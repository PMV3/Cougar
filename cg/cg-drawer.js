console.log("CG Chart drawer script loaded");

class ChartDrawer {
    constructor(canvasId, chartImageId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartImage = document.getElementById(chartImageId);

        this.dataLoaded = false;
        this.imageLoaded = false;

        // CG chart value ranges (from chart image)
        // X-axis: CG in inches (170 to 195)
        // Y-axis: Weight in lbs (right scale: 13228 to 26000 lbs)
        this.cgMin = 170;
        this.cgMax = 195;
        this.weightMin = 13228;  // Bottom of chart in lbs
        this.weightMax = 26000;  // Top of chart in lbs

        this.loadChartData().then(() => {
            this.dataLoaded = true;
            this.initialize();
        });

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
            // Use natural dimensions for canvas internal coordinates
            // CSS will scale the canvas to match the displayed image
            this.canvas.width = this.chartImage.naturalWidth || 1043;
            this.canvas.height = this.chartImage.naturalHeight || 800;
            console.log("CG Canvas sized to natural:", this.canvas.width, this.canvas.height);
            this.canvas.style.display = 'block';
        }
    }

    async loadChartData() {
        try {
            const response = await fetch('chartData.json');
            const data = await response.json();
            this.chartData = data.chartData;
            console.log("Chart data loaded");
        } catch (error) {
            console.error("Error loading chart data:", error);
        }
    }

    // Get chart boundaries based on natural image dimensions (percentage-based like IGE chart)
    getChartBounds() {
        // Use canvas dimensions (set to natural size) for calculations
        const imgWidth = this.canvas.width;
        const imgHeight = this.canvas.height;
        
        // Chart area as percentage of image (cg.png is 1043x800)
        // Fine-tuned calibration
        return {
            left: imgWidth * 0.12,
            right: imgWidth * 0.88,
            top: imgHeight * 0.06,
            bottom: imgHeight * 0.80
        };
    }

    // Convert CG (170-195 in) to X pixel
    cgToPixelX(cg) {
        const bounds = this.getChartBounds();
        const ratio = (cg - this.cgMin) / (this.cgMax - this.cgMin);
        return bounds.left + ratio * (bounds.right - bounds.left);
    }

    // Convert Weight to Y pixel
    weightToPixelY(weight) {
        const bounds = this.getChartBounds();
        const ratio = (weight - this.weightMin) / (this.weightMax - this.weightMin);
        return bounds.bottom - ratio * (bounds.bottom - bounds.top);
    }

    drawResult(weight, cg) {
        console.log("CG drawResult called with weight:", weight, "cg:", cg);
        
        if (!this.imageLoaded) {
            console.error("CG Chart not fully initialized yet");
            return;
        }

        if (isNaN(weight) || isNaN(cg)) {
            console.error("Invalid weight or CG value");
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
    
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bounds = this.getChartBounds();

        // Calculate pixel positions
        const xPixel = this.cgToPixelX(cg);
        const yPixel = this.weightToPixelY(weight);
    
        console.log("Calculated pixel positions - X:", xPixel, "Y:", yPixel);
    
        // Draw from CG (bottom) UP to weight position
        this.drawLine(xPixel, bounds.bottom, xPixel, yPixel, 'red');
        
        // Draw from weight position RIGHT to the edge
        this.drawLineWithArrow(xPixel, yPixel, bounds.right, yPixel, 'red');
        
        // Draw intersection point
        this.drawPoint(xPixel, yPixel, 'red');
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
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw arrow head at end
        const arrowSize = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - arrowSize, endY - arrowSize/2);
        this.ctx.lineTo(endX - arrowSize, endY + arrowSize/2);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawPoint(x, y, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing CG chart drawer");
    window.chartDrawer = new ChartDrawer('chart-overlay', 'chart-image');
});