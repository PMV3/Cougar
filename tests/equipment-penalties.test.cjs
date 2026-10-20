// Equipment performance penalties (perf/equipment.js) used by PLANNING and the
// target-mission planner. Expected values are written here directly from the
// Flight Manual, not taken from perf/equipment.js:
//  SUP.0  penalties of several items add; apply to the chart value, then cap.
//  SUP.33 JDD: hover IGE/OGE max weight -2 %, climb -80 ft/min.
//  SUP.11 hoist / SUP.23 searchlight: climb -10 % of basic, at least -50 ft/min.
//  SUP.51 5.5.1 level flight: JDD speed -5 % above 100 kt and fuel +2 %;
//         hoist speed -2.5 %; probe -3 kt above 100 kt; searchlight -3 %.
// Every check also confirms the chart reading underneath is the same one the
// app uses with no equipment fitted.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const store = {};
const context = { localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
vm.createContext(context);
for (const file of ['datafolder/heightloosemap.js', 'datafolder/weightindex.js', 'datafolder/newIGE.js', 'datafolder/ige5ft_agw.js', 'datafolder/newhoge.js',
    'datafolder/serviceCeiling.js', 'datafolder/serviceclimbing.js', 'datafolder/levelflightData.js', 'datafolder/bestRangeSpeed.js',
    'perf/atmosphere.js', 'perf/hover5ft.js', 'perf/hover10ft.js', 'perf/weightindex.js', 'perf/levelflight.js', 'perf/equipment.js',
    'perf/planning.js', 'perf/target-mission.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const run = code => vm.runInContext(code, context);
const E = run('EQUIPMENT'), P = run('PLANNING'), T = run('TARGET_MISSION'), LF = run('LEVELFLIGHT'), H5 = run('HOVER5FT'), H10 = run('HOVER10FT'), ATM = run('ATM');

// ---- Independent rules (from the manual) ----
const R = {
    hoverF: e => (e.jdd ? 0.98 : 1),
    climbPen: (e, b) => (e.jdd ? 80 : 0) + (e.hoist ? Math.max(0.1 * Math.abs(b), 50) : 0) + (e.light ? Math.max(0.1 * Math.abs(b), 50) : 0),
    terms: (e, above) => ({ pct: (e.jdd && above ? 5 : 0) + (e.hoist ? 2.5 : 0) + (e.light ? 3 : 0), kt: (e.probe && above ? 3 : 0) }),
    actual(e, vc) { const t = R.terms(e, vc > 100); return vc * (1 - t.pct / 100) - t.kt; },
    chartFor(e, v) { let t = R.terms(e, true), vc = (v + t.kt) / (1 - t.pct / 100); if (vc > 100) return vc; t = R.terms(e, false); return (v + t.kt) / (1 - t.pct / 100); },
    fuelF: e => (e.jdd ? 1.02 : 1)
};
// All 16 combinations; each item is entered on a different STEP 1 mission row.
const ROWS = { jdd: ['jddNumber'], hoist: ['hoistNumber', 'hoistNumberWSAR', 'hoistNumberCSAR'], probe: ['refuelingProbeNumber', 'refuelingProbeNumberWSAR', 'refuelingProbeNumberCSAR'], light: ['searchLightNumber', 'searchLightNumberWSAR', 'searchLightNumberCSAR'] };
const COMBOS = [];
for (let m = 0; m < 16; m++) COMBOS.push({ jdd: !!(m & 1), hoist: !!(m & 2), probe: !!(m & 4), light: !!(m & 8) });
const name = e => Object.keys(e).filter(k => e[k]).join('+') || 'none';
function fit(e, variant) {
    const inputs = {};
    for (const k of Object.keys(ROWS)) if (e[k]) inputs[ROWS[k][variant % ROWS[k].length]] = '1';
    store.step1SpecificData = JSON.stringify({ inputs });
}
const near = (a, b, tol, msg) => assert.ok(a === b || (a != null && b != null && Math.abs(a - b) <= tol), `${msg}: got ${a}, expected ${b}`);
let checks = 0;
const ok = (a, b, tol, msg) => { near(a, b, tol, msg); checks++; };

// ---- 1. Rules against the manual's own worked examples ----
fit({ hoist: true }, 0);
ok(E.climb(400), 350, 1e-9, 'SUP.11 example 400'); ok(E.climb(-200), -250, 1e-9, 'SUP.11 example -200'); ok(E.climb(3200), 2880, 1e-9, 'SUP.11 example 3200');
fit({ jdd: true }, 0);
ok(E.hoverWeight(21000, 21495), 20580, 1e-9, 'JDD hover'); ok(E.hoverWeight(23000, 21495), 21495, 1e-9, 'JDD hover capped after penalty');
ok(E.climb(300), 220, 1e-9, 'JDD climb'); ok(E.fuelFactor(), 1.02, 1e-12, 'JDD fuel');
// Detection: blank, zero and unticked rows do not count; any mission row does.
store.step1SpecificData = JSON.stringify({ inputs: { jddNumber: '', hoistNumber: '0', searchLightNumberWSAR: '' } });
assert.equal(E.current().length, 0); checks++;
delete store.step1SpecificData; assert.equal(E.current().length, 0); checks++;
for (const [k, ids] of Object.entries(ROWS)) for (const id of ids) {
    store.step1SpecificData = JSON.stringify({ inputs: { [id]: '1' } });
    assert.equal(JSON.stringify(E.current().map(i => i.key)), JSON.stringify([{ jdd: 'jdd', hoist: 'hoist', probe: 'probe', light: 'searchlight' }[k]]), id); checks++;
}

// ---- 2. Rules for every combination over a range of values ----
COMBOS.forEach((e, i) => {
    fit(e, i);
    for (const b of [-800, -300, -120, -40, 0, 60, 250, 499, 501, 900, 2500]) ok(E.climb(b), b - R.climbPen(e, b), 1e-9, `${name(e)} climb ${b}`);
    for (const w of [15000, 19000, 21000, 21900, 23000, 24700]) ok(E.hoverWeight(w, 21495), Math.min(w * R.hoverF(e), 21495), 1e-9, `${name(e)} hover ${w}`);
    for (let vc = 60; vc <= 170; vc += 2.5) {
        ok(E.actualSpeed(vc), R.actual(e, vc), 1e-9, `${name(e)} actual ${vc}`);
        const v = R.actual(e, vc);
        ok(R.actual(e, E.chartSpeed(v)), v, 1e-9, `${name(e)} chart speed round trip ${v}`);
    }
    for (let v = 60; v <= 150; v += 5) ok(E.chartSpeed(v), R.chartFor(e, v), 1e-9, `${name(e)} chartSpeed ${v}`);
    ok(E.fuelFactor(), R.fuelF(e), 1e-12, `${name(e)} fuel`);
});
console.log(`PASS: penalty rules, manual examples and STEP 1 detection for all 16 combinations (${checks} checks).`);

// ---- 3. PLANNING: same chart readings, penalties applied on top ----
let pChecks = 0, pRows = 0;
const pOk = (a, b, tol, msg) => { near(a, b, tol, msg); pChecks++; };
for (const elev of [-500, 0, 84, 1352, 2261, 3983, 5000, 6778, 8000])
    for (const oat of [-10, 0, 15, 25, 35, 45])
        for (const zfw of [15000, 16903, 18500])
            for (const [wind, onSiteMin] of [[-30, 0], [0, 10], [20, 30]]) {
                const inp = { elevationFt: elev, qnhHpa: 1013.25, oatC: oat, windKt: wind, zfwLb: zfw, reserveLb: 500, onSiteH: onSiteMin / 60 };
                delete store.step1SpecificData;
                const base = P.compute(inp);
                COMBOS.forEach((e, i) => {
                    fit(e, i);
                    const r = P.compute(inp), tag = `${elev} ft ${oat} C ZFW ${zfw} wind ${wind} ${name(e)}`;
                    pRows++;
                    pOk(r.w10ftChart, base.w10ft, 1e-9, tag + ' 10 ft chart reading');
                    pOk(r.w10ft, base.w10ft == null ? null : Math.min(base.w10ft * R.hoverF(e), 21495), 1e-6, tag + ' 10 ft');
                    const h5 = H5.maxWeight(r.hpFt, oat, 21495);
                    pOk(r.w5ftChart, base.w5ft, 1e-9, tag + ' 5 ft chart reading');
                    pOk(r.w5ft, h5.weight == null ? null : Math.min(h5.chartWeight * R.hoverF(e), 21495), 1e-6, tag + ' 5 ft');
                    pOk(r.agw.chartWeight, base.agw.chartWeight, 1e-9, tag + ' AGW chart reading');
                    if (r.agw.allowed) assert.ok(r.agw.weight <= Math.min(r.agw.chartWeight * R.hoverF(e), 24700) + 1e-6, tag + ' AGW');
                    if (base.consumptionLbH != null && r.takeoffWeightLb === base.takeoffWeightLb) {
                        pOk(r.bestRangeChartKt, base.bestRangeTasKt, 0, tag + ' best-range chart reading');
                        pOk(r.consumptionChartLbH, base.consumptionLbH, 0, tag + ' consumption chart reading');
                    }
                    if (r.consumptionLbH != null) {
                        const ff = LF.fuelFlow(r.chartKey, r.takeoffWeightLb, r.bestRangeChartKt, { clampToMaxSpeed: true });
                        pOk(r.consumptionChartLbH, Math.round(ff.lbPerHour), 0, tag + ' chart lb/h');
                        pOk(r.consumptionLbH, Math.round(ff.lbPerHour * R.fuelF(e)), 0, tag + ' lb/h');
                        pOk(r.cruiseTasKt, Math.round(R.actual(e, ff.tasUsed)), 0, tag + ' cruise');
                        const wi = Math.min(r.takeoffWeightLb, 21000);
                        pOk(r.bestRangeTasKt, Math.round(R.actual(e, LF.bestRangeSpeed(r.chartKey, wi, wind))), 0, tag + ' best range');
                        const usable = r.fuelQLb - 500 - 150, ft = usable / r.consumptionLbH, enroute = ft - onSiteMin / 60;
                        if (usable > 0) {
                            pOk(r.rangeNm, enroute > 0 ? Math.round(enroute * r.cruiseTasKt / 2) : 0, 0, tag + ' range');
                            if (enroute > 0) pOk(r.tripNm, 2 * r.rangeNm + Math.round(onSiteMin / 60 * r.cruiseTasKt), 0, tag + ' trip');
                        }
                        if (base.rangeNm != null && r.fuelQLb === base.fuelQLb) assert.ok(r.rangeNm <= base.rangeNm, tag + ' range must not grow');
                    }
                    if (Object.values(e).some(Boolean)) assert.ok(r.notes.some(n => /equipment corrections applied/.test(n)), tag + ' note');
                    else assert.ok(!r.notes.some(n => /equipment/.test(n)), tag + ' no note');
                });
            }
console.log(`PASS: PLANNING, ${pRows} airfield/condition/equipment rows: chart readings unchanged, hover, best range, cruise, consumption, range and trip (${pChecks} checks).`);

// ---- 4. Target-mission planner: hover/climb and fuel burn ----
let tChecks = 0;
const tOk = (a, b, tol, msg) => { near(a, b, tol, msg); tChecks++; };
for (const hp of [0, 2000, 5000, 8000]) for (const oat of [0, 20, 35]) for (const w of [16000, 18500, 20500]) {
    delete store.step1SpecificData;
    const base = T.performance(w, hp, oat);
    COMBOS.forEach((e, i) => {
        fit(e, i);
        const r = T.performance(w, hp, oat), tag = `TM ${hp} ft ${oat} C ${w} lb ${name(e)}`;
        tOk(r.ten, base.ten == null ? null : base.ten * R.hoverF(e), 1e-6, tag + ' 10 ft');
        tOk(r.oge, base.oge == null ? null : base.oge * R.hoverF(e), 1e-6, tag + ' OGE');
        const h5 = (oat < ATM.isaTemperature(hp) + 40) ? H5.maxWeight(hp, oat, 21495) : { weight: null };
        tOk(r.five, base.five == null ? null : Math.min(h5.chartWeight * R.hoverF(e), 21495), 1e-6, tag + ' 5 ft');
        tOk(r.climb, base.climb == null ? null : base.climb - R.climbPen(e, base.climb), 1e-9, tag + ' climb');
        tOk(r.index, base.index, 1e-9, tag + ' weight index unchanged');
        tOk(r.ceiling, base.ceiling, 1e-9, tag + ' ceiling unchanged');
    });
}
// Outbound burn: minute-by-minute at the chart speed for the wanted TAS, times the fuel factor.
let burns = 0;
for (const [elev, oat] of [[0, 15], [1352, 30], [3983, 25], [6000, 10]]) for (const speed of [90, 110, 125]) for (const distance of [20, 60]) {
    const base = { weight: 19000, fuel: 3500, hp: elev, oat, cg: 185, loads: {} };
    const input = { enabled: true, distance, speed, elevation: elev, qnh: 1013.25, oat, onSite: 0, changes: [] };
    COMBOS.forEach((e, i) => {
        fit(e, i);
        const r = T.compute(base, input);
        if (r.error) return;
        const hp = ATM.pressureAltitude(elev, 1013.25), key = LF.selectKey(hp, oat), minutes = distance / speed * 60;
        let used = 0;
        for (let t = 0; t < minutes; t += 1) {
            const f = LF.fuelFlow(key, base.weight - 150 - used, R.chartFor(e, speed)).lbPerHour * R.fuelF(e);
            used += f / 60 * Math.min(1, minutes - t);
        }
        tOk(r.outbound.burn, used, 1e-6, `TM burn ${elev} ft ${oat} C ${speed} kt ${distance} NM ${name(e)}`);
        burns++;
    });
}
assert.ok(burns > 100, 'enough fuel-burn cases ran');
delete store.step1SpecificData;
console.log(`PASS: target-mission planner, hover/climb for 36 conditions and ${burns} outbound fuel burns over all 16 combinations (${tChecks} checks).`);
