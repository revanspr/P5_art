// Animation states
let animationState = 'idle'; // idle, lookAtButton, buttonPress, doorOpen, ballFall, splash, splashReaction, sink
let frameCounter = 0;
let cycleCount = 0;
let maxCycles = 1; // Changed to 1 for seamless looping
let autoPlay = false;

// Recording
let recordFrames = false;
let totalFrames = 0;
let maxRecordFrames = 300;

// Character animation
let character = {
  x: 0,
  y: 0,
  rightArmAngle: 0,
  leftArmAngle: 0,
  anticipation: 0,
  squash: 1,
  headRotation: 0,
  faceExpression: 'neutral', // neutral, smile, frown
  lookingAt: 'forward', // forward, button, leg
  rightLegLift: 0 // how much the right leg is lifted
};

// Button
let button = {
  x: 0,
  y: 0,
  pressed: false,
  pressDepth: 0
};

// Trap door
let trapDoor = {
  x: 0,
  y: 0,
  angle: 0,
  targetAngle: 0
};

// Ball
let ball = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 30,
  squashX: 1,
  squashY: 1,
  bounceCount: 0,
  rotation: 0,
  rotationSpeed: 0
};

// Water pool
let water = {
  x: 0,
  y: 0,
  width: 200,
  height: 160,
  ripples: []
};

// Splash particles
let splashParticles = [];

function setup() {
  createCanvas(1080, 1920); // Instagram Reels format
  frameRate(30);

  // Position elements
  character.x = width - 200; // More space from pool
  character.y = height * 0.85 - 95; // Feet at floor level with 50% bigger character

  button.x = width - 110; // Adjusted for character position
  button.y = height * 0.85 - 75; // Chest level with character at floor

  trapDoor.x = 80;
  trapDoor.y = height * 0.45; // Lower trap door for 1 bounce trajectory

  ball.x = trapDoor.x;
  ball.y = trapDoor.y + 50;

  water.x = width * 0.55; // Positioned for 1 bounce before pool
  water.y = height * 0.85;
  water.width = 200; // Pool width
  water.height = height * 0.15; // Pool extends to bottom of screen

  // Start animation automatically when play button is clicked in p5.js editor
  setTimeout(() => {
    animationState = 'lookAtButton';
    frameCounter = 0;
    console.log('Starting animation...');
  }, 500);
}

function draw() {
  background(30, 35, 45);

  // Draw floor
  fill(40, 45, 55);
  rect(0, height * 0.85, width, height * 0.15);

  // Update and draw based on state
  updateAnimation();

  drawTrapDoor();
  drawWater();
  drawBall();
  drawCharacter();
  drawButton();
  drawSplash();

  frameCounter++;
}

function updateAnimation() {
  if (animationState === 'lookAtButton') {
    // Character turns to look at button and smiles
    if (frameCounter < 10) {
      let t = map(frameCounter, 0, 10, 0, 1);
      t = easeInOut(t);
      character.headRotation = map(t, 0, 1, 0, 0.3);
      character.faceExpression = 'smile';
    }
    else if (frameCounter < 20) {
      // Turn back to forward
      let t = map(frameCounter, 10, 20, 0, 1);
      t = easeInOut(t);
      character.headRotation = map(t, 0, 1, 0.3, 0);
    }
    else {
      animationState = 'buttonPress';
      frameCounter = 0;
    }
  }
  else if (animationState === 'buttonPress') {
    character.faceExpression = 'smile';

    // Principle 2: Anticipation - character winds up
    if (frameCounter < 8) {
      character.anticipation = map(frameCounter, 0, 8, 0, -15);
      character.rightArmAngle = map(frameCounter, 0, 8, 0, -0.3);
    }
    // Principle 6: Slow in and slow out
    else if (frameCounter < 13) {
      let t = map(frameCounter, 8, 13, 0, 1);
      t = easeInOut(t);
      character.rightArmAngle = map(t, 0, 1, -0.3, 0.5);
      button.pressDepth = map(t, 0, 1, 0, 10);
      character.anticipation = map(t, 0, 1, -15, 0);
    }
    else if (frameCounter < 18) {
      // Principle 5: Follow through
      let t = map(frameCounter, 13, 18, 0, 1);
      character.rightArmAngle = map(t, 0, 1, 0.5, 0);
      button.pressDepth = map(t, 0, 1, 10, 0);
    }
    else {
      animationState = 'doorOpen';
      frameCounter = 0;
      character.faceExpression = 'neutral';
    }
  }
  else if (animationState === 'doorOpen') {
    // Principle 6: Slow in and slow out
    if (frameCounter < 10) {
      let t = map(frameCounter, 0, 10, 0, 1);
      t = easeInOut(t);
      trapDoor.angle = map(t, 0, 1, 0, PI / 2);
    }
    else if (frameCounter === 10) {
      animationState = 'ballFall';
      frameCounter = 0;
      ball.vy = 0;
      ball.vx = 8;
      ball.rotationSpeed = 0.2;
    }
  }
  else if (animationState === 'ballFall') {
    // Principle 7: Arc - ball follows arc trajectory
    ball.vy += 1.0; // gravity - heavier ball with more weight
    ball.y += ball.vy;
    ball.x += ball.vx;
    ball.rotation += ball.rotationSpeed;

    // Principle 1: Squash and stretch
    let speed = abs(ball.vy);
    ball.squashY = map(speed, 0, 20, 1, 1.3);
    ball.squashX = map(speed, 0, 20, 1, 0.8);

    // Check if ball is over the water pool
    let isOverWater = ball.x > water.x - water.width / 2 &&
                      ball.x < water.x + water.width / 2;

    // Check if ball hits water surface (only after 1 bounce)
    if (isOverWater && ball.y + ball.radius >= water.y && ball.bounceCount >= 1) {
      animationState = 'splash';
      frameCounter = 0;
      createSplash();
    }
    // Check for bounces on solid floor only (not over water, must bounce 1 time)
    else if (!isOverWater && ball.y + ball.radius >= height * 0.85 && ball.bounceCount < 1) {
      ball.vy *= -0.55; // bounce with even more energy loss (heavier ball)
      ball.vx *= 0.88; // less horizontal velocity decrease
      ball.y = height * 0.85 - ball.radius;
      ball.bounceCount++;
      ball.rotationSpeed *= 0.8;

      // Principle 10: Exaggeration - exaggerate squash on impact
      ball.squashY = 0.5;
      ball.squashX = 1.5;
    }
  }
  else if (animationState === 'splash') {
    if (frameCounter < 15) {
      // Ball floats briefly at water surface
      ball.y = water.y + sin(frameCounter * 0.4) * 3;
      ball.squashY = lerp(ball.squashY, 1, 0.2);
      ball.squashX = lerp(ball.squashX, 1, 0.2);
    }
    else {
      animationState = 'splashReaction';
      frameCounter = 0;
    }

    // Update splash particles
    updateSplash();
  }
  else if (animationState === 'splashReaction') {
    // Character lifts leg, looks down at it and frowns
    if (frameCounter < 10) {
      // Lift leg and look down
      let t = map(frameCounter, 0, 10, 0, 1);
      t = easeInOut(t);
      character.headRotation = map(t, 0, 1, 0, -0.4);
      character.rightLegLift = map(t, 0, 1, 0, -20);
      character.faceExpression = 'frown';
    }
    else if (frameCounter < 25) {
      // Hold the frown while looking at lifted leg
      character.headRotation = -0.4;
      character.rightLegLift = -20;
      character.faceExpression = 'frown';
    }
    else if (frameCounter < 35) {
      // Look back up and lower leg
      let t = map(frameCounter, 25, 35, 0, 1);
      t = easeInOut(t);
      character.headRotation = map(t, 0, 1, -0.4, 0);
      character.rightLegLift = map(t, 0, 1, -20, 0);
      character.faceExpression = 'neutral';
    }
    else {
      animationState = 'sink';
      frameCounter = 0;
    }
  }
  else if (animationState === 'sink') {
    // Principle 9: Timing - slow sink to bottom and off screen
    if (frameCounter < 30) {
      let t = map(frameCounter, 0, 30, 0, 1);
      t = easeIn(t);
      ball.y = lerp(water.y, height + ball.radius * 2, t);

      // Fade out (principle of appeal)
      ball.alpha = map(frameCounter, 10, 30, 255, 0);
    }
    else {
      cycleCount++;

      // Reset for next cycle - loop indefinitely
      if (cycleCount < maxCycles) {
        resetAnimation();
        animationState = 'buttonPress';
        frameCounter = 0;
      } else {
        // Complete loop finished
        cycleCount = 0;

        // Reset and start over (animation loops continuously)
        resetAnimation();
        animationState = 'lookAtButton';
        frameCounter = 0;
      }
    }
  }

  // Always update squash back to normal (elastic)
  if (animationState === 'ballFall') {
    ball.squashY = lerp(ball.squashY, 1, 0.15);
    ball.squashX = lerp(ball.squashX, 1, 0.15);
  }
}

function drawCharacter() {
  push();
  translate(character.x, character.y + character.anticipation);
  scale(1.5); // Scale character to 150% for Instagram format

  // Principle 11: Solid drawing - more realistic character
  let bodySquash = map(character.anticipation, -15, 0, 0.9, 1);

  // Left Arm (behind body)
  stroke(255, 200, 150);
  strokeWeight(8);
  noFill();
  push();
  translate(-10, 0);
  rotate(character.leftArmAngle);
  bezier(0, -5, -15, 0, -25, 15, -30, 35);
  fill(255, 200, 150);
  noStroke();
  ellipse(-30, 35, 10, 12);
  pop();

  // Legs
  fill(60, 80, 120);
  stroke(50, 70, 110);
  strokeWeight(2);

  // Left leg (static from viewer's perspective)
  rect(2, 25, 10, 35, 2);

  // Right leg (can lift up - viewer's right side)
  push();
  translate(0, character.rightLegLift);
  rect(-12, 25, 10, 35, 2);

  // Right shoe
  fill(40, 40, 40);
  ellipse(-7, 62, 14, 8);
  pop();

  // Left shoe (static)
  fill(40, 40, 40);
  ellipse(7, 62, 14, 8);

  noStroke();

  // Torso - Principle 1: Squash during anticipation
  fill(80, 100, 140);
  rect(-15, -5, 30, 35 * bodySquash, 5);

  // Neck
  fill(255, 200, 150);
  rect(-5, -15, 10, 15);

  // Head with rotation
  push();
  translate(0, -25);
  rotate(character.headRotation);

  // Face
  fill(255, 200, 150);
  ellipse(0, 0, 30, 35);

  // Hair
  fill(60, 40, 30);
  arc(0, -3, 32, 30, PI, TWO_PI);

  // Eyes
  fill(50, 50, 50);
  ellipse(-6, -1, 3, 4);
  ellipse(6, -1, 3, 4);

  // Nose
  fill(240, 180, 130);
  ellipse(0, 5, 4, 5);

  // Mouth - changes based on expression
  stroke(50, 50, 50);
  strokeWeight(1);
  noFill();
  if (character.faceExpression === 'smile') {
    arc(0, 9, 10, 8, 0, PI);
  } else if (character.faceExpression === 'frown') {
    arc(0, 13, 10, 6, PI, TWO_PI);
  } else {
    // neutral
    line(-4, 11, 4, 11);
  }

  noStroke();
  pop();

  // Right Arm - Principle 5: Follow through and overlapping action
  stroke(255, 200, 150);
  strokeWeight(8);
  noFill();

  push();
  translate(10, 0);
  rotate(character.rightArmAngle);
  // Principle 7: Arc - arm follows arc
  bezier(0, -5, 15, 0, 25, 15, 30, 35);

  // Hand
  fill(255, 200, 150);
  noStroke();
  ellipse(30, 35, 10, 12);
  pop();

  noStroke();

  pop();
}

function drawButton() {
  push();
  translate(button.x, button.y);

  // Wall mount plate
  fill(80, 80, 90);
  rect(-5, -20, 35, 40, 3);

  // Button housing
  fill(60, 60, 70);
  ellipse(12, 0, 25, 25);

  // Button top - Principle 1: Squash when pressed
  fill(200, 50, 50);
  stroke(180, 40, 40);
  strokeWeight(2);
  ellipse(12 - button.pressDepth * 0.3, 0 + button.pressDepth, 18 - button.pressDepth * 0.2, 18 - button.pressDepth * 0.2);

  // Highlight on button
  noStroke();
  fill(255, 100, 100, 150);
  ellipse(12 - button.pressDepth * 0.3 - 3, 0 + button.pressDepth - 3, 6, 6);

  noStroke();

  pop();
}

function drawTrapDoor() {
  push();
  translate(trapDoor.x, trapDoor.y);

  // Door frame
  fill(80, 60, 40);
  rect(-60, -10, 120, 20);
  rect(-60, -10, 20, 100);
  rect(40, -10, 20, 100);

  // Trap door - Principle 7: Arc - door rotates
  push();
  rotate(trapDoor.angle);
  fill(100, 80, 60);
  rect(-50, 0, 100, 15);

  // Door details
  fill(60, 50, 40);
  rect(-40, 3, 20, 8);
  rect(20, 3, 20, 8);
  pop();

  pop();
}

function drawWater() {
  push();
  translate(water.x, water.y);

  // Water pool - Principle 8: Secondary action - ripples (extends to bottom)
  fill(50, 150, 200, 150);
  rect(-water.width / 2, 0, water.width, water.height, 10);

  // Draw ripples at water surface
  noFill();
  stroke(100, 180, 220, 100);
  strokeWeight(2);
  for (let ripple of water.ripples) {
    ellipse(0, 0, ripple.size, ripple.size * 0.3);
    ripple.size += 2;
    ripple.alpha -= 5;
  }
  water.ripples = water.ripples.filter(r => r.alpha > 0);

  pop();
}

function drawBall() {
  if (animationState === 'idle' || animationState === 'buttonPress' || animationState === 'doorOpen') {
    return; // Don't draw ball before it falls
  }

  push();
  translate(ball.x, ball.y);
  rotate(ball.rotation);

  // Principle 1: Squash and stretch
  scale(ball.squashX, ball.squashY);

  // Ball with shading for depth (Principle 11: Solid drawing)
  let alpha = ball.alpha !== undefined ? ball.alpha : 255;

  fill(255, 100, 50, alpha);
  ellipse(0, 0, ball.radius * 2, ball.radius * 2);

  // Highlight for dimension
  fill(255, 150, 100, alpha * 0.6);
  ellipse(-ball.radius * 0.3, -ball.radius * 0.3, ball.radius * 0.8, ball.radius * 0.8);

  pop();
}

function drawSplash() {
  // Principle 8: Secondary action - splash particles
  for (let i = splashParticles.length - 1; i >= 0; i--) {
    let p = splashParticles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3; // gravity
    p.life--;

    fill(50, 150, 200, map(p.life, 0, 30, 0, 200));
    ellipse(p.x, p.y, p.size, p.size);

    if (p.life <= 0) {
      splashParticles.splice(i, 1);
    }
  }
}

function createSplash() {
  // Principle 10: Exaggeration - exaggerated splash that reaches character's leg
  for (let i = 0; i < 30; i++) {
    let angle = map(i, 0, 30, PI * 0.15, PI * 0.85);
    let speed = random(4, 10); // Increased speed for larger splash
    splashParticles.push({
      x: ball.x,
      y: water.y,
      vx: cos(angle) * speed,
      vy: sin(angle) * -speed,
      size: random(4, 12), // Larger particles
      life: 35
    });
  }

  // Add ripple
  water.ripples.push({ size: 0, alpha: 100 });
}

function updateSplash() {
  // Add ripples continuously
  if (frameCounter % 4 === 0 && frameCounter < 15) {
    water.ripples.push({ size: 0, alpha: 80 });
  }
}

function mousePressed() {
  // Optional: click the red button to restart animation if needed
  if (animationState === 'idle') {
    let d = dist(mouseX, mouseY, button.x, button.y);
    if (d < 30) {
      animationState = 'lookAtButton';
      frameCounter = 0;
    }
  }
}

function resetAnimation() {
  ball.x = trapDoor.x;
  ball.y = trapDoor.y + 50;
  ball.vy = 0;
  ball.vx = 0;
  ball.bounceCount = 0;
  ball.rotation = 0;
  ball.squashX = 1;
  ball.squashY = 1;
  ball.alpha = 255;
  trapDoor.angle = 0;
  splashParticles = [];
  water.ripples = [];
  frameCounter = 0;
}

// Easing functions - Principle 6: Slow in and slow out
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeIn(t) {
  return t * t;
}

function windowResized() {
  // Canvas size is fixed at 800x600
}
