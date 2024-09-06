function saveStep1Data() {
    const step1Data = {
        inputs: {},
        collapsibleSections: {},
        summaryData: {}
    };

    // Save all input fields except those in the fuel table
    document.querySelectorAll('input, select').forEach(input => {
        if (input.id && !input.closest('#fuelSection')) {
            step1Data.inputs[input.id] = input.value;
        }
    });

    // Save collapsible section states and content
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

    // Save summary data
    ['zfw', 'ttl-weight', 'cg-summary', 'ttl-mmnt'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            step1Data.summaryData[id] = element.value || element.textContent;
        }
    });

    // Save additional elements
    step1Data.maxWeight5FTIGE = document.getElementById('5ft_weight') ? document.getElementById('5ft_weight').textContent : '';
    step1Data.maxFuelToUse = document.getElementById('zeroFuelWeightMax5ftIGE') ? document.getElementById('zeroFuelWeightMax5ftIGE').value : '';
    step1Data.cgStatus = document.getElementById('cg-status') ? document.getElementById('cg-status').textContent : '';

    localStorage.setItem('step1SpecificData', JSON.stringify(step1Data));
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

    localStorage.setItem('fuelData', JSON.stringify(fuelData));
    console.log('Fuel data saved:', fuelData);
}

function loadStep1Data() {
    const savedData = JSON.parse(localStorage.getItem('step1SpecificData') || '{}');

    // Load all input fields except those in the fuel table
    Object.entries(savedData.inputs || {}).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && !element.closest('#fuelSection')) {
            element.value = value;
        }
    });

    // Load collapsible section states and content
    Object.entries(savedData.collapsibleSections || {}).forEach(([section, data]) => {
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            sectionElement.style.display = data.collapsed ? 'none' : 'block';
            if (section !== 'Fuel') {
                sectionElement.innerHTML = data.content;
            }
            // Update the toggle button text
            const toggleButton = sectionElement.previousElementSibling;
            if (toggleButton) {
                toggleButton.textContent = toggleButton.textContent.replace(data.collapsed ? "▲" : "▼", data.collapsed ? "▼" : "▲");
            }
        }
    });

    // Load summary data
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

    // Load additional elements
    if (savedData.maxWeight5FTIGE) document.getElementById('5ft_weight').textContent = savedData.maxWeight5FTIGE;
    if (savedData.maxFuelToUse) document.getElementById('zeroFuelWeightMax5ftIGE').value = savedData.maxFuelToUse;
    if (savedData.cgStatus) document.getElementById('cg-status').textContent = savedData.cgStatus;
}

function loadFuelTableData() {
    const fuelData = JSON.parse(localStorage.getItem('fuelData') || '{}');
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
            // Dispatch input event to trigger calculations
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}

function updateWeight(numberId, singleWeight, weightId, momentId, cgLocation) {
    const number = parseFloat(document.getElementById(numberId)?.value) || 1;
    const totalWeight = number * singleWeight;
    const moment = totalWeight * cgLocation;

    // Update weight and moment fields
    document.getElementById(weightId).value = totalWeight.toFixed(2);
    document.getElementById(momentId).value = moment ? moment.toFixed(2) : 'NaN';

    // Recalculate the total fuel weight and moment
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

function initializeInputListeners() {
    const fuelTable = document.querySelector('#fuelSection table');
    if (fuelTable) {
        fuelTable.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' && event.target.closest('td:nth-child(2)')) {
                const row = event.target.closest('tr');
                const fuelType = row.querySelector('th')?.textContent.trim();
                const singleWeight = parseFloat(row.querySelector('td:nth-child(2) input').value) || 0;
                const number = parseFloat(row.querySelector('td:nth-child(3) input').value) || 1;
                const cgLocation = parseFloat(row.querySelector('td:nth-child(5)').textContent.trim()) || 0;

                const weightId = row.querySelector('td:nth-child(4) input').id;
                const momentId = row.querySelector('td:nth-child(6) input').id;

                updateWeight(row.querySelector('td:nth-child(3) input').id, singleWeight, weightId, momentId, cgLocation);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.href.includes('STEP1.html')) {
        console.log('DOMContentLoaded: Loading all data...');
        loadStep1Data();
        loadFuelTableData();
        initializeInputListeners();
    }
});

function saveStep1AndNavigate(destination) {
    saveStep1Data();
    saveFuelTableData(); // Save fuel table data before navigating
    window.location.href = destination;
}

window.addEventListener('beforeunload', () => {
    saveStep1Data();
    saveFuelTableData(); // Save fuel table data before unloading
});

window.addEventListener('pageshow', function () {
    if (window.location.href.includes('STEP1.html')) {
        console.log('pageshow: Loading all data...');
        loadStep1Data();
        loadFuelTableData();
    }
});

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
