// Performance penalties of the optional equipment ticked in STEP 1 (Mission
// Equipment card). Plain global; no dependencies. Used by STEP2 (hover, OEI
// climb), STEP3 (fuel flow, best-range and max-continuous speeds), PLANNING
// and the target-mission planner.
//
// Sources, Flight Manual pmv1.pdf:
//  - SUP.0  "Effect of an optional equipment item on performance": apply the
//    penalty to the chart value, then compare with the aircraft maximum weight
//    and use the smaller; with several items fitted, ADD their penalties.
//  - SUP.33 5.1 Jet dilution device / replacement jet pipes (JDD): max weights
//    for hover IGE and OGE (1 and 2 engines) -2 %; climb (1 and 2 engines)
//    -80 ft/min.
//  - SUP.11 5.1.3 Hoist: climb (1 and 2 engines) -10 % of the basic vertical
//    speed, at least -50 ft/min. Hover unchanged.
//  - SUP.23 5.1 Spectrolab SX16-C searchlight: climb (1 and 2 engines) -10 %,
//    at least -50 ft/min.
//  - SUP.51 5.5.1 "Effect of the equipment items" (level flight, the charts the
//    app uses): JDD speed -5 % (above 100 kt) and consumption +2 %; hoist speed
//    -2.5 %; in-flight refuelling probe speed -3 kt (above 100 kt); Spectrolab
//    searchlight speed -3 %. No separate range figure: range follows from the
//    lower speed and higher consumption.
// Not modelled: gun/rocket axial armament (not used by the squadron) and MPAI
// bullets closed (always open in this app). Category A penalties are not
// modelled because the app has no Category A charts.
//
// Level-flight speed penalties are read as: at the power (fuel flow) the chart
// gives for chart speed Vc, the equipped aircraft flies at
// Vc * (1 - sum of %) - sum of kt. "Above 100 kt" terms apply when Vc > 100 kt.

var EQUIPMENT = (function () {
    'use strict';

    var ITEMS = [
        { key: 'jdd', label: 'JDD', ids: ['jddNumber'],
          hoverPct: 2, climbFixed: 80, speedPct: 5, speedAbove100: true, fuelPct: 2,
          source: 'SUP.33 5.1, SUP.51 5.5.1' },
        { key: 'hoist', label: 'Hoist', ids: ['hoistNumber', 'hoistNumberWSAR', 'hoistNumberCSAR'],
          climbPct: 10, climbMin: 50, speedPct: 2.5,
          source: 'SUP.11 5.1.3, SUP.51 5.5.1' },
        { key: 'probe', label: 'Refuelling probe', ids: ['refuelingProbeNumber', 'refuelingProbeNumberWSAR', 'refuelingProbeNumberCSAR'],
          speedKt: 3, speedAbove100: true,
          source: 'SUP.51 5.5.1' },
        { key: 'searchlight', label: 'Searchlight', ids: ['searchLightNumber', 'searchLightNumberWSAR', 'searchLightNumberCSAR'],
          climbPct: 10, climbMin: 50, speedPct: 3,
          source: 'SUP.23 5.1, SUP.51 5.5.1' }
    ];

    // STEP 1 inputs: the live form on STEP 1, otherwise what STEP 1 saved.
    function readInputs() {
        var out = {};
        var onStep1 = typeof document !== 'undefined' && document.getElementById('jddNumber');
        if (onStep1) {
            ITEMS.forEach(function (it) {
                it.ids.forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) out[id] = el.value;
                });
            });
            return out;
        }
        try {
            var s1 = JSON.parse(localStorage.getItem('step1SpecificData') || '{}');
            return (s1 && s1.inputs) || {};
        } catch (e) {
            return {};
        }
    }

    // Items fitted: any of the item's STEP 1 counts above zero.
    function fitted(inputs) {
        var inp = inputs || readInputs();
        return ITEMS.filter(function (it) {
            return it.ids.some(function (id) { return parseFloat(inp[id]) > 0; });
        });
    }

    function current() { return fitted(); }
    function list(eq) { return eq || current(); }
    function sum(eq, field, pred) {
        return list(eq).reduce(function (s, it) {
            return s + ((it[field] && (!pred || pred(it))) ? it[field] : 0);
        }, 0);
    }

    // ---- Hover (IGE 10 ft, IGE 5 ft incl. AGW, OGE) ----
    function hoverFactor(eq) { return 1 - sum(eq, 'hoverPct') / 100; }
    // Chart maximum weight -> allowed weight: penalty first, then the cap.
    function hoverWeight(chartLb, capLb, eq) {
        if (chartLb == null || !isFinite(chartLb)) return chartLb;
        var w = chartLb * hoverFactor(eq);
        return (capLb != null && isFinite(capLb)) ? Math.min(w, capLb) : w;
    }
    // Actual weight -> the weight to enter the chart with (for "max altitude
    // at this weight" readings): the equipped aircraft needs the chart's
    // performance at a heavier weight.
    function hoverChartWeight(actualLb, eq) {
        if (actualLb == null || !isFinite(actualLb)) return actualLb;
        return actualLb / hoverFactor(eq);
    }

    // ---- Climb (OEI and twin-engine rate of climb, ft/min) ----
    function climbPenalty(basicFpm, eq) {
        if (basicFpm == null || !isFinite(basicFpm)) return 0;
        return list(eq).reduce(function (s, it) {
            if (it.climbFixed) return s + it.climbFixed;
            if (it.climbPct) return s + Math.max(Math.abs(basicFpm) * it.climbPct / 100, it.climbMin || 0);
            return s;
        }, 0);
    }
    function climb(basicFpm, eq) {
        if (basicFpm == null || !isFinite(basicFpm)) return basicFpm;
        return basicFpm - climbPenalty(basicFpm, eq);
    }

    // ---- Level flight ----
    function speedTerms(eq, includeAbove100) {
        var pick = function (it) { return includeAbove100 || !it.speedAbove100; };
        return { pct: sum(eq, 'speedPct', pick), kt: sum(eq, 'speedKt', pick) };
    }
    // Chart TAS -> TAS the equipped aircraft flies at the same power.
    function actualSpeed(chartKt, eq) {
        if (chartKt == null || !isFinite(chartKt)) return chartKt;
        var t = speedTerms(eq, chartKt > 100);
        return chartKt * (1 - t.pct / 100) - t.kt;
    }
    // Wanted TAS -> chart TAS to read the fuel flow at.
    function chartSpeed(actualKt, eq) {
        if (actualKt == null || !isFinite(actualKt)) return actualKt;
        var all = speedTerms(eq, true);
        var vc = (actualKt + all.kt) / (1 - all.pct / 100);
        if (vc > 100) return vc;
        var low = speedTerms(eq, false);
        return (actualKt + low.kt) / (1 - low.pct / 100);
    }
    function fuelFactor(eq) { return 1 + sum(eq, 'fuelPct') / 100; }

    // ---- Text for the pages ----
    // scope: 'hover-climb', 'level' or 'all' (default): which effects to list.
    function describeItem(it, scope) {
        var parts = [];
        var hc = scope !== 'level', lv = scope !== 'hover-climb';
        if (hc && it.hoverPct) parts.push('hover weight -' + it.hoverPct + '%');
        if (hc && it.climbFixed) parts.push('climb -' + it.climbFixed + ' ft/min');
        if (hc && it.climbPct) parts.push('climb -' + it.climbPct + '% (min ' + it.climbMin + ' ft/min)');
        if (lv && it.speedPct) parts.push('speed -' + it.speedPct + '%' + (it.speedAbove100 ? ' above 100 kt' : ''));
        if (lv && it.speedKt) parts.push('speed -' + it.speedKt + ' kt' + (it.speedAbove100 ? ' above 100 kt' : ''));
        if (lv && it.fuelPct) parts.push('fuel flow +' + it.fuelPct + '%');
        return it.label + ': ' + parts.join(', ') + ' (' + it.source + ')';
    }
    function describe(eq) { return list(eq).map(describeItem); }
    function labels(eq) { return list(eq).map(function (it) { return it.label; }); }

    // A note box listing the corrections, placed before `anchor` (element or
    // selector), or after it when `after` is true. Hidden when nothing is
    // fitted. `scope` limits the wording to what that page applies:
    // 'hover-climb', 'level' or 'all'. Returns the box.
    function mountBanner(anchor, scope, after) {
        if (typeof document === 'undefined') return;
        var at = typeof anchor === 'string' ? document.querySelector(anchor) : anchor;
        if (!at || !at.parentNode) return;
        var box = document.getElementById('equipmentBanner');
        if (!box) {
            box = document.createElement('div');
            box.id = 'equipmentBanner';
            box.style.cssText = 'margin:0 0 1rem 0;padding:0.75rem 1rem;border:1px solid #f59e0b;border-left:4px solid #d97706;' +
                'border-radius:8px;background:#fffbeb;color:#78350f;font-size:0.85rem;line-height:1.45;';
            at.parentNode.insertBefore(box, after ? at.nextSibling : at);
        }
        var eq = current();
        if (!eq.length) { box.style.display = 'none'; return box; }
        var relevant = eq.filter(function (it) {
            if (scope === 'hover-climb') return it.hoverPct || it.climbFixed || it.climbPct;
            if (scope === 'level') return it.speedPct || it.speedKt || it.fuelPct;
            return true;
        });
        if (!relevant.length) { box.style.display = 'none'; return box; }
        box.style.display = 'block';
        box.innerHTML = '';
        var title = document.createElement('strong');
        title.textContent = 'Equipment corrections applied (from STEP 1 Mission Equipment)';
        box.appendChild(title);
        var ul = document.createElement('ul');
        ul.style.cssText = 'margin:0.35rem 0 0 1.1rem;padding:0;';
        relevant.forEach(function (it) {
            var li = document.createElement('li');
            li.textContent = describeItem(it, scope);
            ul.appendChild(li);
        });
        box.appendChild(ul);
        var note = document.createElement('div');
        note.style.cssText = 'margin-top:0.35rem;font-size:0.8rem;';
        note.textContent = 'Calculation results include these corrections. On the charts, no changes on the drawing.';
        box.appendChild(note);
        return box;
    }

    return {
        ITEMS: ITEMS, readInputs: readInputs, fitted: fitted, current: current,
        hoverFactor: hoverFactor, hoverWeight: hoverWeight, hoverChartWeight: hoverChartWeight,
        climbPenalty: climbPenalty, climb: climb,
        actualSpeed: actualSpeed, chartSpeed: chartSpeed, fuelFactor: fuelFactor,
        describe: describe, labels: labels, mountBanner: mountBanner
    };
})();
