import { foraoe_8_FuelConsumption } from './datafolder/FuelConsumption.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('fuelChart');
  const ctx = canvas.getContext('2d');
  const backgroundImage = new Image();
  backgroundImage.src = 'eight.jpg'; // Ensure this path is correct

  // Set the desired canvas size
  const desiredWidth = 600; // Adjust as needed
  const desiredHeight = 800; // Adjust as needed
  canvas.width = desiredWidth;
  canvas.height = desiredHeight;

  backgroundImage.onload = () => {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  };

  // Initialize showerrornum
  let showerrornum = 0;

  // Function to calculate fuel consumption
  window.fuelconsumption = function() {
    const speed = parseFloat(document.getElementById('speed').value);
    const totalWeight = parseFloat(document.getElementById('totalweight').value);
    const fuelConsumptionInput = document.getElementById('fuelconsumption');

    if (!(speed >= 0 && speed <= 150 && totalWeight >= 15000 && totalWeight <= 24700)) {
      fuelConsumptionInput.value = "";
      showToast("I can't calculate fuel consumption. Input data must be correct.", "danger", 5000, showerrornum);
      showerrornum += 1;
      return false;
    }

    const fuelData = interpolateData(speed, totalWeight);
    if (fuelData === null) {
      showToast("I can't interpolate with your input data in this FuelConsumption Chart", "info", 5000, showerrornum);
      showerrornum += 1;
      fuelConsumptionInput.value = "";
      return;
    }

    fuelConsumptionInput.value = fuelData.toFixed(2);

    // Display the canvas
    canvas.style.display = 'block';
    console.log('Canvas display set to block');

    // Original chart dimensions
    const originalWidth = 1241;
    const originalHeight = 1755;

    // Scaling factors based on new dimensions
    const widthRatio = desiredWidth / originalWidth;
    const heightRatio = desiredHeight / originalHeight;

    // Adjusted margins
    const margin = {
      top: 100 * heightRatio,
      right: 220 * widthRatio,
      bottom: 400 * heightRatio,
      left: 120 * widthRatio
    };

    // Adjusted coordinates
    const xMin = 0, xMax = 150;  // Speed ranges from 0 to 150
    const yMin = 780, yMax = 1300;  // Fuel consumption ranges from 780 to 1300

    const originalXScale = (855 - 142) / (xMax - xMin);
    const originalYScale = (1213 - 620) / (yMax - yMin);

    const xScale = originalXScale * widthRatio;
    const yScale = originalYScale * heightRatio;

    const xOffset = 142 * widthRatio;
    const yOffset = 1213 * heightRatio;

    const xPos = xOffset + speed * xScale;
    const yPos = yOffset - (fuelData - yMin) * yScale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Draw the red dot
    ctx.beginPath();
    ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();

    // Draw the text
    ctx.font = '16px Arial';
    ctx.fillText(`Fuel Consumption: ${fuelData.toFixed(2)} lb/h at ${speed} kt and ${totalWeight} lbs`, 10, 30);

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
  };

  function interpolateData(inputSpeed, inputWeight) {
    const nearestWeight = foraoe_8_FuelConsumption.reduce((prev, curr) =>
      Math.abs(curr.index - inputWeight) < Math.abs(prev.index - inputWeight) ? curr : prev
    );

    const { data } = nearestWeight;
    for (let i = 0; i < data.length - 1; i++) {
      if (data[i].x <= inputSpeed && data[i + 1].x >= inputSpeed) {
        const x1 = data[i].x;
        const y1 = data[i].y;
        const x2 = data[i + 1].x;
        const y2 = data[i + 1].y;
        return y1 + ((y2 - y1) * (inputSpeed - x1)) / (x2 - x1);
      }
    }
    return null;
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
