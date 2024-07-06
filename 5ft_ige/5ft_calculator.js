function findWeight(temperature, height) {
    let weights = chartData.map(tempData => ({
        temperature: tempData.temperature,
        weight: findWeightForHeight(tempData, height)
    }));

    weights.sort((a, b) => a.temperature - b.temperature);

    let lowerTemp = weights[0];
    let upperTemp = weights[weights.length - 1];
    for (let i = 0; i < weights.length - 1; i++) {
        if (weights[i].temperature <= temperature && weights[i + 1].temperature > temperature) {
            lowerTemp = weights[i];
            upperTemp = weights[i + 1];
            break;
        }
    }

    const tempRatio = (temperature - lowerTemp.temperature) / (upperTemp.temperature - lowerTemp.temperature);
    const weight = lowerTemp.weight + tempRatio * (upperTemp.weight - lowerTemp.weight);

    return Math.min(weight, 21495);
}

function findWeightForHeight(tempData, height) {
    let lowerPoint = tempData.points[tempData.points.length - 1];
    let upperPoint = tempData.points[0];

    for (let i = 0; i < tempData.points.length - 1; i++) {
        if (tempData.points[i].y >= height && tempData.points[i + 1].y < height) {
            upperPoint = tempData.points[i];
            lowerPoint = tempData.points[i + 1];
            break;
        }
    }

    const heightRatio = (height - lowerPoint.y) / (upperPoint.y - lowerPoint.y);
    return lowerPoint.x + heightRatio * (upperPoint.x - lowerPoint.x);
}

function calculateWeight() {
    console.log("Calculate Weight function called");
    const temperature = parseFloat(document.getElementById('temperature').value);
    const height = parseFloat(document.getElementById('height').value);
    console.log("Temperature:", temperature, "Height:", height);
    const resultDiv = document.getElementById('5ft_weight');

    if (isNaN(temperature) || isNaN(height)) {
        resultDiv.textContent = "Please enter valid numbers for temperature and height.";
        return;
    }

    if (temperature < -50 || temperature > 50) {
        resultDiv.textContent = "Temperature must be between -50°C and 50°C.";
        return;
    }

    if (height < 0 || height > 20000) {
        resultDiv.textContent = "Height must be between 0 and 20,000 ft.";
        return;
    }

    console.log("Calculating weight...");
    const weight = findWeight(temperature, height);
    console.log("Calculated weight:", weight);

    if (weight >= 21495) {
        resultDiv.textContent = `Maximum weight: 21495.00 lbs (Limit reached)`;
    } else {
        resultDiv.textContent = `Maximum weight: ${weight.toFixed(2)} lbs`;
    }
}

// Event listener for the calculate button
document.addEventListener('DOMContentLoaded', function() {
    const calculateButton = document.getElementById('calculateButton');
    if (calculateButton) {
        calculateButton.addEventListener('click', calculateWeight);
    }
});











