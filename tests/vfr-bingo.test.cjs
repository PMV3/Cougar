// Run with node tests/vfr-bingo.test.cjs. Executes the actual VFR functions
// against an isolated DOM; it does not load charts, storage or a browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '..', 'fuel.js'), 'utf8');
const fields = {};
let alerts = 0;
const context = {
    document: { getElementById(id) { return fields[id] ??= { value: '' }; } },
    alert() { alerts++; }
};
vm.createContext(context);
for (const name of ['calculateBasicFactor', 'calculateTime', 'calculateMinimumFuel', 'formatTime', 'formatTimeFromMinutes']) {
    const start = source.indexOf('    function ' + name + '(');
    assert.ok(start >= 0, 'Missing function: ' + name);
    const end = source.indexOf('\n    function ', start + 1);
    vm.runInContext(source.slice(start, end), context);
}
const outputIds = ['bf', 'time', 'flightFuel', 'bingo', 'endurance'];
function run(overrides = {}) {
    const values = { distance: 25, windSpeed: 0, speedFuel: 100, fuelConsumption: 21.5, fuelEntered: 1800, dayNight: 'day', vfrOnSiteMinutes: 0, ...overrides };
    for (const [id, value] of Object.entries(values)) context.document.getElementById(id).value = String(value);
    context.calculateMinimumFuel();
    return Object.fromEntries(outputIds.map(id => [id, fields[id].value]));
}
// Hand-calculated examples, including changes to distance and fuel independently.
const examples = [
    [{}, '822.50', '1295.00', '0h 23m'],
    [{ windSpeed: 20 }, '838.63', '1327.25', '0h 21m'],
    [{ distance: 50 }, '1145.00', '1940.00', '0h 0m - At/below Bingo'],
    [{ distance: 100 }, '1790.00', '3230.00', '0h 0m - At/below Bingo'],
    [{ fuelEntered: 1200 }, '822.50', '1295.00', '0h 0m - At/below Bingo'],
    [{ fuelEntered: 2500 }, '822.50', '1295.00', '0h 56m'],
    [{ distance: 0 }, '500.00', '650.00', '0h 53m'],
    [{ dayNight: 'night' }, '922.50', '1395.00', '0h 18m'],
    [{ distance: 40, speedFuel: 120, fuelConsumption: 20 }, '900.00', '1450.00', '0h 17m']
];
for (const [input, bingo, total, time] of examples) {
    const result = run(input);
    assert.equal(result.bingo, bingo);
    assert.equal(result.flightFuel, total);
    assert.equal(result.endurance, time);
    console.log(JSON.stringify({ input, ...result }));
}
assert.equal(run({ windSpeed: 14.99 }).bingo, '822.50');
assert.equal(run({ windSpeed: 15 }).bingo, '838.63');
for (const fuel of [0, 800, 822.5]) assert.equal(run({ fuelEntered: fuel }).endurance, '0h 0m - At/below Bingo');
// Cross-check a matrix using independently computed leg duration in hours.
let combinations = 0;
for (const distance of [0, 1, 12.5, 25, 50, 100, 250])
for (const speed of [60, 100, 120, 150])
for (const consumption of [10, 21.5, 30])
for (const wind of [0, 14.99, 15, 20])
for (const night of [false, true])
for (const fuel of [0, 500, 1800, 4000])
for (const onSite of [0, 0.5, 10, 30, 120]) {
    const reserve = night ? 600 : 500;
    const leg = (distance / speed) * (consumption * 60) * (wind >= 15 ? 1.05 : 1);
    const threshold = reserve + leg;
    const result = run({ distance, speedFuel: speed, fuelConsumption: consumption, windSpeed: wind, dayNight: night ? 'night' : 'day', fuelEntered: fuel, vfrOnSiteMinutes: onSite });
    assert.ok(Math.abs(Number(result.bingo) - threshold) <= 0.005001);
    assert.ok(Math.abs(Number(result.flightFuel) - (2 * leg + onSite * consumption + reserve + 150)) <= 0.005001);
    assert.ok(!/NaN|Infinity/.test(JSON.stringify(result)));
    const match = result.endurance.match(/^(\d+)h (\d+)m/);
    assert.ok(match);
    assert.ok(Number(match[2]) < 60);
    const displayed = Number(match[1]) * 60 + Number(match[2]);
    const remaining = Math.max(0, (fuel - 150 - leg - onSite * consumption - threshold) / consumption);
    assert.ok(displayed <= remaining + 1e-9);
    assert.ok(remaining - displayed < 1 + 1e-9);
    assert.equal(result.endurance.includes('At/below Bingo'), fuel - 150 - leg - onSite * consumption <= threshold);
    combinations++;
}
let invalidCases = 0;
for (const field of ['distance', 'windSpeed', 'speedFuel', 'fuelConsumption', 'fuelEntered']) {
    for (const value of ['', 'bad', 'Infinity', '-Infinity', -1, ...(field === 'speedFuel' || field === 'fuelConsumption' ? [0] : [])]) {
        run(); // Start with results to ensure validation clears stale values.
        const previousAlerts = alerts;
        const result = run({ [field]: value });
        assert.equal(alerts, previousAlerts + 1);
        for (const output of Object.values(result)) assert.equal(output, '');
        invalidCases++;
    }
}
assert.equal(context.formatTime(59.6), '1h 0m');
assert.equal(context.formatTime(119.6), '2h 0m');
const html = fs.readFileSync(path.join(__dirname, '..', 'STEP3.html'), 'utf8');
assert.ok(html.includes('onclick="calculateMinimumFuel()"'));
console.log(`PASS: ${examples.length} examples, ${combinations} combinations, ${invalidCases} invalid inputs, wind/Bingo boundaries and time formatting.`);
let onSiteCases = 0;
for (const windSpeed of [0, 15, 20]) {
    const baseline = run({ windSpeed });
    for (const minutes of [0, 0.5, 10, 30, 60, 120]) {
        const result = run({ windSpeed, vfrOnSiteMinutes: minutes });
        assert.equal(result.bingo, baseline.bingo);
        assert.ok(Math.abs(Number(result.flightFuel) - Number(baseline.flightFuel) - minutes * 21.5) < 0.00001);
        const leg = 322.5 * (windSpeed >= 15 ? 1.05 : 1);
        const threshold = 500 + leg;
        const time = Math.floor(Math.max(0, (1800 - 150 - leg - minutes * 21.5 - threshold) / 21.5));
        assert.equal(result.endurance, 1800 - 150 - leg - minutes * 21.5 <= threshold
            ? '0h 0m - At/below Bingo' : `${Math.floor(time / 60)}h ${time % 60}m`);
        assert.equal(fields.vfrOnSiteStatus.textContent.includes('below Bingo'), 1800 - 150 - leg - minutes * 21.5 < threshold);
        onSiteCases++;
    }
}
const tenMinutes = run({ vfrOnSiteMinutes: 10 });
assert.equal(tenMinutes.flightFuel, '1510.00');
assert.equal(tenMinutes.endurance, '0h 13m');
run({ vfrOnSiteMinutes: 10, fuelEntered: 1510 });   // 150 + outbound 322.5 + on site 215 + Bingo 822.5
assert.ok(fields.vfrOnSiteStatus.textContent.includes('exactly at Bingo'));
for (const value of [-1, 'bad', 'Infinity']) {
    run({ vfrOnSiteMinutes: value });
    for (const id of outputIds) assert.equal(fields[id].value, '');
    assert.equal(fields.vfrOnSiteStatus.textContent, '');
}
assert.equal(run({ vfrOnSiteMinutes: '' }).flightFuel, '1295.00');
// Exercise the actual save/load routines for the new field, including older saves.
const storage = {};
const persistence = {
    document: { ...context.document, addEventListener() {} },
    window: { addEventListener() {} }, console: { log() {} },
    localStorage: { getItem(key) { return storage[key] ?? null; }, setItem(key, value) { storage[key] = value; } }
};
vm.createContext(persistence);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'step3DataHandler.js'), 'utf8'), persistence);
fields.vfrOnSiteMinutes.value = '10';
persistence.saveStep3Data();
fields.vfrOnSiteMinutes.value = '0';
persistence.loadStep3Data();
assert.equal(fields.vfrOnSiteMinutes.value, '10');
storage.step3SpecificData = '{}';
persistence.loadStep3Data();
assert.equal(fields.vfrOnSiteMinutes.value, '0');
console.log(`PASS: ${onSiteCases} on-site combinations, exact/below Bingo, invalid/blank minutes and persistence.`);
// Explicit one-way examples cross-checked by hand, including the user's screenshot.
for (const [input, total, bingo, remaining] of [
    [{ distance: 100, windSpeed: 10, fuelEntered: 3600 }, '3230.00', '1790.00', '0h 17m'],
    [{ distance: 100, windSpeed: 15, fuelEntered: 3600 }, '3359.00', '1854.50', '0h 11m'],
    [{ distance: 100, windSpeed: 10, fuelEntered: 3600, vfrOnSiteMinutes: 10 }, '3445.00', '1790.00', '0h 7m'],
    [{ distance: 50, speedFuel: 120, fuelConsumption: 20, dayNight: 'night', vfrOnSiteMinutes: 15, fuelEntered: 2500 }, '2050.00', '1100.00', '0h 22m'],
    [{ distance: 150, speedFuel: 150, fuelConsumption: 25, vfrOnSiteMinutes: 20, fuelEntered: 5500 }, '4150.00', '2000.00', '0h 54m'],
    [{ distance: 100, fuelEntered: 1500 }, '3230.00', '1790.00', '0h 0m - At/below Bingo']
]) {
    const result = run(input);
    assert.equal(result.flightFuel, total);
    assert.equal(result.bingo, bingo);
    assert.equal(result.endurance, remaining);
    console.log('Verified one-way example:', JSON.stringify({ input, ...result }));
}

assert.equal(run().time, '0h 15m');
run({distance: 25});
persistence.saveStep3Data();
fields.distance.value = '999';
persistence.loadStep3Data();
assert.equal(fields.distance.value, '25');
storage.step3SpecificData = JSON.stringify({inputs:{distance:'50'}});
persistence.loadStep3Data();
assert.equal(fields.distance.value, '');
console.log('PASS: one-way travel time and distance persistence; old total-trip values are not reused.');
