function newCalculation() {
    // Clear all localStorage data
    localStorage.clear();

    // Reset all input fields across all steps
    const inputs = document.querySelectorAll('input:not([type="button"]):not([type="submit"]):not([type="reset"])');
    inputs.forEach(input => {
        input.value = '';
    });

    // Reset all select elements to their first option
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.selectedIndex = 0;
    });

    // Clear any result displays
    const resultElements = document.querySelectorAll('.result-display, .calculation-result');
    resultElements.forEach(element => {
        element.textContent = '';
    });

    // Clear the 5ft_weight div
    const weightElement = document.querySelector('#5ft_weight');
    if (weightElement) {
        weightElement.textContent = '';  // Clear the content of the 5ft_weight div
    }

    // Clear the maximum weight display
    const maxWeightElement = document.querySelector('#maxWeightDisplay');
    if (maxWeightElement) {
        maxWeightElement.textContent = '';  // Clear the maximum weight element
    }

    // Reset specific elements in Step 1
    if (document.querySelector('#emptyWeight')) {
        document.querySelector('#emptyWeight').textContent = '13460';
        document.querySelector('#emptyCG').textContent = '188.5';
        document.querySelector('#emptyMoment').textContent = '2537210.00';
        document.querySelector('#totalWeight').textContent = '13460';
        document.querySelector('#totalCG').textContent = '188.5';
        document.querySelector('#totalMoment').textContent = '2537210.00';
    }

    // Clear and reset canvases (for Step 2)
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Remove any error messages or notifications
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => toast.remove());

    // Reset any dynamic content (like added equipment or passengers)
    const dynamicLists = document.querySelectorAll('.dynamic-list');
    dynamicLists.forEach(list => {
        list.innerHTML = '';
    });

    // Reset specific fields for Step 2
    const step2Fields = ['#heightloose', '#weighindex', '#Wheight_index_6', '#ceilingweight_3', '#ceilinghp_3', '#enginhoge', '#enginhoge_weight', '#enginIGE', '#enginIGE_weight', '#rc'];
    step2Fields.forEach(field => {
        const element = document.querySelector(field);
        if (element) element.value = '';
    });

    // Reset specific fields for Step 3 (add more as needed)
    const step3Fields = ['#totalweight', '#windSpeed', '#temperature', '#height', '#fuelEntered'];
    step3Fields.forEach(field => {
        const element = document.querySelector(field);
        if (element) element.value = '';
    });

    // Recalculate or reinitialize any necessary values
    if (typeof updateTotalWeight === 'function') {
        updateTotalWeight();
    }

    console.log('New calculation started. All fields cleared across all steps.');

    // Force page reload after a brief timeout
    setTimeout(function() {
        window.location.reload(true);  // 'true' forces the browser to reload from the server instead of the cache
    }, 100);  // Small delay to ensure everything gets reset before reload
}

// Add event listener to the New Calculation button
document.addEventListener('DOMContentLoaded', function() {
    const newCalculationBtn = document.getElementById('newCalculationBtn');
    if (newCalculationBtn) {
        newCalculationBtn.addEventListener('click', newCalculation);
    }
});
