(function () {
  var D = window.GC_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var instrSel = $("instructor"), courseSel = $("course");
  var course = null, instructor = null;
  var scores = {}, missed = {}, bonus = 0;

  function fmt(n, d) { var s = (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); return s.indexOf(".") >= 0 ? (s.replace(/\.?0+$/, "") || "0") : s; }
  // Grades are never saved: refreshing the page starts over at the instructor selector.
  function save() {}
  function load() { scores = {}; missed = {}; bonus = 0; }

  // Custom dropdown that wraps a native <select> (kept hidden for the logic) and always opens below the box.
  function enhanceSelect(sel, labelId) {
    var wrap = document.createElement("div"); wrap.className = "dd";
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "dd-btn";
    btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-labelledby", labelId);
    var list = document.createElement("ul"); list.className = "dd-list"; list.setAttribute("role", "listbox"); list.hidden = true;
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(btn); wrap.appendChild(list); wrap.appendChild(sel);
    sel.classList.add("native-hidden"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    var items = [], active = -1;
    function build() {
      list.innerHTML = ""; items = [];
      Array.prototype.forEach.call(sel.options, function (o, i) {
        if (o.value === "") return;
        var li = document.createElement("li"); li.className = "dd-opt"; li.setAttribute("role", "option");
        li.textContent = o.textContent; li.dataset.value = o.value;
        li.setAttribute("aria-selected", sel.value === o.value ? "true" : "false");
        li.addEventListener("mousedown", function (e) { e.preventDefault(); });
        li.addEventListener("click", function () { choose(o.value); });
        (function (idx) { li.addEventListener("mouseenter", function () { setActive(idx); }); li.addEventListener("mousemove", function () { if (active !== idx) setActive(idx); }); })(items.length);
        list.appendChild(li); items.push(li);
      });
      var cur = sel.options[sel.selectedIndex];
      btn.textContent = cur ? cur.textContent : "";
      btn.classList.toggle("placeholder", !cur || cur.value === "");
      btn.disabled = sel.disabled;
    }
    function setActive(i) {
      active = i; items.forEach(function (li, k) { li.classList.toggle("active", k === i); });
      if (items[i]) items[i].scrollIntoView({ block: "nearest" });
    }
    function open(viaKeyboard) {
      if (btn.disabled || !items.length) return;
      list.hidden = false; wrap.classList.add("open"); btn.setAttribute("aria-expanded", "true");
      var si = items.findIndex(function (li) { return li.dataset.value === sel.value; });
      // a mouse open starts with nothing highlighted, so hover is the only highlight
      if (viaKeyboard) setActive(si >= 0 ? si : 0); else setActive(-1);
    }
    function close() { list.hidden = true; wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    function choose(v) { sel.value = v; sel.dispatchEvent(new Event("change")); build(); close(); btn.focus(); }
    btn.addEventListener("click", function () { list.hidden ? open(false) : close(); });
    btn.addEventListener("keydown", function (e) {
      var isOpen = !list.hidden;
      if (e.key === "ArrowDown") { e.preventDefault(); if (!isOpen) open(true); else setActive(Math.min(items.length - 1, active + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (!isOpen) open(true); else setActive(Math.max(0, active - 1)); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!isOpen) open(true); else if (items[active]) choose(items[active].dataset.value); }
      else if (e.key === "Escape") { close(); }
      else if (e.key === "Tab") { close(); }
    });
    document.addEventListener("click", function (e) { if (!wrap.contains(e.target)) close(); });
    var lbl = document.getElementById(labelId);
    if (lbl) lbl.addEventListener("click", function (e) { e.preventDefault(); btn.focus(); });
    new MutationObserver(build).observe(sel, { childList: true, attributes: true, attributeFilter: ["disabled"] });
    build();
  }

  D.instructors.forEach(function (i) {
    var o = document.createElement("option"); o.value = i.id; o.textContent = i.name; instrSel.appendChild(o);
  });

  enhanceSelect(instrSel, "lblInstructor");
  enhanceSelect(courseSel, "lblCourse");

  instrSel.value = ""; // never restore a previous selection after a refresh

  instrSel.addEventListener("change", function () {
    courseSel.innerHTML = "";
    $("calc").hidden = true;
    $("tracker").hidden = true;
    $("courseField").hidden = false;
    instructor = D.instructors.filter(function (i) { return i.id === instrSel.value; })[0] || null;
    if (instructor && instructor.tracker) {
      courseSel.disabled = true;
      courseSel.innerHTML = '<option value="">No course selection needed</option>';
      $("courseField").hidden = true;
      $("tracker").hidden = false;
      GCTracker.open(instructor);
      return;
    }
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
    $("quizNote").textContent = p ? "Quizzes: your lowest " + p.drop + " of " + nq + " quiz scores are dropped as if they never existed, so only your best " + (nq - p.drop) + " count (" + fmt(p.totalWeight, 2) + "% in total). Until a quiz has a grade, the latest blank quizzes are assumed to be the dropped ones. If quizzes tie exactly at the cutoff, the tied quiz that gives you the higher course grade is the one dropped." : "";
    buildRows();
    $("calc").hidden = false;
    notice("");
    update();
  });

  $("reset").addEventListener("click", function () { scores = {}; missed = {}; bonus = 0; save(); notice(""); buildRows(); update(); });

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
    var b = document.createElement("div"); b.className = "row bonusrow"; b.id = "row-bonus";
    b.innerHTML =
      '<div class="name">Bonus<small class="tag">Added to your total earned</small></div>' +
      '<div class="pts"><span class="c-label">Points</span>-</div>' +
      '<div class="wt"><span class="c-label">Counts toward course</span>Added as is</div>' +
      '<div class="score"><input type="number" inputmode="decimal" min="0" step="any" aria-label="Bonus" placeholder="-" value="' + (bonus ? bonus : "") + '"><span class="out">pts</span></div>' +
      '<div class="mcell"><span class="na">Bonus has no weight and is never dropped or missed</span></div>';
    b.querySelector("input").addEventListener("input", function (e) {
      var n = parseFloat(e.target.value);
      if (isNaN(n) || n < 0) { bonus = 0; if (n < 0) e.target.value = ""; } else bonus = n;
      save(); update();
    });
    rows.appendChild(b);
  }

  function toggle(it, box) {
    var next = {}; for (var k in missed) next[k] = missed[k];
    next[it.id] = box.checked; if (!box.checked) delete next[it.id];
    var res = GC.compute(course, scores, next, D.capPct, bonus);
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
    var res = GC.compute(course, scores, missed, D.capPct, bonus);
    var base = {};
    course.items.forEach(function (it) {
      var row = $("row-" + it.id), isMissed = !!missed[it.id];
      row.classList.toggle("missed", isMissed);
      var inp = row.querySelector(".score input"); inp.disabled = isMissed;
      var shown = res.shown[it.id], orig = it.weight;
      var changed = !isMissed && !res.dropped[it.id] && Math.abs(shown - orig) > 0.005;
      var wv = row.querySelector(".wv"), wt = row.querySelector(".wt");
      wt.classList.toggle("changed", changed);
      var dropState = res.dropped[it.id];
      wv.innerHTML = (isMissed || dropState) ? "0%" : fmt(shown, 2) + "%" + (changed ? '<span class="was">was ' + fmt(orig, 2) + "%</span>" : "");
      var tag = row.querySelector(".tag");
      var dropped = !!res.dropped[it.id] && !isMissed;
      row.classList.toggle("dropped", dropped);
      tag.textContent = isMissed ? "Weight shifted to later assessments" : (dropped ? (res.dropped[it.id] === "assumed" ? "Dropped until graded" : "Dropped (lowest scores)") : "");
    });
    $("row-bonus").classList.toggle("on", bonus > 0);
    $("rDone").textContent = fmt(res.completed, 1) + "%";
    $("bar").style.width = Math.min(100, res.completed) + "%";
    $("rEarned").textContent = fmt(res.earned, 2);
    $("rEarnedOf").textContent = "out of " + fmt(res.completed, 1) + " completed" + (bonus > 0 ? ", includes " + fmt(bonus, 2) + " bonus" : "");
    if (res.currentPct === null) { $("rPct").textContent = "-"; $("rLetter").textContent = "-"; }
    else { $("rPct").textContent = fmt(res.currentPct, 1) + "%"; $("rLetter").textContent = GC.letter(D.letterScale, res.currentPct); }
  }
})();

// a page restored from the back/forward cache must also start fresh
window.addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });
