document.addEventListener('DOMContentLoaded', () => {
    function calculateTotalPerMin() {
        const eng1ValElement = document.getElementById('eng1_val');
        const eng2ValElement = document.getElementById('eng2_val');
        
        const eng1Val = eng1ValElement ? parseFloat(eng1ValElement.value) || 0 : 0;
        const eng2Val = eng2ValElement ? parseFloat(eng2ValElement.value) || 0 : 0;

        return (eng1Val + eng2Val) / 60;
    }

    function updateResults() {
        const totalPerMin = calculateTotalPerMin();
        const totalPerMinElement = document.getElementById('totalPerMin');
        if (totalPerMinElement) {
            totalPerMinElement.value = totalPerMin.toFixed(2);
        }

        const minutesElement = document.getElementById('minutes');
        const calculatedTotalElement = document.getElementById('calculatedTotal');
        const remainingFuelElement = document.getElementById('remainingFuel');
        const totalFuelElement = document.getElementById('totalFuel');

        const minutes = minutesElement ? parseFloat(minutesElement.value) || 0 : 0;
        const totalFuel = totalFuelElement ? parseFloat(totalFuelElement.value) || 0 : 0;

        const calculatedTotal = totalPerMin * minutes;
        if (calculatedTotalElement) {
            calculatedTotalElement.value = calculatedTotal.toFixed(2);
        }

        const remainingFuel = totalFuel - calculatedTotal;
        if (remainingFuelElement) {
            remainingFuelElement.value = remainingFuel.toFixed(2);
        }

        // Update secondary tables
        calculateSecondaryTables();
    }

    function calculateSecondaryTables() {
        // Time to Fuel and NM
        const timeInput1Element = document.getElementById('timeInput1');
        const fuelResult1Element = document.getElementById('fuelResult1');
        const nmResult1Element = document.getElementById('nmResult1');

        const timeInput1 = timeInput1Element ? parseFloat(timeInput1Element.value) || 0 : 0;
        const fuelResult1 = timeInput1 * 20;
        const nmResult1 = timeInput1 * 2;
        if (fuelResult1Element) {
            fuelResult1Element.value = fuelResult1.toFixed(2);
        }
        if (nmResult1Element) {
            nmResult1Element.value = nmResult1.toFixed(2);
        }

        // NM to Fuel and Time
        const nmInput2Element = document.getElementById('nmInput2');
        const fuelResult2Element = document.getElementById('fuelResult2');
        const timeResult2Element = document.getElementById('timeResult2');

        const nmInput2 = nmInput2Element ? parseFloat(nmInput2Element.value) || 0 : 0;
        const fuelResult2 = nmInput2 * 10;
        const timeResult2 = nmInput2 / 2;
        if (fuelResult2Element) {
            fuelResult2Element.value = fuelResult2.toFixed(2);
        }
        if (timeResult2Element) {
            timeResult2Element.value = timeResult2.toFixed(2);
        }

        // Fuel to Time and NM
        const fuelInput3Element = document.getElementById('fuelInput3');
        const timeResult3Element = document.getElementById('timeResult3');
        const nmResult3Element = document.getElementById('nmResult3');

        const fuelInput3 = fuelInput3Element ? parseFloat(fuelInput3Element.value) || 0 : 0;
        const timeResult3 = fuelInput3 / 20;
        const nmResult3 = fuelInput3 / 10;
        if (timeResult3Element) {
            timeResult3Element.value = timeResult3.toFixed(2);
        }
        if (nmResult3Element) {
            nmResult3Element.value = nmResult3.toFixed(2);
        }
    }

    // Attach event listeners to input fields to trigger calculations
    const inputFields = document.querySelectorAll('input, select');
    inputFields.forEach(input => {
        input.addEventListener('input', updateResults);
    });

    // Initial calculation
    updateResults();
});
