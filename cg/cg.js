// Combined cg.js and 5ft_calculator.js

let zeroFuelWeightMax5ftIGE = 0; // Global variable to store the fixed value

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
    const maxWeight5ftIGE = parseFloat(document.getElementById('5ft_weight').textContent.match(/\d+(\.\d+)?/)[0]) || 0;
    const zeroFuelWeight = parseFloat(document.getElementById('zfw').value) || 0;
    zeroFuelWeightMax5ftIGE = maxWeight5ftIGE - zeroFuelWeight;
    document.getElementById('zeroFuelWeightMax5ftIGE').value = zeroFuelWeightMax5ftIGE.toFixed(2);
}

function calculateMaxFuelToUse() {
    document.getElementById('maxFuelToUse').value = zeroFuelWeightMax5ftIGE.toFixed(2);
}

function saveDataForStep2() {
    const temperature = document.getElementById('temperature').value;
    const height = document.getElementById('height').value;
    const totalWeight = document.getElementById('ttl-weight').value;

    localStorage.setItem('temperature', temperature);
    localStorage.setItem('height', height);
    localStorage.setItem('totalWeight', totalWeight);
}

document.addEventListener('DOMContentLoaded', function () {
    const tailNumberSelect = document.getElementById('tail-number');
    const aircraftData = {
        9901: { weight: 13560, cog: 191.82 },
        9902: { weight: 13790, cog: 188.23 },
        9903: { weight: 13460, cog: 188.50 },
        9904: { weight: 13646, cog: 189.3 },
        9905: { weight: 13855, cog: 188.95 },
        9909: { weight: 13787, cog: 188.72 },
        9910: { weight: 14096, cog: 187.38 },
        9911: { weight: 13660, cog: 188.62 },
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
            { number: 'mg58RHNumber', weight: 'mg58RHWeight', cg: 108.94, mmnt: 'mg58RHMMNT', singleWeight: 103 },
            { number: 'mg58LHNumber', weight: 'mg58LHWeight', cg: 116.42, mmnt: 'mg58LHMMNT', singleWeight: 103 },
            { number: 'extraAmmoBoxNumber', weight: 'extraAmmoBoxWeight', cg: 95, mmnt: 'extraAmmoBoxMMNT', singleWeight: 31 },
            { number: 'gunNumber', weight: 'gunWeight', cg: 100.4, mmnt: 'gunMMNT', singleWeight: 269 },
            { number: 'gunLoadedNumber', weight: 'gunLoadedWeight', cg: 100.4, mmnt: 'gunLoadedMMNT', singleWeight: 452 },
            { number: 'rocketLauncherNumber', weight: 'rocketLauncherWeight', cg: 117, mmnt: 'rocketLauncherMMNT', singleWeight: 170 },
            { number: 'rocketLauncherLoadedNumber', weight: 'rocketLauncherLoadedWeight', cg: 117, mmnt: 'rocketLauncherLoadedMMNT', singleWeight: 682 },
            { number: 'refuelingProbeNumber', weight: 'refuelingProbeWeight', cg: 194.5, mmnt: 'refuelingProbeMMNT', singleWeight: 330 },
            { number: 'jddNumber', weight: 'jddWeight', cg: 194.5, mmnt: 'jddMMNT', singleWeight: 160 },
            { number: 'doorsArmouredNumber', weight: 'doorsArmouredWeight', cg: 56.73, mmnt: 'doorsArmouredMMNT', singleWeight: 40 },
            { number: 'seatsArmouredNumber', weight: 'seatsArmouredWeight', cg: 58.31, mmnt: 'seatsArmouredMMNT', singleWeight: 118 },
            { number: 'floorArmouredNumber', weight: 'floorArmouredWeight', cg: 141.84, mmnt: 'floorArmouredMMNT', singleWeight: 522 },
            { number: 'commonSARKitNumber', weight: 'commonSARKitWeight', cg: 257, mmnt: 'commonSARKitMMNT', singleWeight: 90 },
            { number: 'landSARKitNumber', weight: 'landSARKitWeight', cg: 257, mmnt: 'landSARKitMMNT', singleWeight: 135 },
            { number: 'seaSARKitNumber', weight: 'seaSARKitWeight', cg: 257, mmnt: 'seaSARKitMMNT', singleWeight: 149 },
            { number: 'transacoStretcherNumber', weight: 'transacoStretcherWeight', cg: 257, mmnt: 'transacoStretcherMMNT', singleWeight: 91 },
            { number: 'sarKitNetNumber', weight: 'sarKitNetWeight', cg: 257, mmnt: 'sarKitNetMMNT', singleWeight:
13 },
            { number: 'medicalKitNumber', weight: 'medicalKitWeight', cg: 257, mmnt: 'medicalKitMMNT', singleWeight: 70 },
            { number: 'passengerANumber', weight: 'passengerAWeight', cg: 96.69, mmnt: 'passengerAMMNT', singleWeight: 250 },
            { number: 'passengerBNumber', weight: 'passengerBWeight', cg: 113.71, mmnt: 'passengerBMMNT', singleWeight: 250 },
            { number: 'passengerCNumber', weight: 'passengerCWeight', cg: 131.59, mmnt: 'passengerCMMNT', singleWeight: 250 },
            { number: 'passengerDNumber', weight: 'passengerDWeight', cg: 149.72, mmnt: 'passengerDMMNT', singleWeight: 250 },
            { number: 'passengerENumber', weight: 'passengerEWeight', cg: 166.27, mmnt: 'passengerEMMNT', singleWeight: 250 },
            { number: 'passengerFNumber', weight: 'passengerFWeight', cg: 185.18, mmnt: 'passengerFMMNT', singleWeight: 250 },
            { number: 'passengerGNumber', weight: 'passengerGWeight', cg: 201.73, mmnt: 'passengerGMMNT', singleWeight: 250 },
            { number: 'passengerHNumber', weight: 'passengerHWeight', cg: 220.64, mmnt: 'passengerHMMNT', singleWeight: 250 },
            { number: 'passengerINumber', weight: 'passengerIWeight', cg: 237.19, mmnt: 'passengerIMMNT', singleWeight: 250 },
            { number: 'passengerJNumber', weight: 'passengerJWeight', cg: 257.28, mmnt: 'passengerJMMNT', singleWeight: 250 },
            { number: 'passengerKNumber', weight: 'passengerKWeight', cg: 273.83, mmnt: 'passengerKMMNT', singleWeight: 250 },
            { number: 'passengerLNumber', weight: 'passengerLWeight', cg: 293.53, mmnt: 'passengerLMMNT', singleWeight: 250 },
            { number: 'stretcherANumber', weight: 'stretcherAWeight', cg: 126.87, mmnt: 'stretcherAMMNT', singleWeight: 220 },
            { number: 'stretcherBNumber', weight: 'stretcherBWeight', cg: 135.14, mmnt: 'stretcherBMMNT', singleWeight: 220 },
            { number: 'stretcherCNumber', weight: 'stretcherCWeight', cg: 225.76, mmnt: 'stretcherCMMNT', singleWeight: 220 },
            { number: 'stretcherDNumber', weight: 'stretcherDWeight', cg: 259.84, mmnt: 'stretcherDMMNT', singleWeight: 220 },
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
            const singleWeight = section.singleWeight;
            const cg = section.cg;
            const weight = number * singleWeight;
            const moment = weight * cg;
    
            weightElement.value = weight.toFixed(2);
            momentElement.value = moment.toFixed(2);
    
            totalWeight += weight;
            totalMoment += moment;

                // Add this part at the end of the function to calculate and display section totals
    const sections = {
        Crew: ['pilots', 'thirdCM', 'fe', 'gunner', 'crs1And2', 'crs3And4'],
        OptionalEquipment: ['flir', 'hoist', 'fastRope', 'searchLight', 'mg58RH', 'mg58LH', 'extraAmmoBox', 'gun', 'gunLoaded', 'rocketLauncher', 'rocketLauncherLoaded', 'refuelingProbe', 'jdd', 'doorsArmoured', 'seatsArmoured', 'floorArmoured', 'commonSARKit', 'landSARKit', 'seaSARKit', 'transacoStretcher', 'sarKitNet', 'medicalKit'],
        Passengers: ['passengerA', 'passengerB', 'passengerC', 'passengerD', 'passengerE', 'passengerF', 'passengerG', 'passengerH', 'passengerI', 'passengerJ', 'passengerK', 'passengerL'],
        Stretchers: ['stretcherA', 'stretcherB', 'stretcherC', 'stretcherD'],
        OtherLoad: ['sectionA', 'sectionB', 'sectionC', 'sectionD', 'sectionE']
    };

    for (const [sectionName, items] of Object.entries(sections)) {
        let sectionWeight = 0;
        let sectionMoment = 0;

        items.forEach(item => {
            const weight = parseFloat(document.getElementById(`${item}Weight`).value) || 0;
            const moment = parseFloat(document.getElementById(`${item}MMNT`).value) || 0;
            sectionWeight += weight;
            sectionMoment += moment;
        });

        const sectionCG = sectionWeight > 0 ? sectionMoment / sectionWeight : 0;

        // Display the totals for each section
        document.getElementById(`total${sectionName}Weight`).value = sectionWeight.toFixed(2);
        document.getElementById(`total${sectionName}MMNT`).value = sectionMoment.toFixed(2);
        document.getElementById(`total${sectionName}CG`).value = sectionCG.toFixed(2);
    }

    // Calculate and display fuel totals separately
    const fuelWeights = ['internalFuelWeight', 'sponsonWeight', 'cabinFuelWeight', 'forwardLongitudinalWeight', 'rearLongitudinalWeight', 'rearTransversalWeight'];
    const fuelMoments = ['internalFuelMMNT', 'sponsonMMNT', 'cabinFuelMMNT', 'forwardLongitudinalMMNT', 'rearLongitudinalMMNT', 'rearTransversalMMNT'];

    const totalFuelWeight = fuelWeights.reduce((sum, id) => sum + (parseFloat(document.getElementById(id).value) || 0), 0);
    const totalFuelMoment = fuelMoments.reduce((sum, id) => sum + (parseFloat(document.getElementById(id).value) || 0), 0);
    const totalFuelCG = totalFuelWeight > 0 ? totalFuelMoment / totalFuelWeight : 0;

    document.getElementById('totalFuelWeight').value = totalFuelWeight.toFixed(2);
    document.getElementById('totalFuelCG').value = totalFuelCG.toFixed(2);
    document.getElementById('totalFuelMMNT').value = totalFuelMoment.toFixed(2);

            
        });
    
        // Calculate total fuel weight and moment
        const totalFuelWeight = 
            parseFloat(document.getElementById('internalFuelWeight').value || 0) + 
            parseFloat(document.getElementById('sponsonWeight').value || 0) + 
            parseFloat(document.getElementById('cabinFuelWeight').value || 0) + 
            parseFloat(document.getElementById('forwardLongitudinalWeight').value || 0) + 
            parseFloat(document.getElementById('rearLongitudinalWeight').value || 0) + 
            parseFloat(document.getElementById('rearTransversalWeight').value || 0);
    
        const totalFuelMoment = 
            parseFloat(document.getElementById('internalFuelMMNT').value || 0) + 
            parseFloat(document.getElementById('sponsonMMNT').value || 0) + 
            parseFloat(document.getElementById('cabinFuelMMNT').value || 0) + 
            parseFloat(document.getElementById('forwardLongitudinalMMNT').value || 0) + 
            parseFloat(document.getElementById('rearLongitudinalMMNT').value || 0) + 
            parseFloat(document.getElementById('rearTransversalMMNT').value || 0);
    
        const totalFuelCG = totalFuelWeight > 0 ? totalFuelMoment / totalFuelWeight : 0;
    
        document.getElementById('totalFuelWeight').value = totalFuelWeight.toFixed(2);
        document.getElementById('totalFuelCG').value = totalFuelCG.toFixed(3);
        document.getElementById('totalFuelMMNT').value = totalFuelMoment.toFixed(2);
        
        // Calculate ZFW (Zero Fuel Weight)
        const emptyWeight = parseFloat(document.getElementById('emptyWeight').value) || 0;
        const zfw = totalWeight + emptyWeight;
        const ttlWeight = zfw + totalFuelWeight;
        const emptyWeightCG = parseFloat(document.getElementById('emptyWeightCG').value) || 0;
        const aircraftMoment = emptyWeight * emptyWeightCG;
        const ttlMoment = totalMoment + aircraftMoment + totalFuelMoment;
        
        const cg = ttlWeight > 0 ? ttlMoment / ttlWeight : 0;
                
        document.getElementById('zfw').value = zfw.toFixed(2);
        document.getElementById('ttl-weight').value = ttlWeight.toFixed(2);
        document.getElementById('ttl-mmnt').value = ttlMoment.toFixed(2);
        document.getElementById('cg-summary').value = cg.toFixed(2);

        // Check CG and weight conditions
        const isCGOK = checkCGAndWeight(ttlWeight, cg);
        const cgStatusElement = document.getElementById('cg-status');
        if (isCGOK) {
            cgStatusElement.textContent = "Center of Gravity: OK";
            cgStatusElement.style.color = "green";
        } else {
            cgStatusElement.textContent = "Center of Gravity: NOT OK";
            cgStatusElement.style.color = "red";
        }

        // Draw the result on the chart
        if (window.chartDrawer && typeof window.chartDrawer.drawResult === 'function') {
            if (ttlWeight > 0 && !isNaN(cg)) {
                window.chartDrawer.drawResult(ttlWeight, cg);
            } else {
                console.error('Invalid weight or CG value for drawing');
            }
        } else {
            console.error("Chart drawer not available or drawResult is not a function");
        }

        calculateMaxFuelToUse();
        saveDataForStep2(); // Add this line to save data for Step 2
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
        calculateMaxFuelToUse();
    });

    document.getElementById('zfw').addEventListener('input', function() {
        calculateZeroFuelWeightMax5ftIGE();
        calculateMaxFuelToUse();
    });

    // Initial calculations
    calculateZeroFuelWeightMax5ftIGE();
    calculateMaxFuelToUse();
    calculateCG();
});

// 5ft_calculator.js content
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
    console.log("Calculate Weight function called");
    const temperature = parseFloat(document.getElementById('temperature').value);
    const height = parseFloat(document.getElementById('height').value);
    console.log("Temperature:", temperature, "Height:", height);
    const resultDiv = document.getElementById('5ft_weight');

    if (isNaN(temperature) || isNaN(height)) {
        resultDiv.textContent = "Please enter valid numbers for temperature and height.";
        return;
    }

    if (temperature < -50 || temperature > 50) {
        resultDiv.textContent = "Temperature must be between -50°C and 50°C.";
        return;
    }

    if (height < 0 || height > 20000) {
        resultDiv.textContent = "Height must be between 0 and 20,000 ft.";
        return;
    }

    console.log("Calculating weight...");
    const weight = findWeight(temperature, height);
    console.log("Calculated weight:", weight);

    if (weight >= 21495) {
        resultDiv.textContent = `Maximum weight: 21495.00 lbs (Limit reached)`;
    } else {
        resultDiv.textContent = `Maximum weight: ${weight.toFixed(2)} lbs`;
    }

    calculateZeroFuelWeightMax5ftIGE();
    calculateMaxFuelToUse();
    saveDataForStep2(); // Add this line to save data for Step 2
}

// Event listener for the calculate button
document.addEventListener('DOMContentLoaded', function() {
    const calculateButton = document.getElementById('calculateButton');
    if (calculateButton) {
        calculateButton.addEventListener('click', calculateWeight);
    }

    // Add event listeners for fuel inputs
    const fuelInputs = [
        'internalFuelNumber', 'sponsonNumber', 'cabinFuelNumber',
        'forwardLongitudinalNumber', 'rearLongitudinalNumber', 'rearTransversalNumber'
    ];
    fuelInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', calculateCG);
        }
    });
});

// Add event listener to save data when navigating away from the page
window.addEventListener('beforeunload', saveDataForStep2);