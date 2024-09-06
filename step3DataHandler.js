// step3DataHandler.js

let step1FuelData = {};
let step2WindData = '';

function loadStep3Data() {
    const step1Data = JSON.parse(localStorage.getItem('step1SpecificData') || '{}');
    const step2Data = JSON.parse(localStorage.getItem('step2SpecificData') || '{}');
    const savedData = JSON.parse(localStorage.getItem('step3SpecificData') || '{}');
    step1FuelData = JSON.parse(localStorage.getItem('fuelData') || '{}');
    step2WindData = step2Data.inputs?.['#wind'] || '';
    console.log('Loading Step 3 data:', { step1Data, step2Data, savedData, step1FuelData, step2WindData });

    // Load data from Step 1 and Step 2
    document.getElementById('totalweight').value = step1Data.summaryData?.['ttl-weight'] || step2Data.inputs?.['#acweight'] || savedData.inputs?.['totalweight'] || '';
    document.getElementById('height').value = step1Data.inputs?.['height'] || step2Data.inputs?.['#hp'] || savedData.inputs?.['height'] || '';
    document.getElementById('temperature').value = step1Data.inputs?.['temperature'] || step2Data.inputs?.['#qat'] || savedData.inputs?.['temperature'] || '';

    // Load wind data from Step 2
    document.getElementById('windSpeed').value = step2WindData || savedData.inputs?.['windSpeed'] || '';

    // Load Step 3 specific data
    document.getElementById('speed').value = savedData.inputs?.['speed'] || '';
    document.getElementById('fuelconsumption').value = savedData.calculatedValues?.['fuelconsumption'] || '';

    // Load VFR Calculation data
    document.getElementById('distance').value = savedData.inputs?.['distance'] || '';
    document.getElementById('speedFuel').value = savedData.inputs?.['speedFuel'] || '';
    document.getElementById('fuelConsumption').value = savedData.inputs?.['fuelConsumption'] || '';
    document.getElementById('fuelEntered').value = savedData.inputs?.['fuelEntered'] || step1FuelData['totalFuelWeight'] || '';
    document.getElementById('dayNight').value = savedData.inputs?.['dayNight'] || 'day';

    // Load IFR Calculation data
    document.getElementById('distanceAB').value = savedData.inputs?.['distanceAB'] || '';
    document.getElementById('distanceBC').value = savedData.inputs?.['distanceBC'] || '';
    document.getElementById('speedIFR').value = savedData.inputs?.['speedIFR'] || '';
    document.getElementById('fuelConsumptionIFR').value = savedData.inputs?.['fuelConsumptionIFR'] || '';
    document.getElementById('reserveIFR').value = savedData.inputs?.['reserveIFR'] || '';

    // Load FUEL Calculation data
    document.getElementById('range2').value = savedData.inputs?.['range2'] || '';
    document.getElementById('speed2').value = savedData.inputs?.['speed2'] || '';
    document.getElementById('onSiteHours2').value = savedData.inputs?.['onSiteHours2'] || '';
    document.getElementById('onSiteMinutes2').value = savedData.inputs?.['onSiteMinutes2'] || '';
    document.getElementById('consumption2').value = savedData.inputs?.['consumption2'] || '';
    document.getElementById('reserve2').value = savedData.inputs?.['reserve2'] || '';

    // Load RANGE Calculation data
    document.getElementById('qInTanks').value = savedData.inputs?.['qInTanks'] || step1FuelData['totalFuelWeight'] || '';
    document.getElementById('reserve').value = savedData.inputs?.['reserve'] || '';
    document.getElementById('consumption').value = savedData.inputs?.['consumption'] || '';
    document.getElementById('onSiteHours').value = savedData.inputs?.['onSiteHours'] || '';
    document.getElementById('onSiteMinutes').value = savedData.inputs?.['onSiteMinutes'] || '';
    document.getElementById('speedBox1').value = savedData.inputs?.['speedBox1'] || '';
}

function saveStep3Data() {
    const data = {
        inputs: {
            speed: document.getElementById('speed').value,
            distance: document.getElementById('distance').value,
            windSpeed: document.getElementById('windSpeed').value,
            speedFuel: document.getElementById('speedFuel').value,
            fuelConsumption: document.getElementById('fuelConsumption').value,
            fuelEntered: document.getElementById('fuelEntered').value,
            dayNight: document.getElementById('dayNight').value,
            distanceAB: document.getElementById('distanceAB').value,
            distanceBC: document.getElementById('distanceBC').value,
            speedIFR: document.getElementById('speedIFR').value,
            fuelConsumptionIFR: document.getElementById('fuelConsumptionIFR').value,
            reserveIFR: document.getElementById('reserveIFR').value,
            range2: document.getElementById('range2').value,
            speed2: document.getElementById('speed2').value,
            onSiteHours2: document.getElementById('onSiteHours2').value,
            onSiteMinutes2: document.getElementById('onSiteMinutes2').value,
            consumption2: document.getElementById('consumption2').value,
            reserve2: document.getElementById('reserve2').value,
            qInTanks: document.getElementById('qInTanks').value,
            reserve: document.getElementById('reserve').value,
            consumption: document.getElementById('consumption').value,
            onSiteHours: document.getElementById('onSiteHours').value,
            onSiteMinutes: document.getElementById('onSiteMinutes').value,
            speedBox1: document.getElementById('speedBox1').value,
        },
        calculatedValues: {
            fuelconsumption: document.getElementById('fuelconsumption').value,
            bf: document.getElementById('bf').value,
            time: document.getElementById('time').value,
            flightFuel: document.getElementById('flightFuel').value,
            bingo: document.getElementById('bingo').value,
            endurance: document.getElementById('endurance').value,
            mfqIFR: document.getElementById('mfqIFR').value,
            trip2: document.getElementById('trip2').value,
            legs2: document.getElementById('legs2').value,
            flight2: document.getElementById('flight2').value,
            needed2: document.getElementById('needed2').value,
            qInTanks2: document.getElementById('qInTanks2').value,
            usable: document.getElementById('usable').value,
            flight: document.getElementById('flight').value,
            legs: document.getElementById('legs').value,
            range: document.getElementById('range').value,
            trip: document.getElementById('trip').value,
        }
    };

    localStorage.setItem('step3SpecificData', JSON.stringify(data));
    console.log('Step 3 data saved:', data);
}

function calculateMinimumFuelVFR() {
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const windSpeed = parseFloat(document.getElementById('windSpeed').value) || 0;
    const speed = parseFloat(document.getElementById('speedFuel').value) || 0;
    const fuelConsumption = parseFloat(document.getElementById('fuelConsumption').value) || 0;
    const totalFuel = parseFloat(document.getElementById('fuelEntered').value) || 0;
    const dayNight = document.getElementById('dayNight').value;

    const groundSpeed = speed - windSpeed;
    const time = distance / groundSpeed;
    const flightFuel = time * fuelConsumption;
    const bf = dayNight === 'day' ? 200 : 300;
    const bingo = flightFuel + bf;
    const endurance = totalFuel / fuelConsumption;

    document.getElementById('bf').value = bf.toFixed(2);
    document.getElementById('time').value = time.toFixed(2);
    document.getElementById('flightFuel').value = flightFuel.toFixed(2);
    document.getElementById('bingo').value = bingo.toFixed(2);
    document.getElementById('endurance').value = endurance.toFixed(2);

    saveStep3Data();
}

function calculateMinimumFuelIFR() {
    const distanceAB = parseFloat(document.getElementById('distanceAB').value) || 0;
    const distanceBC = parseFloat(document.getElementById('distanceBC').value) || 0;
    const speed = parseFloat(document.getElementById('speedIFR').value) || 0;
    const fuelConsumption = parseFloat(document.getElementById('fuelConsumptionIFR').value) || 0;
    const reserve = parseFloat(document.getElementById('reserveIFR').value) || 0;

    const totalDistance = distanceAB + distanceBC;
    const flightTime = totalDistance / speed;
    const flightFuel = flightTime * fuelConsumption;
    const reserveFuel = reserve * fuelConsumption;
    const mfq = flightFuel + reserveFuel;

    document.getElementById('mfqIFR').value = mfq.toFixed(2);

    saveStep3Data();
}

function calculateFuelNeeded() {
    const range = parseFloat(document.getElementById('range2').value) || 0;
    const speed = parseFloat(document.getElementById('speed2').value) || 0;
    const onSiteHours = parseFloat(document.getElementById('onSiteHours2').value) || 0;
    const onSiteMinutes = parseFloat(document.getElementById('onSiteMinutes2').value) || 0;
    const consumption = parseFloat(document.getElementById('consumption2').value) || 0;
    const reserve = parseFloat(document.getElementById('reserve2').value) || 0;

    const trip = range * 2;
    const flightTime = trip / speed;
    const onSiteTime = onSiteHours + (onSiteMinutes / 60);
    const totalTime = flightTime + onSiteTime;
    const fuelNeeded = totalTime * consumption;
    const totalFuel = fuelNeeded + reserve;

    document.getElementById('trip2').value = trip.toFixed(2);
    document.getElementById('legs2').value = flightTime.toFixed(2);
    document.getElementById('flight2').value = totalTime.toFixed(2);
    document.getElementById('needed2').value = fuelNeeded.toFixed(2);
    document.getElementById('qInTanks2').value = totalFuel.toFixed(2);

    saveStep3Data();
}

function calculateRange() {
    const qInTanks = parseFloat(document.getElementById('qInTanks').value) || 0;
    const reserve = parseFloat(document.getElementById('reserve').value) || 0;
    const consumption = parseFloat(document.getElementById('consumption').value) || 0;
    const onSiteHours = parseFloat(document.getElementById('onSiteHours').value) || 0;
    const onSiteMinutes = parseFloat(document.getElementById('onSiteMinutes').value) || 0;
    const speed = parseFloat(document.getElementById('speedBox1').value) || 0;

    const usableFuel = qInTanks - reserve;
    const onSiteTime = onSiteHours + (onSiteMinutes / 60);
    const flightTime = (usableFuel / consumption) - onSiteTime;
    const range = (flightTime * speed) / 2;
    const trip = range * 2;

    document.getElementById('usable').value = usableFuel.toFixed(2);
    document.getElementById('flight').value = flightTime.toFixed(2);
    document.getElementById('legs').value = (flightTime / 2).toFixed(2);
    document.getElementById('range').value = range.toFixed(2);
    document.getElementById('trip').value = trip.toFixed(2);

    saveStep3Data();
}

function initializeStep3Listeners() {
    document.getElementById('calculateVFR').addEventListener('click', calculateMinimumFuelVFR);
    document.getElementById('calculateIFR').addEventListener('click', calculateMinimumFuelIFR);
    document.getElementById('calculateFUEL').addEventListener('click', calculateFuelNeeded);
    document.getElementById('calculateRANGE').addEventListener('click', calculateRange);
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.href.includes('STEP3.html')) {
        console.log('DOMContentLoaded: Loading Step 3 data...');
        loadStep3Data();
        initializeStep3Listeners();
    }
});

function saveStep3AndNavigate(destination) {
    saveStep3Data();
    window.location.href = destination;
}

window.addEventListener('beforeunload', saveStep3Data);