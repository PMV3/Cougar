'use strict';
// This file is loaded as a classic script (not an ES module) so that STEP3
// also works when the app is opened directly from the file system, where
// browsers block module scripts. The four fuel-flow datasets
// (foraoe_8_FuelConsumption_15C, _30C, _6000ft_15C, _6000ft_30C) are plain
// globals declared by the datafolder/*.js scripts that STEP3.html loads
// before this one.

document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
});
// Assign functions to window object for global access
Object.assign(window, {
    saveDataAndGoToStep1,
    saveDataAndGoToStep2,
    saveDataAndGoToStep3,
    saveDataAndNavigate
    // ... other functions ...
});

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fuelChart');
    const ctx = canvas.getContext('2d');
    // One image per digitised level-flight chart (datafolder/levelflightData.js,
    // images in levelflight/). The canvas takes the size of the chart drawn.
    const chartImages = {};
    Object.keys(LEVELFLIGHT_DATA).forEach(key => {
        const img = new Image();
        img.src = LEVELFLIGHT_DATA[key].src;
        chartImages[key] = img;
    });
    const firstDef = LEVELFLIGHT_DATA[Object.keys(LEVELFLIGHT_DATA)[0]];
    canvas.width = firstDef.w;
    canvas.height = firstDef.h;

    let backgroundImageLoaded = false;
    let showerrornum = 0;

    Object.keys(chartImages).forEach(key => {
        chartImages[key].onload = () => {
            backgroundImageLoaded = true;
        };
    });

    function autoFillSpeed() {
        const speed = document.getElementById('speed').value;
        const speedFields = ['speedFuel', 'speedIFR', 'speed2', 'speedBox1'];
        speedFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = speed;
        });
    }

    function getDataFromStep2() {
        const totalWeight = localStorage.getItem('step3_totalWeight');
        const height = localStorage.getItem('step3_height');
        const temperature = localStorage.getItem('step3_temperature');
        const speed = localStorage.getItem('step3_speed');
        const fuelConsumption = localStorage.getItem('step3_fuelConsumption');
        const totalFuelWeight = localStorage.getItem('step3_totalFuelWeight');
        const windSpeed = localStorage.getItem('step3_windSpeed');
    
        if (totalWeight) document.getElementById("totalweight").value = totalWeight;
        if (height) document.getElementById("height").value = height;
        if (temperature) document.getElementById("temperature").value = temperature;
        if (speed) {
            document.getElementById("speed").value = speed;
            autoFillSpeed();
        }
        if (totalFuelWeight) {
            document.getElementById("fuelEntered").value = totalFuelWeight;
            document.getElementById("qInTanks").value = totalFuelWeight;
        }
        if (windSpeed) document.getElementById("windSpeed").value = windSpeed;

        if (fuelConsumption) {
            document.getElementById("fuelConsumption").value = fuelConsumption;
            document.getElementById("fuelConsumptionIFR").value = fuelConsumption;
            document.getElementById("consumption").value = fuelConsumption;
            document.getElementById("consumption2").value = fuelConsumption;
        }

        console.log('Data retrieved in Step 3:', { totalWeight, height, temperature, windSpeed, speed, fuelConsumption });

        localStorage.removeItem('step3_totalWeight');
        localStorage.removeItem('step3_height');
        localStorage.removeItem('step3_temperature');
        localStorage.removeItem('step3_windSpeed');
        localStorage.removeItem('step3_speed');
        localStorage.removeItem('step3_fuelConsumption');
        localStorage.removeItem('step3_totalFuelWeight');
    }

    function calculateAEOFuelConsumption() {
        const totalWeight = parseFloat(document.getElementById("totalweight").value);
        const height = parseFloat(document.getElementById("height").value);
        const temperature = parseFloat(document.getElementById("temperature").value);
        const speed = parseFloat(document.getElementById("speed").value);

        if (isNaN(totalWeight) || isNaN(height) || isNaN(temperature) || isNaN(speed)) {
            return;
        }

        window.fuelconsumption();
    }

    window.fuelconsumption = async function() {
        const height = parseFloat(document.getElementById('height').value);
        const temp = parseFloat(document.getElementById('temperature').value);
        const speed = parseFloat(document.getElementById('speed').value);
        const totalWeight = parseFloat(document.getElementById('totalweight').value);
        const fuelConsumptionInput = document.getElementById('fuelconsumption');

        if (!(speed >= 0 && speed <= 150 && totalWeight >= 15000 && totalWeight <= 24700)) {
            fuelConsumptionInput.value = "";
            showToast("I can't calculate fuel consumption. Input data must be correct.", "danger", 5000, showerrornum++);
            return false;
        }

        if (!backgroundImageLoaded) {
            showToast("Background images are still loading, please wait.", "info", 5000, showerrornum++);
            return;
        }

        const { fuelData, backgroundImage, originalWidth, originalHeight, margin } = await interpolateData(height, temp, speed, totalWeight);
        if (fuelData === null) {
            showToast("I can't interpolate with your input data in this FuelConsumption Chart", "info", 5000, showerrornum++);
            fuelConsumptionInput.value = "";
            return;
        }

        const fuelConsumptionPerHour = fuelData.toFixed(2);
        const fuelConsumptionPerMinute = (fuelData / 60).toFixed(2);

        fuelConsumptionInput.value = `${fuelConsumptionPerHour} lbs/h, ${fuelConsumptionPerMinute} lbs/m`;

        document.getElementById('fuelConsumption').value = fuelConsumptionPerMinute;
        document.getElementById('fuelConsumptionIFR').value = fuelConsumptionPerMinute;
        document.getElementById('consumption2').value = fuelConsumptionPerHour;
        document.getElementById('consumption').value = fuelConsumptionPerHour;

        autoFillSpeed();

        canvas.style.display = 'block';
        drawChart(backgroundImage, originalWidth, originalHeight, speed, fuelData, fuelConsumptionPerHour, fuelConsumptionPerMinute, totalWeight, margin);
    };

    // Which level-flight chart applies: the nearest of the twelve digitised
    // charts (Hp 0/3000/6000/9000 ft, OAT 0/+15/+30/+45 C), chosen by
    // LEVELFLIGHT.selectKey in perf/levelflight.js. Shared by the fuel-flow
    // lookup and the best-range-speed lookup so both always read the same
    // chart. Returns null outside -2000..10500 ft.
    let currentChartKey = null;
    function selectChart(height, temp) {
        const key = LEVELFLIGHT.selectKey(height, temp);
        currentChartKey = key;
        if (!key) return null;
        const def = LEVELFLIGHT_DATA[key];
        return { key, def, backgroundImage: chartImages[key], originalWidth: def.w, originalHeight: def.h,
                 margin: { top: 0, right: def.w - def.scaleX, bottom: def.h - def.axisY, left: 0 } };
    }

    async function interpolateData(height, temp, inputSpeed, inputWeight) {
        const chart = selectChart(height, temp);
        if (!chart) {
            return { fuelData: null, backgroundImage: null, originalWidth: null, originalHeight: null, margin: null };
        }
        const { backgroundImage, originalWidth, originalHeight, margin } = chart;

        // Shared lookup (perf/levelflight.js): linear between the two weight
        // curves that bracket the weight, instead of the nearest curve only.
        const ff = LEVELFLIGHT.fuelFlow(chart.key, inputWeight, inputSpeed);
        if (ff.lbPerHour == null) {
            return { fuelData: null, backgroundImage: null, originalWidth: null, originalHeight: null, margin: null };
        }
        return { fuelData: ff.lbPerHour, backgroundImage, originalWidth, originalHeight, margin };
    }

    // ---- Best range speed (the inset printed on the same level-flight charts) ----
    // lastBestRange keeps the latest result so drawChart can mark it on the inset.
    let lastBestRange = null;

    // Best-range TAS lookup lives in perf/levelflight.js (shared with the
    // planning page); null when the weight or wind is outside the inset.
    function lookupBestRangeSpeed(chartKey, weight, windComponent) {
        return LEVELFLIGHT.bestRangeSpeed(chartKey, weight, windComponent);
    }

    function updateBestRangeSpeed() {
        const out = document.getElementById('bestRangeSpeed');
        const windEl = document.getElementById('windEnRoute');
        if (!out || !windEl) return;
        const height = parseFloat(document.getElementById('height').value);
        const temp = parseFloat(document.getElementById('temperature').value);
        const weight = parseFloat(document.getElementById('totalweight').value);
        const wind = parseFloat(windEl.value);
        lastBestRange = null;
        if ([height, temp, weight, wind].some(v => !isFinite(v))) { out.value = ''; return; }
        if (wind < -60 || wind > 60) { out.value = 'Wind must be -60 to +60 kt'; return; }
        const chart = selectChart(height, temp);
        if (!chart) { out.value = 'Altitude outside charts'; return; }
        const tas = lookupBestRangeSpeed(chart.key, weight, wind);
        if (tas === null) { out.value = 'Outside chart for this weight/wind'; return; }
        lastBestRange = { key: chart.key, tas: tas, weight: weight, wind: wind };
        out.value = Math.round(tas) + ' kt';
    }

    // Marks the best-range result on the inset of the chart currently drawn.
    function drawBestRangeMarker(widthRatio, heightRatio) {
        if (!lastBestRange || lastBestRange.key !== currentChartKey) return;
        const inset = BEST_RANGE_SPEED[lastBestRange.key].inset;
        const x = (inset.x100kt + (lastBestRange.tas - 100) * inset.pxPerKt) * widthRatio;
        const y = (inset.y25000lb + (25000 - lastBestRange.weight) * inset.pxPerLb) * heightRatio;
        const xLeft = inset.x100kt * widthRatio;                                            // 100 kt axis
        const yBottom = (inset.y25000lb + (25000 - 13000) * inset.pxPerLb) * heightRatio;  // bottom of the inset grid
        ctx.save();
        ctx.strokeStyle = 'blue';
        ctx.fillStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xLeft, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, yBottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Best range ${Math.round(lastBestRange.tas)} kt`, x + 8, y - 6);
        ctx.restore();
    }

    function drawChart(backgroundImage, originalWidth, originalHeight, speed, fuelData, fuelConsumptionPerHour, fuelConsumptionPerMinute, totalWeight, margin) {
        if (canvas.width !== originalWidth || canvas.height !== originalHeight) {
            canvas.width = originalWidth;
            canvas.height = originalHeight;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        const widthRatio = canvas.width / originalWidth;
        const heightRatio = canvas.height / originalHeight;

        // Chart calibration from datafolder/levelflightData.js: TAS axis linear,
        // AEO lb/h scale interpolated between its printed ticks (it is not linear).
        const def = LEVELFLIGHT_DATA[currentChartKey];
        const xPos = LEVELFLIGHT.xOf(def, speed) * widthRatio;
        const yPos = LEVELFLIGHT.yOf(def, fuelData) * heightRatio;

        ctx.beginPath();
        ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        
        // White backing so the two title lines stay readable over the chart's printed frame line.
        const title1 = `Fuel Consumption: ${fuelConsumptionPerHour} lbs/h, ${fuelConsumptionPerMinute} lbs/m at ${speed} kt and ${totalWeight} lbs`;
        const title2 = `${def.title} (${def.source})`;
        ctx.font = 'bold 20px Arial';
        const titleWidth = Math.max(ctx.measureText(title1).width, ctx.measureText(title2).width);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(4, 8, titleWidth + 14, 56);
        ctx.fillStyle = 'red';
        ctx.fillText(title1, 10, 30);
        ctx.font = '16px Arial';
        ctx.fillText(title2, 10, 54);
        
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;   // the chart is 1470 px wide and shown smaller: 1 px lines vanish
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos, canvas.height - margin.bottom);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(canvas.width - margin.right, yPos);
        ctx.stroke();
        
        const triangleSize = 16;
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(canvas.width - margin.right, yPos);
        ctx.lineTo(canvas.width - margin.right - triangleSize, yPos - triangleSize / 2);
        ctx.lineTo(canvas.width - margin.right - triangleSize, yPos + triangleSize / 2);
        ctx.closePath();
        ctx.fill();

        drawBestRangeMarker(widthRatio, heightRatio);
    }

    function showToast(message = "Sample Message", toastType = "info", duration = 5000, fortop = 0) {
        let box = document.createElement("div");
        box.classList.add("toast", `toast-${toastType}`);
        box.style.top = `${20 + (fortop * 65)}px`;
        box.innerHTML = `
            <div class="toast-content-wrapper">
                <div class="toast-message">${message}</div>
                <div class="toast-progress"></div>
            </div>`;
        box.querySelector(".toast-progress").style.animationDuration = `${duration / 1000}s`;
        document.body.appendChild(box);
    }

    function calculateFirstTable() {
        const qInTanks = parseFloat(document.getElementById('qInTanks').value);
        const reserve = parseFloat(document.getElementById('reserve').value);
        const consumption = parseFloat(document.getElementById('consumption').value);

        const usable = qInTanks - reserve - 150;
        document.getElementById('usable').value = usable.toFixed(2);

        const onSiteHours = parseFloat(document.getElementById('onSiteHours').value);
        const onSiteMinutes = parseFloat(document.getElementById('onSiteMinutes').value);
        const onSite = onSiteHours + (onSiteMinutes / 60);
        
        // Flight: how long the usable fuel lasts in total. Legs: the flying time
        // that is left after the time on site (out and back), which sets the range.
        const flight = usable / consumption;
        const legs = Math.max(0, flight - onSite);
        document.getElementById('flight').value = formatTime(flight * 60);
        document.getElementById('legs').value = formatTime(legs * 60);

        const speedBox1 = parseFloat(document.getElementById('speedBox1').value);
        
        const trip = legs * speedBox1;
        document.getElementById('trip').value = trip.toFixed(2);

        const range = trip / 2;
        document.getElementById('range').value = range.toFixed(2);
    }

    function calculateSecondTable() {
        const range2 = parseFloat(document.getElementById('range2').value);
        const speed2 = parseFloat(document.getElementById('speed2').value);
        const consumption2 = parseFloat(document.getElementById('consumption2').value);

        const trip2 = range2 * 2;
        document.getElementById('trip2').value = trip2;

        const legs2 = trip2 / speed2;
        document.getElementById('legs2').value = formatTime(legs2 * 60);

        const onSiteHours2 = parseFloat(document.getElementById('onSiteHours2').value);
        const onSiteMinutes2 = parseFloat(document.getElementById('onSiteMinutes2').value);
        
        const onSite2 = onSiteHours2 + (onSiteMinutes2 / 60);

        const flight2 = legs2 + onSite2;
        document.getElementById('flight2').value = formatTime(flight2 * 60);

        const needed2 = flight2 * consumption2;
        document.getElementById('needed2').value = needed2.toFixed(2);

        const reserve2 = parseFloat(document.getElementById('reserve2').value);
        const qInTanks2 = needed2 + reserve2 + 150;
        document.getElementById('qInTanks2').value = qInTanks2.toFixed(2);
    }

    function calculateBasicFactor(speed) {
        return 60 / speed;
    }

    function calculateTime(distance, bf) {
        return distance * bf;
    }

    function calculateMinimumFuel() {
        const onSiteMinutes = Number(document.getElementById('vfrOnSiteMinutes').value.trim() || 0);
        const distance = parseFloat(document.getElementById('distance').value);
        const windSpeed = parseFloat(document.getElementById('windSpeed').value);
        const speed = parseFloat(document.getElementById('speedFuel').value);
        const fuelConsumption = parseFloat(document.getElementById('fuelConsumption').value);
        const fuelEntered = parseFloat(document.getElementById('fuelEntered').value);
        const dayNight = document.getElementById('dayNight').value;

        if (![distance, windSpeed, speed, fuelConsumption, fuelEntered, onSiteMinutes].every(Number.isFinite)
            || distance < 0 || windSpeed < 0 || speed <= 0 || fuelConsumption <= 0 || fuelEntered < 0 || onSiteMinutes < 0) {
            ['bf', 'time', 'flightFuel', 'bingo', 'endurance'].forEach(id => {
                document.getElementById(id).value = '';
            });
            document.getElementById('vfrOnSiteStatus').textContent = '';
            alert("Enter non-negative distance, wind speed, departure fuel and on-site minutes, and positive speed and fuel consumption.");
            return;
        }

        const bf = calculateBasicFactor(speed);
        const time = calculateTime(distance, bf);

        document.getElementById('bf').value = bf.toFixed(2);
        document.getElementById('time').value = formatTime(time);

        // Distance is one way. The return leg uses the same distance and rate.
        let legFuel = time * fuelConsumption;

        if (windSpeed >= 15) {
            legFuel += 0.05 * legFuel;
        }

        const reserve = (dayNight === "day") ? 500 : 600;
        const startupTaxi = 150;

        const onSiteFuel = onSiteMinutes * fuelConsumption;
        const flightFuel = legFuel * 2 + onSiteFuel + reserve + startupTaxi;
        document.getElementById('flightFuel').value = flightFuel.toFixed(2);

        // Bingo is the onboard fuel threshold for return, not fuel available
        // to burn. Startup/taxi is included only in departure fuel planning.
        const bingo = legFuel + reserve;
        document.getElementById('bingo').value = bingo.toFixed(2);

        // Extra play time: what is left of the entered (departure) fuel after
        // startup/taxi, the outbound leg, the planned on-site fuel and Bingo
        // (Bingo = return leg + landing reserve), in minutes at the consumption.
        const fuelAfterOnSite = fuelEntered - startupTaxi - legFuel - onSiteFuel;
        const minutesAfterOnSite = (fuelAfterOnSite - bingo) / fuelConsumption;
        // Show remaining time after the plan, without rounding up.
        document.getElementById('endurance').value = minutesAfterOnSite <= 0
            ? '0h 0m - At/below Bingo'
            : formatTimeFromMinutes(Math.floor(minutesAfterOnSite));
        document.getElementById('vfrOnSiteStatus').textContent = fuelAfterOnSite < bingo
            ? `Planned on-site time leaves fuel below Bingo by ${(bingo - fuelAfterOnSite).toFixed(2)} lb.`
            : fuelAfterOnSite === bingo
                ? 'Planned on-site time leaves fuel exactly at Bingo.'
                : '';
    }

    function calculateMFQIFR() {
        const distanceAB = parseFloat(document.getElementById('distanceAB').value);
        const distanceBC = parseFloat(document.getElementById('distanceBC').value);
        const speed = parseFloat(document.getElementById('speedIFR').value);
        const fuelConsumption = parseFloat(document.getElementById('fuelConsumptionIFR').value);
        const reserve = parseFloat(document.getElementById('reserveIFR').value);

        if (isNaN(distanceAB) || isNaN(distanceBC) || isNaN(speed) || isNaN(fuelConsumption) || isNaN(reserve)) {
            alert("Please enter valid numbers for distance, speed, fuel consumption, and reserve.");
            return;
        }

        const bf = calculateBasicFactor(speed);
        const timeAB = calculateTime(distanceAB, bf);
        const timeBC = calculateTime(distanceBC, bf);

        let fuelAtoB = timeAB * fuelConsumption;
        let fuelBtoC = timeBC * fuelConsumption;

        fuelAtoB += 0.05 * fuelAtoB;

        const reserveFuel = reserve < 30 ? 20 * fuelConsumption : 30 * fuelConsumption;
        const startupTaxi = 150;

        const totalFuelRequired = fuelAtoB + fuelBtoC + reserveFuel + startupTaxi;
        document.getElementById('mfqIFR').value = totalFuelRequired.toFixed(2);
    }

    function formatTime(totalMinutes) {
        const roundedMinutes = Math.round(totalMinutes);
        const hours = Math.floor(roundedMinutes / 60);
        const minutes = roundedMinutes % 60;
        return `${hours}h ${minutes}m`;
    }

    function formatTimeFromMinutes(totalMinutes) {
        return formatTime(totalMinutes);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    window.calculateFirstTable = calculateFirstTable;
    window.calculateSecondTable = calculateSecondTable;
    window.calculateMinimumFuel = calculateMinimumFuel;
    window.calculateMFQIFR = calculateMFQIFR;

    getDataFromStep2();

    const speedInput = document.getElementById('speed');
    if (speedInput) {
        speedInput.addEventListener('input', debounce(calculateAEOFuelConsumption, 500));
    }

    const windEnRouteInput = document.getElementById('windEnRoute');
    if (windEnRouteInput) {
        windEnRouteInput.addEventListener('input', function() {
            updateBestRangeSpeed();
            // Redraw so the inset marker follows the new wind when a chart is already shown.
            if (canvas.style.display === 'block' && isFinite(parseFloat(document.getElementById('speed').value))) {
                window.fuelconsumption();
            }
        });
    }
    // The hidden weight / pressure altitude / OAT fields are restored by the
    // persistence scripts before this handler runs; compute once now and again
    // when the page is restored from the back/forward cache.
    updateBestRangeSpeed();
    window.addEventListener('pageshow', updateBestRangeSpeed);

    document.getElementById('calculateFuelLeak').addEventListener('click', function() {
        const totalFuel = parseFloat(document.getElementById('totalFuel').value);
        const fuelConsumPerHour = parseFloat(document.getElementById('fuelConsumPerHour').value);
        const minutes = parseFloat(document.getElementById('minutes').value);

        if (isNaN(totalFuel) || isNaN(fuelConsumPerHour) || isNaN(minutes)) {
            alert("Please enter valid numbers for all fields.");
            return;
        }

        const totalPerMin = fuelConsumPerHour / 60;
        document.getElementById('totalPerMin').value = totalPerMin.toFixed(2);

        const remainingFuel = totalFuel - (totalPerMin * minutes);
        document.getElementById('remainingFuel').value = remainingFuel.toFixed(2);
    });

    document.getElementById('convertTime').addEventListener('click', function() {
        const time = parseFloat(document.getElementById('timeInput').value);
        const fuel = parseFloat(document.getElementById('totalPerMin').value) * time;
        const nm = parseFloat(document.getElementById('speedBox1').value) * (time / 60);

        document.getElementById('fuelOutput').value = fuel.toFixed(2);
        document.getElementById('nmOutput').value = nm.toFixed(2);
    });

    document.getElementById('convertNM').addEventListener('click', function() {
        const nm = parseFloat(document.getElementById('nmInput').value);
        const speed = parseFloat(document.getElementById('speedBox1').value);
        const time = (nm / speed) * 60;
        const fuel = parseFloat(document.getElementById('totalPerMin').value) * time;

        document.getElementById('fuelOutput2').value = fuel.toFixed(2);
        document.getElementById('timeOutput').value = time.toFixed(2);
    });

    document.getElementById('convertFuel').addEventListener('click', function() {
        const fuel = parseFloat(document.getElementById('fuelInput').value);
        const fuelPerMin = parseFloat(document.getElementById('totalPerMin').value);
        const time = fuel / fuelPerMin;
        const speed = parseFloat(document.getElementById('speedBox1').value);
        const nm = (speed * time) / 60;

        document.getElementById('timeOutput2').value = time.toFixed(2);
        document.getElementById('nmOutput2').value = nm.toFixed(2);
    });
});
