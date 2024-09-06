// Robust storage functions
function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('localStorage failed, falling back to sessionStorage', error);
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error2) {
            console.error('sessionStorage also failed', error2);
        }
    }
}

function getStorageItem(key) {
    var value;
    try {
        value = JSON.parse(localStorage.getItem(key));
    } catch (error) {
        console.error('localStorage failed, trying sessionStorage', error);
        try {
            value = JSON.parse(sessionStorage.getItem(key));
        } catch (error2) {
            console.error('sessionStorage also failed', error2);
        }
    }
    return value;
}

function saveAllData() {
    console.log('Saving all data...');
    var dataToSave = getAllInputData();

    if (window.location.href.includes('STEP1.html')) {
        saveStep1Data(dataToSave);
        saveFuelTableData();
    } else if (window.location.href.includes('STEP2.html')) {
        saveStep2Data(dataToSave);
    } else if (window.location.href.includes('STEP3.html')) {
        saveStep3Data(dataToSave);
    }

    setStorageItem('allData', dataToSave);
    console.log('Saved data:', dataToSave);
}

function getAllInputData() {
    var data = {};
    var inputs = document.querySelectorAll('input, select');
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.id) {
            data[input.id] = input.value;
        }
    }
    return data;
}

function loadAllData() {
    return new Promise(function(resolve) {
        console.log('Loading all data...');
        var savedData = getStorageItem('allData') || {};
        console.log('Retrieved data:', savedData);

        var inputs = document.querySelectorAll('input, select');
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            if (input.id && savedData[input.id] !== undefined) {
                input.value = savedData[input.id];
                if (input.oninput) {
                    input.oninput();
                }
            }
        }

        if (window.location.href.includes('STEP1.html')) {
            loadStep1Data();
            loadFuelTableData();
        } else if (window.location.href.includes('STEP2.html')) {
            loadStep2Data(savedData);
        } else if (window.location.href.includes('STEP3.html')) {
            loadStep3Data(savedData);
        }

        console.log('Loaded data:', savedData);
        resolve();
    });
}

function saveStep1Data(dataToSave) {
    var step1Data = {
        inputs: dataToSave,
        collapsibleSections: {},
        summaryData: {}
    };

    // Save collapsible section states and content
    var sections = ['Crew', 'OptionalEquipment', 'Passengers', 'StretchersLitters', 'OtherLoad', 'Fuel'];
    for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var sectionElement = document.getElementById(section + 'Section');
        if (sectionElement) {
            step1Data.collapsibleSections[section] = {
                collapsed: sectionElement.style.display === 'none',
                content: section !== 'Fuel' ? sectionElement.innerHTML : ''
            };
        }
    }

    // Save summary data
    var summaryIds = ['zfw', 'ttl-weight', 'cg-summary', 'ttl-mmnt'];
    for (var j = 0; j < summaryIds.length; j++) {
        var id = summaryIds[j];
        var element = document.getElementById(id);
        if (element) {
            step1Data.summaryData[id] = element.value || element.textContent;
        }
    }

    // Save additional elements
    var ft5WeightElement = document.getElementById('5ft_weight');
    step1Data.maxWeight5FTIGE = ft5WeightElement ? ft5WeightElement.textContent : '';
    
    var maxFuelElement = document.getElementById('zeroFuelWeightMax5ftIGE');
    step1Data.maxFuelToUse = maxFuelElement ? maxFuelElement.value : '';
    
    var cgStatusElement = document.getElementById('cg-status');
    step1Data.cgStatus = cgStatusElement ? cgStatusElement.textContent : '';

    // Save total weight and fuel weight
    dataToSave['ttl-weight'] = document.getElementById('ttl-weight').value;
    dataToSave['totalFuelWeight'] = document.getElementById('totalFuelWeight').value;

    setStorageItem('step1SpecificData', step1Data);
    setStorageItem('allData', dataToSave);  // Save all data including the new fields
    console.log('Step 1 data saved:', step1Data);
}

function saveFuelTableData() {
    var fuelData = {};
    var fuelInputs = [
        'internalFuelSingleWeight', 'internalFuelWeight',
        'sponsonSingleWeight', 'sponsonWeight',
        'cabinFuelSingleWeight', 'cabinFuelWeight',
        'forwardLongitudinalSingleWeight', 'forwardLongitudinalWeight',
        'rearLongitudinalSingleWeight', 'rearLongitudinalWeight',
        'rearTransversalSingleWeight', 'rearTransversalWeight',
        'totalFuelWeight', 'totalFuelCG', 'totalFuelMMNT'
    ];

    for (var i = 0; i < fuelInputs.length; i++) {
        var id = fuelInputs[i];
        var inputElement = document.getElementById(id);
        if (inputElement) {
            fuelData[id] = inputElement.value;
        }
    }

    setStorageItem('fuelData', fuelData);
    console.log('Fuel data saved:', fuelData);
}

function loadStep1Data() {
    var savedData = getStorageItem('step1SpecificData') || {};
    console.log('Loading Step 1 data:', savedData);

    // Load collapsible section states and content
    var collapsibleSections = savedData.collapsibleSections || {};
    for (var section in collapsibleSections) {
        if (collapsibleSections.hasOwnProperty(section)) {
            var data = collapsibleSections[section];
            var sectionElement = document.getElementById(section + 'Section');
            if (sectionElement) {
                sectionElement.style.display = data.collapsed ? 'none' : 'block';
                if (section !== 'Fuel') {
                    sectionElement.innerHTML = data.content;
                }
                // Update the toggle button text
                var toggleButton = sectionElement.previousElementSibling;
                if (toggleButton) {
                    toggleButton.textContent = toggleButton.textContent.replace(data.collapsed ? "▲" : "▼", data.collapsed ? "▼" : "▲");
                }
            }
        }
    }

    // Load summary data
    var summaryData = savedData.summaryData || {};
    for (var id in summaryData) {
        if (summaryData.hasOwnProperty(id)) {
            var element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = summaryData[id];
                } else {
                    element.textContent = summaryData[id];
                }
            }
        }
    }

    // Load additional elements
    if (savedData.maxWeight5FTIGE) {
        var ft5WeightElement = document.getElementById('5ft_weight');
        if (ft5WeightElement) ft5WeightElement.textContent = savedData.maxWeight5FTIGE;
    }
    if (savedData.maxFuelToUse) {
        var maxFuelElement = document.getElementById('zeroFuelWeightMax5ftIGE');
        if (maxFuelElement) maxFuelElement.value = savedData.maxFuelToUse;
    }
    if (savedData.cgStatus) {
        var cgStatusElement = document.getElementById('cg-status');
        if (cgStatusElement) cgStatusElement.textContent = savedData.cgStatus;
    }
}

function loadFuelTableData() {
    var fuelData = getStorageItem('fuelData') || {};
    console.log('Loading Fuel Table data:', fuelData);
    var fuelInputs = [
        'internalFuelSingleWeight', 'internalFuelWeight',
        'sponsonSingleWeight', 'sponsonWeight',
        'cabinFuelSingleWeight', 'cabinFuelWeight',
        'forwardLongitudinalSingleWeight', 'forwardLongitudinalWeight',
        'rearLongitudinalSingleWeight', 'rearLongitudinalWeight',
        'rearTransversalSingleWeight', 'rearTransversalWeight',
        'totalFuelWeight', 'totalFuelCG', 'totalFuelMMNT'
    ];

    for (var i = 0; i < fuelInputs.length; i++) {
        var id = fuelInputs[i];
        var inputElement = document.getElementById(id);
        if (inputElement && fuelData[id] !== undefined) {
            inputElement.value = fuelData[id];
            // Dispatch input event to trigger calculations
            var event = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    }
}
function saveStep2Data(dataToSave) {
    var step2Data = {
        inputs: dataToSave,
        calculatedValues: {}
    };

    // Save calculated values
    var calculatedFields = ['heightloose', 'weighindex', 'Wheight_index_6', 'ceilingweight_3', 'ceilinghp_3', 'enginhoge', 'enginhoge_weight', 'enginIGE', 'enginIGE_weight', 'rc'];
    for (var i = 0; i < calculatedFields.length; i++) {
        var field = calculatedFields[i];
        var element = document.getElementById(field);
        if (element) {
            step2Data.calculatedValues[field] = element.value || element.textContent;
        }
    }

    // Retrieve and store fuel data from Step 1 (if available)
    var fuelData = getStorageItem('fuelData') || {};
    step2Data.fuelData = fuelData;  // Ensure fuel data is passed through

    setStorageItem('step2SpecificData', step2Data);
}

function saveStep2Data(dataToSave) {
    var step2Data = {
        inputs: dataToSave,
        calculatedValues: {}
    };

    // Save calculated values
    var calculatedFields = [
        'heightloose', 'weighindex', 'Wheight_index_6', 
        'ceilingweight_3', 'ceilinghp_3', 
        'enginhoge', 'enginhoge_weight', 
        'enginIGE', 'enginIGE_weight', 
        'rc'
    ];
    
    for (var i = 0; i < calculatedFields.length; i++) {
        var field = calculatedFields[i];
        var element = document.getElementById(field);
        if (element) {
            step2Data.calculatedValues[field] = element.value || element.textContent;
        }
    }

    setStorageItem('step2SpecificData', step2Data);
    console.log('Step 2 data saved:', step2Data);
}

function loadStep2Data(savedData) {
    console.log('Loading Step 2 data:', savedData);
    var step2Data = getStorageItem('step2SpecificData') || {};
    
    // Load input fields
    var step2Fields = ['#acweight', '#wind', '#qat', '#hp'];
    var step2SourceFields = ['ttl-weight', 'wind', 'temperature', 'height'];
    
    for (var i = 0; i < step2Fields.length; i++) {
        var element = document.getElementById(step2Fields[i]);
        if (element) {
            element.value = (step2Data.inputs && step2Data.inputs[step2SourceFields[i]]) || 
                            savedData[step2SourceFields[i]] || 
                            '';
        }
    }

    // Load calculated values
    if (step2Data.calculatedValues) {
        for (var field in step2Data.calculatedValues) {
            if (step2Data.calculatedValues.hasOwnProperty(field)) {
                var element = document.getElementById(field);
                if (element) {
                    element.value = step2Data.calculatedValues[field];
                }
            }
        }
    }

    // Trigger calculations to update any dependent fields
    if (typeof performCalculations === 'function') {
        performCalculations();
    }
}

function saveStep3Data(dataToSave) {
    setStorageItem('step3SpecificData', dataToSave);
    console.log('Step 3 data saved:', dataToSave);
}

function loadStep3Data(savedData) {
    var step1Data = getStorageItem('step1SpecificData') || {};
    var step2Data = getStorageItem('step2SpecificData') || {};
    var step3Data = getStorageItem('step3SpecificData') || {};
    var fuelData = step2Data.fuelData || getStorageItem('fuelData') || {};

    console.log('Loading Step 3 data:', { savedData: savedData, step1Data: step1Data, step2Data: step2Data, step3Data: step3Data, fuelData: fuelData });

    var step3Fields = ['totalweight', 'windSpeed', 'temperature', 'height', 'fuelEntered', 'speed'];
    var sourceFields = ['ttl-weight', 'wind', 'temperature', 'height', 'totalFuelWeight', 'speed'];

    for (var i = 0; i < step3Fields.length; i++) {
        var element = document.getElementById(step3Fields[i]);
        if (element) {
            var value = step3Data[step3Fields[i]] || 
                        (step2Data.inputs ? step2Data.inputs[sourceFields[i]] : '') || 
                        savedData[sourceFields[i]] || 
                        (step1Data.inputs ? step1Data.inputs[sourceFields[i]] : '') || '';

            if (step3Fields[i] === 'fuelEntered') {
                value = fuelData.totalFuelWeight || value;
            }

            element.value = value;
        }
    }

    var fuelConsumptionElement = document.getElementById('fuelConsumption');
    if (fuelConsumptionElement) {
        fuelConsumptionElement.value = step3Data.fuelConsumption || savedData.fuelConsumption || '';
    }
}


function saveDataAndNavigate(destination) {
    console.log('Navigating to ' + destination);
    saveAllData();
    window.location.href = destination;
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
    saveStep2Data(getAllInputData());
    saveAllData();
    window.location.href = 'STEP3.html';
}

function clearAllData() {
    console.log('Clearing all stored data...');
    localStorage.clear();
    sessionStorage.clear();
    console.log('All data cleared');
}

function newCalculation() {
    clearAllData();

    var inputs = document.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"])');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }

    var selects = document.querySelectorAll('select');
    for (var j = 0; j < selects.length; j++) {
        selects[j].selectedIndex = 0;
    }

    var resultElements = document.querySelectorAll('.result-display, .calculation-result');
    for (var k = 0; k < resultElements.length; k++) {
        resultElements[k].textContent = '';
    }

    var elementsToReset = {
        '#5ft_weight': '',
        '#maxWeightDisplay': '',
        '#emptyWeight': '13460',
        '#emptyCG': '188.5',
        '#emptyMoment': '2537210.00',
        '#totalWeight': '13460',
        '#totalCG': '188.5',
        '#totalMoment': '2537210.00'
    };

    for (var selector in elementsToReset) {
        if (elementsToReset.hasOwnProperty(selector)) {
            var element = document.querySelector(selector);
            if (element) element.textContent = elementsToReset[selector];
        }
    }

    var canvases = document.querySelectorAll('canvas');
    for (var l = 0; l < canvases.length; l++) {
        var ctx = canvases[l].getContext('2d');
        ctx.clearRect(0, 0, canvases[l].width, canvases[l].height);
    }

    var toasts = document.querySelectorAll('.toast');
    for (var m = 0; m < toasts.length; m++) {
        toasts[m].remove();
    }

    var dynamicLists = document.querySelectorAll('.dynamic-list');
    for (var n = 0; n < dynamicLists.length; n++) {
        dynamicLists[n].innerHTML = '';
    }

    if (typeof updateTotalWeight === 'function') {
        updateTotalWeight();
    }

    console.log('New calculation started. All fields cleared across all steps.');

    setTimeout(function() {
        window.location.reload(true);
    }, 100);
}

function updateWeight(numberId, singleWeight, weightId, momentId, cgLocation) {
    var numberElement = document.getElementById(numberId);
    var number = numberElement ? (parseFloat(numberElement.value) || 1) : 1;
    var totalWeight = number * singleWeight;
    var moment = totalWeight * cgLocation;

    var weightElement = document.getElementById(weightId);
    var momentElement = document.getElementById(momentId);
    if (weightElement) weightElement.value = totalWeight.toFixed(2);
    if (momentElement) momentElement.value = moment ? moment.toFixed(2) : 'NaN';

    calculateTotalFuel();
}

function calculateTotalFuel() {
    var weights = [
        'internalFuelWeight', 'sponsonWeight', 'cabinFuelWeight',
        'forwardLongitudinalWeight', 'rearLongitudinalWeight', 'rearTransversalWeight'
    ];

    var moments = [
        'internalFuelMMNT', 'sponsonMMNT', 'cabinFuelMMNT',
        'forwardLongitudinalMMNT', 'rearLongitudinalMMNT', 'rearTransversalMMNT'
    ];

    var totalWeight = 0;
    var totalMoment = 0;

    for (var i = 0; i < weights.length; i++) {
        var weightElement = document.getElementById(weights[i]);
        var weight = weightElement ? (parseFloat(weightElement.value) || 0) : 0;
        totalWeight += weight;
    }

    for (var j = 0; j < moments.length; j++) {
        var momentElement = document.getElementById(moments[j]);
        var moment = momentElement ? (parseFloat(momentElement.value) || 0) : 0;
        totalMoment += moment;
    }

    var totalFuelWeightElement = document.getElementById('totalFuelWeight');
    var totalFuelMMNTElement = document.getElementById('totalFuelMMNT');
    var totalFuelCGElement = document.getElementById('totalFuelCG');

    if (totalFuelWeightElement) totalFuelWeightElement.value = totalWeight.toFixed(2);
    if (totalFuelMMNTElement) totalFuelMMNTElement.value = totalMoment.toFixed(2);
    if (totalFuelCGElement) totalFuelCGElement.value = totalWeight ? (totalMoment / totalWeight).toFixed(2) : '0.00';
}

function initializeInputListeners() {
    var fuelTable = document.querySelector('#fuelSection table');
    if (fuelTable) {
        fuelTable.addEventListener('input', function(event) {
            if (event.target.tagName === 'INPUT' && event.target.closest('td:nth-child(2)')) {
                var row = event.target.closest('tr');
                var singleWeightInput = row.querySelector('td:nth-child(2) input');
                var numberInput = row.querySelector('td:nth-child(3) input');
                var cgLocationElement = row.querySelector('td:nth-child(5)');
                var weightInput = row.querySelector('td:nth-child(4) input');
                var momentInput = row.querySelector('td:nth-child(6) input');

                var singleWeight = singleWeightInput ? (parseFloat(singleWeightInput.value) || 0) : 0;
                var number = numberInput ? (parseFloat(numberInput.value) || 1) : 1;
                var cgLocation = cgLocationElement ? (parseFloat(cgLocationElement.textContent.trim()) || 0) : 0;

                var weightId = weightInput ? weightInput.id : '';
                var momentId = momentInput ? momentInput.id : '';

                updateWeight(numberInput ? numberInput.id : '', singleWeight, weightId, momentId, cgLocation);
            }
        });
    }
}

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

function updateStep3Fields() {
    var speedElement = document.getElementById('speed');
    var speedFuelElement = document.getElementById('speedFuel');
    var fuelConsumptionElement = document.getElementById('fuelConsumption');
    var fuelCPerMinuteElement = document.getElementById('fuelCPerMinute');

    if (speedElement && speedFuelElement) {
        speedFuelElement.value = speedElement.value;
    }

    if (fuelConsumptionElement && fuelCPerMinuteElement) {
        var fuelPerHour = parseFloat(fuelConsumptionElement.value) || 0;
        fuelCPerMinuteElement.value = (fuelPerHour / 60).toFixed(2);
    }
}

function performCalculations() {
    if (typeof count_6 === 'function') count_6();
    if (typeof count === 'function') count(1);
    if (typeof count_3 === 'function') count_3();
    if (typeof count_4 === 'function') count_4();
    if (typeof count_5 === 'function') count_5();
    if (typeof count_7 === 'function') count_7();
    if (typeof showchart === 'function') showchart(0);

    // After calculations, save the results
    saveStep2Data(getAllInputData());
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadAllData().then(function() {
        console.log('Data loaded successfully');
        if (window.location.href.includes('STEP2.html')) {
            loadStep2Data(getStorageItem('allData') || {});
            performCalculations();
        }
        if (window.location.href.includes('STEP1.html')) {
            initializeInputListeners();
        }
        if (window.location.href.includes('STEP3.html')) {
            updateStep3Fields();
        }
    }).catch(function(error) {
        console.error('Error loading data:', error);
    });

    var newCalculationBtn = document.getElementById('newCalculationBtn');
    if (newCalculationBtn) {
        newCalculationBtn.addEventListener('click', newCalculation);
    }
});

window.addEventListener('beforeunload', saveAllData);

// Assign functions to window object for global access
window.saveDataAndGoToStep1 = saveDataAndGoToStep1;
window.saveDataAndGoToStep2 = saveDataAndGoToStep2;
window.saveDataAndGoToStep3 = saveDataAndGoToStep3;
window.clearAllData = clearAllData;
window.newCalculation = newCalculation;
window.toggleSection = toggleSection;