// Combined data handling and navigation file

// Utility functions
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Data saving functions
function saveStep1Data() {
    const step1Data = {
        inputs: {},
        collapsibleSections: {},
        summaryData: {}
    };

    document.querySelectorAll('input, select').forEach(input => {
        if (input.id && !input.closest('#fuelSection')) {
            step1Data.inputs[input.id] = input.value;
        }
    });

    const sections = ['Crew', 'OptionalEquipment', 'Passengers', 'StretchersLitters', 'OtherLoad', 'Fuel'];
    sections.forEach(section => {
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            step1Data.collapsibleSections[section] = {
                collapsed: sectionElement.style.display === 'none',
                content: section !== 'Fuel' ? sectionElement.innerHTML : ''
            };
        }
    });

    ['zfw', 'ttl-weight', 'cg-summary', 'ttl-mmnt'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            step1Data.summaryData[id] = element.value || element.textContent;
        }
    });

    step1Data.maxWeight5FTIGE = document.getElementById('5ft_weight')?.textContent || '';
    step1Data.maxFuelToUse = document.getElementById('zeroFuelWeightMax5ftIGE')?.value || '';
    step1Data.cgStatus = document.getElementById('cg-status')?.textContent || '';

    sessionStorage.setItem('step1SpecificData', JSON.stringify(step1Data));
}

function saveFuelTableData() {
    const fuelData = {};
    const fuelInputs = [
        'internalFuelSingleWeight', 'internalFuelWeight',
        'sponsonSingleWeight', 'sponsonWeight',
        'cabinFuelSingleWeight', 'cabinFuelWeight',
        'forwardLongitudinalSingleWeight', 'forwardLongitudinalWeight',
        'rearLongitudinalSingleWeight', 'rearLongitudinalWeight',
        'rearTransversalSingleWeight', 'rearTransversalWeight',
        'totalFuelWeight', 'totalFuelCG', 'totalFuelMMNT'
    ];

    fuelInputs.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            fuelData[id] = inputElement.value;
        }
    });

    sessionStorage.setItem('fuelData', JSON.stringify(fuelData));
}

// Data loading functions
function loadStep1Data() {
    const savedData = JSON.parse(sessionStorage.getItem('step1SpecificData') || '{}');

    Object.entries(savedData.inputs || {}).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && !element.closest('#fuelSection')) {
            element.value = value;
        }
    });

    Object.entries(savedData.collapsibleSections || {}).forEach(([section, data]) => {
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            sectionElement.style.display = data.collapsed ? 'none' : 'block';
            if (section !== 'Fuel') {
                sectionElement.innerHTML = data.content;
            }
            const toggleButton = sectionElement.previousElementSibling;
            if (toggleButton) {
                toggleButton.textContent = toggleButton.textContent.replace(data.collapsed ? "▲" : "▼", data.collapsed ? "▼" : "▲");
            }
        }
    });

    Object.entries(savedData.summaryData || {}).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    });

    if (savedData.maxWeight5FTIGE) document.getElementById('5ft_weight').textContent = savedData.maxWeight5FTIGE;
    if (savedData.maxFuelToUse) document.getElementById('zeroFuelWeightMax5ftIGE').value = savedData.maxFuelToUse;
    if (savedData.cgStatus) document.getElementById('cg-status').textContent = savedData.cgStatus;
}

function loadFuelTableData() {
    const fuelData = JSON.parse(sessionStorage.getItem('fuelData') || '{}');
    const fuelInputs = [
        'internalFuelSingleWeight', 'internalFuelWeight',
        'sponsonSingleWeight', 'sponsonWeight',
        'cabinFuelSingleWeight', 'cabinFuelWeight',
        'forwardLongitudinalSingleWeight', 'forwardLongitudinalWeight',
        'rearLongitudinalSingleWeight', 'rearLongitudinalWeight',
        'rearTransversalSingleWeight', 'rearTransversalWeight',
        'totalFuelWeight', 'totalFuelCG', 'totalFuelMMNT'
    ];

    fuelInputs.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement && fuelData[id] !== undefined) {
            inputElement.value = fuelData[id];
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}

// Calculation functions
function updateWeight(numberId, singleWeight, weightId, momentId, cgLocation) {
    const number = parseFloat(document.getElementById(numberId)?.value) || 1;
    const totalWeight = number * singleWeight;
    const moment = totalWeight * cgLocation;

    document.getElementById(weightId).value = totalWeight.toFixed(2);
    document.getElementById(momentId).value = moment ? moment.toFixed(2) : 'NaN';

    calculateTotalFuel();
}

function calculateTotalFuel() {
    const weights = [
        'internalFuelWeight', 'sponsonWeight', 'cabinFuelWeight',
        'forwardLongitudinalWeight', 'rearLongitudinalWeight', 'rearTransversalWeight'
    ];

    const moments = [
        'internalFuelMMNT', 'sponsonMMNT', 'cabinFuelMMNT',
        'forwardLongitudinalMMNT', 'rearLongitudinalMMNT', 'rearTransversalMMNT'
    ];

    let totalWeight = 0;
    let totalMoment = 0;

    weights.forEach(id => {
        const weight = parseFloat(document.getElementById(id)?.value) || 0;
        totalWeight += weight;
    });

    moments.forEach(id => {
        const moment = parseFloat(document.getElementById(id)?.value) || 0;
        totalMoment += moment;
    });

    document.getElementById('totalFuelWeight').value = totalWeight.toFixed(2);
    document.getElementById('totalFuelMMNT').value = totalMoment.toFixed(2);
    document.getElementById('totalFuelCG').value = totalWeight ? (totalMoment / totalWeight).toFixed(2) : '0.00';
}

// Event listeners and initialization
function initializeInputListeners() {
    const fuelTable = document.querySelector('#fuelSection table');
    if (fuelTable) {
        fuelTable.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' && event.target.closest('td:nth-child(2)')) {
                const row = event.target.closest('tr');
                const singleWeight = parseFloat(row.querySelector('td:nth-child(2) input').value) || 0;
                const numberId = row.querySelector('td:nth-child(3) input').id;
                const weightId = row.querySelector('td:nth-child(4) input').id;
                const cgLocation = parseFloat(row.querySelector('td:nth-child(5)').textContent.trim()) || 0;
                const momentId = row.querySelector('td:nth-child(6) input').id;

                updateWeight(numberId, singleWeight, weightId, momentId, cgLocation);
            }
        });
    }
}

// Navigation and data persistence
function saveAllData() {
    if (window.location.href.includes('STEP1.html')) {
        saveStep1Data();
        saveFuelTableData();
    }
    
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.id) {
            sessionStorage.setItem(input.id, input.value);
        }
    });
}

function loadAllData() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.id) {
            const savedValue = sessionStorage.getItem(input.id);
            if (savedValue !== null) {
                input.value = savedValue;
                if (input.oninput) {
                    input.oninput();
                }
            }
        }
    });

    if (window.location.href.includes('STEP1.html')) {
        loadStep1Data();
        loadFuelTableData();
    } else if (window.location.href.includes('STEP2.html')) {
        document.getElementById('acweight').value = sessionStorage.getItem('ttl-weight') || '';
        document.getElementById('wind').value = sessionStorage.getItem('wind') || '';
        document.getElementById('qat').value = sessionStorage.getItem('temperature') || '';
        document.getElementById('hp').value = sessionStorage.getItem('height') || '';
    } else if (window.location.href.includes('STEP3.html')) {
        document.getElementById('totalweight').value = sessionStorage.getItem('ttl-weight') || '';
        document.getElementById('windSpeed').value = sessionStorage.getItem('wind') || '';
        document.getElementById('temperature').value = sessionStorage.getItem('temperature') || '';
        document.getElementById('height').value = sessionStorage.getItem('height') || '';
        document.getElementById('fuelEntered').value = sessionStorage.getItem('totalFuelWeight') || '';
    }
}

function saveDataAndNavigate(destination) {
    saveAllData();
    window.location.href = destination;
}

// Global navigation functions
window.saveDataAndGoToStep1 = function() { saveDataAndNavigate('STEP1.html'); }
window.saveDataAndGoToStep2 = function() { saveDataAndNavigate('STEP2.html'); }
window.saveDataAndGoToStep3 = function() { saveDataAndNavigate('STEP3.html'); }

// Toggle section function
function toggleSection(sectionId) {
    var content = document.getElementById(sectionId);
    var header = content.previousElementSibling;
    if (content.style.display === "none" || content.style.display === "") {
        content.style.display = "block";
        header.textContent = header.textContent.replace("▼", "▲");
    } else {
        content.style.display = "none";
        header.textContent = header.textContent.replace("▲", "▼");
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    initializeInputListeners();
    if (window.location.href.includes('STEP2.html') && typeof performCalculations === 'function') {
        performCalculations();
    }
});

// Save data before unloading the page
window.addEventListener('beforeunload', function() {
    saveAllData();
});

// Make sure toggleSection is available globally
window.toggleSection = toggleSection;