import { foraoe_8_FuelConsumption_15C } from './datafolder/0ft_15C.js';
import { foraoe_8_FuelConsumption_30C } from './datafolder/0ft_30C.js';
import { foraoe_8_FuelConsumption_6000ft_15C } from './datafolder/6000ft_15C.js';
import { foraoe_8_FuelConsumption_6000ft_30C } from './datafolder/6000ft_30C.js';
// Import other charts as needed

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fuelChart');
    const ctx = canvas.getContext('2d');
    const backgroundImage15C = new Image();
    const backgroundImage30C = new Image();
    const backgroundImage6000ft15C = new Image();
    const backgroundImage6000ft30C = new Image();
    backgroundImage15C.src = '0ft_15C.jpg';
    backgroundImage30C.src = '0ft_30C.jpg';
    backgroundImage6000ft15C.src = '6000ft_15C.jpg';
    backgroundImage6000ft30C.src = '6000ft_30C.jpg';
    // Add other images as needed

    // Set the desired canvas size
    const desiredWidth = 1241;
    const desiredHeight = 1755;
    canvas.width = desiredWidth;
    canvas.height = desiredHeight;

    let backgroundImageLoaded = false;

    backgroundImage15C.onload = () => {
        backgroundImageLoaded = true;
    };

    backgroundImage30C.onload = () => {
        backgroundImageLoaded = true;
    };

    backgroundImage6000ft15C.onload = () => {
        backgroundImageLoaded = true;
    };

    backgroundImage6000ft30C.onload = () => {
        backgroundImageLoaded = true;
    };

    // Initialize showerrornum
    let showerrornum = 0;

    // Function to calculate fuel consumption
    window.fuelconsumption = async function() {
        const height = parseFloat(document.getElementById('height').value);
        const temp = parseFloat(document.getElementById('temperature').value);
        const speed = parseFloat(document.getElementById('speed').value);
        const totalWeight = parseFloat(document.getElementById('totalweight').value);
        const fuelConsumptionInput = document.getElementById('fuelconsumption');

        if (!(speed >= 0 && speed <= 150 && totalWeight >= 15000 && totalWeight <= 24700)) {
            fuelConsumptionInput.value = "";
            showToast("I can't calculate fuel consumption. Input data must be correct.", "danger", 5000, showerrornum);
            showerrornum += 1;
            return false;
        }

        if (!backgroundImageLoaded) {
            showToast("Background images are still loading, please wait.", "info", 5000, showerrornum);
            showerrornum += 1;
            return;
        }

        const { fuelData, backgroundImage, originalWidth, originalHeight, margin } = await interpolateData(height, temp, speed, totalWeight);
        if (fuelData === null) {
            showToast("I can't interpolate with your input data in this FuelConsumption Chart", "info", 5000, showerrornum);
            showerrornum += 1;
            fuelConsumptionInput.value = "";
            return;
        }

        // Calculate fuel consumption in lbs/h and lbs/m
        const fuelConsumptionPerHour = fuelData.toFixed(2);
        const fuelConsumptionPerMinute = (fuelData / 60).toFixed(2);

        // Display the result in the input box
        fuelConsumptionInput.value = `${fuelConsumptionPerHour} lbs/h, ${fuelConsumptionPerMinute} lbs/m`;

        // Display the canvas
        canvas.style.display = 'block';
        console.log('Canvas display set to block');

        drawChart(backgroundImage, originalWidth, originalHeight, speed, fuelData, fuelConsumptionPerHour, fuelConsumptionPerMinute, totalWeight, margin);
    };

    async function interpolateData(height, temp, inputSpeed, inputWeight) {
        let chartData, backgroundImage, originalWidth, originalHeight, margin;

        if (height >= 0 && height <= 3000) {
            if (temp < 30) {
                chartData = foraoe_8_FuelConsumption_15C;
                backgroundImage = backgroundImage15C;
                originalWidth = 1241;
                originalHeight = 1755;
                margin = {
                    top: 100 * (desiredHeight / originalHeight),
                    right: 220 * (desiredWidth / originalWidth),
                    bottom: 400 * (desiredHeight / originalHeight),
                    left: 120 * (desiredWidth / originalWidth)
                };
            } else {
                chartData = foraoe_8_FuelConsumption_30C;
                backgroundImage = backgroundImage30C;
                originalWidth = 528; // replace with actual width of the second chart
                originalHeight = 745; // replace with actual height of the second chart
                margin = {
                    top: 260 * (desiredHeight / originalHeight),
                    right: 35 * (desiredWidth / originalWidth),
                    bottom: 120 * (desiredHeight / originalHeight),
                    left: 35 * (desiredWidth / originalWidth)
                };
            }
        } else if (height > 3000 && height <= 9000) {
            if (temp < 30) {
                chartData = foraoe_8_FuelConsumption_6000ft_15C;
                backgroundImage = backgroundImage6000ft15C;
                originalWidth = 1241; // replace with actual width of the third chart
                originalHeight = 1755; // replace with actual height of the third chart
                margin = {
                    top: 0 * (desiredHeight / originalHeight),
                    right: 0 * (desiredWidth / originalWidth),
                    bottom: 0 * (desiredHeight / originalHeight),
                    left: 35 * (desiredWidth / originalWidth)
                };
            } else {
                chartData = foraoe_8_FuelConsumption_6000ft_30C;
                backgroundImage = backgroundImage6000ft30C;
                originalWidth = 1241; // replace with actual width of the fourth chart
                originalHeight = 1755; // replace with actual height of the fourth chart
                margin = {
                    top: 0 * (desiredHeight / originalHeight),
                    right: 0 * (desiredWidth / originalWidth),
                    bottom: 0 * (desiredHeight / originalHeight),
                    left: 0 * (desiredWidth / originalWidth)
                };
            }
        }

        const nearestWeight = chartData.reduce((prev, curr) =>
            Math.abs(curr.index - inputWeight) < Math.abs(prev.index - inputWeight) ? curr : prev
        );

        const { data } = nearestWeight;
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i].x <= inputSpeed && data[i + 1].x >= inputSpeed) {
                const x1 = data[i].x;
                const y1 = data[i].y;
                const x2 = data[i + 1].x;
                const y2 = data[i + 1].y;
                const interpolatedY = y1 + ((y2 - y1) * (inputSpeed - x1)) / (x2 - x1);
                return { fuelData: interpolatedY, backgroundImage, originalWidth, originalHeight, margin };
            }
        }
        return { fuelData: null, backgroundImage: null, originalWidth: null, originalHeight: null, margin: null };
    }

    function drawChart(backgroundImage, originalWidth, originalHeight, speed, fuelData, fuelConsumptionPerHour, fuelConsumptionPerMinute, totalWeight, margin) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // Scaling factors based on new dimensions
        const widthRatio = canvas.width / originalWidth;
        const heightRatio = canvas.height / originalHeight;

        let xMin, xMax, yMin, yMax;
        let originalXScale, originalYScale, xScale, yScale, xOffset, yOffset, xPos, yPos;

        // Adjusted coordinates for the first chart
        if (backgroundImage === backgroundImage15C) {
            xMin = 0;
            xMax = 150;  // Speed ranges from 0 to 150
            yMin = 780;
            yMax = 1300;  // Fuel consumption ranges from 780 to 1300 for the first chart

            originalXScale = (855 - 142) / (xMax - xMin);
            originalYScale = (1213 - 620) / (yMax - yMin);

            xScale = originalXScale * widthRatio;
            yScale = originalYScale * heightRatio;

            xOffset = 142 * widthRatio;
            yOffset = 1213 * heightRatio;

            xPos = xOffset + speed * xScale;
            yPos = yOffset - (fuelData - yMin) * yScale;
        } else if (backgroundImage === backgroundImage30C) {
            // Adjusted coordinates for the second chart
            xMin = 0;
            xMax = 150;  // Speed ranges from 0 to 150
            yMin = 760;
            yMax = 1300;  // Fuel consumption ranges from 760 to 1300 for the second chart

            originalXScale = (405 - 38) / (xMax - xMin);
            originalYScale = (584 - 268) / (yMax - yMin);

            xScale = originalXScale * widthRatio;
            yScale = originalYScale * heightRatio;

            xOffset = 38 * widthRatio;
            yOffset = 584 * heightRatio;

            xPos = xOffset + speed * xScale;
            yPos = yOffset - (fuelData - yMin) * yScale;
        } else if (backgroundImage === backgroundImage6000ft15C) {
            // Adjusted coordinates for the third chart
            xMin = 0;
            xMax = 150;  // Speed ranges from 0 to 150
            yMin = 680;
            yMax = 1440;  // Fuel consumption ranges from 780 to 1300 for the third chart

            originalXScale = (910 - 194) / (xMax - xMin);
            originalYScale = (1242 - 454) / (yMax - yMin);

            xScale = originalXScale * widthRatio;
            yScale = originalYScale * heightRatio;

            xOffset = 194 * widthRatio;
            yOffset = 1242 * heightRatio;

            xPos = xOffset + speed * xScale;
            yPos = yOffset - (fuelData - yMin) * yScale;
        } else if (backgroundImage === backgroundImage6000ft30C) {
            // Adjusted coordinates for the fourth chart
            xMin = 0;
            xMax = 150;  // Speed ranges from 0 to 150
            yMin = 680;
            yMax = 1340;  // Fuel consumption ranges from 760 to 1300 for the fourth chart

            originalXScale = (850 - 141) / (xMax - xMin);
            originalYScale = (1250 - 537) / (yMax - yMin);

            xScale = originalXScale * widthRatio;
            yScale = originalYScale * heightRatio;

            xOffset = 141 * widthRatio;
            yOffset = 1250 * heightRatio;

            xPos = xOffset + speed * xScale;
            yPos = yOffset - (fuelData - yMin) * yScale;
        }

        // Draw the red dot
        ctx.beginPath();
        ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();

        // Draw the text
        ctx.font = '16px Arial';
        ctx.fillText(`Fuel Consumption: ${fuelConsumptionPerHour} lbs/h, ${fuelConsumptionPerMinute} lbs/m at ${speed} kt and ${totalWeight} lbs`, 10, 30);

        // Draw the vertical line
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos, canvas.height - margin.bottom);
        ctx.stroke();

        // Draw the horizontal line
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(canvas.width - margin.right, yPos);
        ctx.stroke();
    }

    // Function to show toast notifications
    function showToast(message = "Sample Message", toastType = "info", duration = 5000, fortop = 0) {
        let box = document.createElement("div");
        box.classList.add("toast", `toast-${toastType}`);
        box.style.top = `${20 + (fortop * 65)}px`;
        box.innerHTML = `
            <div class="toast-content-wrapper">
                <div class="toast-message">${message}</div>
                <div class="toast-progress"></div>
            </div>`;
        box.querySelector(".toast-progress").style.animationDuration = `${duration / 1000}s`;
        document.body.appendChild(box);
    }
});
