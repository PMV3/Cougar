// Chart panel of PLANNING.html: draws the four charts behind the row chosen
// in the panel header, in the same style as STEP2/STEP3 (image behind,
// construction lines on top). Needs perf/charts.js, perf/weightindex.js (trace), the datasets and
// PLANNING results.

var PlanningCharts = (function () {
    'use strict';

    var selected = -1;
    var RED = '#dc2626', BLUE = '#1d4ed8', GREY = '#6b7280', GREEN = '#16a34a';

    function el(id) { return document.getElementById(id); }
    // Chart caption: the title, then the manual figure in a lighter style.
    function caption(id, d) {
        var c = el(id); c.textContent = d.title;
        if (d.source) { var s = document.createElement('span'); s.className = 'src'; s.textContent = ' — ' + d.source; c.appendChild(s); }
    }
    function fmt(v) { return (v == null || !isFinite(v)) ? '--' : Math.round(v).toString(); }

    function drawHover10(r) {
        var d = CHARTS.defs.hover10ft;
        caption('chartTitle10', d);
        CHARTS.draw(el('chart10ft'), d, function (ctx) {
            if (r.w10ft == null) { CHARTS.label(ctx, 'Outside chart', 80, 60, RED); return; }
            var y = d.y(r.hpFt), x = d.x(r.w10ft);
            CHARTS.arrow(ctx, d.axisX, y, x, y, BLUE);
            CHARTS.arrow(ctx, x, y, x, d.axisY, BLUE);
            CHARTS.dot(ctx, x, y, BLUE);
            CHARTS.label(ctx, fmt(r.w10ft) + ' lb @ ' + fmt(r.hpFt) + ' ft, ' + r.inputs.oatC + ' C', Math.min(x + 10, 480), y - 10, BLUE, 15);
        });
    }

    function drawHover5(r) {
        var d = CHARTS.defs.ige5ftAgw;
        caption('chartTitle5', d);
        CHARTS.draw(el('chart5ft'), d, function (ctx) {
            var k = CHARTS.scale(ctx);
            var y = d.y(r.hpFt);
            // normal maximum reference line (9750 kg / 21495 lb)
            var xn = d.x(21495);
            CHARTS.line(ctx, xn, d.y(20000), xn, d.y(-2000), GREY, 2, [10, 8]);
            CHARTS.label(ctx, '21495 lb', xn - 40 * k, d.y(20000) - 8 * k, GREY, 14);
            var chart5 = r.w5ft == null ? null : (r.agw.chartWeight != null ? r.agw.chartWeight : r.w5ft);
            if (chart5 == null) { CHARTS.label(ctx, 'Outside chart: ' + (r.notes.join('; ') || ''), 240, 60 * k, RED); return; }
            // altitude line from the axis to the chart curve intersection
            var xc = d.x(Math.min(chart5, 24700));
            CHARTS.arrow(ctx, d.axisX, y, xc, y, BLUE);
            // 5 ft normal weight (capped 21495), red
            var x5 = d.x(r.w5ft);
            CHARTS.arrow(ctx, x5, y, x5, d.axisY, RED);
            CHARTS.dot(ctx, x5, y, RED);
            CHARTS.label(ctx, '5 ft: ' + fmt(r.w5ft) + ' lb', Math.max(240, x5 - 200 * k), y - 14 * k, RED, 16);
            // AGW weight, blue when permitted, grey with reason when not
            if (r.agw.allowed) {
                var xa = d.x(r.agw.weight);
                CHARTS.arrow(ctx, xa, y, xa, d.axisY, BLUE);
                CHARTS.dot(ctx, xa, y, BLUE);
                CHARTS.label(ctx, 'AGW: ' + fmt(r.agw.weight) + ' lb (' + r.agw.limitedBy + ')', Math.max(240, xa - 380 * k), y + 34 * k, BLUE, 16);
            } else {
                CHARTS.dot(ctx, xc, y, GREY);
                CHARTS.label(ctx, 'AGW not permitted: ' + r.agw.reasons.join('; '), 240, y + 34 * k, GREY, 15);
            }
            CHARTS.label(ctx, 'Hp ' + fmt(r.hpFt) + ' ft, OAT ' + r.inputs.oatC + ' C', 240, 60 * k, BLUE, 15);
        });
    }

    function drawWeightIndex(r) {
        var d = CHARTS.defs.weightIndex;
        caption('chartTitleWI', d);
        var w = r.agw.allowed ? r.agw.weight : (r.takeoffWeightLb != null ? r.takeoffWeightLb : r.w5ft);
        CHARTS.draw(el('chartWI'), d, function (ctx) {
            var k = CHARTS.scale(ctx);
            var xl = d.indexX(PLANNING.RULES.agwMaxWeightIndex);
            CHARTS.line(ctx, xl, 40, xl, d.baseY, RED, 2, [10, 8]);
            CHARTS.label(ctx, 'limit 11.6 (AGW)', xl - 60 * k, 36, RED, 14);
            var t = (w == null) ? null : WEIGHTINDEX.trace(r.inputs.oatC, r.hpFt, w);
            if (!t) { CHARTS.label(ctx, 'Weight index chart: outside range', 60, d.baseY + 33 * k, RED, 15); return; }
            CHARTS.arrow(ctx, t.qatX, d.baseY, t.qatX, t.Y, BLUE);
            CHARTS.arrow(ctx, t.qatX, t.Y, t.X, t.Y, BLUE);
            CHARTS.arrow(ctx, t.X, t.Y, t.X, d.baseY, BLUE);
            CHARTS.dot(ctx, t.X, t.Y, BLUE);
            var ok = t.index <= PLANNING.RULES.agwMaxWeightIndex;
            CHARTS.label(ctx, 'index ' + t.index.toFixed(2) + ' at ' + fmt(w) + ' lb' + (r.agw.allowed ? '' : ' (AGW not in use)'), 60, d.baseY + 33 * k, ok ? GREEN : RED, 15);
        });
    }

    function drawLevelFlight(r) {
        var key = r.chartKey;
        var d = key ? CHARTS.defs.levelFlight[key] : null;
        if (d) caption('chartTitleLF', d); else el('chartTitleLF').textContent = 'Level flight: no chart for this altitude';
        if (!d) { var c = el('chartLF'); c.width = 600; c.height = 80; c.getContext('2d').clearRect(0, 0, 600, 80); return; }
        CHARTS.draw(el('chartLF'), d, function (ctx) {
            var k = CHARTS.scale(ctx);
            if (r.consumptionLbH == null || r.cruiseTasKt == null) { CHARTS.label(ctx, 'Consumption: outside chart', 60, 40 * k, RED); return; }
            var x = CHARTS.lfX(d, r.cruiseTasKt), y = CHARTS.lfY(d, r.consumptionLbH);
            var xe = d.def.scaleX;                     // end of the fuel-flow arrow, at the lb/h scale
            CHARTS.arrow(ctx, x, d.def.axisY, x, y, RED);
            CHARTS.arrow(ctx, x, y, xe, y, RED);
            CHARTS.dot(ctx, x, y, RED);
            var t1 = fmt(r.consumptionLbH) + ' lb/h', t2 = r.cruiseTasKt + ' kt @ ' + fmt(r.takeoffWeightLb) + ' lb';
            var w1 = CHARTS.textWidth(ctx, t1, 15), w2 = CHARTS.textWidth(ctx, t2, 15);
            CHARTS.label(ctx, t1, Math.min(xe - w1, d.w - w1 - 8 * k), y - 8 * k, RED, 15);
            CHARTS.label(ctx, t2, Math.min(x + 10 * k, d.w - w2 - 8 * k), y + 24 * k, RED, 15);
            // best range inset
            var ins = (typeof BEST_RANGE_SPEED !== 'undefined' && BEST_RANGE_SPEED[key]) ? BEST_RANGE_SPEED[key].inset : null;
            if (ins && r.bestRangeTasKt != null) {
                var wi = Math.min(r.takeoffWeightLb, PLANNING.RULES.bestRangeInsetMaxLb);
                var ix = ins.x100kt + (r.bestRangeTasKt - 100) * ins.pxPerKt;
                var iy = ins.y25000lb + (25000 - wi) * ins.pxPerLb;
                var ib = ins.y25000lb + (25000 - 13000) * ins.pxPerLb;
                CHARTS.line(ctx, ins.x100kt, iy, ix, iy, BLUE, 2);
                CHARTS.line(ctx, ix, iy, ix, ib, BLUE, 2);
                CHARTS.dot(ctx, ix, iy, BLUE, 5);
                CHARTS.label(ctx, 'best range ' + r.bestRangeTasKt + ' kt', ix + 8 * k, iy - 6 * k, BLUE, 13);
            }
        });
    }

    var rowsRef = [];
    var KEY = 'planningChartsRow';

    function rowLabel(row, i) {
        var oat = (row.oatC === '' || row.oatC == null) ? '--' : row.oatC;
        return (i + 1) + '. ' + (row.airfield || 'Custom') + (row.code ? ' ' + row.code : '') + ', OAT ' + oat + ' C';
    }

    // Keep the header's row selector in step with the table rows (labels and
    // count). Does not draw anything.
    function setRows(rows) {
        rowsRef = rows;
        var sel = el('chartsRowSelect');
        while (sel.options.length > rows.length) sel.remove(sel.options.length - 1);
        rows.forEach(function (row, i) {
            var o = sel.options[i];
            if (!o) { o = document.createElement('option'); o.value = String(i); sel.appendChild(o); }
            var t = rowLabel(row, i);
            if (o.textContent !== t) o.textContent = t;
        });
        if (selected >= rows.length) selected = rows.length - 1;
        if (selected >= 0) sel.value = String(selected);
    }

    // Draw the selected row (or the one chosen on a previous visit, or the
    // first row).
    function showSelected() {
        if (!rowsRef.length) { hide(); return; }
        var want = selected;
        if (want < 0) {
            var s = parseInt(localStorage.getItem(KEY), 10);
            want = (isFinite(s) && s >= 0) ? s : 0;
        }
        if (want >= rowsRef.length) want = rowsRef.length - 1;
        show(want, rowsRef[want], rowsRef[want].result);
    }

    function show(index, row, r) {
        selected = index;
        try { localStorage.setItem(KEY, String(index)); } catch (e) { /* ignore */ }
        var card = el('card-charts');
        card.style.display = 'block';
        var sel = el('chartsRowSelect');
        if (sel.value !== String(index)) sel.value = String(index);
        document.querySelectorAll('#planningBody tr').forEach(function (tr) { tr.classList.toggle('selected', Number(tr.dataset.index) === index); });
        var note = el('chartsRowNote');
        if (!r || r.error) { note.textContent = 'no result: ' + (r ? r.error : 'not computed'); return; }
        note.textContent = '';
        drawHover10(r); drawHover5(r); drawWeightIndex(r); drawLevelFlight(r);
    }

    function refreshIfSelected(index, row, r) {
        if (index === selected) show(index, row, r);
    }

    // A table row was removed: keep the selection on the same row where possible.
    function rowRemoved(index) {
        if (index < selected) selected -= 1;
        else if (index === selected) selected = -1;
    }

    function hide() { selected = -1; el('card-charts').style.display = 'none'; }

    document.addEventListener('DOMContentLoaded', function () {
        el('chartsRowSelect').addEventListener('change', function () {
            var i = parseInt(this.value, 10);
            if (isFinite(i) && rowsRef[i]) { el('card-charts').classList.remove('collapsed'); show(i, rowsRef[i], rowsRef[i].result); }
        });
    });

    return { setRows: setRows, showSelected: showSelected, show: show, refreshIfSelected: refreshIfSelected, rowRemoved: rowRemoved, hide: hide, selectedIndex: function () { return selected; } };
})();
