// Open grade tracker (Ali Khawaja). Rows are entered in the order the assessments happen.
(function (root) {
  function num(v) { if (v === "" || v === null || v === undefined) return null; var n = parseFloat(v); return isNaN(n) ? null : n; }

  // Abramowitz and Stegun approximation of the standard normal CDF (error below 1e-7)
  function normCdf(z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  // rows: [{earned, max, weight, missed}] in completion order. cap and targets come from the site data.
  function compute(rows, cap, targets) {
    var w = rows.map(function (r) { var x = num(r.weight); return x === null || x < 0 ? 0 : x; });
    var adj = w.slice();
    var invalid = null;
    rows.forEach(function (r, k) {
      if (!r.missed) return;
      var restIdx = [];
      for (var i = k + 1; i < rows.length; i++) if (!rows[i].missed) restIdx.push(i);
      var R = restIdx.reduce(function (s, i) { return s + adj[i]; }, 0);
      if (R <= 0) { invalid = { reason: "none", index: k }; return; }
      var m = (R + w[k]) / R;
      restIdx.forEach(function (i) { adj[i] *= m; });
      adj[k] = 0;
    });
    if (!invalid) rows.forEach(function (r, i) {
      if (!r.missed && adj[i] > cap + 1e-9) invalid = { reason: "cap", index: i, value: adj[i] };
    });

    var completed = 0, earned = 0, pcts = [], scorePct = [];
    rows.forEach(function (r, i) {
      var e = num(r.earned), m = num(r.max);
      var ok = !r.missed && e !== null && m !== null && m > 0;
      scorePct.push(ok ? e / m : null);
      if (!ok) return;
      completed += adj[i]; earned += adj[i] * e / m; pcts.push(e / m);
    });
    var avg = completed > 0 ? earned / completed : null;
    var mean = null, sd = null;
    if (pcts.length) mean = pcts.reduce(function (a, b) { return a + b; }, 0) / pcts.length;
    if (pcts.length > 1) sd = Math.sqrt(pcts.reduce(function (s, x) { return s + (x - mean) * (x - mean); }, 0) / (pcts.length - 1));

    var table = (targets || []).map(function (t) {
      var target = t[0] / 100, out = { letter: t[1], target: target, status: "ok", needed: null, prob: null };
      var remaining = 1 - completed / 100;
      if (remaining <= 1e-9) { out.status = "none"; return out; }
      var need = (target - earned / 100) / remaining;
      if (need <= 0) { out.status = "secured"; return out; }
      if (need > 1) { out.status = "unreachable"; return out; }
      out.needed = need;
      if (sd !== null && sd > 0) out.prob = 1 - normCdf((need - mean) / sd);
      return out;
    });
    return { adjusted: adj, scorePct: scorePct, invalid: invalid, completed: completed, earned: earned, avg: avg,
             mean: mean, sd: sd, targets: table, rawTotal: w.reduce(function (a, b) { return a + b; }, 0) };
  }

  var api = { compute: compute, normCdf: normCdf };
  if (typeof module !== "undefined") { module.exports = api; return; }

  // ---------------- page ----------------
  var D = window.GC_DATA, $ = function (id) { return document.getElementById(id); };
  var rows = [];
  function fmt(n, d) { var s = (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); return s.indexOf(".") >= 0 ? (s.replace(/\.?0+$/, "") || "0") : s; }
  function blank() { return { label: "", earned: "", max: "", weight: "", missed: false }; }
  function notice(msg) { var n = $("trNotice"); n.textContent = msg; n.hidden = !msg; }
  function targets() { return D.letterScale.filter(function (x) { return x[0] > 0; }); }

  function build() {
    var box = $("trRows"); box.innerHTML = "";
    var head = document.createElement("div"); head.className = "trow head";
    head.innerHTML = "<div>#</div><div>Assessment</div><div title='Earned score'>Earned</div><div title='Max score'>Max</div><div>Weight %</div><div title='Missed with Associate Dean approval'>Missed</div><div>Adjusted %</div><div>Score %</div><div></div>";
    box.appendChild(head);
    rows.forEach(function (r, i) {
      var el = document.createElement("div"); el.className = "trow"; el.id = "tr-" + i;
      el.innerHTML =
        '<div class="tn">' + (i + 1) + '</div>' +
        '<div><span class="c-label">Assessment</span><input type="text" class="t-label" autocomplete="off" placeholder="e.g. Quiz 1" aria-label="Assessment name" value=""></div>' +
        '<div><span class="c-label">Earned score</span><input type="number" inputmode="decimal" min="0" step="any" class="t-earned" autocomplete="off" placeholder="-" aria-label="Earned score"></div>' +
        '<div><span class="c-label">Max score</span><input type="number" inputmode="decimal" min="0" step="any" class="t-max" autocomplete="off" placeholder="-" aria-label="Max score"></div>' +
        '<div><span class="c-label">Weight %</span><input type="number" inputmode="decimal" min="0" step="any" class="t-weight" autocomplete="off" placeholder="-" aria-label="Weight percent"></div>' +
        '<div><label class="sw"><input type="checkbox" class="t-missed" aria-label="Missed with approval"><span class="track"></span><span>Missed<span class="appr"> (approved)</span></span></label></div>' +
        '<div class="t-adj"><span class="c-label">Adjusted %</span><span class="av">-</span></div>' +
        '<div class="t-pct"><span class="c-label">Score %</span><span class="pv">-</span></div>' +
        '<div><button type="button" class="x" aria-label="Remove row" title="Remove row">&times;</button></div>';
      el.querySelector(".t-label").value = r.label;
      el.querySelector(".t-earned").value = r.earned;
      el.querySelector(".t-max").value = r.max;
      el.querySelector(".t-weight").value = r.weight;
      el.querySelector(".t-missed").checked = r.missed;
      ["label", "earned", "max", "weight"].forEach(function (f) {
        el.querySelector(".t-" + f).addEventListener("input", function (e) { r[f] = e.target.value; update(); });
      });
      el.querySelector(".t-missed").addEventListener("change", function (e) {
        var prev = r.missed; r.missed = e.target.checked;
        var res = compute(rows, D.capPct, targets());
        if (res.invalid) {
          r.missed = prev; e.target.checked = prev;
          if (res.invalid.reason === "cap") {
            var nm = rows[res.invalid.index].label || ("row " + (res.invalid.index + 1));
            notice("Weight not shifted. It would raise " + nm + " to " + fmt(res.invalid.value, 2) + "%, above the " + D.capPct + "% cap. A make-up assessment is required instead, so please contact your instructor.");
          } else {
            notice("There is no later assessment to receive this weight. Add the remaining assessments below it first.");
          }
          return;
        }
        notice(""); update();
      });
      el.querySelector(".x").addEventListener("click", function () {
        if (rows.length <= 1) { rows[0] = blank(); } else { rows.splice(i, 1); }
        notice(""); build(); update();
      });
      box.appendChild(el);
    });
  }

  function update() {
    var res = compute(rows, D.capPct, targets());
    rows.forEach(function (r, i) {
      var el = $("tr-" + i); if (!el) return;
      el.classList.toggle("missed", r.missed);
      ["earned"].forEach(function () { el.querySelector(".t-earned").disabled = r.missed; });
      var e = num(r.earned), m = num(r.max), w = num(r.weight);
      var bad = e !== null && m !== null && e > m;
      el.querySelector(".t-earned").classList.toggle("bad", bad);
      var av = el.querySelector(".av");
      if (w === null && !r.missed) av.textContent = "-";
      else {
        var shown = r.missed ? 0 : res.adjusted[i];
        var changed = !r.missed && w !== null && Math.abs(shown - w) > 0.005;
        av.textContent = fmt(shown, 2) + "%";
        el.querySelector(".t-adj").classList.toggle("changed", changed);
      }
      el.querySelector(".pv").textContent = res.scorePct[i] === null ? "-" : fmt(res.scorePct[i] * 100, 1) + "%";
    });
    $("trDone").textContent = fmt(res.completed, 1) + "%";
    $("trBar").style.width = Math.min(100, res.completed) + "%";
    $("trEarned").textContent = fmt(res.earned, 2);
    $("trEarnedOf").textContent = "out of " + fmt(res.completed, 1) + " completed";
    if (res.avg === null) { $("trAvg").textContent = "-"; $("trLetter").textContent = "-"; }
    else { $("trAvg").textContent = fmt(res.avg * 100, 1) + "%"; $("trLetter").textContent = GC.letter(D.letterScale, res.avg * 100); }
    var t = fmt(res.rawTotal, 2);
    $("trTotal").textContent = "Total weight entered: " + t + "%" + (Math.abs(res.rawTotal - 100) > 0.005 && res.rawTotal > 0 ? " (should add up to 100%)" : "");
    var tb = $("trTargets");
    var html = '<div class="trow2 head"><div>Target grade</div><div>Average needed</div><div>Probability</div></div>';
    res.targets.forEach(function (x) {
      var need, prob = "-";
      if (x.status === "secured") { need = "Already secured"; prob = "100%"; }
      else if (x.status === "unreachable") { need = "Not reachable"; prob = "0%"; }
      else if (x.status === "none") { need = "-"; }
      else { need = fmt(x.needed * 100, 1) + "%"; prob = x.prob === null ? "needs 2+ grades" : fmt(x.prob * 100, 1) + "%"; }
      html += '<div class="trow2"><div class="tg">' + x.letter + ' <small>(' + fmt(x.target * 100, 0) + '%+)</small></div><div>' + need + '</div><div>' + prob + '</div></div>';
    });
    tb.innerHTML = html;
  }

  function open(instr) {
    $("trInstr").textContent = "Instructor: " + instr.name;
    rows = []; for (var i = 0; i < 12; i++) rows.push(blank());
    notice(""); build(); update();
  }
  $("trAdd").addEventListener("click", function () { rows.push(blank()); build(); update(); var l = document.querySelectorAll(".t-label"); if (l.length) l[l.length - 1].focus(); });
  $("trReset").addEventListener("click", function () { open({ name: $("trInstr").textContent.replace("Instructor: ", "") }); });
  root.GCTracker = { open: open };
})(typeof window !== "undefined" ? window : this);
