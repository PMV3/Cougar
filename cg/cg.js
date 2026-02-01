let zeroFuelWeightMax5ftIGE = 0;

function updateWeight(numberId, singleWeight, weightId, mmntId, cg) {
    const numberElement = document.getElementById(numberId);
    const weightElement = document.getElementById(weightId);
    const mmntElement = document.getElementById(mmntId);
    
    const number = parseFloat(numberElement.value) || 0;
    const weight = number * singleWeight;
    const moment = weight * cg;
    
    weightElement.value = weight.toFixed(2);
    mmntElement.value = moment.toFixed(2);
    
    calculateCG();
}

function calculateZeroFuelWeightMax5ftIGE() {
    const igeWeightText = document.getElementById('5ft_weight').textContent;
    const match = igeWeightText.match(/\d+(\.\d+)?/);
    const maxWeight5ftIGE = match ? parseFloat(match[0]) : 0;
    
    const zeroFuelWeight = parseFloat(document.getElementById('zfw').value) || 0;
    zeroFuelWeightMax5ftIGE = maxWeight5ftIGE - zeroFuelWeight;

    const inputField = document.getElementById('zeroFuelWeightMax5ftIGE');

    if (zeroFuelWeightMax5ftIGE <= 0) {
        inputField.value = "0.00 (Aircraft overweight)";
    } else if (zeroFuelWeightMax5ftIGE >= 6700) {
        inputField.value = "Maximum Fuel: 6700 lbs (Fuel system limit)";
    } else {
        inputField.value = zeroFuelWeightMax5ftIGE.toFixed(2);
    }
    
    const maxFuelCapacity = 21495 - zeroFuelWeight;
    window.maxAllowedFuel = Math.max(0, Math.min(maxFuelCapacity, 6700));
    
    const absoluteFuelField = document.getElementById('absoluteFuelLimit');
    if (absoluteFuelField) {
        if (maxFuelCapacity <= 0) {
            absoluteFuelField.value = "0.00 (Aircraft overweight without fuel)";
        } else if (maxFuelCapacity >= 6700) {
            absoluteFuelField.value = "Maximum Fuel: 6700 lbs (Fuel system limit)";
        } else {
            absoluteFuelField.value = maxFuelCapacity.toFixed(2);
        }
    }

    setMaxFuelLimit(window.maxAllowedFuel);
    
    const maxWeight5ftIGEElement = document.getElementById('maxWeight5ftIGE');
    if (maxWeight5ftIGEElement) {
        maxWeight5ftIGEElement.textContent = `Maximum weight: ${maxWeight5ftIGE.toFixed(2)} lbs`;
    }
}

function setMaxFuelLimit(maxFuel) {
    const fuelInputs = [
        'lhInternalFuelSingleWeight',
        'rhInternalFuelSingleWeight', 
        'lhSponsonSingleWeight',
        'rhSponsonSingleWeight', 
        'cabinFuelSingleWeight'
    ];

    let totalFuel = 0;

    fuelInputs.forEach(inputId => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            let inputValue = parseFloat(inputElement.value) || 0;
            
            if (totalFuel + inputValue > maxFuel) {
                inputValue = maxFuel - totalFuel;
                inputElement.value = inputValue.toFixed(2);
            }
            
            totalFuel += inputValue;

            // Set Fuel quantity Lb equal to SINGLE WEIGHT
            const weightId = inputId.replace('SingleWeight', 'Weight');
            const weightElement = document.getElementById(weightId);
            if (weightElement) {
                weightElement.value = inputValue.toFixed(2);
            }

            inputElement.setAttribute('max', maxFuel - (totalFuel - inputValue));
        }
    });

    updateTotalFuel();
}

function updateTotalFuel() {
    const fuelInputs = [
        'lhInternalFuelSingleWeight',
        'rhInternalFuelSingleWeight', 
        'lhSponsonSingleWeight',
        'rhSponsonSingleWeight', 
        'cabinFuelSingleWeight'
    ];

    const cgLocations = [
        173.46, // LH Internal Fuel CG
        173.46, // RH Internal Fuel CG
        269.92, // LH Sponson CG
        269.92, // RH Sponson CG
        335.51  // Cabin Fuel CG
    ];

    let totalFuelWeight = 0;
    let totalFuelMoment = 0;

    fuelInputs.forEach((inputId, index) => {
        const inputElement = document.getElementById(inputId);
        const fuelWeight = parseFloat(inputElement.value) || 0;
        const cgLocation = cgLocations[index];

        const fuelMoment = fuelWeight * cgLocation;
        totalFuelWeight += fuelWeight;
        totalFuelMoment += fuelMoment;

        // Update corresponding weight input
        const weightId = inputId.replace('SingleWeight', 'Weight');
        const weightElement = document.getElementById(weightId);
        if (weightElement) {
            weightElement.value = fuelWeight.toFixed(2);
        }

        const momentElement = document.getElementById(`${inputId}Moment`);
        if (momentElement) {
            momentElement.value = fuelMoment.toFixed(2);
        }
    });

    document.getElementById('totalFuelWeight').value = totalFuelWeight.toFixed(2);
    document.getElementById('totalFuelMMNT').value = totalFuelMoment.toFixed(2);

    calculateCG(); // Ensure CG is recalculated after updating fuel
}

function saveDataAndGoToStep2() {
    saveAllData();
    window.location.href = 'STEP2.html';
}

window.addEventListener('beforeunload', function() {
    console.log('Leaving Step 1, localStorage contents:', JSON.stringify(localStorage));
});

document.addEventListener('DOMContentLoaded', function () {
    const tailNumberSelect = document.getElementById('tail-number');
    const aircraftData = {
        9901: { weight: 13560, cog: 191.82 },
        9902: { weight: 13799, cog: 188.23 },
        9903: { weight: 13460, cog: 188.50 },
        9904: { weight: 13646, cog: 189.3 },
        9905: { weight: 13855, cog: 188.95 },
        9909: { weight: 14467, cog: 185.72 },
        9910: { weight: 14096, cog: 187.38 },
        9911: { weight: 13669, cog: 186.98 },
    };

    tailNumberSelect.addEventListener('change', function () {
        const selectedTailNumber = tailNumberSelect.value;
        if (aircraftData[selectedTailNumber]) {
            const weight = aircraftData[selectedTailNumber].weight;
            const cog = aircraftData[selectedTailNumber].cog;
            const moment = weight * cog;

            document.getElementById('emptyWeight').value = weight;
            document.getElementById('emptyWeightCG').value = cog;
            document.getElementById('emptyWeightMMNT').value = moment.toFixed(2);

            calculateCG();
        } else {
            document.getElementById('emptyWeight').value = '';
            document.getElementById('emptyWeightCG').value = '';
            document.getElementById('emptyWeightMMNT').value = '';
        }
    });

    function calculateCG() {
        const sections = [
            { number: 'pilotsNumber', weight: 'pilotsWeight', cg: 50.39, mmnt: 'pilotsMMNT', singleWeight: 200 },
            { number: 'thirdCMNumber', weight: 'thirdCMWeight', cg: 75.74, mmnt: 'thirdCMMMNT', singleWeight: 200 },
            { number: 'feNumber', weight: 'feWeight', cg: 113.71, mmnt: 'feMMNT', singleWeight: 200 },
            { number: 'gunnerNumber', weight: 'gunnerWeight', cg: 115, mmnt: 'gunnerMMNT', singleWeight: 200 },
            { number: 'crs1And2Number', weight: 'crs1And2Weight', cg: 220, mmnt: 'crs1And2MMNT', singleWeight: 250 },
            { number: 'crs3And4Number', weight: 'crs3And4Weight', cg: 260, mmnt: 'crs3And4MMNT', singleWeight: 250 },
            { number: 'flirNumber', weight: 'flirWeight', cg: -18.9, mmnt: 'flirMMNT', singleWeight: -88 },
            { number: 'hoistNumber', weight: 'hoistWeight', cg: 162.2, mmnt: 'hoistMMNT', singleWeight: 97 },
            { number: 'fastRopeNumber', weight: 'fastRopeWeight', cg: 167.98, mmnt: 'fastRopeMMNT', singleWeight: 80 },
            { number: 'searchLightNumber', weight: 'searchLightWeight', cg: 120.56, mmnt: 'searchLightMMNT', singleWeight: 53 },
            { number: 'mg58RHNumber', weight: 'mg58RHWeight', cg: 108.94, mmnt: 'mg58RHMMNT', singleWeight: 72 },
            { number: 'mg58LHNumber', weight: 'mg58LHWeight', cg: 116.42, mmnt: 'mg58LHMMNT', singleWeight: 72 },
            { number: 'extraAmmoBoxNumber', weight: 'extraAmmoBoxWeight', cg: 95, mmnt: 'extraAmmoBoxMMNT', singleWeight: 31 },
            { number: 'gunNumber', weight: 'gunWeight', cg: 100.4, mmnt: 'gunMMNT', singleWeight: 269 },
            { number: 'gunLoadedNumber', weight: 'gunLoadedWeight', cg: 100.4, mmnt: 'gunLoadedMMNT', singleWeight: 452 },
            { number: 'rocketLauncherNumber', weight: 'rocketLauncherWeight', cg: 117, mmnt: 'rocketLauncherMMNT', singleWeight: 170 },
            { number: 'rocketLauncherLoadedNumber', weight: 'rocketLauncherLoadedWeight', cg: 117, mmnt: 'rocketLauncherLoadedMMNT', singleWeight: 682 },
            { number: 'refuelingProbeNumber', weight: 'refuelingProbeWeight', cg: 194.5, mmnt: 'refuelingProbeMMNT', singleWeight: 330 },
            { number: 'jddNumber', weight: 'jddWeight', cg: 194.5, mmnt: 'jddMMNT', singleWeight: 320 },
            { number: 'doorsArmouredNumber', weight: 'doorsArmouredWeight', cg: 56.73, mmnt: 'doorsArmouredMMNT', singleWeight: 40 },
            { number: 'seatsArmouredNumber', weight: 'seatsArmouredWeight', cg: 58.31, mmnt: 'seatsArmouredMMNT', singleWeight: 118 },
            { number: 'floorArmouredNumber', weight: 'floorArmouredWeight', cg: 141.84, mmnt: 'floorArmouredMMNT', singleWeight: 522 },
            { number: 'commonSARKitNumber', weight: 'commonSARKitWeight', cg: 257, mmnt: 'commonSARKitMMNT', singleWeight: 90 },
            { number: 'landSARKitNumber', weight: 'landSARKitWeight', cg: 257, mmnt: 'landSARKitMMNT', singleWeight: 135 },
            { number: 'seaSARKitNumber', weight: 'seaSARKitWeight', cg: 257, mmnt: 'seaSARKitMMNT', singleWeight: 149 },
            { number: 'transacoStretcherNumber', weight: 'transacoStretcherWeight', cg: 257, mmnt: 'transacoStretcherMMNT', singleWeight: 91 },
            { number: 'sarKitNetNumber', weight: 'sarKitNetWeight', cg: 257, mmnt: 'sarKitNetMMNT', singleWeight: 13 },
            { number: 'medicalKitNumber', weight: 'medicalKitWeight', cg: 257, mmnt: 'medicalKitMMNT', singleWeight: 70 },
            { number: 'passengerANumber', weight: 'passengerAWeight', cg: 96.69, mmnt: 'passengerAMMNT', singleWeight: 200 },
            { number: 'passengerBNumber', weight: 'passengerBWeight', cg: 113.71, mmnt: 'passengerBMMNT', singleWeight: 200 },
            { number: 'passengerCNumber', weight: 'passengerCWeight', cg: 131.59, mmnt: 'passengerCMMNT', singleWeight: 200 },
            { number: 'passengerDNumber', weight: 'passengerDWeight', cg: 149.72, mmnt: 'passengerDMMNT', singleWeight: 200 },
            { number: 'passengerENumber', weight: 'passengerEWeight', cg: 166.27, mmnt: 'passengerEMMNT', singleWeight: 200 },
            { number: 'passengerFNumber', weight: 'passengerFWeight', cg: 185.18, mmnt: 'passengerFMMNT', singleWeight: 200 },
            { number: 'passengerGNumber', weight: 'passengerGWeight', cg: 201.73, mmnt: 'passengerGMMNT', singleWeight: 200 },
            { number: 'passengerHNumber', weight: 'passengerHWeight', cg: 220.64, mmnt: 'passengerHMMNT', singleWeight: 200 },
            { number: 'passengerINumber', weight: 'passengerIWeight', cg: 237.19, mmnt: 'passengerIMMNT', singleWeight: 200 },
            { number: 'passengerJNumber', weight: 'passengerJWeight', cg: 257.28, mmnt: 'passengerJMMNT', singleWeight: 200 },
            { number: 'passengerKNumber', weight: 'passengerKWeight', cg: 273.83, mmnt: 'passengerKMMNT', singleWeight: 200 },
            { number: 'passengerLNumber', weight: 'passengerLWeight', cg: 293.53, mmnt: 'passengerLMMNT', singleWeight: 200 },
            { number: 'stretcherANumber', weight: 'stretcherAWeight', cg: 126.87, mmnt: 'stretcherAMMNT', singleWeight: 20 },
            { number: 'stretcherBNumber', weight: 'stretcherBWeight', cg: 135.14, mmnt: 'stretcherBMMNT', singleWeight: 20 },
            { number: 'stretcherCNumber', weight: 'stretcherCWeight', cg: 225.76, mmnt: 'stretcherCMMNT', singleWeight: 20 },
            { number: 'stretcherDNumber', weight: 'stretcherDWeight', cg: 259.84, mmnt: 'stretcherDMMNT', singleWeight: 20 },
            { number: 'sectionANumber', weight: 'sectionAWeight', cg: 120, mmnt: 'sectionAMMNT', singleWeight: 0 },
            { number: 'sectionBNumber', weight: 'sectionBWeight', cg: 140, mmnt: 'sectionBMMNT', singleWeight: 0 },
            { number: 'sectionCNumber', weight: 'sectionCWeight', cg: 180, mmnt: 'sectionCMMNT', singleWeight: 0 },
            { number: 'sectionDNumber', weight: 'sectionDWeight', cg: 220, mmnt: 'sectionDMMNT', singleWeight: 0 },
            { number: 'sectionENumber', weight: 'sectionEWeight', cg: 260, mmnt: 'sectionEMMNT', singleWeight: 0 },
        ];

        let totalWeight = 0;
        let totalMoment = 0;

        sections.forEach(section => {
            const numberElement = document.getElementById(section.number);
            const weightElement = document.getElementById(section.weight);
            const momentElement = document.getElementById(section.mmnt);
            const number = parseFloat(numberElement.value) || 0;
            
            let singleWeight = section.singleWeight;
            
            // Handle Other Load sections with variable single weights
            if (section.number.startsWith('section')) {
                const singleWeightElement = document.getElementById(section.number.replace('Number', 'WeightSingle'));
                if (singleWeightElement) {
                    singleWeight = parseFloat(singleWeightElement.value) || 0;
                }
            }
            
            const cg = section.cg;
            const weight = number * singleWeight;
            const moment = weight * cg;

            weightElement.value = weight.toFixed(2);
            momentElement.value = moment.toFixed(2);

            totalWeight += weight;
            totalMoment += moment;
        });

        const sectionGroups = {
            Crew: ['pilots', 'thirdCM', 'fe', 'gunner', 'crs1And2', 'crs3And4'],
            OptionalEquipment: ['flir', 'hoist', 'fastRope', 'searchLight', 'mg58RH', 'mg58LH', 'extraAmmoBox', 'gun', 'gunLoaded', 'rocketLauncher', 'rocketLauncherLoaded', 'refuelingProbe', 'jdd', 'doorsArmoured', 'seatsArmoured', 'floorArmoured', 'commonSARKit', 'landSARKit', 'seaSARKit', 'transacoStretcher', 'sarKitNet', 'medicalKit'],
            Passengers: ['passengerA', 'passengerB', 'passengerC', 'passengerD', 'passengerE', 'passengerF', 'passengerG', 'passengerH', 'passengerI', 'passengerJ', 'passengerK', 'passengerL'],
            Stretchers: ['stretcherA', 'stretcherB', 'stretcherC', 'stretcherD'],
            OtherLoad: ['sectionA', 'sectionB', 'sectionC', 'sectionD', 'sectionE']
        };

        for (const [sectionName, items] of Object.entries(sectionGroups)) {
            let sectionWeight = 0;
            let sectionMoment = 0;

            items.forEach(item => {
                const weight = parseFloat(document.getElementById(`${item}Weight`).value) || 0;
                const moment = parseFloat(document.getElementById(`${item}MMNT`).value) || 0;
                sectionWeight += weight;
                sectionMoment += moment;
            });

            const sectionCG = sectionWeight > 0 ? sectionMoment / sectionWeight : 0;

            document.getElementById(`total${sectionName}Weight`).value = sectionWeight.toFixed(2);
            document.getElementById(`total${sectionName}MMNT`).value = sectionMoment.toFixed(2);
            document.getElementById(`total${sectionName}CG`).value = sectionCG.toFixed(2);
        }

        const fuelWeights = ['lhInternalFuelWeight', 'rhInternalFuelWeight', 'lhSponsonWeight', 'rhSponsonWeight', 'cabinFuelWeight'];
        const fuelMoments = ['lhInternalFuelMMNT', 'rhInternalFuelMMNT', 'lhSponsonMMNT', 'rhSponsonMMNT', 'cabinFuelMMNT'];

        let totalFuelWeight = 0;
        let totalFuelMoment = 0;

        for (let i = 0; i < fuelWeights.length; i++) {
            let weight = parseFloat(document.getElementById(fuelWeights[i]).value) || 0;
            let moment = parseFloat(document.getElementById(fuelMoments[i]).value) || 0;

            totalFuelWeight += weight;
            totalFuelMoment += moment;
        }

        // Cap the total fuel weight at the maximum allowed fuel
        totalFuelWeight = Math.min(totalFuelWeight, window.maxAllowedFuel);

        const totalFuelWeightElement = document.getElementById('totalFuelWeight');
        totalFuelWeightElement.value = totalFuelWeight.toFixed(2);

        const totalFuelCG = totalFuelWeight > 0 ? totalFuelMoment / totalFuelWeight : 0;
        document.getElementById('totalFuelCG').value = totalFuelCG.toFixed(2);
        document.getElementById('totalFuelMMNT').value = totalFuelMoment.toFixed(2);

        const emptyWeight = parseFloat(document.getElementById('emptyWeight').value) || 0;
        const zfw = totalWeight + emptyWeight;
        const ttlWeight = zfw + totalFuelWeight; // Use totalFuelWeight here
        const emptyWeightCG = parseFloat(document.getElementById('emptyWeightCG').value) || 0;
        const aircraftMoment = emptyWeight * emptyWeightCG;
        const ttlMoment = totalMoment + aircraftMoment + totalFuelMoment;

        const cg = ttlWeight > 0 ? ttlMoment / ttlWeight : 0;

        document.getElementById('zfw').value = zfw.toFixed(2);
        document.getElementById('ttl-weight').value = ttlWeight.toFixed(2);
        document.getElementById('ttl-mmnt').value = ttlMoment.toFixed(2);
        document.getElementById('cg-summary').value = cg.toFixed(2);

        const isCGOK = checkCGAndWeight(ttlWeight, cg);
        const cgStatusElement = document.getElementById('cg-status');
        if (isCGOK) {
            cgStatusElement.textContent = "Center of Gravity: OK";
            cgStatusElement.className = "status-ok";
        } else {
            cgStatusElement.textContent = "Center of Gravity: NOT OK";
            cgStatusElement.className = "status-error";
        }

        if (window.chartDrawer && typeof window.chartDrawer.drawResult === 'function') {
            if (ttlWeight > 0 && !isNaN(cg)) {
                window.chartDrawer.drawResult(ttlWeight, cg);
            } else {
                console.error('Invalid weight or CG value for drawing');
            }
        } else {
            console.error("Chart drawer not available or drawResult is not a function");
        }

        // Draw on IGE chart (Altitude + Temperature â†’ Max Weight)
        if (window.igeChartDrawer && typeof window.igeChartDrawer.drawResult === 'function') {
            const altitude = parseFloat(document.getElementById('height')?.value) || 0;
            const temperature = parseFloat(document.getElementById('temperature')?.value) || 15;
            window.igeChartDrawer.drawResult(altitude, temperature);
        }

        calculateZeroFuelWeightMax5ftIGE();
        saveAllData();
    }

    function checkCGAndWeight(weight, cg) {
        const isWeightOK = weight <= 21495;
        const isCGOK = cg >= 170 && cg <= 195;
        return isWeightOK && isCGOK;
    }

    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calculateCG);
    });

    document.getElementById('5ft_weight').addEventListener('DOMSubtreeModified', function() {
        calculateZeroFuelWeightMax5ftIGE();
    });

    document.getElementById('zfw').addEventListener('input', function() {
        calculateZeroFuelWeightMax5ftIGE();
        calculateCG();
    });

    const fuelInputs = [
        'lhInternalFuelNumber', 'rhInternalFuelNumber', 'lhSponsonNumber', 'rhSponsonNumber', 'cabinFuelNumber'
        
    ];
    const singleWeightInputs = [
        'lhInternalFuelSingleWeight', 'rhInternalFuelSingleWeight', 'lhSponsonSingleWeight', 'rhSponsonSingleWeight', 'cabinFuelSingleWeight'
    ];

    fuelInputs.forEach((inputId, index) => {
        const element = document.getElementById(inputId);
        const singleWeightElement = document.getElementById(singleWeightInputs[index]);
        if (element && singleWeightElement) {
            element.addEventListener('input', function() {
                if (this.value && this.value !== '0') {
                    singleWeightElement.value = '1';
                } else {
                    singleWeightElement.value = '0';
                }
                calculateCG();
            });
        }
    });

    calculateZeroFuelWeightMax5ftIGE();
    calculateCG();
});

function findWeight(temperature, height) {
    let weights = chartData.map(tempData => ({
        temperature: tempData.temperature,
        weight: findWeightForHeight(tempData, height)
    }));

    weights.sort((a, b) => a.temperature - b.temperature);

    let lowerTemp = weights[0];
    let upperTemp = weights[weights.length - 1];
    for (let i = 0; i < weights.length - 1; i++) {
        if (weights[i].temperature <= temperature && weights[i + 1].temperature > temperature) {
            lowerTemp = weights[i];
            upperTemp = weights[i + 1];
            break;
        }
    }

    const tempRatio = (temperature - lowerTemp.temperature) / (upperTemp.temperature - lowerTemp.temperature);
    const weight = lowerTemp.weight + tempRatio * (upperTemp.weight - lowerTemp.weight);

    return Math.min(weight, 21495);
}

function findWeightForHeight(tempData, height) {
    let lowerPoint = tempData.points[tempData.points.length - 1];
    let upperPoint = tempData.points[0];

    for (let i = 0; i < tempData.points.length - 1; i++) {
        if (tempData.points[i].y >= height && tempData.points[i + 1].y < height) {
            upperPoint = tempData.points[i];
            lowerPoint = tempData.points[i + 1];
            break;
        }
    }

    const heightRatio = (height - lowerPoint.y) / (upperPoint.y - lowerPoint.y);
    return lowerPoint.x + heightRatio * (upperPoint.x - lowerPoint.x);
}

function calculateWeight() {
    const temperature = parseFloat(document.getElementById('temperature').value);
    const height = parseFloat(document.getElementById('height').value);
    const resultDiv = document.getElementById('5ft_weight');

    if (isNaN(temperature) || isNaN(height)) {
        resultDiv.textContent = "Please enter valid numbers for temperature and height.";
        return;
    }

    if (temperature < -50 || temperature > 50) {
        resultDiv.textContent = "Temperature must be between -50Â°C and 50Â°C.";
        return;
    }

    if (height < 0 || height > 20000) {
        resultDiv.textContent = "Height must be between 0 and 20,000 ft.";
        return;
    }

    const weight = findWeight(temperature, height);

    if (weight >= 21495) {
        resultDiv.textContent = `Maximum weight: 21495.00 lbs (Limit reached)`;
    } else {
        resultDiv.textContent = `Maximum weight: ${weight.toFixed(2)} lbs`;
    }

    calculateZeroFuelWeightMax5ftIGE();
    calculateCG();
    saveAllData();
}

document.addEventListener('DOMContentLoaded', function() {
    const calculateWeightBtn = document.getElementById('calculateWeightBtn');
    if (calculateWeightBtn) {
        calculateWeightBtn.addEventListener('click', calculateWeight);
    }
    
    const temperatureInput = document.getElementById('temperature');
    const heightInput = document.getElementById('height');
    
    if (temperatureInput && heightInput) {
        temperatureInput.addEventListener('input', calculateWeight);
        heightInput.addEventListener('input', calculateWeight);
    }
});

function updateOtherLoadWeight(sectionId, cg) {
    const singleWeightElement = document.getElementById(sectionId + 'WeightSingle');
    const numberElement = document.getElementById(sectionId + 'Number');
    const weightElement = document.getElementById(sectionId + 'Weight');
    const mmntElement = document.getElementById(sectionId + 'MMNT');
    
    const singleWeight = parseFloat(singleWeightElement.value) || 0;
    const number = parseFloat(numberElement.value) || 0;
    const weight = singleWeight * number;
    const moment = weight * cg;
    
    weightElement.value = weight.toFixed(2);
    mmntElement.value = moment.toFixed(2);
    
    calculateCG();
}

window.addEventListener('beforeunload', saveAllData);
