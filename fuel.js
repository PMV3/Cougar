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
    const backgroundImage15C = new Image();
    const backgroundImage30C = new Image();
    const backgroundImage6000ft15C = new Image();
    const backgroundImage6000ft30C = new Image();
    backgroundImage15C.src = '0ft_15C.jpg';
    backgroundImage30C.src = '0ft_30C.jpg';
    backgroundImage6000ft15C.src = '6000ft_15C.jpg';
    backgroundImage6000ft30C.src = '6000ft_30C.jpg';

    const desiredWidth = 1241;
    const desiredHeight = 1755;
    canvas.width = desiredWidth;
    canvas.height = desiredHeight;

    let backgroundImageLoaded = false;
    let showerrornum = 0;

    [backgroundImage15C, backgroundImage30C, backgroundImage6000ft15C, backgroundImage6000ft30C].forEach(img => {
        img.onload = () => {
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

    // Which level-flight chart applies: altitude band (0 or 6000 ft) and OAT
    // (15 or 30 C). Shared by the fuel-flow lookup and the best-range-speed
    // lookup so both always read the same chart. Returns null outside the
    // charted altitude bands.
    let currentChartKey = null;
    function selectChart(height, temp) {
        let chart = null;
        if (height >= 0 && height <= 5000) {
            chart = (temp < 30)
                ? { key: '0ft_15C', chartData: foraoe_8_FuelConsumption_15C, backgroundImage: backgroundImage15C, originalWidth: 1241, originalHeight: 1755,
                    marginPx: { top: 100, right: 220, bottom: 400, left: 120 } }
                : { key: '0ft_30C', chartData: foraoe_8_FuelConsumption_30C, backgroundImage: backgroundImage30C, originalWidth: 528, originalHeight: 745,
                    marginPx: { top: 260, right: 35, bottom: 120, left: 35 } };
        } else if (height > 5000 && height <= 9000) {
            chart = (temp < 30)
                ? { key: '6000ft_15C', chartData: foraoe_8_FuelConsumption_6000ft_15C, backgroundImage: backgroundImage6000ft15C, originalWidth: 1241, originalHeight: 1755,
                    marginPx: { top: 0, right: 180, bottom: 430, left: 35 } }
                : { key: '6000ft_30C', chartData: foraoe_8_FuelConsumption_6000ft_30C, backgroundImage: backgroundImage6000ft30C, originalWidth: 1241, originalHeight: 1755,
                    marginPx: { top: 0, right: 220, bottom: 430, left: 0 } };
        }
        if (chart) {
            const m = chart.marginPx;
            chart.margin = {
                top: m.top * (desiredHeight / chart.originalHeight),
                right: m.right * (desiredWidth / chart.originalWidth),
                bottom: m.bottom * (desiredHeight / chart.originalHeight),
                left: m.left * (desiredWidth / chart.originalWidth)
            };
        }
        currentChartKey = chart ? chart.key : null;
        return chart;
    }

    async function interpolateData(height, temp, inputSpeed, inputWeight) {
        const chart = selectChart(height, temp);
        if (!chart) {
            return { fuelData: null, backgroundImage: null, originalWidth: null, originalHeight: null, margin: null };
        }
        const { chartData, backgroundImage, originalWidth, originalHeight, margin } = chart;

        const nearestWeight = chartData.reduce((prev, curr) =>
            Math.abs(curr.index - inputWeight) < Math.abs(prev.index - inputWeight) ? curr : prev
        );

        const { data } = nearestWeight;
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i].x <= inputSpeed && data[i + 1].x >= inputSpeed) {
                const x1 = data[i].x;
                const y1 = data[i].y;
                const x2 = data[i + 1].x;
                const y2 = data[i + 1].y;
                const interpolatedY = y1 + ((y2 - y1) * (inputSpeed - x1)) / (x2 - x1);
                return { fuelData: interpolatedY, backgroundImage, originalWidth, originalHeight, margin };
            }
        }
        return { fuelData: null, backgroundImage: null, originalWidth: null, originalHeight: null, margin: null };
    }

    // ---- Best range speed (the inset printed on the same level-flight charts) ----
    // lastBestRange keeps the latest result so drawChart can mark it on the inset.
    let lastBestRange = null;

    // TAS on one digitised curve at the given weight; null outside the curve's
    // printed weight range (no extrapolation).
    function tasOnCurve(curve, weight) {
        const pts = curve.points;
        if (weight < pts[0][0] || weight > pts[pts.length - 1][0]) return null;
        for (let i = 0; i < pts.length - 1; i++) {
            if (pts[i][0] <= weight && weight <= pts[i + 1][0]) {
                const f = (weight - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
                return pts[i][1] + f * (pts[i + 1][1] - pts[i][1]);
            }
        }
        return null;
    }

    // Best-range TAS for a chart, a weight (lb) and a wind component (kt,
    // + tail / - head). Linear between the two bracketing wind curves; null when
    // the weight or wind is outside what the chart prints.
    function lookupBestRangeSpeed(chartKey, weight, windComponent) {
        if (typeof BEST_RANGE_SPEED === 'undefined' || !BEST_RANGE_SPEED[chartKey]) return null;
        const curves = BEST_RANGE_SPEED[chartKey].curves; // ordered +60 ... -60
        for (let i = 0; i < curves.length; i++) {
            const c = curves[i];
            if (windComponent === c.wind) return tasOnCurve(c, weight);
            const next = curves[i + 1];
            if (next && windComponent < c.wind && windComponent > next.wind) {
                const a = tasOnCurve(c, weight);
                const b = tasOnCurve(next, weight);
                if (a === null || b === null) return null;
                const f = (c.wind - windComponent) / (c.wind - next.wind);
                return a + f * (b - a);
            }
        }
        return null;
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        const widthRatio = canvas.width / originalWidth;
        const heightRatio = canvas.height / originalHeight;

        let xMin, xMax, yMin, yMax;
        let originalXScale, originalYScale, xScale, yScale, xOffset, yOffset, xPos, yPos;

        if (backgroundImage === backgroundImage15C) {
            xMin = 0;
            xMax = 150;
            yMin = 780;
            yMax = 1300;

            originalXScale = (855 - 142) / (xMax - xMin);
            originalYScale = (1213 - 620) / (yMax - yMin);

            xScale = originalXScale * widthRatio;
            yScale = originalYScale * heightRatio;

            xOffset = 142 * widthRatio;
            yOffset = 1213 * heightRatio;

            xPos = xOffset + speed * xScale;
            yPos = yOffset - (fuelData - yMin) * yScale;
        } else if (backgroundImage === backgroundImage30C) {
            xMin = 0;
            xMax = 150;
            yMin = 760;
            yMax = 1300;

            originalXScale = (405 - 38) / (xMax - xMin);
            originalYScale = (584 - 268) / (yMax - yMin);

            xScale = originalXScale * widthRatio;
            yScale = originalYScale * heightRatio;

            xOffset = 38 * widthRatio;
            yOffset = 584 * heightRatio;

            xPos = xOffset + speed * xScale;
            yPos = yOffset - (fuelData - yMin) * yScale;
        } else if (backgroundImage === backgroundImage6000ft15C) {
            xMin = 0;
            xMax = 150;
            yMin = 680;
            yMax = 1440;

            originalXScale = (910 - 194) / (xMax - xMin);
            originalYScale = (1242 - 454) / (yMax - yMin);

            xScale = originalXScale * widthRatio;
            yScale = originalYScale * heightRatio;

            xOffset = 194 * widthRatio;
            yOffset = 1242 * heightRatio;

            xPos = xOffset + speed * xScale;
            yPos = yOffset - (fuelData - yMin) * yScale;
        } else if (backgroundImage === backgroundImage6000ft30C) {
            xMin = 0;
            xMax = 150;
            yMin = 680;
            yMax = 1340;

            originalXScale = (850 - 141) / (xMax - xMin);
            originalYScale = (1250 - 537) / (yMax - yMin);

            xScale = originalXScale * widthRatio;
            yScale = originalYScale * heightRatio;

            xOffset = 141 * widthRatio;
            yOffset = 1250 * heightRatio;

            xPos = xOffset + speed * xScale;
            yPos = yOffset - (fuelData - yMin) * yScale;
        }

        ctx.beginPath();
        ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        
        ctx.font = '16px Arial';
        ctx.fillText(`Fuel Consumption: ${fuelConsumptionPerHour} lbs/h, ${fuelConsumptionPerMinute} lbs/m at ${speed} kt and ${totalWeight} lbs`, 10, 30);
        
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos, canvas.height - margin.bottom);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(canvas.width - margin.right, yPos);
        ctx.stroke();
        
        const triangleSize = 10;
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
        
        const flight = usable / consumption;
        document.getElementById('flight').value = formatTime(flight * 60);

        const legs = flight + onSite;
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
        const distance = parseFloat(document.getElementById('distance').value);
        const windSpeed = parseFloat(document.getElementById('windSpeed').value);
        const speed = parseFloat(document.getElementById('speedFuel').value);
        const fuelConsumption = parseFloat(document.getElementById('fuelConsumption').value);
        const fuelEntered = parseFloat(document.getElementById('fuelEntered').value);
        const dayNight = document.getElementById('dayNight').value;

        if (isNaN(distance) || isNaN(windSpeed) || isNaN(speed) || isNaN(fuelConsumption) || isNaN(fuelEntered)) {
            alert("Please enter valid numbers for distance, wind speed, speed, fuel consumption, and fuel entered.");
            return;
        }

        const bf = calculateBasicFactor(speed);
        const time = calculateTime(distance, bf);

        document.getElementById('bf').value = bf.toFixed(2);
        document.getElementById('time').value = formatTime(time);

        let fuelAtoB = time * fuelConsumption;

        if (windSpeed >= 15) {
            fuelAtoB += 0.05 * fuelAtoB;
        }

        const reserve = (dayNight === "day") ? 500 : 600;
        const startupTaxi = 150;

        const flightFuel = fuelAtoB * 2 + reserve + startupTaxi;
        document.getElementById('flightFuel').value = flightFuel.toFixed(2);

        const totalFuelRequired = fuelAtoB + reserve + startupTaxi;

        const bingo = fuelEntered - totalFuelRequired;
        document.getElementById('bingo').value = bingo.toFixed(2);

        const endurance = bingo / fuelConsumption;
        document.getElementById('endurance').value = formatTimeFromMinutes(endurance);
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
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
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