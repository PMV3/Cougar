// Weight index from the "Weight index for determining rate of climb" chart
// (WeightIndexForRateofclime.jpg), a DOM-free port of count_6 in scripts.js so
// the planning page can apply the SUP.51 limit of 11.6 at alternate gross
// weight. Same pixel constants and the same digitised curves as STEP2. Needs
// datafolder/weightindex.js and datafolder/heightloosemap.js (for getYForX and
// getXForY) loaded before this file.

var WEIGHTINDEX = (function () {
    'use strict';

    // Weight index for OAT (degC), pressure altitude (ft) and weight (lb).
    // Returns null outside the chart. Negative altitudes are read at 0 ft (the
    // chart starts at 0 ft; a slightly higher index, so conservative).
    function compute(qat, hp, acweight) {
        var t = trace(qat, hp, acweight);
        return t ? t.index : null;
    }

    // Same as compute() but also returns the chart construction points in
    // image pixels (qatX, Y, X) for drawing, as STEP2's count_6 does.
    function trace(qat, hp, acweight) {
        if (!isFinite(qat) || !isFinite(hp) || !isFinite(acweight)) return null;
        if (hp < 0) hp = 0;
        if (!(qat >= -50 && qat <= 50 && hp <= 25000 && acweight >= 13000 && acweight <= 24700)) return null;

        var qatX = 463 - ((463 - 79) * (50 - qat)) / 95;
        var hpIdx = Math.trunc(hp / 1000);
        if (hpIdx >= forhpft_6_weightindex.length - 1) hpIdx = forhpft_6_weightindex.length - 2;
        var y1 = getYForX(qatX, forhpft_6_weightindex[hpIdx]);
        if (y1 == null) return null;
        var y2 = getYForX(qatX, forhpft_6_weightindex[hpIdx + 1]);
        if (y2 == null) return null;
        var Y = y1 - ((y1 - y2) / 1000) * (hp - forhpft_6[hpIdx]);

        var wIdx = Math.trunc((acweight <= 24700 && acweight > 24000) ? 0 : (24000 - acweight - 0.01) / 1000) + 1;
        if (wIdx >= forActualweightlb_6.length - 1) wIdx = forActualweightlb_6.length - 2;
        var x1 = getXForY(Y, forActualweightlb_6[wIdx]);
        if (x1 == null) return null;
        var x2 = getXForY(Y, forActualweightlb_6[wIdx + 1]);
        if (x2 == null) return null;
        var X = ((x1 - x2) * (acweight - forActualweightlb_6list[wIdx + 1])) /
                (forActualweightlb_6list[wIdx] - forActualweightlb_6list[wIdx + 1]) + x2;
        return { index: 13 - ((X - 507) / (860 - 507)) * 6, qatX: qatX, Y: Y, X: X };
    }

    // Largest weight (lb) in [13000, 24700] whose index does not exceed `limit`,
    // by bisection (the index rises with weight). Returns 24700 when even the
    // maximum weight is within the limit, null when no weight is.
    function maxWeightForIndex(qat, hp, limit) {
        var lo = 13000, hi = 24700;
        var iHi = compute(qat, hp, hi);
        if (iHi != null && iHi <= limit) return hi;
        var iLo = compute(qat, hp, lo);
        if (iLo == null || iLo > limit) return null;
        for (var n = 0; n < 40; n++) {
            var mid = (lo + hi) / 2;
            var v = compute(qat, hp, mid);
            if (v == null || v > limit) hi = mid; else lo = mid;
        }
        return lo;
    }

    return { compute: compute, trace: trace, maxWeightForIndex: maxWeightForIndex };
})();
