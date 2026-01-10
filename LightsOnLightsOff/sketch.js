// Lights On/Lights Off - Instagram Reel Animation
// Window view of country field with working light switch

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const LOOP_DURATION = 300; // 10 seconds at 30fps

let isRecording = false; // Set to true to record frames
let recordingFrameCount = 0;
const TOTAL_RECORDING_FRAMES = 300;

let animationTimer = 0;
let lightsOn = false;
let lightTransition = 0; // 0 = night (off), 1 = day (on)
let stars = [];
let switchFlipProgress = 0; // Animation for switch flipping

function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    frameRate(30);

    // Create star field for night mode
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: random(width * 0.1, width * 0.9),
            y: random(height * 0.1, height * 0.4),
            size: random(1, 3),
            twinkle: random(TWO_PI),
            brightness: random(0.4, 1)
        });
    }
}

function draw() {
    // Handle recording and animation timer
    if (isRecording && recordingFrameCount < TOTAL_RECORDING_FRAMES) {
        animationTimer = recordingFrameCount;
    } else if (!isRecording) {
        animationTimer++;
        if (animationTimer >= LOOP_DURATION) {
            animationTimer = 0;
        }
    }

    // Toggle lights every 5 seconds (150 frames)
    // Switch flips at these moments
    if (animationTimer === 0) {
        lightsOn = false;
    } else if (animationTimer === 150) {
        lightsOn = true;
    }

    // Smooth transition between night and day
    let targetTransition = lightsOn ? 1 : 0;
    lightTransition = lerp(lightTransition, targetTransition, 0.05);

    // Animate switch flip
    let targetSwitchPos = lightsOn ? 1 : 0;
    switchFlipProgress = lerp(switchFlipProgress, targetSwitchPos, 0.15);

    // Draw the scene from inside looking out the window
    drawInteriorWall();
    drawWindowFrame();
    drawSceneThroughWindow();
    drawLightSwitch();

    // Frame recording
    if (isRecording && recordingFrameCount < TOTAL_RECORDING_FRAMES) {
        let frameNumber = recordingFrameCount + 1;
        save(`LightsOnOff${nf(frameNumber, 3)}.png`);
        recordingFrameCount++;

        if (recordingFrameCount >= TOTAL_RECORDING_FRAMES) {
            console.log("Recording complete! 300 frames saved.");
            isRecording = false;
            noLoop();
        }
    }
}

function drawInteriorWall() {
    // Draw the interior wall (beige/cream color)
    background(220, 210, 190);
}

function drawWindowFrame() {
    // Window frame dimensions
    let frameX = width * 0.15;
    let frameY = height * 0.2;
    let frameWidth = width * 0.5;
    let frameHeight = height * 0.5;

    // Draw window frame (dark wood)
    push();
    fill(60, 40, 20);
    noStroke();

    // Outer frame
    let frameThickness = 40;
    rect(frameX - frameThickness, frameY - frameThickness, frameWidth + frameThickness * 2, frameThickness); // Top
    rect(frameX - frameThickness, frameY + frameHeight, frameWidth + frameThickness * 2, frameThickness); // Bottom
    rect(frameX - frameThickness, frameY, frameThickness, frameHeight); // Left
    rect(frameX + frameWidth, frameY, frameThickness, frameHeight); // Right

    // Center cross divider
    rect(frameX, frameY + frameHeight / 2 - 15, frameWidth, 30); // Horizontal
    rect(frameX + frameWidth / 2 - 15, frameY, 30, frameHeight); // Vertical
    pop();
}

function drawSceneThroughWindow() {
    // Window dimensions
    let frameX = width * 0.15;
    let frameY = height * 0.2;
    let frameWidth = width * 0.5;
    let frameHeight = height * 0.5;

    // Draw the complete scene once (not per pane)
    push();
    drawCompleteScene(frameX, frameY, frameWidth, frameHeight);
    pop();
}

function drawCompleteScene(x, y, w, h) {
    // Sky - black and white at night, blue in day
    let nightSky = color(20, 20, 25);
    let daySky = color(135, 206, 250);
    let skyColor = lerpColor(nightSky, daySky, lightTransition);
    fill(skyColor);
    noStroke();
    rect(x, y, w, h);

    // Stars (only visible at night)
    if (lightTransition < 0.6) {
        for (let star of stars) {
            let alpha = map(lightTransition, 0, 0.6, 255, 0);
            let twinkle = sin(frameCount * 0.05 + star.twinkle) * 0.3 + 0.7;
            fill(255, 255, 255, alpha * star.brightness * twinkle);
            noStroke();
            ellipse(star.x, star.y, star.size);
        }
    }

    // Ground/Field
    let horizonY = y + h * 0.55;

    // Night grass (grayscale)
    let nightGrass = color(40, 45, 40);
    // Day grass (vibrant green)
    let dayGrass = color(80, 180, 80);
    let grassColor = lerpColor(nightGrass, dayGrass, lightTransition);

    fill(grassColor);
    noStroke();
    rect(x, horizonY, w, y + h - horizonY);

    // Add grass texture in day
    if (lightTransition > 0.3) {
        stroke(60, 160, 60, map(lightTransition, 0.3, 1, 0, 100));
        strokeWeight(2);
        for (let i = 0; i < 50; i++) {
            let gx = x + random(w);
            let gy = horizonY + random(y + h - horizonY);
            line(gx, gy, gx, gy - random(5, 15));
        }
        noStroke();
    }

    // ONE Streetlight in the middle distance
    let streetlightX = x + w * 0.65;
    let streetlightY = horizonY;
    let poleHeight = 100;

    // Streetlight pole (grayscale)
    let nightPole = color(60, 60, 65);
    let dayPole = color(100, 100, 105);
    let poleColor = lerpColor(nightPole, dayPole, lightTransition);
    fill(poleColor);
    noStroke();
    rect(streetlightX - 5, streetlightY, 10, poleHeight);

    // Streetlight head
    fill(poleColor);
    ellipse(streetlightX, streetlightY, 25, 15);
    rect(streetlightX - 15, streetlightY - 10, 30, 10);

    // Streetlight glow (only at night)
    if (lightTransition < 0.5) {
        let glowAlpha = map(lightTransition, 0, 0.5, 255, 0);

        // Bright bulb
        fill(255, 255, 200, glowAlpha);
        noStroke();
        ellipse(streetlightX, streetlightY + 5, 12, 12);

        // Light beam cone
        fill(255, 255, 200, glowAlpha * 0.2);
        triangle(
            streetlightX - 15, streetlightY,
            streetlightX + 15, streetlightY,
            streetlightX, streetlightY + 120
        );

        // Wider glow
        fill(255, 255, 150, glowAlpha * 0.1);
        triangle(
            streetlightX - 25, streetlightY,
            streetlightX + 25, streetlightY,
            streetlightX, streetlightY + 150
        );
    }

    // ONE Stick figure flying kite (only in daytime)
    if (lightTransition > 0.5) {
        let figureAlpha = map(lightTransition, 0.5, 1, 0, 255);
        let figureX = x + w * 0.25;
        let figureY = horizonY + 30;
        let figureSize = 25;

        stroke(50, 50, 50, figureAlpha);
        strokeWeight(3);

        // Head
        noFill();
        ellipse(figureX, figureY, figureSize * 0.4);

        // Body
        line(figureX, figureY + figureSize * 0.2, figureX, figureY + figureSize * 0.7);

        // Arms (one raised holding kite string)
        line(figureX, figureY + figureSize * 0.35, figureX - figureSize * 0.3, figureY + figureSize * 0.5);
        line(figureX, figureY + figureSize * 0.35, figureX + figureSize * 0.4, figureY + figureSize * 0.15);

        // Legs
        line(figureX, figureY + figureSize * 0.7, figureX - figureSize * 0.25, figureY + figureSize);
        line(figureX, figureY + figureSize * 0.7, figureX + figureSize * 0.25, figureY + figureSize);

        // Kite string goes UP into the sky
        let kiteX = x + w * 0.4;
        let kiteY = y + h * 0.2; // High in the sky
        stroke(50, 50, 50, figureAlpha * 0.5);
        strokeWeight(1.5);

        // String curves slightly
        noFill();
        bezier(
            figureX + figureSize * 0.4, figureY + figureSize * 0.15,
            figureX + w * 0.1, figureY - h * 0.15,
            kiteX - 20, kiteY + 30,
            kiteX, kiteY
        );

        // Kite (diamond shape) flying in sky
        fill(255, 100, 100, figureAlpha);
        stroke(200, 50, 50, figureAlpha);
        strokeWeight(2);

        // Animated kite movement
        let kiteWobbleX = sin(frameCount * 0.08) * 8;
        let kiteWobbleY = cos(frameCount * 0.06) * 5;
        kiteX += kiteWobbleX;
        kiteY += kiteWobbleY;

        push();
        translate(kiteX, kiteY);
        rotate(sin(frameCount * 0.08) * 0.15);

        // Kite diamond
        beginShape();
        vertex(0, -12);
        vertex(9, 0);
        vertex(0, 12);
        vertex(-9, 0);
        endShape(CLOSE);

        // Kite cross structure
        stroke(200, 50, 50, figureAlpha);
        strokeWeight(1.5);
        line(0, -12, 0, 12);
        line(-9, 0, 9, 0);

        // Kite tail ribbons flowing down
        stroke(255, 100, 100, figureAlpha);
        strokeWeight(2);
        for (let i = 0; i < 4; i++) {
            let tailX = sin(frameCount * 0.08 + i * 0.5) * 4;
            let tailY = 12 + i * 10;
            if (i === 0) {
                line(0, 12, tailX, tailY);
            } else {
                let prevTailX = sin(frameCount * 0.08 + (i-1) * 0.5) * 4;
                let prevTailY = 12 + (i-1) * 10;
                line(prevTailX, prevTailY, tailX, tailY);
            }

            // Ribbon bows
            fill(255, 150, 150, figureAlpha);
            noStroke();
            ellipse(tailX, tailY, 5, 5);
        }
        pop();
    }
}

function drawLightSwitch() {
    // Light switch on the right side of the window
    let switchX = width * 0.75;
    let switchY = height * 0.45;
    let switchWidth = 60;
    let switchHeight = 100;

    push();

    // Switch plate (cream/beige)
    fill(230, 225, 210);
    stroke(180, 175, 160);
    strokeWeight(2);
    rect(switchX, switchY, switchWidth, switchHeight, 5);

    // Screws
    fill(160, 160, 165);
    noStroke();
    ellipse(switchX + 15, switchY + 15, 6);
    ellipse(switchX + switchWidth - 15, switchY + 15, 6);
    ellipse(switchX + 15, switchY + switchHeight - 15, 6);
    ellipse(switchX + switchWidth - 15, switchY + switchHeight - 15, 6);

    // Switch toggle
    let toggleX = switchX + switchWidth / 2;
    let toggleYOff = switchY + switchHeight * 0.65;
    let toggleYOn = switchY + switchHeight * 0.35;
    let toggleY = lerp(toggleYOff, toggleYOn, switchFlipProgress);

    // Switch background slot
    fill(100, 100, 100);
    rect(toggleX - 10, switchY + switchHeight * 0.3, 20, switchHeight * 0.4, 3);

    // Switch toggle
    fill(200, 200, 190);
    stroke(120, 120, 115);
    strokeWeight(2);
    rect(toggleX - 8, toggleY - 15, 16, 30, 2);

    // ON/OFF labels
    noStroke();
    fill(100, 100, 100);
    textAlign(CENTER, CENTER);
    textSize(12);
    text("ON", toggleX, switchY + switchHeight * 0.25);
    text("OFF", toggleX, switchY + switchHeight * 0.75);

    pop();
}
