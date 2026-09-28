// Mission planning chain: reproduces the squadron planning sheet
// (T/O airfield -> pressure altitude, density altitude, max takeoff weights
// 10 ft / 5 ft / AGW, fuel quantity, best range speed, consumption, range).
// Plain global; no DOM. Needs ATM, HOVER5FT, HOVER10FT, WEIGHTINDEX and
// LEVELFLIGHT (perf/*.js) and their datasets loaded before this file.
//
// Rules, with their source:
//  - Max takeoff weight 10 ft / 5 ft: basic-manual hover charts, capped at
//    21495 lb (9750 kg).
//  - AGW: SUP.51 Figure 1 (IGE 5 ft) capped at 24700 lb, and only when
//      . pressure altitude >= -2000 ft and density altitude <= 3000 ft
//        (SUP.51 2.x Altitude envelope, landing and takeoff),
//      . weight index <= 11.6 (SUP.51 2.2, applied by limiting the weight),
//    with a caution above 22046 lb (10000 kg) that the emergency flotation
//    gear counts only as immersion-retardant. Crew and systems conditions of
//    SUP.51 1.1 / 2.1 are for the crew to confirm.
//  - Fuel quantity: min(6700 lb, allowed takeoff weight - zero fuel weight),
//    allowed weight = AGW when permitted, else the 5 ft weight (takeoff is
//    from the 5 ft check hover).
//  - Best range TAS: inset of the level-flight chart at the takeoff weight
//    (inset printed to 21000 lb; heavier weights read at 21000 lb) and the
//    en-route wind component.
//  - Consumption: level-flight chart at that TAS and the takeoff weight. The
//    chart is the nearest of the twelve SUP.51 level-flight charts (Hp 0,
//    3000, 6000, 9000 ft; OAT 0, +15, +30, +45 degC), see perf/levelflight.js.
//  - Range: STEP3 "RANGE from fuel quantity available" formula:
//    usable = fuel - reserve - 150 (start-up and taxi), flight time = usable /
//    consumption, en-route time = flight time - time on site (STEP3 burns
//    the on-site time at the same consumption), range = en-route time *
//    TAS / 2 (radius of action).
//  - Trip: 2 * range + the on-site time converted to NM at the cruise TAS
//    (the distance the usable fuel covers at cruise speed).

var PLANNING = (function () {
    'use strict';

    var RULES = {
        normalMaxLb: 21495,
        agwMaxLb: 24700,
        maxFuelLb: 6700,
        startTaxiLb: 150,
        agwMinHpFt: -2000,
        agwMaxDensityAltFt: 3000,
        agwMaxWeightIndex: 11.6,
        flotationCautionLb: 22046,
        bestRangeInsetMaxLb: 21000
    };

    function round(v, d) {
        if (v == null || !isFinite(v)) return null;
        var m = Math.pow(10, d || 0);
        return Math.round(v * m) / m;
    }

    // inp: { elevationFt, qnhHpa, oatC, windKt, zfwLb, reserveLb, onSiteH (hours, optional) }
    function compute(inp) {
        var r = { inputs: inp, notes: [], cautions: [] };

        r.hpFt = ATM.pressureAltitude(inp.elevationFt, inp.qnhHpa);
        if (r.hpFt == null) { r.error = 'Elevation and QNH are required'; return r; }
        if (!isFinite(inp.oatC)) { r.error = 'OAT is required'; return r; }
        r.hpFt = Math.round(r.hpFt);
        r.densityAltFt = Math.round(ATM.densityAltitude(r.hpFt, inp.oatC));

        // Max takeoff weight, basic manual
        r.w10ft = HOVER10FT.maxWeight(inp.oatC, r.hpFt);
        if (r.w10ft == null) r.notes.push('10 ft: outside chart (no hover at any charted weight)');
        var h5 = HOVER5FT.maxWeight(r.hpFt, inp.oatC, RULES.normalMaxLb);
        r.w5ft = h5.weight;
        r.w5ftLimit = h5.limit || null;
        if (r.w5ft == null) r.notes.push('5 ft: ' + h5.reason);

        // AGW
        var agw = { allowed: false, weight: null, chartWeight: null, weightIndexLimitLb: null, limitedBy: null, reasons: [] };
        if (r.hpFt < RULES.agwMinHpFt) agw.reasons.push('pressure altitude below -2000 ft');
        if (r.densityAltFt > RULES.agwMaxDensityAltFt) agw.reasons.push('density altitude > 3000 ft');
        var h5agw = HOVER5FT.maxWeight(r.hpFt, inp.oatC, RULES.agwMaxLb);
        agw.chartWeight = h5agw.weight;
        if (agw.chartWeight == null) agw.reasons.push('5 ft AGW chart: ' + h5agw.reason);
        agw.weightIndexLimitLb = WEIGHTINDEX.maxWeightForIndex(inp.oatC, r.hpFt, RULES.agwMaxWeightIndex);
        if (agw.weightIndexLimitLb == null) r.notes.push('weight index chart not available for these conditions; index limit not applied');
        if (agw.reasons.length === 0) {
            var w = Math.min(agw.chartWeight, RULES.agwMaxLb);
            agw.limitedBy = (h5agw.limit === 'maxline') ? '24700 lb limit line' : (h5agw.limit === 'isa40' ? 'ISA+40 line' : '5 ft AGW chart');
            if (agw.weightIndexLimitLb != null && agw.weightIndexLimitLb < w) { w = agw.weightIndexLimitLb; agw.limitedBy = 'weight index 11.6'; }
            if (w > RULES.normalMaxLb) { agw.allowed = true; agw.weight = w; }
            else agw.reasons.push('AGW chart gives no more than the normal maximum here');
        }
        r.agw = agw;

        // Fuel quantity
        var allowedTakeoff = agw.allowed ? agw.weight : r.w5ft;
        r.allowedTakeoffLb = allowedTakeoff;
        if (allowedTakeoff != null && isFinite(inp.zfwLb)) {
            r.fuelQLb = Math.max(0, Math.min(RULES.maxFuelLb, allowedTakeoff - inp.zfwLb));
            r.fuelLimitedBy = (allowedTakeoff - inp.zfwLb > RULES.maxFuelLb) ? 'tank capacity' : (agw.allowed ? 'AGW' : '5 ft weight');
            r.takeoffWeightLb = inp.zfwLb + r.fuelQLb;
            if (r.takeoffWeightLb > RULES.flotationCautionLb) r.cautions.push('over 22046 lb, floats are immersion-retardant only (SUP.51 2.2)');
        } else {
            r.fuelQLb = null; r.takeoffWeightLb = null;
        }

        // Level flight
        r.chartKey = LEVELFLIGHT.selectKey(r.hpFt, inp.oatC);
        if (!r.chartKey) r.notes.push('level-flight charts cover -2000 to 10500 ft only');
        if (r.chartKey && r.takeoffWeightLb != null) {
            var wInset = Math.min(r.takeoffWeightLb, RULES.bestRangeInsetMaxLb);
            var wind = isFinite(inp.windKt) ? inp.windKt : 0;
            var tas = LEVELFLIGHT.bestRangeSpeed(r.chartKey, wInset, wind);
            r.bestRangeTasKt = tas == null ? null : Math.round(tas);
            if (tas == null) r.notes.push('best range speed: outside the inset for this weight/wind');
            if (r.bestRangeTasKt != null) {
                // The heavy fuel curves end at the AEO max-continuous line; if the
                // best-range TAS is beyond it, cruise at the max-continuous speed.
                var ff = LEVELFLIGHT.fuelFlow(r.chartKey, r.takeoffWeightLb, r.bestRangeTasKt, { clampToMaxSpeed: true });
                r.consumptionLbH = ff.lbPerHour == null ? null : Math.round(ff.lbPerHour);
                r.cruiseTasKt = ff.lbPerHour == null ? null : Math.round(ff.tasUsed);
                r.speedLimited = !!ff.speedLimited;
                if (ff.lbPerHour == null) r.notes.push('consumption: ' + ff.reason);
                else if (ff.weightClamped) r.notes.push('consumption read at the ' + ff.heaviest + ' lb curve, the heaviest usable on this chart');
                else if (ff.speedLimited && r.cruiseTasKt < r.bestRangeTasKt) r.notes.push('best range ' + r.bestRangeTasKt + ' kt exceeds AEO max continuous at this weight; cruise at ' + r.cruiseTasKt + ' kt');
            }
        }

        // Range
        if (r.fuelQLb != null && r.consumptionLbH && r.cruiseTasKt) {
            var reserve = isFinite(inp.reserveLb) ? inp.reserveLb : 0;
            r.usableFuelLb = r.fuelQLb - reserve - RULES.startTaxiLb;
            r.onSiteH = (isFinite(inp.onSiteH) && inp.onSiteH > 0) ? inp.onSiteH : 0;
            if (r.usableFuelLb > 0) {
                r.flightTimeH = r.usableFuelLb / r.consumptionLbH;   // total time on the usable fuel
                r.enRouteTimeH = r.flightTimeH - r.onSiteH;           // STEP3: flight time minus time on site
                r.onSiteNm = round(r.onSiteH * r.cruiseTasKt, 0);
                if (r.enRouteTimeH > 0) {
                    r.rangeNm = round((r.enRouteTimeH * r.cruiseTasKt) / 2, 0);
                    r.tripNm = 2 * r.rangeNm + r.onSiteNm;
                } else {
                    r.rangeNm = 0; r.tripNm = round(r.flightTimeH * r.cruiseTasKt, 0);
                    r.notes.push('time on site uses all the usable fuel');
                }
            } else {
                r.rangeNm = 0; r.notes.push('no usable fuel after reserve and start-up');
            }
        }
        return r;
    }

    return { RULES: RULES, compute: compute };
})();
