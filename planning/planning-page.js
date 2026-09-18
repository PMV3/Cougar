// PLANNING.html page logic: a table of airfield rows, each computed by
// PLANNING.compute (perf/planning.js) and re-computed on every input change.
// Rows persist in localStorage under 'planningRows'.

(function () {
    'use strict';

    var STORAGE_KEY = 'planningRows';

    // Airfield presets: elevation in ft. Add airfields here.
    var AIRFIELDS = [
        { name: 'KHAMIS',         code: 'OEKM', elevationFt: 6778 },
        { name: 'JAZAN',          code: 'OEGN', elevationFt: 20 },
        { name: 'NAJRAN',         code: 'OENG', elevationFt: 3983 },
        { name: 'SHARURAH',       code: 'OESH', elevationFt: 2382 },
        { name: 'AL JOUF',        code: 'OESK', elevationFt: 2261 },
        { name: 'HAFAR AL BATIN', code: 'KSAB', elevationFt: 1352 },
        { name: 'DAHRAN',         code: 'OEDR', elevationFt: 84 },
        { name: 'Custom',         code: '',     elevationFt: null }
    ];

    // One row per airfield. Blank QNH / OAT / ZFW are filled from STEP 1 on
    // load (QNH falls back to 1013.25 when STEP 1 has none).
    var DEFAULT_ROWS = AIRFIELDS.filter(function (a) { return a.elevationFt != null; }).map(function (a) {
        return { airfield: a.name, code: a.code, elevationFt: a.elevationFt, qnhHpa: '', oatC: '', windKt: 0, onSiteMin: '', zfwLb: '', reserveLb: 500 };
    });

    var rows = [];

    function loadRows() {
        try {
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (Array.isArray(saved) && saved.length) {
                // older rows stored hours + minutes; fold them into minutes
                saved.forEach(function (row) {
                    if (row.onSiteMin == null && (row.onSiteH != null || row.onSiteM != null)) {
                        var h = parseFloat(row.onSiteH), m = parseFloat(row.onSiteM);
                        var t = (isFinite(h) ? h * 60 : 0) + (isFinite(m) ? m : 0);
                        row.onSiteMin = t > 0 ? Math.round(t) : '';
                    }
                    delete row.onSiteH; delete row.onSiteM;
                });
                return withAllAirfields(saved);
            }
        } catch (e) { /* ignore */ }
        return JSON.parse(JSON.stringify(DEFAULT_ROWS));
    }

    // Make sure every preset airfield is shown as a row. Rows saved by an
    // earlier version (the old KHAMIS / JAZAN summer-winter set) are replaced
    // by the default rows; otherwise a row is appended for each airfield that
    // has none, keeping the user's rows and their values.
    function withAllAirfields(saved) {
        var names = saved.map(function (r) { return r.airfield; }).join(',');
        var legacy = saved.length === 4 && names === 'KHAMIS,KHAMIS,JAZAN,JAZAN';
        if (legacy) return JSON.parse(JSON.stringify(DEFAULT_ROWS));
        var last = saved[saved.length - 1];
        DEFAULT_ROWS.forEach(function (d) {
            if (!saved.some(function (r) { return r.airfield === d.airfield; })) {
                var row = JSON.parse(JSON.stringify(d));
                row.qnhHpa = last.qnhHpa; row.oatC = last.oatC; row.windKt = last.windKt;
                row.onSiteMin = last.onSiteMin; row.zfwLb = last.zfwLb; row.reserveLb = last.reserveLb;
                saved.push(row);
            }
        });
        return saved;
    }

    function saveRows() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); } catch (e) { /* ignore */ }
    }

    // Zero-fuel weight saved by STEP 1 (hidden #zfw field), if any.
    function step1Zfw() {
        try {
            var s1 = JSON.parse(localStorage.getItem('step1SpecificData') || '{}');
            var v = parseFloat(s1.summaryData && s1.summaryData.zfw);
            if (isFinite(v) && v > 0) return v;
            var all = JSON.parse(localStorage.getItem('allData') || '{}');
            v = parseFloat(all.zfw);
            return (isFinite(v) && v > 0) ? v : null;
        } catch (e) { return null; }
    }

    // Elevation, QNH, OAT and zero-fuel weight saved by STEP 1 (its quick-info
    // bar and summary), each null when not available.
    function step1Info() {
        var info = { elevationFt: null, qnhHpa: null, oatC: null, zfwLb: step1Zfw() };
        try {
            var s1 = JSON.parse(localStorage.getItem('step1SpecificData') || '{}');
            var all = JSON.parse(localStorage.getItem('allData') || '{}');
            var pick = function (key) {
                var v = parseFloat(s1.inputs && s1.inputs[key]);
                if (!isFinite(v)) v = parseFloat(all[key]);
                return isFinite(v) ? v : null;
            };
            info.elevationFt = pick('elevation');
            info.qnhHpa = pick('qnh');
            info.oatC = pick('temperature');
        } catch (e) { /* ignore */ }
        return info;
    }

    function num(v) { var n = parseFloat(v); return isFinite(n) ? n : NaN; }
    function hm(h) { var m = Math.round(h * 60); return Math.floor(m / 60) + 'h ' + (m % 60) + 'm'; }
    // Time on site (hours) from the row's minutes input; blank counts as 0.
    function onSiteHours(row) { var m = num(row.onSiteMin); return (isFinite(m) && m > 0) ? m / 60 : 0; }
    function fmt(v, d) { return (v == null || !isFinite(v)) ? '--' : Number(v).toFixed(d || 0); }

    function inputCell(row, i, field, opts) {
        var td = document.createElement('td'); td.className = 'in';
        var el;
        if (field === 'airfield') {
            el = document.createElement('select');
            AIRFIELDS.forEach(function (a) {
                var o = document.createElement('option'); o.value = a.name; o.textContent = a.name; el.appendChild(o);
            });
            el.value = row.airfield || 'Custom';
            el.addEventListener('change', function () {
                var a = AIRFIELDS.filter(function (x) { return x.name === el.value; })[0];
                row.airfield = el.value;
                if (a && a.elevationFt != null) { row.code = a.code; row.elevationFt = a.elevationFt; }
                render();
            });
        } else {
            el = document.createElement('input');
            el.type = (opts && opts.text) ? 'text' : 'number';
            if (opts && opts.step) el.step = opts.step;
            if (opts && opts.wide) el.className = 'wide';
            if (opts && opts.placeholder) el.placeholder = opts.placeholder;
            if (opts && opts.title) el.title = opts.title;
            el.value = (row[field] == null) ? '' : row[field];
            el.addEventListener('input', function () {
                row[field] = (el.type === 'number') ? (el.value === '' ? '' : parseFloat(el.value)) : el.value;
                computeRow(i); saveRows();
            });
        }
        td.appendChild(el);
        return td;
    }

    function outCell(cls) { var td = document.createElement('td'); td.className = 'out' + (cls ? ' ' + cls : ''); return td; }

    function render() {
        var body = document.getElementById('planningBody');
        body.innerHTML = '';
        rows.forEach(function (row, i) {
            var tr = document.createElement('tr'); tr.dataset.index = i;
            tr.appendChild(inputCell(row, i, 'airfield'));
            tr.appendChild(inputCell(row, i, 'code', { text: true }));
            tr.appendChild(inputCell(row, i, 'elevationFt', { step: 1 }));
            tr.appendChild(inputCell(row, i, 'qnhHpa', { step: 0.1 }));
            tr.appendChild(inputCell(row, i, 'onSiteMin', { step: 5, placeholder: 'min', title: 'Time on site (minutes)' }));
            tr.appendChild(inputCell(row, i, 'oatC', { step: 1 }));
            tr.appendChild(inputCell(row, i, 'windKt', { step: 1 }));
            tr.appendChild(inputCell(row, i, 'zfwLb', { step: 1, placeholder: 'ZFW', title: 'Zero-fuel weight (lb)' }));
            tr.appendChild(inputCell(row, i, 'reserveLb', { step: 10, placeholder: 'Reserve', title: 'Reserve fuel (lb)' }));
            ['w10ft', 'w5ft', 'agw', 'hp', 'zd', 'fuel', 'tas', 'cons', 'range', 'trip'].forEach(function (k) { var td = outCell(); td.dataset.out = k; tr.appendChild(td); });
            var notes = document.createElement('td'); notes.className = 'out notes'; notes.dataset.out = 'notes'; tr.appendChild(notes);
            body.appendChild(tr);
            computeRow(i);
        });
        saveRows();
        if (window.PlanningCharts) { PlanningCharts.setRows(rows); PlanningCharts.showSelected(); }
    }

    function computeRow(i) {
        var row = rows[i];
        var tr = document.querySelector('#planningBody tr[data-index="' + i + '"]');
        if (!tr) return;
        var out = function (k) { return tr.querySelector('td[data-out="' + k + '"]'); };
        var r = PLANNING.compute({
            elevationFt: num(row.elevationFt), qnhHpa: num(row.qnhHpa), oatC: num(row.oatC),
            windKt: isFinite(num(row.windKt)) ? num(row.windKt) : 0,
            zfwLb: num(row.zfwLb), reserveLb: isFinite(num(row.reserveLb)) ? num(row.reserveLb) : 0,
            onSiteH: onSiteHours(row)
        });
        row.result = r;
        var set = function (k, text, cls, sub) {
            var td = out(k); td.className = 'out' + (cls ? ' ' + cls : ''); td.textContent = text;
            if (sub) { var s = document.createElement('span'); s.className = 'sub'; s.textContent = sub; td.appendChild(s); }
        };
        if (r.error) {
            ['w10ft', 'w5ft', 'agw', 'hp', 'zd', 'fuel', 'tas', 'cons', 'range', 'trip'].forEach(function (k) { set(k, '--'); });
            set('notes', r.error, 'warn'); return;
        }
        set('hp', fmt(r.hpFt));
        var zdOk = r.densityAltFt <= PLANNING.RULES.agwMaxDensityAltFt;
        set('zd', fmt(r.densityAltFt), zdOk ? 'ok' : 'no', zdOk ? 'OK for AGW' : '> 3000: no AGW');
        set('w10ft', fmt(r.w10ft));
        set('w5ft', fmt(r.w5ft), null, r.w5ftLimit === 'isa40' ? 'ISA+40 line' : null);
        if (r.agw.allowed) set('agw', fmt(r.agw.weight), 'ok', 'limited by ' + r.agw.limitedBy);
        else set('agw', 'no', 'no', r.agw.reasons.join('; '));
        set('fuel', fmt(r.fuelQLb), r.fuelLimitedBy === 'tank capacity' ? 'warn' : null,
            r.fuelQLb == null ? (isFinite(num(row.zfwLb)) ? null : 'enter ZFW') : (r.fuelLimitedBy === 'tank capacity' ? 'tank limit; T/O ' + fmt(r.takeoffWeightLb) + ' lb' : 'T/O ' + fmt(r.takeoffWeightLb) + ' lb'));
        set('tas', fmt(r.bestRangeTasKt), r.speedLimited ? 'warn' : null, r.speedLimited ? 'cruise ' + r.cruiseTasKt + ' kt' : null);
        set('cons', fmt(r.consumptionLbH), null, r.chartKey ? r.chartKey.replace('_', ' / ') : null);
        // Range: one-way distance, with the one-way flying time under it.
        // Trip: out + on site + back, with the total time under it.
        var legOk = r.enRouteTimeH != null && r.enRouteTimeH > 0;
        set('range', fmt(r.rangeNm), (r.enRouteTimeH != null && !legOk) ? 'no' : null,
            legOk ? hm(r.enRouteTimeH / 2) + ' one way' : null);
        set('trip', fmt(r.tripNm), null,
            r.flightTimeH ? hm(r.flightTimeH) + ' total' + (r.onSiteH ? ' incl. ' + hm(r.onSiteH) + ' on site' : '') : null);
        var notes = r.cautions.map(function (c) { return 'CAUTION: ' + c; }).concat(r.notes);
        set('notes', notes.join(' | '), r.cautions.length ? 'warn' : null);
        if (window.PlanningCharts) { PlanningCharts.setRows(rows); PlanningCharts.refreshIfSelected(i, row, r); }
    }

    document.addEventListener('DOMContentLoaded', function () {
        rows = loadRows();
        var s1 = step1Info(), parts = [];
        rows.forEach(function (row) {
            if (row.zfwLb === '' || row.zfwLb == null) { if (s1.zfwLb != null) row.zfwLb = Math.round(s1.zfwLb); }
            if (row.qnhHpa === '' || row.qnhHpa == null) row.qnhHpa = (s1.qnhHpa != null) ? s1.qnhHpa : 1013.25;
            if ((row.oatC === '' || row.oatC == null) && s1.oatC != null) row.oatC = s1.oatC;
        });
        if (s1.elevationFt != null) parts.push('elev ' + s1.elevationFt + ' ft');
        if (s1.qnhHpa != null) parts.push('QNH ' + s1.qnhHpa + ' hPa');
        if (s1.oatC != null) parts.push('OAT ' + s1.oatC + ' \u00b0C');
        if (s1.zfwLb != null) parts.push('ZFW ' + Math.round(s1.zfwLb) + ' lb');
        document.getElementById('planningHint').textContent = parts.length ? ('STEP 1: ' + parts.join(', ')) : 'No STEP 1 data found; enter the values per row.';
        document.getElementById('btnAddRow').addEventListener('click', function () {
            var last = rows[rows.length - 1] || DEFAULT_ROWS[0];
            rows.push({ airfield: last.airfield, code: last.code, elevationFt: last.elevationFt, qnhHpa: last.qnhHpa, oatC: '', windKt: 0, onSiteMin: last.onSiteMin, zfwLb: last.zfwLb, reserveLb: last.reserveLb });
            render();
        });
        document.getElementById('btnZfwFromStep1').addEventListener('click', function () {
            var s = step1Info();
            if (s.elevationFt == null && s.qnhHpa == null && s.oatC == null && s.zfwLb == null) { alert('No STEP 1 data saved yet. Fill in STEP 1 first.'); return; }
            if (!rows.length) rows.push(JSON.parse(JSON.stringify(DEFAULT_ROWS[0])));
            var row = rows[0];
            if (s.elevationFt != null) {
                row.elevationFt = s.elevationFt;
                var a = AIRFIELDS.filter(function (x) { return x.elevationFt === s.elevationFt; })[0];
                row.airfield = a ? a.name : 'Custom';
                row.code = a ? a.code : '';
            }
            if (s.qnhHpa != null) row.qnhHpa = s.qnhHpa;
            if (s.oatC != null) row.oatC = s.oatC;
            if (s.zfwLb != null) rows.forEach(function (r) { r.zfwLb = Math.round(s.zfwLb); });
            render();
        });
        document.getElementById('btnClearRows').addEventListener('click', function () {
            if (!confirm('Remove all rows and restore the default airfields?')) return;
            rows = JSON.parse(JSON.stringify(DEFAULT_ROWS)); render();
        });
        render();
    });
})();
