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

document.addEventListener('DOMContentLoaded', function () {
    const tailNumberSelect = document.getElementById('tail-number');
    const aircraftData = {
        9901: { weight: 13560, cog: 191.82 },
        9902: { weight: 13790, cog: 188.23 },
        9903: { weight: 13460, cog: 188.50 },
        9904: { weight: 13646, cog: 189.3 },
        9905: { weight: 13855, cog: 188.95 },
        9909: { weight: 13787, cog: 188.72 },
        9910: { weight: 13860, cog: 187.38 },
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
            { number: 'sarKitNetNumber', weight: 'sarKitNetWeight', cg: 257, mmnt: 'sarKitNetMMNT', singleWeight: 13 },
            { number: 'medicalKitNumber', weight: 'medicalKitWeight', cg: 257, mmnt: 'medicalKitMMNT', singleWeight: 70 },
            { number: 'fuelRHNumber', weight: 'fuelRHWeight', cg: 175, mmnt: 'fuelRHMMNT', singleWeight: 375 },
            { number: 'fuelLHNumber', weight: 'fuelLHWeight', cg: 175, mmnt: 'fuelLHMMNT', singleWeight: 390 },
            { number: 'rearTransversNumber', weight: 'rearTransversWeight', cg: 230, mmnt: 'rearTransversMMNT', singleWeight: 1000 },
            { number: 'forwardTransversNumber', weight: 'forwardTransversWeight', cg: 140, mmnt: 'forwardTransversMMNT', singleWeight: 2000 },
            { number: 'cabinNumber', weight: 'cabinWeight', cg: 335.5, mmnt: 'cabinMMNT', singleWeight: 730 },
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
        });

        const cg = totalMoment / totalWeight;

        document.getElementById('ttl-weight').value = totalWeight.toFixed(2);
        document.getElementById('ttl-mmnt').value = totalMoment.toFixed(2);
        document.getElementById('cg-summary').value = cg.toFixed(2);

        // Calculate and update total fuel weight
        const totalFuelWeight = 
              parseFloat(document.getElementById('fuelRHWeight').value) + 
              parseFloat(document.getElementById('fuelLHWeight').value) + 
              parseFloat(document.getElementById('rearTransversWeight').value) + 
              parseFloat(document.getElementById('forwardTransversWeight').value) + 
              parseFloat(document.getElementById('externalRHWeight').value) + 
              parseFloat(document.getElementById('externalLHWeight').value) + 
              parseFloat(document.getElementById('cabinWeight').value);

        document.getElementById('totalFuelWeight').value = totalFuelWeight.toFixed(2);
        
        // Update ZFW and total weight
        const emptyWeight = parseFloat(document.getElementById('emptyWeight').value) || 0;
        const zfw = totalWeight + emptyWeight - totalFuelWeight;
        const ttlWeight =  zfw + totalFuelWeight;
        const aircraftMoment = emptyWeight * parseFloat(document.getElementById('emptyWeightCG').value);
        const ttlMoment = totalMoment + aircraftMoment;
                
        document.getElementById('zfw').value = zfw.toFixed(2);
        document.getElementById('ttl-weight').value = ttlWeight.toFixed(2);
        document.getElementById('ttl-mmnt').value = ttlMoment.toFixed(2);
        document.getElementById('cg-summary').value = (ttlMoment / ttlWeight).toFixed(2);
    }

    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calculateCG);
    });

    calculateCG(); // Initial calculation on page load
});
