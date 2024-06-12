document.addEventListener('DOMContentLoaded', () => {
    function calculateFirstTable() {
        const qInTanks = parseFloat(document.getElementById('qInTanks').value);
        const reserve = parseFloat(document.getElementById('reserve').value);
        const consumption = parseFloat(document.getElementById('consumption').value);

        const usable = qInTanks - reserve;
        document.getElementById('usable').value = usable.toFixed(2);

        const onSiteHours = parseFloat(document.getElementById('onSiteHours').value);
        const onSiteMinutes = parseFloat(document.getElementById('onSiteMinutes').value);
        const onSite = onSiteHours + (onSiteMinutes / 60);
        
        const flight = usable / consumption;
        document.getElementById('flight').value = `${Math.floor(flight)}h ${Math.round((flight % 1) * 60)}m`;

        const legs = flight + onSite;
        document.getElementById('legs').value = `${Math.floor(legs)}h ${Math.round((legs % 1) * 60)}m`;

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
        document.getElementById('legs2').value = `${Math.floor(legs2)}h ${Math.round((legs2 % 1) * 60)}m`;

        const onSiteHours2 = parseFloat(document.getElementById('onSiteHours2').value);
        const onSiteMinutes2 = parseFloat(document.getElementById('onSiteMinutes2').value);
        const onSite2 = onSiteHours2 + (onSiteMinutes2 / 60);

        const flight2 = legs2 + onSite2;
        document.getElementById('flight2').value = `${Math.floor(flight2)}h ${Math.round((flight2 % 1) * 60)}m`;

        const needed2 = flight2 * consumption2;
        document.getElementById('needed2').value = needed2.toFixed(2);

        const reserve2 = parseFloat(document.getElementById('reserve2').value);
        const qInTanks2 = needed2 + reserve2;
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
        document.getElementById('time').value = time.toFixed(2);

        // Calculate fuel required from A to B
        let fuelAtoB = time * fuelConsumption;

        // Add 5% to fuelAtoB if wind speed >= 15 Kts
        if (windSpeed >= 15) {
            fuelAtoB += 0.05 * fuelAtoB;
        }

        // Calculate reserve fuel
        const reserve = (dayNight === "day") ? 500 : 600;

        // Additional fuel for startup and taxi
        const startupTaxi = 150;

        // Total fuel required
        const totalFuelRequired = fuelAtoB + reserve + startupTaxi;
        document.getElementById('fuelNeeded').value = totalFuelRequired.toFixed(2);

        // Calculate Bingo and Endurance
        const bingo = fuelEntered - totalFuelRequired;
        document.getElementById('bingo').value = bingo.toFixed(2);

        const endurance = bingo / fuelConsumption;
        document.getElementById('endurance').value = `${Math.floor(endurance)}h ${Math.round((endurance % 1) * 60)}m`;
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

        // Add 5% to fuelAtoB
        fuelAtoB += 0.05 * fuelAtoB;

        // Calculate reserve fuel based on time
        const reserveFuel = reserve < 30 ? 20 * fuelConsumption : 30 * fuelConsumption;

        // Additional fuel for startup and taxi
        const startupTaxi = 150;

        // Total fuel required
        const totalFuelRequired = fuelAtoB + fuelBtoC + reserveFuel + startupTaxi;
        document.getElementById('mfqIFR').value = totalFuelRequired.toFixed(2);
    }

    window.calculateFirstTable = calculateFirstTable;
    window.calculateSecondTable = calculateSecondTable;
    window.calculateMinimumFuel = calculateMinimumFuel;
    window.calculateMFQIFR = calculateMFQIFR;
});
