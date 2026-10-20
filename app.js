(function () {
  var D = window.GC_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var instrSel = $("instructor"), courseSel = $("course");
  var course = null, instructor = null;
  var scores = {}, missed = {};

  function fmt(n, d) { return (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace(/\.?0+$/, "") || "0"; }
  function key() { return "gc:" + instructor.id + ":" + course.id; }
  function save() { try { localStorage.setItem(key(), JSON.stringify({ s: scores, m: missed })); } catch (e) {} }
  function load() {
    scores = {}; missed = {};
    try {
      var v = JSON.parse(localStorage.getItem(key()) || "null");
      if (v) { scores = v.s || {}; missed = v.m || {}; }
    } catch (e) {}
    // a saved state that breaks the cap is discarded
    if (GC.compute(course, scores, missed, D.capPct).invalid) { scores = {}; missed = {}; }
  }

  D.instructors.forEach(function (i) {
    var o = document.createElement("option"); o.value = i.id; o.textContent = i.name; instrSel.appendChild(o);
  });

  instrSel.addEventListener("change", function () {
    courseSel.innerHTML = "";
    $("calc").hidden = true;
    instructor = D.instructors.filter(function (i) { return i.id === instrSel.value; })[0] || null;
    if (!instructor) {
      courseSel.disabled = true;
      courseSel.innerHTML = '<option value="">Choose an instructor first</option>';
      return;
    }
    courseSel.disabled = false;
    courseSel.innerHTML = '<option value="">Choose a course</option>';
    instructor.courses.forEach(function (c) {
      var o = document.createElement("option"); o.value = c.id; o.textContent = c.code; courseSel.appendChild(o);
    });
  });

  courseSel.addEventListener("change", function () {
    course = instructor && instructor.courses.filter(function (c) { return c.id === courseSel.value; })[0];
    if (!course) { $("calc").hidden = true; return; }
    load();
    $("courseTitle").textContent = course.code + " Grade Calculator";
    $("instrName").textContent = "Instructor: " + instructor.name;
    var p = course.quizPool;
    var nq = course.items.filter(function (i) { return i.type === "quiz"; }).length;
    $("quizNote").textContent = p ? "Quizzes: your lowest " + p.drop + " of " + nq + " quiz scores are dropped, so only your best " + (nq - p.drop) + " count (" + fmt(p.totalWeight, 2) + "% in total)." : "";
    buildRows();
    $("calc").hidden = false;
    notice("");
    update();
  });

  $("reset").addEventListener("click", function () { scores = {}; missed = {}; save(); notice(""); buildRows(); update(); });

  function notice(msg) { var n = $("notice"); n.textContent = msg; n.hidden = !msg; }

  function buildRows() {
    var rows = $("rows"); rows.innerHTML = "";
    var head = document.createElement("div"); head.className = "row head";
    head.innerHTML = "<div>Assessment</div><div>Points</div><div>Weight</div><div>Your grade</div><div>Missed</div>";
    rows.appendChild(head);
    course.items.forEach(function (it) {
      var r = document.createElement("div"); r.className = "row"; r.id = "row-" + it.id;
      var sv = scores[it.id];
      r.innerHTML =
        '<div class="name">' + it.label + '<small class="tag"></small></div>' +
        '<div class="pts"><span class="c-label">Points</span>' + it.points + '</div>' +
        '<div class="wt"><span class="c-label">Counts toward course</span><span class="wv"></span></div>' +
        '<div class="score"><input type="number" inputmode="decimal" min="0" max="' + it.points + '" step="any" aria-label="' + it.label + ' grade" placeholder="-" value="' + (sv === null || sv === undefined ? "" : sv) + '"><span class="out">/ ' + it.points + '</span></div>' +
        '<div class="mcell"></div>';
      var m = r.querySelector(".mcell");
      if (it.canMiss) {
        m.innerHTML = '<label class="sw"><input type="checkbox"' + (missed[it.id] ? " checked" : "") + '><span class="track"></span><span>Missed (approved)</span></label>';
        m.querySelector("input").addEventListener("change", function (e) { toggle(it, e.target); });
      } else {
        m.innerHTML = '<span class="na">Last assessment, nothing to shift to</span>';
      }
      r.querySelector(".score input").addEventListener("input", function (e) {
        var v = e.target.value;
        if (v === "") { delete scores[it.id]; }
        else {
          var n = parseFloat(v);
          if (isNaN(n)) { delete scores[it.id]; }
          else { if (n > it.points) { n = it.points; e.target.value = n; } if (n < 0) { n = 0; e.target.value = n; } scores[it.id] = n; }
        }
        save(); update();
      });
      rows.appendChild(r);
    });
  }

  function toggle(it, box) {
    var next = {}; for (var k in missed) next[k] = missed[k];
    next[it.id] = box.checked; if (!box.checked) delete next[it.id];
    var res = GC.compute(course, scores, next, D.capPct);
    if (res.invalid) {
      box.checked = !box.checked;
      if (res.invalid.reason === "cap") {
        notice("Weight not shifted. Moving " + it.label + " forward would raise " + res.invalid.item.label + " to " + fmt(res.invalid.value, 2) + "%, above the " + D.capPct + "% cap. A make-up assessment is required instead, so please contact your instructor.");
      } else {
        notice("There is no later assessment to receive this weight.");
      }
      return;
    }
    missed = next; notice(""); save(); update();
  }

  function update() {
    var res = GC.compute(course, scores, missed, D.capPct);
    var base = {};
    course.items.forEach(function (it) {
      var row = $("row-" + it.id), isMissed = !!missed[it.id];
      row.classList.toggle("missed", isMissed);
      var inp = row.querySelector(".score input"); inp.disabled = isMissed;
      var shown = res.shown[it.id], orig = it.weight;
      var changed = !isMissed && Math.abs(shown - orig) > 0.005;
      var wv = row.querySelector(".wv"), wt = row.querySelector(".wt");
      wt.classList.toggle("changed", changed);
      wv.innerHTML = isMissed ? "0%" : fmt(shown, 2) + "%" + (changed ? '<span class="was">was ' + fmt(orig, 2) + "%</span>" : "");
      var tag = row.querySelector(".tag");
      var dropped = it.type === "quiz" && !isMissed && scores[it.id] !== undefined && !res.kept[it.id];
      row.classList.toggle("dropped", dropped);
      tag.textContent = isMissed ? "Weight shifted to later assessments" : (dropped ? "Dropped (not in your best " + (course.items.filter(function (i) { return i.type === "quiz"; }).length - course.quizPool.drop) + ")" : "");
    });
    $("rPoints").textContent = fmt(res.points, 2);
    $("rPointsOf").textContent = "out of " + fmt(res.pointsPossible, 2) + " graded so far";
    $("rDone").textContent = fmt(res.completed, 1) + "%";
    $("bar").style.width = Math.min(100, res.completed) + "%";
    $("rEarned").textContent = fmt(res.earned, 2);
    $("rEarnedOf").textContent = "out of " + fmt(res.completed, 1) + " completed";
    if (res.currentPct === null) { $("rPct").textContent = "-"; $("rLetter").textContent = "enter a grade"; }
    else { $("rPct").textContent = fmt(res.currentPct, 1) + "%"; $("rLetter").textContent = "Letter grade: " + GC.letter(D.letterScale, res.currentPct); }
  }
})();
