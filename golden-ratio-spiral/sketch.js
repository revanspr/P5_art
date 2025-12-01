let a = 1;
let direction = 1; // 1 for forward, -1 for reverse
let lastUpdateTime = 0;
let updateInterval = 6.67; // 3 times faster: 20/3 ≈ 6.67 milliseconds
let lastPoint = null;
let secondLastPoint = null;
let rainbowColors = [];
let colorCounter = 0; // Track total calculations for continuous color cycling

function setup() {
  createCanvas(800, 600);
  background(255);

  // Define pastel rainbow colors: red, orange, yellow, green, cyan, blue, violet, magenta, pink
  rainbowColors = [
    color(255, 180, 180),   // Pastel Red
    color(255, 210, 160),   // Pastel Orange
    color(255, 255, 180),   // Pastel Yellow
    color(180, 255, 180),   // Pastel Green
    color(180, 240, 255),   // Pastel Cyan
    color(180, 180, 255),   // Pastel Blue
    color(210, 180, 255),   // Pastel Violet
    color(255, 180, 255),   // Pastel Magenta
    color(255, 180, 210)    // Pastel Pink
  ];
}

function draw() {
  let currentTime = millis();

  // Update every 0.02 seconds (20 milliseconds)
  if (currentTime - lastUpdateTime >= updateInterval) {
    lastUpdateTime = currentTime;

    let b = a / 2;

    // Calculate position using golden ratio spiral formula
    // Using polar coordinates: angle increases with a, radius with golden ratio
    let phi = 1.618033988749895; // Golden ratio
    let angle = a * 2 * PI / phi;
    let radius = a * 1.2; // Scale factor for visibility (reduced for larger range of 500)

    let x = width / 2 + cos(angle) * radius;
    let y = height / 2 + sin(angle) * radius;

    // Determine color: loop through rainbow colors every 10 calculations using colorCounter
    let colorIndex = floor(colorCounter / 10) % rainbowColors.length;
    let currentColor = rainbowColors[colorIndex];

    // Calculate thickness based on a value (5 levels: 1-100, 101-200, 201-300, 301-400, 401-500)
    let thicknessLevel = floor((a - 1) / 100); // 0, 1, 2, 3, 4
    let thickness = thicknessLevel + 1; // 1, 2, 3, 4, 5

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
    if (a > 500) {
      a = 500;
      direction = -1;
    } else if (a < 1) {
      a = 1;
      direction = 1;
    }
  }

  // Display current values (redrawn each frame)
  noStroke();
  fill(255, 255, 255, 200); // Semi-transparent white background for text
  rect(5, 15, 150, 50);

  fill(0);
  textSize(16);
  textAlign(LEFT);
  text(`Current a: ${a}`, 10, 30);
  text(`Current b: ${(a / 2).toFixed(2)}`, 10, 50);
}
