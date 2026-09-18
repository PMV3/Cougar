// Twin-engine IGE 5 ft hover lookup on the SUP.51 Figure 1 dataset
// (datafolder/ige5ft_agw.js, global IGE5FT_AGW). Plain global; no DOM.
//
// Chart semantics implemented here:
//  - Each OAT curve is printed only where that OAT can occur, i.e. below the
//    ISA+40 degC dash-dot line. Above a curve's printed top, the hot bound of
//    the chart is the ISA+40 line (`isa40`), whose temperature at a given
//    pressure altitude is ISA(Hp) + 40.
//  - Below the altitude where a curve meets the 24700 lb limit line, the chart
//    answer is the limit line itself (24700 lb).
//  - Between curves the result is linear in OAT. Colder than -45 degC uses the
//    -45 curve (conservative). Hotter than 50 degC, or hotter than ISA+40 where
//    the envelope is not printed, is outside the chart.
//  - `capLb` clips the answer: 21495 for the basic-manual maximum, 24700 for
//    alternate gross weight.

var HOVER5FT = (function () {
    'use strict';

    var LAPSE_C_PER_FT = 0.0019812;

    function dataset() {
        return (typeof IGE5FT_AGW !== 'undefined') ? IGE5FT_AGW : null;
    }

    // Weight (lb) on a polyline of {x: lb, y: ft} points ordered by decreasing y.
    function weightAt(points, ft) {
        if (!points || !points.length) return { w: null };
        if (ft > points[0].y) return { w: null, above: true };
        if (ft < points[points.length - 1].y) return { w: null, below: true };
        for (var i = 0; i < points.length - 1; i++) {
            var a = points[i], b = points[i + 1];
            if (a.y >= ft && ft >= b.y) {
                var f = (a.y === b.y) ? 0 : (a.y - ft) / (a.y - b.y);
                return { w: a.x + f * (b.x - a.x) };
            }
        }
        return { w: null };
    }

    function isaPlus40(hpFt) {
        return 15 - LAPSE_C_PER_FT * hpFt + 40;
    }

    // Returns { weight, chartWeight, limit } where limit is 'curve', 'maxline'
    // (24700 lb line reached) or 'isa40' (hot bound), or { weight: null, reason }.
    function maxWeight(hpFt, oatC, capLb) {
        var D = dataset();
        if (!D) return { weight: null, reason: 'IGE 5 ft dataset not loaded' };
        var cap = capLb || D.maxWeightLb;
        if (!isFinite(hpFt) || !isFinite(oatC)) return { weight: null, reason: 'missing input' };
        if (hpFt < -2000 || hpFt > 20000) return { weight: null, reason: 'altitude outside chart (-2000 to 20000 ft)' };
        if (oatC > 50) return { weight: null, reason: 'OAT above chart (50 C)' };

        var oat = Math.max(oatC, -45);
        var tEnv = isaPlus40(hpFt);
        var env = weightAt(D.isa40, hpFt);

        if (oat >= tEnv) {
            if (env.w == null) return { weight: null, reason: 'hotter than ISA+40 C: outside chart' };
            return { weight: Math.min(env.w, cap), chartWeight: env.w, limit: 'isa40' };
        }

        var curves = D.curves; // ordered +50 ... -45
        var warm = null, cold = null;
        for (var i = 0; i < curves.length - 1; i++) {
            if (curves[i].temperature >= oat && oat >= curves[i + 1].temperature) {
                warm = curves[i]; cold = curves[i + 1]; break;
            }
        }
        if (!warm) { warm = cold = curves[curves.length - 1]; }

        var wc = weightAt(cold.points, hpFt);
        var ww = weightAt(warm.points, hpFt);
        var coldVal = wc.below ? D.maxWeightLb : wc.w;
        var warmT = warm.temperature, warmVal;
        if (ww.below) {
            warmVal = D.maxWeightLb;
        } else if (ww.above) {
            if (env.w == null) return { weight: null, reason: 'outside chart' };
            warmT = tEnv; warmVal = env.w;
        } else {
            warmVal = ww.w;
        }
        if (coldVal == null || warmVal == null) return { weight: null, reason: 'outside chart' };

        var w;
        if (warmT === cold.temperature) w = coldVal;
        else {
            var f = (warmT - oat) / (warmT - cold.temperature);
            w = warmVal + f * (coldVal - warmVal);
        }
        var limit = (w >= D.maxWeightLb - 1) ? 'maxline' : 'curve';
        return { weight: Math.min(w, cap), chartWeight: w, limit: limit };
    }

    return { maxWeight: maxWeight, isaPlus40: isaPlus40 };
})();
