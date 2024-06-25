console.log("Chart drawer script loaded");

class ChartDrawer {
    constructor(canvasId, chartImageId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartImage = document.getElementById(chartImageId);

        this.dataLoaded = false;
        this.imageLoaded = false;

        // Chart area properties
        this.chartLeft = 130;
        this.chartRight = 630;
        this.chartTop = 84;
        this.chartBottom = 490;

        this.loadChartData().then(() => {
            this.dataLoaded = true;
            this.tryInitialize();
        });

        this.chartImage.onload = () => {
            this.imageLoaded = true;
            this.tryInitialize();
        };

        if (this.chartImage.complete) {
            this.imageLoaded = true;
            this.tryInitialize();
        }
    }

    tryInitialize() {
        if (this.dataLoaded && this.imageLoaded) {
            this.canvas.width = this.chartImage.width;
            this.canvas.height = this.chartImage.height;
            console.log("Canvas sized to:", this.canvas.width, this.canvas.height);
            this.canvas.style.display = 'block'; // Ensure canvas is visible
        }
    }

    async loadChartData() {
        try {
            const response = await fetch('chartData.json');
            const data = await response.json();
            this.chartData = data.chartData;

            this.cgMin = Math.min(...this.chartData.map(point => point[0]));
            this.cgMax = Math.max(...this.chartData.map(point => point[0]));
            this.weightMin = Math.min(...this.chartData.map(point => point[1]));
            this.weightMax = Math.max(...this.chartData.map(point => point[1]));

            console.log("Chart data loaded. CG range:", this.cgMin, "-", this.cgMax, "Weight range:", this.weightMin, "-", this.weightMax);
        } catch (error) {
            console.error("Error loading chart data:", error);
        }
    }

    drawResult(weight, cg) {
        console.log("drawResult called with:", weight, cg);
        
        if (!this.dataLoaded || !this.imageLoaded) {
            console.error("Chart not fully initialized yet");
            return;
        }
    
        if (isNaN(weight) || isNaN(cg) || 
            weight < this.weightMin || weight > this.weightMax || 
            cg < this.cgMin || cg > this.cgMax) {
            console.error("Invalid weight or CG value, or out of chart range");
            return;
        }
    
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
        const xPixel = this.calculateXPixel(cg);
        const yPixel = this.calculateYPixel(weight);
    
        console.log("Calculated pixel positions:", xPixel, yPixel);
    
        // Draw vertical line from bottom to weight
        this.drawLine(xPixel, this.chartBottom, xPixel, yPixel, 'red');
        
        // Draw horizontal line from CG to right edge
        this.drawLine(xPixel, yPixel, this.chartRight, yPixel, 'red');
        
        // Draw intersection point
        this.drawPoint(xPixel, yPixel, 'red');
    
        
    }

    calculateXPixel(cg) {
        return this.chartLeft + ((cg - this.cgMin) / (this.cgMax - this.cgMin)) * (this.chartRight - this.chartLeft);
    }

    calculateYPixel(weight) {
        return this.chartBottom - ((weight - this.weightMin) / (this.weightMax - this.weightMin)) * (this.chartBottom - this.chartTop);
    }

    drawLine(startX, startY, endX, endY, color) {
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawPoint(x, y, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    addLabel(text, x, y) {
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(text, x, y);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing chart drawer");
    window.chartDrawer = new ChartDrawer('chart-overlay', 'chart-image');
});