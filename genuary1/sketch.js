const stockData = [
    { ticker: 'SNDK', percent: 587 },
    { ticker: 'WDC', percent: 292 },
    { ticker: 'MU', percent: 226 },
    { ticker: 'STX', percent: 226 },
    { ticker: 'PLTR', percent: 155 },
    { ticker: 'AMD', percent: 99 },
    { ticker: 'INTC', percent: 80 },
    { ticker: 'GOOG', percent: 66 },
    { ticker: 'AMAT', percent: 63 },
    { ticker: 'AVGO', percent: 48 },
    { ticker: 'NVDA', percent: 41 },
    { ticker: 'SHOP', percent: 40 },
    { ticker: 'NFLX', percent: 36 }
];

function setup() {
    createCanvas(windowWidth, windowHeight);
    noLoop();
}

function draw() {
    background(0);

    const maxPercent = Math.max(...stockData.map(s => s.percent));
    const maxSize = min(width, height) * 0.15;

    const cols = 5;
    const rows = Math.ceil(stockData.length / cols);
    const spacingX = width / (cols + 1);
    const spacingY = height / (rows + 1);

    fill(0, 255, 0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);

    stockData.forEach((stock, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const x = spacingX * (col + 1);
        const y = spacingY * (row + 1);

        const size = (stock.percent / maxPercent) * maxSize;

        // Draw triangle pointing up
        fill(0, 255, 0);
        triangle(
            x, y - size / 2,
            x - size / 2, y + size / 2,
            x + size / 2, y + size / 2
        );

        // Draw ticker inside triangle in black
        fill(0);
        text(stock.ticker, x, y + size / 6);

        // Draw percentage below triangle in green
        fill(0, 255, 0);
        text(stock.percent + '%', x, y + size / 2 + 20);
    });
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    redraw();
}
