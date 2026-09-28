// Twin-engine IGE 10 ft maximum weight, a DOM-free port of the weight branch of
// count_5 in scripts.js (chart newIGE.jpg, curves in datafolder/newIGE.js).
// Same pixel constants and the same interpolation as STEP2, so the planning
// page and STEP2 agree. Needs datafolder/newIGE.js and getXForY from
// datafolder/heightloosemap.js loaded before this file.

var HOVER10FT = (function () {
    'use strict';

    // Curve temperatures of Qat_5, in the same order (mirrors Qatindex_4 in datafolder/newhoge.js).
    var TEMPS = [50, 40, 30, 20, 10, 0, -10, -20, -30, -40, -45];
    var NORMAL_MAX_LB = 21495;

    // Maximum weight (lb) at OAT (degC) and pressure altitude (ft), capped at
    // 21495 lb like the chart's limit line. Returns null where STEP2 would show
    // "Unable to calculate" (altitude above the top of the curve, i.e. no hover
    // possible at any charted weight) or for OAT outside -45..50 degC.
    function maxWeight(oatC, hpFt) {
        if (!isFinite(oatC) || !isFinite(hpFt)) return null;
        if (!(oatC >= -45 && oatC <= 50)) return null;
        var idx = Math.trunc(oatC >= -45 && oatC <= -40 ? 9 : (50 - oatC) / 10);
        if (idx >= TEMPS.length - 1) idx = TEMPS.length - 2;
        var yRow = 28 + ((674 - 28) * (20000 - hpFt)) / 20000;
        var x1 = getXForY(yRow, Qat_5[idx]);
        var x2 = getXForY(yRow, Qat_5[idx + 1]);
        if (x1 == null || x2 == null) return null;
        var xw = x1 + ((TEMPS[idx] - oatC) * (x2 - x1)) / (TEMPS[idx] - TEMPS[idx + 1]);
        var w = 13300 + ((xw - 59) / (570 - 59)) * (21500 - 13300);
        return Math.min(w, NORMAL_MAX_LB);
    }

    return { maxWeight: maxWeight };
})();
