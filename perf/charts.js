// Chart images and their pixel calibrations, plus small drawing helpers, for
// plotting calculated results on the scanned charts. Plain global; no
// dependencies. Coordinates are in the natural pixels of each image; a canvas
// is always sized to the image and scaled by CSS, so overlays stay aligned at
// any display size.
//
// Calibrations come from the existing STEP2/STEP3 code (count_5 in scripts.js,
// count_6 in scripts.js, drawChart in fuel.js) or, for the SUP.51 Figure 1
// image, from the gridline fit made while digitising it.

var CHARTS = (function () {
    'use strict';

    var LB_PER_KG = 2.20462;

    // All four panels are displayed at the same width, so a 2 px line on the
    // 733 px wide 10 ft chart looks right while the same line on the 1460 px
    // Figure 1 looks half as thick. Drawings are therefore scaled by the image
    // width relative to the 10 ft chart (never below 1).
    var REF_WIDTH = 733;
    function scale(ctx) { return ctx.__chartScale || 1; }

    var defs = {
        hover10ft: {
            src: 'newIGE.jpg', w: 733, h: 814,
            title: 'Twin-engine hover IGE 10 ft', source: 'Flight Manual 5.1 Figure 3a',
            x: function (lb) { return 59 + ((lb - 13300) / (21500 - 13300)) * (570 - 59); },
            y: function (hp) { return 28 + ((674 - 28) * (20000 - hp)) / 20000; },
            axisX: 59, axisY: 755
        },
        ige5ftAgw: {
            src: '5ft_ige/ige5ft_agw.png', w: 1460, h: 2010,
            title: 'Twin-engine hover IGE 5 ft, alternate gross weight', source: 'SUP.51 Figure 1',
            x: function (lb) { return 209.9 + ((lb / LB_PER_KG - 6000) / 100) * 20.8238; },
            y: function (hp) { return 68.11 + ((20000 - hp) / 1000) * 68.2668; },
            axisX: 209.9, axisY: 1600
        },
        weightIndex: {
            src: 'WeightIndexForRateofclime.jpg', w: 954, h: 1280,
            title: 'Weight index for rate of climb', source: 'SUP.51 Figure 6',
            qatX: function (qat) { return 463 - ((463 - 79) * (50 - qat)) / 95; },
            indexX: function (idx) { return 507 + ((13 - idx) / 6) * (860 - 507); },
            baseY: 697
        },
        // the twelve digitised level-flight charts (datafolder/levelflightData.js)
        levelFlight: (function () {
            var o = {};
            if (typeof LEVELFLIGHT_DATA !== 'undefined') {
                Object.keys(LEVELFLIGHT_DATA).forEach(function (k) {
                    var e = LEVELFLIGHT_DATA[k];
                    o[k] = { src: e.src, w: e.w, h: e.h, title: e.title, source: e.source, def: e };
                });
            }
            return o;
        })()
    };

    // TAS -> x and lb/h -> y on a level-flight chart (perf/levelflight.js holds the
    // calibration: linear TAS axis, non-linear printed lb/h scale).
    function lfX(c, tas) { return LEVELFLIGHT.xOf(c.def, tas); }
    function lfY(c, ff) { return LEVELFLIGHT.yOf(c.def, ff); }

    var cache = {};
    function loadImage(src, cb) {
        var img = cache[src];
        if (img && img.complete && img.naturalWidth) { cb(img); return; }
        if (!img) { img = new Image(); cache[src] = img; img.src = src; }
        img.addEventListener('load', function () { cb(img); }, { once: true });
        img.addEventListener('error', function () { cb(null); }, { once: true });
    }

    // Size the canvas to the chart, draw the image, then call fn(ctx, def).
    function draw(canvas, def, fn) {
        canvas.width = def.w; canvas.height = def.h;
        loadImage(def.src, function (img) {
            var ctx = canvas.getContext('2d');
            ctx.__chartScale = Math.max(1, def.w / REF_WIDTH);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            else { ctx.fillStyle = '#b91c1c'; ctx.font = '16px Arial'; ctx.fillText('Chart image not found: ' + def.src, 20, 30); }
            fn(ctx, def);
        });
    }

    function line(ctx, x1, y1, x2, y2, color, width, dash) {
        var k = scale(ctx);
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = (width || 2) * k;
        if (dash) ctx.setLineDash(dash.map(function (d) { return d * k; }));
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.restore();
    }

    function arrow(ctx, x1, y1, x2, y2, color, width) {
        line(ctx, x1, y1, x2, y2, color, width);
        var a = Math.atan2(y2 - y1, x2 - x1), h = 10 * scale(ctx);
        ctx.save(); ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - h * Math.cos(a - Math.PI / 6), y2 - h * Math.sin(a - Math.PI / 6));
        ctx.lineTo(x2 - h * Math.cos(a + Math.PI / 6), y2 - h * Math.sin(a + Math.PI / 6));
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

    function dot(ctx, x, y, color, r) {
        var k = scale(ctx);
        ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = 'white'; ctx.lineWidth = 2 * k;
        ctx.beginPath(); ctx.arc(x, y, (r || 6) * k, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    }

    // Width of a label's text in canvas pixels (same scaled font as label()).
    function textWidth(ctx, text, size) {
        ctx.save(); ctx.font = 'bold ' + Math.round((size || 16) * scale(ctx)) + 'px Arial';
        var w = ctx.measureText(text).width; ctx.restore(); return w;
    }

    function label(ctx, text, x, y, color, size) {
        var k = scale(ctx), px = Math.round((size || 16) * k);
        ctx.save(); ctx.font = 'bold ' + px + 'px Arial';
        var wdt = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x - 3 * k, y - px, wdt + 6 * k, px + 6 * k);
        ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
    }

    return { defs: defs, lfX: lfX, lfY: lfY, draw: draw, line: line, arrow: arrow, dot: dot, label: label, textWidth: textWidth, scale: scale, LB_PER_KG: LB_PER_KG };
})();
