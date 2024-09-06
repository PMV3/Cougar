function saveAllData() {
    // Save specific data from Step 1
    if (window.location.href.includes('STEP1.html')) {
        localStorage.setItem('ttl-weight', document.getElementById('ttl-weight').value);
        localStorage.setItem('wind', document.getElementById('wind').value);
        localStorage.setItem('temperature', document.getElementById('temperature').value);
        localStorage.setItem('height', document.getElementById('height').value);
        localStorage.setItem('totalFuelWeight', document.getElementById('totalFuelWeight').value);
    }
    
    // Save all other input fields
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.id) {
            localStorage.setItem(input.id, input.value);
        }
    });
}

function loadAllData() {
    return new Promise((resolve) => {
        // Load all saved input fields
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.id) {
                const savedValue = localStorage.getItem(input.id);
                if (savedValue !== null) {
                    input.value = savedValue;
                    if (input.oninput) {
                        input.oninput();
                    }
                }
            }
            // Load Step 1 specific data if available
if (window.location.href.includes('STEP1.html')) {
    loadStep1Data(); // This function is from step1DataHandler.js
}
        });

        // Load specific data into Step 2
        if (window.location.href.includes('STEP2.html')) {
            document.getElementById('#acweight').value = localStorage.getItem('ttl-weight') || '';
            document.getElementById('#wind').value = localStorage.getItem('wind') || '';
            document.getElementById('#qat').value = localStorage.getItem('temperature') || '';
            document.getElementById('#hp').value = localStorage.getItem('height') || '';
        }

        // Load specific data into Step 3
        if (window.location.href.includes('STEP3.html')) {
            document.getElementById('totalweight').value = localStorage.getItem('ttl-weight') || '';
            document.getElementById('windSpeed').value = localStorage.getItem('wind') || '';
            document.getElementById('temperature').value = localStorage.getItem('temperature') || '';
            document.getElementById('height').value = localStorage.getItem('height') || '';
            document.getElementById('fuelEntered').value = localStorage.getItem('totalFuelWeight') || '';
        }

        console.log('Loaded data:', localStorage);
        resolve(); // Resolve the promise when loading is complete
    });
}

function saveDataAndGoToStep1() {
    saveAllData();
    window.location.href = 'STEP1.html';
}

function saveDataAndGoToStep2() {
    saveAllData();
    window.location.href = 'STEP2.html';
}

function saveDataAndGoToStep3() {
    saveAllData();
    window.location.href = 'STEP3.html';
}

// Add this event listener to each page
document.addEventListener('DOMContentLoaded', function() {
    loadAllData().then(() => {
        // Call your calculation function here if needed
        if (window.location.href.includes('STEP2.html') && typeof performCalculations === 'function') {
            performCalculations();
        }
    });
});