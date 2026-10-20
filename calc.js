// Pure calculation logic (no DOM). Used by the page and by tests.
(function (root) {
  function compute(course, scores, missed, cap) {
    var items = course.items;
    var pool = course.quizPool;
    var quizzes = items.filter(function (i) { return i.type === "quiz"; });
    var nq = quizzes.length;
    var e0 = pool ? pool.totalWeight / nq : 0; // effective weight of one quiz in the pool

    // effective weights
    var w = {};
    items.forEach(function (i) { w[i.id] = i.type === "quiz" ? e0 : i.weight; });

    // shift missed weights forward, in course order
    var invalid = null;
    items.forEach(function (it, k) {
      if (!missed[it.id]) return;
      var rest = items.slice(k + 1).filter(function (x) { return !missed[x.id]; });
      var R = rest.reduce(function (s, x) { return s + w[x.id]; }, 0);
      if (R <= 0) { invalid = { reason: "none", item: it }; return; }
      var m = (R + w[it.id]) / R;
      rest.forEach(function (x) { w[x.id] *= m; });
      w[it.id] = 0;
    });
    if (!invalid) {
      items.forEach(function (it) {
        if (it.type !== "quiz" && w[it.id] > cap + 1e-9) invalid = { reason: "cap", item: it, value: w[it.id] };
      });
    }

    // display weight for each item (quizzes shown per counted quiz)
    var perSlot = pool ? pool.totalWeight / (nq - pool.drop) : 0;
    var shown = {};
    items.forEach(function (it) {
      shown[it.id] = it.type === "quiz" ? (w[it.id] / e0) * perSlot : w[it.id];
    });

    var earned = 0, completed = 0, pts = 0, ptsPossible = 0;
    var kept = {};
    // non-quiz items
    items.forEach(function (it) {
      if (it.type === "quiz" || missed[it.id]) return;
      var s = scores[it.id];
      if (s === null || s === undefined || isNaN(s)) return;
      earned += w[it.id] * s / it.points;
      completed += w[it.id];
      pts += s; ptsPossible += it.points;
    });
    // quiz pool
    if (pool) {
      var qn = quizzes.filter(function (q) { return !missed[q.id]; });
      var S = Math.max(0, qn.length - pool.drop);
      var sumAll = qn.reduce(function (s, q) { return s + w[q.id]; }, 0);
      var taken = qn.filter(function (q) { var s = scores[q.id]; return s !== null && s !== undefined && !isNaN(s); });
      var sumTaken = taken.reduce(function (s, q) { return s + w[q.id]; }, 0);
      var ranked = taken.slice().sort(function (a, b) { return scores[b.id] / b.points - scores[a.id] / a.points; });
      var keep = ranked.slice(0, Math.min(S, ranked.length));
      keep.forEach(function (q) { kept[q.id] = true; });
      if (S > 0 && keep.length) {
        var f = Math.min(1, (sumTaken / sumAll) * (qn.length / S));
        var kw = keep.reduce(function (s, q) { return s + w[q.id]; }, 0);
        var avg = keep.reduce(function (s, q) { return s + w[q.id] * scores[q.id] / q.points; }, 0) / kw;
        earned += sumAll * f * avg;
        completed += sumAll * f;
        keep.forEach(function (q) { pts += scores[q.id]; ptsPossible += q.points; });
      }
    }
    return {
      weights: w, shown: shown, invalid: invalid, kept: kept,
      earned: earned, completed: completed, points: pts, pointsPossible: ptsPossible,
      currentPct: completed > 0 ? earned / completed * 100 : null
    };
  }
  function letter(scale, pct) {
    for (var i = 0; i < scale.length; i++) if (pct + 1e-9 >= scale[i][0]) return scale[i][1];
    return "F";
  }
  var api = { compute: compute, letter: letter };
  if (typeof module !== "undefined") module.exports = api; else root.GC = api;
})(this);
