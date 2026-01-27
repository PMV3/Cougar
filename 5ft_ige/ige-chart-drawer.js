console.log("5ft IGE Chart drawer script loaded");

class IGEChartDrawer {
    constructor(canvasId, chartImageId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartImage = document.getElementById(chartImageId);

        this.imageLoaded = false;

        this.chartImage.onload = () => {
            this.imageLoaded = true;
            this.initialize();
        };

        if (this.chartImage.complete) {
            this.imageLoaded = true;
            this.initialize();
        }
    }

    initialize() {
        if (this.imageLoaded) {
            this.canvas.width = this.chartImage.width;
            this.canvas.height = this.chartImage.height;
            
            // Get the actual displayed size of the image
            const rect = this.chartImage.getBoundingClientRect();
            this.displayWidth = rect.width;
            this.displayHeight = rect.height;
            
            // Scale factor between natural size and display size
            this.scaleX = this.chartImage.width / this.displayWidth;
            this.scaleY = this.chartImage.height / this.displayHeight;
            
            console.log("IGE Canvas sized to:", this.canvas.width, this.canvas.height);
            console.log("Display size:", this.displayWidth, this.displayHeight);
            this.canvas.style.display = 'block';
        }
    }

    // Get chart boundaries based on actual image dimensions
    getChartBounds() {
        const imgWidth = this.chartImage.width;
        const imgHeight = this.chartImage.height;
        
        // Chart area as percentage of image
        // Analyzed from 5ft_ige.png: grid area within the image
        // Y-axis (left edge): ~9% from left (moved left)
        // Right edge of grid: ~94% from left  
        // Top grid line (20000ft): ~3.5% from top
        // Bottom grid line (0ft): ~73% from top (above CONDITIONS text)
        return {
            left: imgWidth * 0.09,
            right: imgWidth * 0.94,
            top: imgHeight * 0.035,
            bottom: imgHeight * 0.73
        };
    }

    // Convert altitude (0-20000 ft) to Y pixel
    altitudeToPixelY(altitude) {
        const bounds = this.getChartBounds();
        const ratio = altitude / 20000;
        return bounds.bottom - ratio * (bounds.bottom - bounds.top);
    }
    
    // Convert weight (14000-22000 lb) to X pixel
    weightToPixelX(weight) {
        const bounds = this.getChartBounds();
        const ratio = (weight - 14000) / (22000 - 14000);
        return bounds.left + ratio * (bounds.right - bounds.left);
    }

    // Main drawing function: Altitude + Temperature → Max Weight
    drawResult(altitude, temperature) {
        console.log("IGE drawResult called with altitude:", altitude, "temperature:", temperature);
        
        if (!this.imageLoaded) {
            console.error("IGE Chart not fully initialized yet");
            return;
        }

        if (isNaN(altitude) || isNaN(temperature)) {
            console.error("Invalid altitude or temperature value");
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
    
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Get max weight using findWeight function
        let maxWeight = null;
        if (typeof findWeight === 'function') {
            maxWeight = findWeight(temperature, altitude);
        }
        
        if (maxWeight === null || isNaN(maxWeight)) {
            this.updateStatus(altitude, temperature, null);
            return;
        }

        // Don't draw on chart if max weight is at the limit (21495 lb)
        if (maxWeight >= 21495) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawLimitMessage();
            this.updateStatus(altitude, temperature, maxWeight);
            return;
        }

        // Get chart boundaries
        const bounds = this.getChartBounds();

        // Calculate Y pixel for the altitude
        const yPixel = this.altitudeToPixelY(altitude);

        // Calculate X pixel for the max weight
        const xPixel = this.weightToPixelX(maxWeight);

        // Draw horizontal line from left edge to weight position
        this.drawLine(bounds.left, yPixel, xPixel, yPixel, 'blue');
        
        // Draw vertical line from weight position down to the X-axis (weight scale)
        // Extend beyond bounds.bottom to reach just above the weight labels
        const xAxisY = this.chartImage.height * 0.81;  // Weight axis position
        this.drawLineWithArrow(xPixel, yPixel, xPixel, xAxisY, 'blue');
        
        // Draw intersection point
        this.drawPoint(xPixel, yPixel, 'blue');

        // Update status with max weight result
        this.updateStatus(altitude, temperature, maxWeight);
    }

    drawLine(startX, startY, endX, endY, color) {
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawLineWithArrow(startX, startY, endX, endY, color) {
        // Draw the line
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw arrow head at the end
        const arrowSize = 8;
        const angle = Math.atan2(endY - startY, endX - startX);
        
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawPoint(x, y, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawLimitMessage() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Draw background box
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(centerX - 180, centerY - 30, 360, 60);
        this.ctx.strokeStyle = '#16a34a';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - 180, centerY - 30, 360, 60);
        
        // Draw text
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = '#16a34a';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Maximum Weight Limit Reached (21495 lb)', centerX, centerY - 5);
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText('Chart visualization not applicable at this limit', centerX, centerY + 15);
    }

    updateStatus(altitude, temperature, maxWeight) {
        const statusElement = document.getElementById('ige-status');
        if (statusElement) {
            if (maxWeight !== null) {
                statusElement.innerHTML = `<div style="text-align:center; padding:0.5rem; background:rgba(34,197,94,0.1); border-radius:6px; color:#16a34a; font-weight:600;">Max Weight 5ft IGE: ${maxWeight.toFixed(0)} lb<br><span style="font-size:0.8em; font-weight:400;">at ${altitude} ft / ${temperature}°C</span></div>`;
            } else {
                statusElement.innerHTML = `<div style="text-align:center; padding:0.5rem; background:rgba(239,68,68,0.1); border-radius:6px; color:#dc2626; font-weight:500;">Out of chart range</div>`;
            }
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const statusElement = document.getElementById('ige-status');
        if (statusElement) {
            statusElement.innerHTML = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing IGE chart drawer");
    window.igeChartDrawer = new IGEChartDrawer('ige-chart-overlay', 'ige-chart-image');
});
