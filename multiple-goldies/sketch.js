// Configuration
let maxLoops = 10; // Number of complete loops to run before stopping
let maxA = 1000; // Maximum value of a

// Animation variables
let a = 1;
let direction = 1; // 1 for forward, -1 for reverse
let lastUpdateTime = 0;
let updateInterval = 2.00; // 2.00 milliseconds
let lastPoint = null;
let secondLastPoint = null;
let rainbowColors = [];
let colorCounter = 0; // Track total calculations for continuous color cycling
let loopCount = 0; // Track number of complete loops
let animationComplete = false;

function setup() {
  createCanvas(800, 600);
  background(0);

  // Define base rainbow colors (will be adjusted by brightness)
  rainbowColors = [
    [255, 180, 180],   // Pastel Red
    [255, 210, 160],   // Pastel Orange
    [255, 255, 180],   // Pastel Yellow
    [180, 255, 180],   // Pastel Green
    [180, 240, 255],   // Pastel Cyan
    [180, 180, 255],   // Pastel Blue
    [210, 180, 255]    // Pastel Violet
  ];
}

function draw() {
  // Stop animation if complete
  if (animationComplete) {
    return;
  }

  let currentTime = millis();

  // Update every 2.00 milliseconds
  if (currentTime - lastUpdateTime >= updateInterval) {
    lastUpdateTime = currentTime;

    // Calculate position using golden ratio spiral formula
    // Using polar coordinates: angle increases with a, radius with golden ratio
    let phi = 1.618033988749895; // Golden ratio
    let angle = a * 2 * PI / phi;
    let radius = a * 0.6; // Scale factor for visibility (reduced for larger range of 1000)

    let x = width / 2 + cos(angle) * radius;
    let y = height / 2 + sin(angle) * radius;

    // Determine color: loop through rainbow colors every 10 calculations using colorCounter
    let colorIndex = floor(colorCounter / 10) % rainbowColors.length;
    let baseColor = rainbowColors[colorIndex];

    // Calculate brightness multiplier based on a value (10 levels for 1-1000)
    // When going forward (1-1000), gets darker; when going backward (1000-1), gets lighter
    let brightnessLevel = floor((a - 1) / 100); // 0-9 for range 1-1000
    let brightnessMultiplier = 1.0 - (brightnessLevel * 0.15); // Gradually darker: 1.0, 0.85, 0.7, 0.55, 0.4, ...

    // Apply brightness to color
    let r = baseColor[0] * brightnessMultiplier;
    let g = baseColor[1] * brightnessMultiplier;
    let bl = baseColor[2] * brightnessMultiplier;
    let currentColor = color(r, g, bl);

    // Calculate thickness based on a value (10 levels: 1-100, 101-200, ..., 901-1000)
    let thicknessLevel = floor((a - 1) / 100); // 0-9
    let thickness = thicknessLevel + 1; // 1-10

    // Draw smooth curve from previous point to current point using bezier
    if (lastPoint !== null && secondLastPoint !== null) {
      stroke(currentColor);
      strokeWeight(thickness);
      noFill();

      // Calculate control points for smooth curve
      let cp1x = lastPoint.x + (lastPoint.x - secondLastPoint.x) * 0.3;
      let cp1y = lastPoint.y + (lastPoint.y - secondLastPoint.y) * 0.3;
      let cp2x = x - (x - lastPoint.x) * 0.3;
      let cp2y = y - (y - lastPoint.y) * 0.3;

      bezier(lastPoint.x, lastPoint.y, cp1x, cp1y, cp2x, cp2y, x, y);
    } else if (lastPoint !== null) {
      // For the first segment, just draw a line
      stroke(currentColor);
      strokeWeight(thickness);
      line(lastPoint.x, lastPoint.y, x, y);
    }

    // Draw current point
    fill(currentColor);
    noStroke();
    circle(x, y, 6);

    // Store current point for next iteration
    secondLastPoint = lastPoint;
    lastPoint = { x: x, y: y };

    // Increment color counter for continuous color progression
    colorCounter++;

    // Update a with direction, and reverse when hitting boundaries
    a += direction;
    if (a > maxA) {
      a = maxA;
      direction = -1;

      // Check if we should stop at the thickest line (maxA)
      // This happens when maxLoops has a decimal part (e.g., 1.5, 2.5)
      let loopsAtMax = loopCount + 0.5;
      if (loopsAtMax >= maxLoops) {
        animationComplete = true;
      }
    } else if (a < 1) {
      a = 1;
      direction = 1;
      loopCount++;

      // Check if we should stop at the thinnest line (a=1)
      // This happens when maxLoops is a whole number (e.g., 1, 2, 10)
      if (loopCount >= maxLoops) {
        animationComplete = true;
      }
    }
  }

}
