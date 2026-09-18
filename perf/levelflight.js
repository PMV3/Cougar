// Level-flight performance lookups shared by STEP3 (fuel.js) and the planning
// page. Plain global; no DOM. Needs datafolder/levelflightData.js
// (LEVELFLIGHT_DATA, the digitised charts) and datafolder/bestRangeSpeed.js
// (BEST_RANGE_SPEED, the best-range insets), loaded before this file.
//
// Charts: the Flight Manual SUP.51 LEVEL FLIGHT PERFORMANCE AEO/OEI figures for
// Hp 0, 3000, 6000 and 9000 ft at OAT 0, +15 and +30 degC (+45 degC at 0 ft as
// well). The chart used is the nearest one, as a pilot would pick it: the
// nearest chart altitude (0 ft up to 1500 ft, 3000 ft to 4500, 6000 ft to 7500,
// 9000 ft to 10500; pressure altitudes from -2000 ft are accepted) and, at that
// altitude, the nearest printed temperature, the warmer chart when halfway.
//
// Fuel flow is linear between the two weight curves that bracket the weight.
// The heaviest weights are printed dashed above the AEO takeoff line and are
// only kept where they come below the max-continuous line; a weight above the
// heaviest usable curve is read at that curve and flagged (weightClamped).

var LEVELFLIGHT = (function () {
    'use strict';

    var ALTS = [0, 3000, 6000, 9000];
    var CHARTS = {};   // key -> { hp, oat, def, data() }
    if (typeof LEVELFLIGHT_DATA !== 'undefined') {
        Object.keys(LEVELFLIGHT_DATA).forEach(function (k) {
            var e = LEVELFLIGHT_DATA[k];
            CHARTS[k] = { hp: e.hp, oat: e.oat, def: e, data: function () { return e.curves; } };
        });
    }

    // Nearest chart for a pressure altitude (ft) and OAT (degC); null outside
    // -2000..10500 ft.
    function selectKey(hpFt, oatC) {
        if (!isFinite(hpFt) || !isFinite(oatC)) return null;
        if (hpFt < -2000 || hpFt > 10500) return null;
        var alt = null, best = Infinity;
        ALTS.forEach(function (a) {
            var d = Math.abs(hpFt - a);
            if (d < best || (d === best && a > alt)) { best = d; alt = a; }
        });
        var key = null, dt = Infinity;
        Object.keys(CHARTS).forEach(function (k) {
            var c = CHARTS[k];
            if (c.hp !== alt) return;
            var d = Math.abs(oatC - c.oat);
            if (d < dt || (d === dt && c.oat > CHARTS[key].oat)) { dt = d; key = k; }
        });
        return key;
    }

    function chartDef(key) { return CHARTS[key] ? CHARTS[key].def : null; }

    // Image x (px) of a TAS on a chart.
    function xOf(def, tasKt) { return def.tas.x0kt + tasKt * def.tas.pxPerKt; }

    // Image y (px) of a fuel flow on a chart: the printed AEO lb/h scale is not
    // linear, so interpolate between its labelled ticks (extrapolate at the ends).
    function yOf(def, lbh) {
        var s = def.fuelScale;   // [[y, lb/h], ...] with y increasing, lb/h decreasing
        var n = s.length;
        if (n < 2) return null;
        var i;
        if (lbh >= s[0][1]) i = 0;
        else if (lbh <= s[n - 1][1]) i = n - 2;
        else { for (i = 0; i < n - 2; i++) if (s[i][1] >= lbh && lbh >= s[i + 1][1]) break; }
        var y0 = s[i][0], y1 = s[i + 1][0], v0 = s[i][1], v1 = s[i + 1][1];
        return y0 + (v0 - lbh) * (y1 - y0) / (v0 - v1);
    }

    // Fuel flow (lb/h) on one digitised weight curve at a TAS; null outside its speed range.
    function flowOnCurve(curve, tas) {
        var d = curve.data;   // [[kt, lb/h], ...] in increasing kt
        for (var i = 0; i < d.length - 1; i++) {
            if (d[i][0] <= tas && d[i + 1][0] >= tas) {
                return d[i][1] + ((d[i + 1][1] - d[i][1]) * (tas - d[i][0])) / (d[i + 1][0] - d[i][0]);
            }
        }
        return null;
    }

    function maxSpeed(curve) {
        var m = -Infinity;
        for (var i = 0; i < curve.data.length; i++) if (curve.data[i][0] > m) m = curve.data[i][0];
        return m;
    }

    // AEO fuel flow (lb/h) at a weight (lb) and TAS (kt), linear between the two
    // weight curves that bracket the weight. Weights outside the printed curves
    // are read at the nearest curve (weightClamped reports a weight above the
    // heaviest usable curve). Each curve ends where it meets the AEO
    // max-continuous line; with opts.clampToMaxSpeed the TAS is reduced to the end
    // of the heavier curve (the max-continuous speed) and reported in tasUsed with
    // speedLimited = true, otherwise a TAS beyond the curve gives lbPerHour null.
    // Returns { lbPerHour, tasUsed, speedLimited, weightClamped, heaviest, lower, upper }
    // or { lbPerHour: null, reason }.
    function fuelFlow(key, weightLb, tasKt, opts) {
        var chart = CHARTS[key];
        if (!chart) return { lbPerHour: null, reason: 'no chart' };
        var curves = chart.data().filter(function (c) { return typeof c.index === 'number'; })
            .slice().sort(function (a, b) { return a.index - b.index; });
        if (!curves.length) return { lbPerHour: null, reason: 'empty chart' };
        var heaviest = curves[curves.length - 1].index;
        var w = Math.min(Math.max(weightLb, curves[0].index), heaviest);
        var lo = curves[0], hi = curves[curves.length - 1];
        for (var i = 0; i < curves.length - 1; i++) {
            if (curves[i].index <= w && w <= curves[i + 1].index) { lo = curves[i]; hi = curves[i + 1]; break; }
        }
        var tas = tasKt, limited = false;
        if (opts && opts.clampToMaxSpeed) {
            var vmax = Math.min(maxSpeed(lo), maxSpeed(hi));
            if (tas > vmax) { tas = vmax; limited = true; }
        }
        var fLo = flowOnCurve(lo, tas), fHi = flowOnCurve(hi, tas);
        if (fLo == null || fHi == null) return { lbPerHour: null, reason: 'speed outside the chart curves at this weight' };
        var t = (hi.index === lo.index) ? 0 : (w - lo.index) / (hi.index - lo.index);
        return { lbPerHour: fLo + t * (fHi - fLo), tasUsed: tas, speedLimited: limited,
                 weightClamped: weightLb > heaviest + 1, heaviest: heaviest, lower: lo.index, upper: hi.index };
    }

    // TAS on one best-range curve at a weight; null outside its printed weight range.
    function tasOnCurve(curve, weight) {
        var pts = curve.points;
        if (weight < pts[0][0] || weight > pts[pts.length - 1][0]) return null;
        for (var i = 0; i < pts.length - 1; i++) {
            if (pts[i][0] <= weight && weight <= pts[i + 1][0]) {
                var f = (weight - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
                return pts[i][1] + f * (pts[i + 1][1] - pts[i][1]);
            }
        }
        return null;
    }

    // Best-range TAS (kt) for a chart, weight (lb) and wind component (kt,
    // + tail / - head), linear between the two bracketing wind curves; null when
    // outside what the inset prints.
    function bestRangeSpeed(key, weightLb, windKt) {
        if (typeof BEST_RANGE_SPEED === 'undefined' || !BEST_RANGE_SPEED[key]) return null;
        var curves = BEST_RANGE_SPEED[key].curves; // ordered +60 ... -60
        for (var i = 0; i < curves.length; i++) {
            var c = curves[i];
            if (windKt === c.wind) return tasOnCurve(c, weightLb);
            var next = curves[i + 1];
            if (next && windKt < c.wind && windKt > next.wind) {
                var a = tasOnCurve(c, weightLb), b = tasOnCurve(next, weightLb);
                if (a === null || b === null) return null;
                var f = (c.wind - windKt) / (c.wind - next.wind);
                return a + f * (b - a);
            }
        }
        return null;
    }

    return { CHARTS: CHARTS, ALTS: ALTS, selectKey: selectKey, chartDef: chartDef, xOf: xOf, yOf: yOf,
             fuelFlow: fuelFlow, bestRangeSpeed: bestRangeSpeed };
})();
