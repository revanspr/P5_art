// Configuration
let numberOfSpirals = 20; // Input: number of spirals to start with
let maxA = 500; // Maximum value of a (bigger for larger petals)
let updateInterval = 0.1; // Starting at 0.1 milliseconds
let petalCount = 24; // Number of petals in the daisy (fewer for bigger petals)

// Animation variables
let spirals = []; // Array to hold all active spirals
let rainbowColors = [];
let lastUpdateTime = 0;
let isRunning = true; // Control animation state
let animationComplete = false;

// Slowdown variables
let startTime = 0; // Track when animation started
let slowdownDuration = 300000; // 5 minutes in milliseconds
let minInterval = 0.1; // Starting interval
let maxInterval = 1000; // Ending interval
let imageSavedAt2Min = false; // Track if image at 2 minutes has been saved
let imageSavedAt4Min = false; // Track if image at 4 minutes has been saved

// Spiral class to manage individual spirals
class Spiral {
  constructor(centerX, centerY) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.a = 1;
    this.direction = 1;
    this.lastPoint = null;
    this.secondLastPoint = null;
    this.colorCounter = floor(random(0, rainbowColors.length)) * 10; // Start at random color
    this.active = true;
    this.currentPoint = null;
    this.allPoints = []; // Store all points for collision detection
    this.collisionPartner = null; // Track which spiral this collided with
    this.collisionPoint = null; // Store where the collision happened
    this.hasCompleted = false; // Track if this spiral has completed its cycle
  }

  update() {
    if (!this.active) return;

    let phi = 1.618033988749895; // Golden ratio
    let angle = this.a * 2 * PI / phi;

    // Create daisy petal pattern using modulation
    let petalAngle = (this.a / maxA) * petalCount * 2 * PI;
    let petalModulation = 0.3 + 0.7 * abs(sin(petalAngle)); // Creates petal shape
    let radius = this.a * 0.8 * petalModulation;

    let x = this.centerX + cos(angle) * radius;
    let y = this.centerY + sin(angle) * radius;

    // Determine color
    let colorIndex = floor(this.colorCounter / 10) % rainbowColors.length;
    let baseColor = rainbowColors[colorIndex];
    let currentColor = color(baseColor[0], baseColor[1], baseColor[2]);

    // Constant thickness
    let thickness = 2;

    // Draw with filled area
    if (this.lastPoint !== null && this.secondLastPoint !== null) {
      // Smoother curves with stronger control point influence
      let cp1x = this.lastPoint.x + (this.lastPoint.x - this.secondLastPoint.x) * 0.6;
      let cp1y = this.lastPoint.y + (this.lastPoint.y - this.secondLastPoint.y) * 0.6;
      let cp2x = x - (x - this.lastPoint.x) * 0.6;
      let cp2y = y - (y - this.lastPoint.y) * 0.6;

      // Draw filled shape between center and petals
      let fillColor = color(baseColor[0], baseColor[1], baseColor[2], 80); // Semi-transparent fill
      fill(fillColor);
      noStroke();
      beginShape();
      vertex(this.centerX, this.centerY);
      vertex(this.lastPoint.x, this.lastPoint.y);
      bezierVertex(cp1x, cp1y, cp2x, cp2y, x, y);
      vertex(this.centerX, this.centerY);
      endShape(CLOSE);

      // Draw outline
      noFill();
      stroke(currentColor);
      strokeWeight(thickness);
      bezier(this.lastPoint.x, this.lastPoint.y, cp1x, cp1y, cp2x, cp2y, x, y);
    }

    // Removed circle drawing to avoid pinkish dots

    // Store points
    this.secondLastPoint = this.lastPoint;
    this.lastPoint = { x: x, y: y };
    this.currentPoint = { x: x, y: y };
    this.allPoints.push({ x: x, y: y }); // Store all points for collision checking

    this.colorCounter++;

    // Update a with direction
    this.a += this.direction;
    if (this.a > maxA) {
      this.a = maxA;
      this.direction = -1;
    } else if (this.a < 1) {
      this.a = 1;
      this.direction = 1;
      this.hasCompleted = true; // Mark as completed when it returns to a=1
    }
  }
}

function setup() {
  createCanvas(800, 600);
  background(0);

  // Define dimmer pearly pastel rainbow colors (all 7 colors)
  rainbowColors = [
    [180, 120, 120],   // Dimmer Pearly Pastel Red
    [180, 140, 100],   // Dimmer Pearly Pastel Orange
    [180, 180, 120],   // Dimmer Pearly Pastel Yellow
    [120, 180, 120],   // Dimmer Pearly Pastel Green
    [120, 120, 180],   // Dimmer Pearly Pastel Blue
    [140, 120, 180],   // Dimmer Pearly Pastel Indigo
    [160, 120, 180]    // Dimmer Pearly Pastel Violet
  ];

  // Create initial spirals at random positions within bounds
  // Keep centers at least 100px from edges to ensure spirals stay visible
  for (let i = 0; i < numberOfSpirals; i++) {
    let x = random(100, width - 100);
    let y = random(100, height - 100);
    spirals.push(new Spiral(x, y));
  }

  // Record start time for slowdown calculation
  startTime = millis();
}

function draw() {
  // Stop animation if complete or paused
  if (!isRunning || animationComplete) {
    return;
  }

  let currentTime = millis();
  let elapsedTime = currentTime - startTime;

  // Calculate updateInterval based on elapsed time (linear slowdown over 5 minutes)
  if (elapsedTime < slowdownDuration) {
    // Linear interpolation from minInterval to maxInterval
    let progress = elapsedTime / slowdownDuration; // 0 to 1
    updateInterval = minInterval + (maxInterval - minInterval) * progress;

    // Save image at 75 second mark (75000 milliseconds)
    if (elapsedTime >= 75000 && !imageSavedAt2Min) {
      saveCanvas('images/multiple-goldies-75sec-' + year() + '-' + month() + '-' + day() + '-' + hour() + '-' + minute() + '-' + second(), 'jpg');
      imageSavedAt2Min = true;
    }

    // Save image at 150 second mark (150000 milliseconds)
    if (elapsedTime >= 150000 && !imageSavedAt4Min) {
      saveCanvas('images/multiple-goldies-150sec-' + year() + '-' + month() + '-' + day() + '-' + hour() + '-' + minute() + '-' + second(), 'jpg');
      imageSavedAt4Min = true;
    }
  } else {
    // After 5 minutes, stop the animation
    updateInterval = maxInterval;
    animationComplete = true;
    isRunning = false;
  }

  // Update when enough time has passed
  if (currentTime - lastUpdateTime >= updateInterval) {
    lastUpdateTime = currentTime;

    // Update all active spirals
    for (let spiral of spirals) {
      if (spiral.active) {
        spiral.update();
      }
    }

    // Check for collisions between spirals
    checkCollisions();

    // Check if any collision pairs have both completed
    checkCompletedCollisions();

    // Check if only one spiral remains active (hasn't collided or waiting to complete)
    let activeCount = spirals.filter(s => s.active && s.collisionPartner === null).length;
    if (activeCount <= 1) {
      // Also check if all collision spirals have been spawned
      let waitingForCompletion = spirals.filter(s => s.collisionPartner !== null && !s.hasCompleted).length;
      if (waitingForCompletion === 0) {
        animationComplete = true;
        isRunning = false;
      }
    }
  }
}

// Check for collisions between spiral lines
function checkCollisions() {
  let activeSpirals = spirals.filter(s => s.active && s.collisionPartner === null);

  for (let i = 0; i < activeSpirals.length; i++) {
    for (let j = i + 1; j < activeSpirals.length; j++) {
      let s1 = activeSpirals[i];
      let s2 = activeSpirals[j];

      // Check if the current point of s1 touches any point in s2's path
      if (s1.currentPoint && s2.allPoints.length > 0) {
        for (let point of s2.allPoints) {
          let distance = dist(s1.currentPoint.x, s1.currentPoint.y, point.x, point.y);

          if (distance < 8) {
            // Touch detected! Use the point where they touched
            let touchX = (s1.currentPoint.x + point.x) / 2;
            let touchY = (s1.currentPoint.y + point.y) / 2;

            // Mark collision but don't deactivate - let them complete their cycles
            s1.collisionPartner = s2;
            s1.collisionPoint = { x: touchX, y: touchY };
            s2.collisionPartner = s1;
            s2.collisionPoint = { x: touchX, y: touchY };

            return; // Only handle one collision per frame
          }
        }
      }

      // Check if the current point of s2 touches any point in s1's path
      if (s2.currentPoint && s1.allPoints.length > 0) {
        for (let point of s1.allPoints) {
          let distance = dist(s2.currentPoint.x, s2.currentPoint.y, point.x, point.y);

          if (distance < 8) {
            // Touch detected! Use the point where they touched
            let touchX = (s2.currentPoint.x + point.x) / 2;
            let touchY = (s2.currentPoint.y + point.y) / 2;

            // Mark collision but don't deactivate - let them complete their cycles
            s1.collisionPartner = s2;
            s1.collisionPoint = { x: touchX, y: touchY };
            s2.collisionPartner = s1;
            s2.collisionPoint = { x: touchX, y: touchY };

            return; // Only handle one collision per frame
          }
        }
      }
    }
  }
}

// Check if any collision pairs have both completed their cycles
function checkCompletedCollisions() {
  for (let spiral of spirals) {
    // Check if this spiral has a collision partner and both have completed
    if (spiral.collisionPartner !== null &&
        spiral.hasCompleted &&
        spiral.collisionPartner.hasCompleted &&
        spiral.collisionPoint !== null) {

      // Only create new spirals once (check if this is the "first" spiral of the pair)
      if (spirals.indexOf(spiral) < spirals.indexOf(spiral.collisionPartner)) {
        let touchX = spiral.collisionPoint.x;
        let touchY = spiral.collisionPoint.y;

        // Deactivate both spirals now that they've completed
        spiral.active = false;
        spiral.collisionPartner.active = false;

        // Create new spiral at touch point if within bounds
        if (touchX >= 0 && touchX <= width && touchY >= 0 && touchY <= height) {
          let newSpiral = new Spiral(touchX, touchY);
          spirals.push(newSpiral);
        }

        // Create mirrored spirals
        createMirroredSpirals(touchX, touchY);
      }
    }
  }
}

// Create one mirrored spiral - whichever curve is farthest
function createMirroredSpirals(touchX, touchY) {
  // Center of canvas (origin)
  let centerX = width / 2;
  let centerY = height / 2;

  // Convert touch point to coordinates relative to center
  let relX = touchX - centerX;
  let relY = touchY - centerY;

  // Calculate distance from touch point to y=tan(sin(x)) curve
  // Point on curve: y_curve = tan(sin(relX))
  let tanSinVal = tan(sin(relX));
  let distToTanSin = abs(relY - tanSinVal);

  // Calculate distance from touch point to y=tan(cos(x)) curve
  // Point on curve: y_curve = tan(cos(relX))
  let tanCosVal = tan(cos(relX));
  let distToTanCos = abs(relY - tanCosVal);

  let mirrorX, mirrorY;

  // Choose the curve that's farthest from the touch point
  if (distToTanSin > distToTanCos) {
    // Mirror across y=tan(sin(x)) curve
    // Reflect point across the curve
    mirrorX = centerX + relX;
    mirrorY = centerY + (2 * tanSinVal - relY);
  } else {
    // Mirror across y=tan(cos(x)) curve
    // Reflect point across the curve
    mirrorX = centerX + relX;
    mirrorY = centerY + (2 * tanCosVal - relY);
  }

  // Create new spiral at mirrored position only if within bounds
  if (mirrorX >= 0 && mirrorX <= width && mirrorY >= 0 && mirrorY <= height) {
    spirals.push(new Spiral(mirrorX, mirrorY));
  }
}

// Press any key to stop/start the animation
function keyPressed() {
  if (!animationComplete) {
    isRunning = !isRunning;
  }
}
