// Pure calculation logic (no DOM). Used by the page and by tests.
//
// Rules:
//  - Two quizzes (course.quizPool.drop) are always treated as dropped, as if they never existed.
//  - Quizzes with no grade yet are assumed dropped first (latest in the course order first).
//    If fewer than two blanks remain, the lowest scoring entered quizzes are dropped.
//  - A quiz marked missed (approved) is never one of the drops; its weight shifts forward.
//  - Missed weight is shifted proportionally to the later assessments, in course order,
//    on the course with the dropped quizzes removed. Weights always add up to 100%.
(function (root) {
  function has(scores, id) { var s = scores[id]; return s !== null && s !== undefined && !isNaN(s); }

  function pickDrops(course, scores, missed) {
    var pool = course.quizPool, out = {};
    if (!pool) return out;
    var cands = course.items.filter(function (i) { return i.type === "quiz" && !missed[i.id]; });
    var need = Math.min(pool.drop, cands.length);
    var blank = cands.filter(function (q) { return !has(scores, q.id); }).reverse(); // latest first
    blank.slice(0, need).forEach(function (q) { out[q.id] = "assumed"; });
    need -= Math.min(need, blank.length);
    if (need > 0) {
      var entered = cands.filter(function (q) { return has(scores, q.id); });
      entered.sort(function (a, b) {
        var d = scores[a.id] / a.points - scores[b.id] / b.points;
        return d !== 0 ? d : course.items.indexOf(b) - course.items.indexOf(a); // tie: later quiz dropped
      });
      entered.slice(0, need).forEach(function (q) { out[q.id] = "actual"; });
    }
    return out;
  }

  function compute(course, scores, missed, cap) {
    var items = course.items, pool = course.quizPool;
    var nq = items.filter(function (i) { return i.type === "quiz"; }).length;
    var perQuiz = pool ? pool.totalWeight / (nq - pool.drop) : 0;

    var dropped = pickDrops(course, scores, missed);
    var seq = items.filter(function (i) { return !dropped[i.id]; });
    var w = {};
    items.forEach(function (i) { w[i.id] = dropped[i.id] ? 0 : (i.type === "quiz" ? perQuiz : i.weight); });

    var invalid = null;
    seq.forEach(function (it, k) {
      if (!missed[it.id]) return;
      var rest = seq.slice(k + 1).filter(function (x) { return !missed[x.id]; });
      var R = rest.reduce(function (s, x) { return s + w[x.id]; }, 0);
      if (R <= 0) { invalid = { reason: "none", item: it }; return; }
      var m = (R + w[it.id]) / R;
      rest.forEach(function (x) { w[x.id] *= m; });
      w[it.id] = 0;
    });
    if (!invalid) {
      items.forEach(function (it) {
        if (it.type !== "quiz" && !missed[it.id] && w[it.id] > cap + 1e-9) invalid = { reason: "cap", item: it, value: w[it.id] };
      });
    }

    var earned = 0, completed = 0, pts = 0, ptsPossible = 0;
    items.forEach(function (it) {
      if (dropped[it.id] || missed[it.id] || !has(scores, it.id)) return;
      earned += w[it.id] * scores[it.id] / it.points;
      completed += w[it.id];
      pts += scores[it.id]; ptsPossible += it.points;
    });
    return {
      weights: w, shown: w, invalid: invalid, dropped: dropped,
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
