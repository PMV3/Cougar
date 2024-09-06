function loadStep2Data() {
    const step1Data = JSON.parse(localStorage.getItem('step1SpecificData') || '{}');
    const savedData = JSON.parse(localStorage.getItem('step2SpecificData') || '{}');
    console.log('Loading Step 2 data:', { step1Data, savedData });

    // Always load the latest data from Step 1
    const acweightElement = document.getElementById('#acweight');
    if (acweightElement) {
        acweightElement.value = step1Data.summaryData?.['ttl-weight'] || savedData.inputs?.['#acweight'] || '';
    }

    const windElement = document.getElementById('#wind');
    if (windElement) {
        windElement.value = step1Data.inputs?.['wind'] || savedData.inputs?.['#wind'] || '';
    }

    const qatElement = document.getElementById('#qat');
    if (qatElement) {
        qatElement.value = step1Data.inputs?.['temperature'] || savedData.inputs?.['#qat'] || '';
    }

    const hpElement = document.getElementById('#hp');
    if (hpElement) {
        hpElement.value = step1Data.inputs?.['height'] || savedData.inputs?.['#hp'] || '';
    }

    // Load other Step 2 saved data
    Object.entries(savedData.inputs || {}).forEach(([id, value]) => {
        if (!['#acweight', '#wind', '#qat', '#hp'].includes(id)) {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });

    // Load calculated values
    Object.entries(savedData.calculatedValues || {}).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    });

    // Load chart data if applicable
    Object.entries(savedData.chartData || {}).forEach(([id, dataUrl]) => {
        const canvas = document.getElementById(id) || document.querySelector(`canvas:not([id])`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = dataUrl;
        }
    });

    // Trigger calculations to update any dependent fields
    if (typeof performCalculations === 'function') {
        performCalculations();
    }
}

// Add this function to check for Step 1 updates
function checkForStep1Updates() {
    const step1Data = JSON.parse(localStorage.getItem('step1SpecificData') || '{}');
    const savedData = JSON.parse(localStorage.getItem('step2SpecificData') || '{}');

    let updatesDetected = false;

    if (step1Data.summaryData?.['ttl-weight'] !== savedData.inputs?.['#acweight']) updatesDetected = true;
    if (step1Data.inputs?.['wind'] !== savedData.inputs?.['#wind']) updatesDetected = true;
    if (step1Data.inputs?.['temperature'] !== savedData.inputs?.['#qat']) updatesDetected = true;
    if (step1Data.inputs?.['height'] !== savedData.inputs?.['#hp']) updatesDetected = true;

    if (updatesDetected) {
        loadStep2Data();
    }
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.href.includes('STEP2.html')) {
        console.log('DOMContentLoaded: Loading Step 2 data...');
        loadStep2Data();
        initializeStep2Listeners();
        
        // Add periodic check for Step 1 updates
        setInterval(checkForStep1Updates, 5000); // Check every 5 seconds
    }
});