// Instagram Reel dimensions (1080x1920)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

// Frame recording settings
let isRecording = false; // Set to true to record frames
let recordingFrameCount = 0;
const TOTAL_RECORDING_FRAMES = 300; // 300 frames at 30fps = 10 seconds
let loopCount = 0; // Track which loop we're on
const START_RECORDING_LOOP = 3; // Start recording on the 3rd loop

let fishes = [];
let bubbles = [];
let foodFlakes = [];
let animationState = 'swimming'; // Start with swimming
let totalDrops = 0;
const MAX_DROPS = 1; // Only 1 wave for simpler animation
let foodDropped = false;
let animationTimer = 0;
const LOOP_DURATION = 300; // 10 seconds at 30fps
const SWIM_START_DURATION = 30; // 1 second of swimming at start (at 30fps)
const FOOD_DROP_TIME = 30; // Drop food at 1 second (at 30fps)
// Food falls from Y=50 to Y=1152 (60% of 1920) = 1102 pixels at 9 px/frame = ~122 frames
// At 40% height (768px), food has fallen 718 pixels = ~80 frames from drop
// So food reaches 40% at frame 30 + 80 = 110
const FISH_ANTICIPATE_TIME = 110; // Fish start moving when food reaches 40% height
const FEEDING_END = 240; // End feeding at 8 seconds, return to swimming for seamless loop

// Ornament animation
let clamOpenAmount = 0;
let clamState = 'closed'; // 'closed', 'opening', 'open', 'closing'
let clamTimer = 0;

let chestOpenAmount = 0;
let chestState = 'closed';
let chestTimer = 0;

function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    frameRate(30); // Set to 30fps for recording

    // Create small guppy fish - enough to form clear letter shapes
    // Each fish is assigned to one of the 7 letters AND a specific food piece within that letter
    let totalFish = 420; // 60 fish per letter (420 total / 7 letters), 4 fish per food piece (15 pieces per letter)
    for (let i = 0; i < totalFish; i++) {
        let assignedLetterIndex = i % 7; // Assign fish to one of 7 letters (0-6)
        let fishWithinLetter = Math.floor(i / 7); // Which fish this is within its assigned letter (0-59)
        let assignedPieceIndex = fishWithinLetter % 15; // Assign to one of 15 food pieces within the letter (0-14)

        fishes.push(new Guppy(
            random(width),
            random(height / 2, height - 200), // Start in bottom half
            random(TWO_PI),
            i,  // Give each fish a unique index
            assignedLetterIndex,  // Which letter (0-6) this fish belongs to
            assignedPieceIndex    // Which food piece (0-14) within the letter this fish targets
        ));
    }
}

function draw() {
    // When recording, use frameCount directly as animation timer
    // Otherwise, manage our own animation timer for looping
    if (!isRecording) {
        // Normal looping mode when not recording
        animationTimer++;

        // Reset for next loop
        if (animationTimer >= LOOP_DURATION) {
            // Increment loop counter first
            loopCount++;

            // Start recording on the 3rd loop BEFORE resetting
            if (loopCount === START_RECORDING_LOOP) {
                isRecording = true;
                recordingFrameCount = 0;
                console.log("Starting recording on loop 3...");
                // Don't reset the animation state, let it continue into recording
                // The recording will capture frame 0 (which is the start of loop 3)
            } else {
                // Normal reset for non-recording loops
                animationTimer = 0;
                totalDrops = 0;
                foodDropped = false;
                foodFlakes = [];
                animationState = 'swimming';

                for (let fish of fishes) {
                    if (fish.targetFlake) {
                        fish.targetFlake.releaseFish();
                    }
                    fish.targetFlake = null;
                    fish.eating = false;
                    fish.feedingOffset = null;
                    fish.anticipating = false;
                    fish.anticipationPosition = null;
                    fish.returning = false;
                }
            }
        }
    }

    // Update animation timer when recording
    if (isRecording && recordingFrameCount < TOTAL_RECORDING_FRAMES) {
        // During recording, animation timer matches the current frame being recorded
        animationTimer = recordingFrameCount;
    }

    // State transitions for seamless loop
    if (animationTimer === FISH_ANTICIPATE_TIME) {
        // Fish start moving to anticipation positions
        animationState = 'anticipating';
    } else if (animationTimer === FOOD_DROP_TIME) {
        // Food drops, fish start feeding
        animationState = 'feeding';
    } else if (animationTimer === FEEDING_END) {
        // Transition to returning - fish swim back to start positions
        animationState = 'returning';
        // Clear remaining flakes
        foodFlakes = [];
        // Set all fish to returning mode
        for (let fish of fishes) {
            if (fish.targetFlake) {
                fish.targetFlake.releaseFish();
            }
            fish.targetFlake = null;
            fish.eating = false;
            fish.feedingOffset = null;
            fish.anticipating = false;
            fish.anticipationPosition = null; // Clear anticipation position for next loop
            fish.returning = true;
        }
    }

    // Aquarium background - gradient
    drawBackground();

    // Draw decorations (back layer)
    drawGravel();

    // Draw ornaments
    drawCaveOrnament();
    drawCastleOrnament();

    // Update and draw bubbles
    updateBubbles();

    // Draw plants
    drawAquariumPlants();

    // Drop food at specific time
    if (animationTimer === FOOD_DROP_TIME && !foodDropped) {
        dropFoodFlakes();
        foodDropped = true;
        totalDrops = 1;
    }

    // Update and display food flakes
    for (let i = foodFlakes.length - 1; i >= 0; i--) {
        foodFlakes[i].update();
        foodFlakes[i].display();

        // Remove eaten flakes
        if (foodFlakes[i].isEaten()) {
            foodFlakes.splice(i, 1);
        }
    }

    // Update and display all fish
    for (let fish of fishes) {
        // Check individual fish state for returning behavior
        if (fish.returning) {
            fish.returnToStart();
        } else if (animationState === 'anticipating') {
            fish.anticipateFood();
        } else if (animationState === 'feeding' && foodFlakes.length > 0) {
            fish.feedOnFlakes(foodFlakes);
        } else {
            fish.swim();
        }
        fish.display();
    }

    // Draw water effects (front layer)
    drawWaterEffects();

    // Animate clam and chest
    animateClam();
    animateChest();

    // Frame recording for video export
    if (isRecording && recordingFrameCount < TOTAL_RECORDING_FRAMES) {
        // Save the current frame with custom naming
        let frameNumber = recordingFrameCount + 1; // Start from 001 instead of 000
        save(`GenuaryFishes${nf(frameNumber, 3)}.png`);

        // Increment AFTER saving so next draw() renders the next frame
        recordingFrameCount++;

        if (recordingFrameCount >= TOTAL_RECORDING_FRAMES) {
            console.log("Recording complete! 300 frames saved.");
            isRecording = false; // Stop recording
            noLoop(); // Stop the animation
        }
    }
}

function drawBackground() {
    // Nice aquarium blue gradient
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(color(135, 206, 235), color(25, 60, 90), inter);
        stroke(c);
        line(0, y, width, y);
    }
}

function drawGravel() {
    // Colorful aquarium gravel at bottom
    push();
    noStroke();

    // Base gravel layer
    fill(101, 67, 33);
    rect(0, height - 150, width, 150);

    // Colorful gravel stones (use randomSeed for consistent positions)
    randomSeed(12345); // Fixed seed for consistent gravel pattern
    for (let i = 0; i < 200; i++) {
        let x = random(width);
        let y = height - 150 + random(150);
        let size = random(5, 15);

        // Random gravel colors (natural and colored aquarium gravel)
        let colors = [
            color(180, 140, 100),
            color(150, 120, 90),
            color(200, 160, 120),
            color(100, 100, 100),
            color(80, 120, 160), // blue gravel
            color(160, 100, 140), // purple gravel
        ];

        fill(random(colors));
        ellipse(x, y, size, size * 0.8);
    }
    randomSeed(millis()); // Reset random seed
    pop();
}

function drawCaveOrnament() {
    push();
    translate(200, height - 150); // On gravel surface

    // Cave structure with more realistic shading
    // Dark shadow base
    fill(60, 50, 40);
    noStroke();
    beginShape();
    vertex(-85, 0);
    vertex(-95, -75);
    vertex(-65, -125);
    vertex(0, -135);
    vertex(65, -125);
    vertex(95, -75);
    vertex(85, 0);
    endShape(CLOSE);

    // Main rock body with gradient effect
    fill(95, 85, 70);
    stroke(70, 60, 50);
    strokeWeight(1.5);
    beginShape();
    vertex(-80, 0);
    vertex(-90, -80);
    vertex(-60, -130);
    vertex(0, -140);
    vertex(60, -130);
    vertex(90, -80);
    vertex(80, 0);
    endShape(CLOSE);

    // Highlight areas (lighter rock surfaces)
    fill(110, 100, 85, 180);
    noStroke();
    beginShape();
    vertex(-50, -90);
    vertex(-40, -115);
    vertex(-20, -120);
    vertex(-30, -95);
    endShape(CLOSE);

    beginShape();
    vertex(20, -120);
    vertex(40, -115);
    vertex(50, -90);
    vertex(30, -95);
    endShape(CLOSE);

    // Cave opening (darker with depth)
    fill(15, 15, 20);
    ellipse(0, -50, 75, 85);
    fill(25, 25, 30);
    ellipse(0, -50, 70, 80);

    // Inner shadow detail
    fill(10, 10, 15);
    ellipse(0, -35, 50, 40);

    // Rock texture and cracks
    stroke(50, 45, 35);
    strokeWeight(1.5);
    noFill();
    // Crack lines
    bezier(-70, -60, -60, -70, -50, -80, -45, -95);
    bezier(45, -95, 50, -80, 60, -70, 70, -60);
    bezier(-20, -120, -10, -125, 10, -125, 20, -120);

    // Small rock details
    fill(85, 75, 60, 120);
    noStroke();
    ellipse(-55, -75, 35, 30);
    ellipse(45, -90, 30, 25);
    ellipse(-25, -115, 25, 20);
    ellipse(15, -105, 20, 18);

    // Moss/algae with more detail
    fill(35, 75, 35, 140);
    ellipse(-60, -30, 40, 25);
    ellipse(-50, -25, 30, 20);
    fill(40, 85, 40, 120);
    ellipse(50, -40, 35, 22);
    ellipse(40, -35, 25, 18);
    fill(30, 65, 30, 100);
    ellipse(-35, -50, 20, 15);
    ellipse(25, -55, 18, 13);

    pop();

    // Draw clam in front of cave (moved to the right)
    drawClam(280, height - 150);
}

function drawClam(x, y) {
    push();
    translate(x, y);

    // Bottom shell with shading
    // Dark shadow
    fill(140, 120, 100);
    noStroke();
    arc(0, 2, 85, 52, 0, PI);

    // Main bottom shell
    fill(170, 150, 130);
    stroke(130, 110, 90);
    strokeWeight(2);
    arc(0, 0, 80, 50, 0, PI);

    // Bottom shell highlight
    fill(190, 170, 150, 150);
    noStroke();
    arc(-10, -3, 30, 20, 0, PI);

    // Bottom shell ridges (radial lines)
    stroke(120, 100, 80);
    strokeWeight(1.5);
    for (let i = -35; i <= 35; i += 8) {
        let angle = map(i, -35, 35, 0, PI);
        let x1 = cos(angle) * 25;
        let y1 = sin(angle) * 15;
        let x2 = cos(angle) * 40;
        let y2 = sin(angle) * 25;
        line(x1, y1, x2, y2);
    }

    // Top shell (opens and closes)
    push();
    rotate(-clamOpenAmount);

    // Top shell shadow
    fill(150, 130, 110);
    noStroke();
    arc(0, -2, 85, 52, PI, TWO_PI);

    // Main top shell
    fill(180, 160, 140);
    stroke(140, 120, 100);
    strokeWeight(2);
    arc(0, 0, 80, 50, PI, TWO_PI);

    // Top shell highlight
    fill(200, 180, 160, 150);
    noStroke();
    arc(10, 3, 30, 20, PI, TWO_PI);

    // Top shell ridges (radial lines)
    stroke(130, 110, 90);
    strokeWeight(1.5);
    for (let i = -35; i <= 35; i += 8) {
        let angle = map(i, -35, 35, PI, TWO_PI);
        let x1 = cos(angle) * 25;
        let y1 = sin(angle) * 15;
        let x2 = cos(angle) * 40;
        let y2 = sin(angle) * 25;
        line(x1, y1, x2, y2);
    }
    pop();

    // Pearl inside when open
    if (clamOpenAmount > 0.3) {
        // Pearl shadow
        fill(220, 215, 205, 100);
        noStroke();
        ellipse(1, -3, 18, 18);

        // Main pearl
        fill(245, 240, 230);
        ellipse(0, -5, 16, 16);

        // Pearl highlights
        fill(255, 255, 255, 220);
        ellipse(-3, -8, 7, 7);
        fill(255, 255, 255, 150);
        ellipse(2, -4, 4, 4);
    }

    // Clam meat/body slightly visible when open
    if (clamOpenAmount > 0.2) {
        fill(240, 200, 180, 100);
        noStroke();
        ellipse(0, -2, 35, 15);
    }

    pop();
}

function drawCastleOrnament() {
    push();
    translate(width - 200, height - 150); // Moved right and on gravel surface

    // Castle shadows
    fill(120, 120, 135);
    noStroke();
    rect(-103, -77, 206, 80);
    rect(-93, -177, 63, 100);
    rect(27, -177, 63, 100);
    rect(-33, -137, 63, 60);

    // Castle base with stone texture
    fill(150, 150, 170);
    stroke(110, 110, 130);
    strokeWeight(2);
    rect(-100, -80, 200, 80);

    // Stone brick lines on base
    stroke(130, 130, 150);
    strokeWeight(1);
    for (let y = -70; y > -80; y -= 20) {
        line(-100, y, 100, y);
    }
    for (let x = -80; x < 100; x += 30) {
        line(x, -80, x, 0);
    }

    // Castle towers with depth
    fill(155, 155, 175);
    stroke(115, 115, 135);
    strokeWeight(2);
    rect(-90, -180, 60, 100);
    rect(30, -180, 60, 100);
    rect(-30, -140, 60, 60);

    // Tower highlights
    fill(170, 170, 190, 120);
    noStroke();
    rect(-85, -175, 15, 90);
    rect(35, -175, 15, 90);
    rect(-25, -135, 15, 50);

    // Stone brick texture on towers
    stroke(135, 135, 155);
    strokeWeight(1);
    // Left tower
    for (let y = -170; y > -180; y -= 20) {
        line(-90, y, -30, y);
    }
    for (let x = -80; x < -30; x += 20) {
        line(x, -180, x, -80);
    }
    // Right tower
    for (let y = -170; y > -180; y -= 20) {
        line(30, y, 90, y);
    }
    for (let x = 40; x < 90; x += 20) {
        line(x, -180, x, -80);
    }
    // Center tower
    for (let y = -130; y > -140; y -= 20) {
        line(-30, y, 30, y);
    }
    for (let x = -20; x < 30; x += 20) {
        line(x, -140, x, -80);
    }

    // Tower tops (battlements) with more detail
    fill(135, 135, 155);
    stroke(105, 105, 125);
    strokeWeight(2);
    for (let i = -90; i < -30; i += 15) {
        rect(i, -190, 10, 10);
    }
    for (let i = 30; i < 90; i += 15) {
        rect(i, -190, 10, 10);
    }
    for (let i = -30; i < 30; i += 15) {
        rect(i, -150, 10, 10);
    }

    // Windows with depth
    // Window shadows
    fill(40, 40, 55);
    noStroke();
    rect(-69, -149, 20, 30);
    rect(51, -149, 20, 30);
    rect(-9, -119, 20, 25);

    // Window frames
    fill(50, 50, 65);
    stroke(30, 30, 45);
    strokeWeight(2);
    rect(-70, -150, 20, 30);
    rect(50, -150, 20, 30);
    rect(-10, -120, 20, 25);

    // Window cross bars
    stroke(60, 60, 75);
    strokeWeight(1.5);
    line(-60, -135, -60, -120);
    line(-70, -135, -50, -135);
    line(60, -135, 60, -120);
    line(50, -135, 70, -135);
    line(0, -107.5, 0, -95);
    line(-10, -107.5, 10, -107.5);

    // Door with depth and details
    // Door shadow
    fill(60, 45, 25);
    noStroke();
    arc(0, -39, 42, 62, PI, TWO_PI);
    rect(-21, -39, 42, 42);

    // Door frame
    fill(70, 55, 35);
    stroke(50, 40, 25);
    strokeWeight(2);
    arc(0, -40, 40, 60, PI, TWO_PI);
    rect(-20, -40, 40, 40);

    // Door planks
    stroke(60, 45, 25);
    strokeWeight(1.5);
    for (let y = -35; y < 0; y += 8) {
        line(-20, y, 20, y);
    }

    // Door handle
    fill(140, 120, 70);
    stroke(100, 85, 50);
    strokeWeight(1);
    ellipse(8, -20, 5, 5);

    // Moss/algae with more variety
    fill(35, 75, 35, 140);
    noStroke();
    ellipse(-85, -50, 35, 22);
    ellipse(-75, -45, 25, 18);
    fill(40, 85, 40, 120);
    ellipse(65, -60, 38, 24);
    ellipse(55, -55, 28, 20);
    fill(30, 65, 30, 100);
    ellipse(-20, -15, 25, 15);
    ellipse(15, -20, 22, 14);

    pop();

    // Draw treasure chest next to castle (moved to the left)
    drawTreasureChest(width - 350, height - 150);
}

function drawTreasureChest(x, y) {
    push();
    translate(x, y);

    // Chest shadow
    fill(70, 45, 20);
    noStroke();
    rect(-42, -18, 84, 42, 5);

    // Chest bottom with wood grain
    fill(95, 63, 31);
    stroke(65, 40, 18);
    strokeWeight(2);
    rect(-40, -20, 80, 40, 5);

    // Wood planks on bottom
    stroke(75, 50, 23);
    strokeWeight(1);
    for (let x = -35; x < 40; x += 16) {
        line(x, -20, x, 20);
    }

    // Bottom highlights
    fill(115, 80, 40, 100);
    noStroke();
    rect(-38, -18, 20, 35, 3);

    // Metal corners on bottom
    fill(160, 140, 90);
    stroke(120, 100, 60);
    strokeWeight(1.5);
    // Corner brackets
    rect(-38, -18, 8, 8);
    rect(30, -18, 8, 8);
    rect(-38, 10, 8, 8);
    rect(30, 10, 8, 8);

    // Chest lid
    push();
    translate(0, -20);
    rotate(-chestOpenAmount);

    // Lid shadow
    fill(75, 50, 23);
    noStroke();
    arc(0, -1, 84, 44, PI, TWO_PI);
    rect(-42, -1, 84, 12);

    // Main lid
    fill(105, 72, 36);
    stroke(70, 45, 20);
    strokeWeight(2);
    arc(0, 0, 80, 40, PI, TWO_PI);
    rect(-40, 0, 80, 10);

    // Wood grain on lid
    stroke(85, 58, 28);
    strokeWeight(1);
    for (let x = -35; x < 40; x += 16) {
        let startY = 0;
        let endY = -sqrt(400 - x * x) * 0.5; // Follow arc curve
        if (!isNaN(endY)) {
            line(x, startY, x, endY);
        }
    }

    // Lid highlight
    fill(125, 90, 45, 100);
    noStroke();
    arc(-10, 0, 30, 25, PI, TWO_PI);

    // Metal bands with rivets
    stroke(170, 150, 95);
    strokeWeight(3.5);
    line(-30, -15, -30, 5);
    line(0, -15, 0, 5);
    line(30, -15, 30, 5);

    // Rivets on bands
    fill(180, 160, 100);
    noStroke();
    // Left band
    ellipse(-30, -12, 4, 4);
    ellipse(-30, -5, 4, 4);
    ellipse(-30, 2, 4, 4);
    // Middle band
    ellipse(0, -12, 4, 4);
    ellipse(0, -5, 4, 4);
    ellipse(0, 2, 4, 4);
    // Right band
    ellipse(30, -12, 4, 4);
    ellipse(30, -5, 4, 4);
    ellipse(30, 2, 4, 4);

    pop();

    // Lock with more detail
    // Lock shadow
    fill(140, 120, 70);
    noStroke();
    ellipse(1, -9, 14, 14);

    // Lock body
    fill(170, 150, 90);
    stroke(130, 110, 65);
    strokeWeight(2);
    ellipse(0, -10, 12, 12);

    // Lock keyhole
    fill(40, 30, 15);
    noStroke();
    ellipse(0, -10, 4, 5);
    triangle(-1, -8, 1, -8, 0, -5);

    // Lock highlight
    fill(200, 180, 120, 150);
    noStroke();
    ellipse(-2, -12, 4, 4);

    // Treasure inside when open
    if (chestOpenAmount > 0.5) {
        // More elaborate treasure
        // Gold coins with detail
        for (let i = 0; i < 6; i++) {
            let coinX = random(-15, 15);
            let coinY = random(-32, -22);
            // Coin shadow
            fill(200, 170, 0);
            noStroke();
            ellipse(coinX + 1, coinY + 1, 11, 11);
            // Coin
            fill(255, 215, 0);
            ellipse(coinX, coinY, 10, 10);
            // Coin highlight
            fill(255, 240, 100);
            ellipse(coinX - 2, coinY - 2, 4, 4);
        }

        // Gems with sparkle
        // Ruby
        fill(200, 30, 70);
        noStroke();
        ellipse(10, -28, 9, 9);
        fill(255, 50, 100);
        ellipse(10, -28, 7, 7);
        fill(255, 150, 180);
        ellipse(8, -30, 3, 3);

        // Sapphire
        fill(30, 100, 200);
        ellipse(-8, -30, 10, 10);
        fill(50, 150, 255);
        ellipse(-8, -30, 8, 8);
        fill(150, 200, 255);
        ellipse(-10, -32, 3, 3);

        // Emerald
        fill(20, 150, 80);
        ellipse(5, -25, 8, 8);
        fill(40, 200, 120);
        ellipse(5, -25, 6, 6);
        fill(120, 255, 180);
        ellipse(3, -27, 2, 2);

        // Pearl
        fill(235, 230, 220);
        ellipse(-12, -26, 7, 7);
        fill(255, 255, 255, 200);
        ellipse(-13, -27, 3, 3);
    }

    pop();
}

function drawAquariumPlants() {
    // Tall plants scattered around - minimum height/2, varying up to 1400px
    drawPlant(120, height - 150, color(34, 139, 34), 1200);
    drawPlant(350, height - 150, color(50, 150, 50), 960);
    drawPlant(700, height - 150, color(40, 130, 40), 1400);
    drawPlant(900, height - 150, color(45, 140, 45), 1100);

    // Medium-tall plants
    drawPlant(500, height - 150, color(60, 160, 60), 1000);
    drawPlant(650, height - 150, color(55, 145, 55), 1300);
}

function drawPlant(x, y, col, tallness) {
    push();
    stroke(col);
    strokeWeight(4);
    noFill();

    // Multiple plant stems with smooth, natural sway
    for (let i = 0; i < 3; i++) {
        let offsetX = (i - 1) * 15;
        let phaseOffset = i * 1.5;

        beginShape();
        for (let j = 0; j <= tallness; j += 10) {
            // Smooth multi-frequency sway for natural movement
            let swayAmount = (j / tallness) * 20; // More sway at top
            let sway = sin(frameCount * 0.015 + phaseOffset + j * 0.003) * swayAmount;
            sway += sin(frameCount * 0.008 + phaseOffset * 2 + j * 0.002) * swayAmount * 0.5;
            vertex(x + offsetX + sway, y - j);
        }
        endShape();

        // Leaves with smooth independent movement
        strokeWeight(2);
        for (let j = 20; j < tallness; j += 25) {
            let swayAmount = (j / tallness) * 20;
            let sway = sin(frameCount * 0.015 + phaseOffset + j * 0.003) * swayAmount;
            sway += sin(frameCount * 0.008 + phaseOffset * 2 + j * 0.002) * swayAmount * 0.5;

            let leafSway = sin(frameCount * 0.025 + i + j * 0.01) * 5;

            // Left leaves with gentle flutter
            bezier(
                x + offsetX + sway, y - j,
                x + offsetX + sway - 20 + leafSway, y - j - 5,
                x + offsetX + sway - 25 + leafSway, y - j - 10,
                x + offsetX + sway - 20 + leafSway * 0.5, y - j - 15
            );
            // Right leaves with gentle flutter
            bezier(
                x + offsetX + sway, y - j,
                x + offsetX + sway + 20 - leafSway, y - j - 5,
                x + offsetX + sway + 25 - leafSway, y - j - 10,
                x + offsetX + sway + 20 - leafSway * 0.5, y - j - 15
            );
        }
    }
    strokeWeight(4);
    pop();
}

function drawWaterEffects() {
    // Light rays from top
    push();
    noStroke();
    for (let i = 0; i < 5; i++) {
        let x = (width / 6) * (i + 0.5);
        let offset = sin(frameCount * 0.01 + i) * 30;
        fill(255, 255, 255, 10);
        triangle(
            x + offset, 0,
            x - 50 + offset, height - 150,
            x + 50 + offset, height - 150
        );
    }
    pop();
}

function animateClam() {
    clamTimer++;

    if (clamState === 'closed' && clamTimer > 90) { // Opens more frequently (was 180)
        clamState = 'opening';
        clamTimer = 0;
    } else if (clamState === 'opening') {
        clamOpenAmount = lerp(clamOpenAmount, PI / 3, 0.05);
        if (clamOpenAmount > PI / 3 - 0.1) {
            clamState = 'open';
            clamTimer = 0;
            // Release more bubbles more frequently
            for (let i = 0; i < 15; i++) { // More bubbles (was 10)
                bubbles.push(new Bubble(280, height - 150));
            }
        }
    } else if (clamState === 'open' && clamTimer > 45) { // Stays open shorter (was 90)
        clamState = 'closing';
        clamTimer = 0;
    } else if (clamState === 'closing') {
        clamOpenAmount = lerp(clamOpenAmount, 0, 0.05);
        if (clamOpenAmount < 0.1) {
            clamOpenAmount = 0;
            clamState = 'closed';
            clamTimer = 0;
        }
    }
}

function animateChest() {
    chestTimer++;

    if (chestState === 'closed' && chestTimer > 120) { // Opens more frequently (was 200)
        chestState = 'opening';
        chestTimer = 0;
    } else if (chestState === 'opening') {
        chestOpenAmount = lerp(chestOpenAmount, PI / 2.5, 0.05);
        if (chestOpenAmount > PI / 2.5 - 0.1) {
            chestState = 'open';
            chestTimer = 0;
            // Release more bubbles, different amount than clam
            for (let i = 0; i < 20; i++) { // More bubbles than clam (was 12)
                bubbles.push(new Bubble(width - 350, height - 150));
            }
        }
    } else if (chestState === 'open' && chestTimer > 60) { // Stays open shorter (was 100)
        chestState = 'closing';
        chestTimer = 0;
    } else if (chestState === 'closing') {
        chestOpenAmount = lerp(chestOpenAmount, 0, 0.05);
        if (chestOpenAmount < 0.1) {
            chestOpenAmount = 0;
            chestState = 'closed';
            chestTimer = 0;
        }
    }
}

function updateBubbles() {
    for (let i = bubbles.length - 1; i >= 0; i--) {
        bubbles[i].update();
        bubbles[i].display();

        if (bubbles[i].isOffScreen()) {
            bubbles.splice(i, 1);
        }
    }
}

function dropFoodFlakes() {
    // Drop 7 flakes (one for each letter of GENUARY)
    // Each flake splits into pieces that fall together in a cluster
    const word = "GENUARY"; // Uppercase for better visibility
    const PIECES_PER_LETTER = 15; // More pieces for clearer letter formation

    const letterSpacing = 135; // Spacing between letters (adjusted)
    const totalWidth = word.length * letterSpacing;
    const startX = (width - totalWidth) / 2 + letterSpacing / 2;
    const baseY = 50; // Starting height (near top)

    for (let i = 0; i < word.length; i++) {
        let centerX = startX + i * letterSpacing;
        let centerY = baseY;

        // Create pieces that fall in a simple cluster
        for (let p = 0; p < PIECES_PER_LETTER; p++) {
            // Small random offset so pieces fall together but not exactly on top of each other
            let flakeX = centerX + random(-15, 15);
            let flakeY = centerY + random(-10, 10);

            foodFlakes.push(new FoodFlake(
                flakeX,
                flakeY,
                word[i],
                i, // Letter index (0-6)
                p, // Piece index
                totalDrops + 1 // Wave number (1 or 2)
            ));
        }
    }
}

function getLetterClusterPositions(letter) {
    // Returns 15 key positions where pieces should settle to form letter shape
    // Fish will cluster densely around these pieces
    let positions = [];
    let scale = 38; // Adjusted for 45-55% zone (reduced from 42)

    switch(letter) {
        case 'G':
            // Improved G with clearer top and bottom, stronger right bar
            positions = [
                // Left vertical stroke (5 points)
                {x: -2*scale, y: -2.5*scale}, {x: -2*scale, y: -1.25*scale}, {x: -2*scale, y: 0}, {x: -2*scale, y: 1.25*scale}, {x: -2*scale, y: 2.5*scale},
                // Top horizontal (3 points)
                {x: -0.5*scale, y: -2.5*scale}, {x: 0.75*scale, y: -2.5*scale}, {x: 2*scale, y: -2.5*scale},
                // Bottom horizontal (3 points)
                {x: -0.5*scale, y: 2.5*scale}, {x: 0.75*scale, y: 2.5*scale}, {x: 2*scale, y: 2.5*scale},
                // Right vertical bar with horizontal (4 points)
                {x: 2*scale, y: 1.25*scale}, {x: 2*scale, y: 0}, {x: 0.75*scale, y: 0}, {x: 0*scale, y: 0}
            ];
            break;
        case 'E':
            // Improved E with more balanced horizontal bars
            positions = [
                // Left vertical stroke (5 points)
                {x: -2*scale, y: -2.5*scale}, {x: -2*scale, y: -1.25*scale}, {x: -2*scale, y: 0}, {x: -2*scale, y: 1.25*scale}, {x: -2*scale, y: 2.5*scale},
                // Top horizontal (3 points)
                {x: -0.5*scale, y: -2.5*scale}, {x: 0.75*scale, y: -2.5*scale}, {x: 1.75*scale, y: -2.5*scale},
                // Middle horizontal (3 points)
                {x: -0.5*scale, y: 0}, {x: 0.5*scale, y: 0}, {x: 1.25*scale, y: 0},
                // Bottom horizontal (3 points)
                {x: -0.5*scale, y: 2.5*scale}, {x: 0.75*scale, y: 2.5*scale}, {x: 1.75*scale, y: 2.5*scale},
                // Extra point for definition
                {x: -1*scale, y: -1.25*scale}
            ];
            break;
        case 'N':
            positions = [
                {x: -2*scale, y: -3*scale}, {x: -2*scale, y: -1.5*scale}, {x: -2*scale, y: 0}, {x: -2*scale, y: 1.5*scale}, {x: -2*scale, y: 3*scale},
                {x: 2*scale, y: -3*scale}, {x: 2*scale, y: -1.5*scale}, {x: 2*scale, y: 0}, {x: 2*scale, y: 1.5*scale}, {x: 2*scale, y: 3*scale},
                {x: -1*scale, y: -2*scale}, {x: 0, y: -1*scale}, {x: 0, y: 0}, {x: 0, y: 1*scale}, {x: 1*scale, y: 2*scale}
            ];
            break;
        case 'U':
            positions = [
                {x: -2*scale, y: -3*scale}, {x: -2*scale, y: -1.5*scale}, {x: -2*scale, y: 0}, {x: -2*scale, y: 1.5*scale},
                {x: 2*scale, y: -3*scale}, {x: 2*scale, y: -1.5*scale}, {x: 2*scale, y: 0}, {x: 2*scale, y: 1.5*scale},
                {x: -1.5*scale, y: 3*scale}, {x: -1*scale, y: 3*scale}, {x: -0.5*scale, y: 3*scale},
                {x: 0.5*scale, y: 3*scale}, {x: 1*scale, y: 3*scale}, {x: 1.5*scale, y: 3*scale}, {x: 0, y: 2.5*scale}
            ];
            break;
        case 'A':
            positions = [
                {x: 0, y: -3*scale}, {x: -0.5*scale, y: -2.5*scale}, {x: 0.5*scale, y: -2.5*scale},
                {x: -1*scale, y: -1.5*scale}, {x: 1*scale, y: -1.5*scale},
                {x: -1.5*scale, y: 0}, {x: -0.5*scale, y: 0}, {x: 0, y: 0}, {x: 0.5*scale, y: 0}, {x: 1.5*scale, y: 0},
                {x: -2*scale, y: 1.5*scale}, {x: 2*scale, y: 1.5*scale},
                {x: -2*scale, y: 3*scale}, {x: -2.5*scale, y: 2.5*scale}, {x: 2*scale, y: 3*scale}
            ];
            break;
        case 'R':
            positions = [
                {x: -2*scale, y: -3*scale}, {x: -2*scale, y: -1.5*scale}, {x: -2*scale, y: 0}, {x: -2*scale, y: 1.5*scale}, {x: -2*scale, y: 3*scale},
                {x: 0, y: -3*scale}, {x: 1*scale, y: -3*scale}, {x: 1.5*scale, y: -3*scale},
                {x: 2*scale, y: -2*scale}, {x: 2*scale, y: -1.5*scale},
                {x: 1*scale, y: 0}, {x: 0.5*scale, y: 0},
                {x: 0, y: 1.5*scale}, {x: 0.5*scale, y: 2*scale}, {x: 1*scale, y: 3*scale}
            ];
            break;
        case 'Y':
            positions = [
                {x: -2*scale, y: -3*scale}, {x: -1.5*scale, y: -2.5*scale}, {x: -1*scale, y: -1.5*scale},
                {x: 2*scale, y: -3*scale}, {x: 1.5*scale, y: -2.5*scale}, {x: 1*scale, y: -1.5*scale},
                {x: -0.5*scale, y: -0.5*scale}, {x: 0, y: 0}, {x: 0.5*scale, y: -0.5*scale},
                {x: 0, y: 1*scale}, {x: -0.5*scale, y: 1*scale}, {x: 0.5*scale, y: 1*scale},
                {x: 0, y: 1.5*scale}, {x: 0, y: 2.5*scale}, {x: 0, y: 3*scale}
            ];
            break;
    }

    return positions;
}

class Bubble {
    constructor(x, y) {
        this.x = x + random(-10, 10);
        this.y = y;
        this.size = random(5, 12);
        this.baseSpeed = random(1.2, 2.5);
        this.speed = 0; // Start at 0 for smooth acceleration
        this.wobble = random(0.015, 0.035);
        this.wobbleOffset = random(TWO_PI);
        this.wobbleAmplitude = random(0.8, 1.5);
        this.age = 0;
        this.maxAge = random(120, 180); // Bubble lifetime for size changes
    }

    update() {
        this.age++;

        // Smooth acceleration at start
        this.speed = lerp(this.speed, this.baseSpeed, 0.05);

        // Rise with smooth wobble
        this.y -= this.speed;

        // Multi-frequency wobble for natural movement
        let wobbleX = sin(frameCount * this.wobble + this.wobbleOffset) * this.wobbleAmplitude;
        wobbleX += sin(frameCount * this.wobble * 0.5 + this.wobbleOffset * 1.3) * this.wobbleAmplitude * 0.3;
        this.x += wobbleX;

        // Slight size pulsing for realism
        let sizePulse = sin(this.age * 0.1) * 0.1;
        this.currentSize = this.size * (1 + sizePulse);
    }

    display() {
        push();
        noStroke();

        // Main bubble with smooth transparency
        let alpha = map(this.age, 0, this.maxAge, 80, 120);
        fill(255, 255, 255, alpha);
        ellipse(this.x, this.y, this.currentSize, this.currentSize);

        // Highlight with shimmer effect
        let shimmer = sin(this.age * 0.15) * 30 + 200;
        fill(255, 255, 255, shimmer);
        ellipse(this.x - this.currentSize * 0.25, this.y - this.currentSize * 0.25,
                this.currentSize * 0.35, this.currentSize * 0.35);

        // Smaller secondary highlight
        fill(255, 255, 255, shimmer * 0.7);
        ellipse(this.x + this.currentSize * 0.15, this.y - this.currentSize * 0.15,
                this.currentSize * 0.15, this.currentSize * 0.15);

        pop();
    }

    isOffScreen() {
        return this.y < -20;
    }
}

class FoodFlake {
    constructor(startX, startY, letter, letterIndex, pieceIndex, waveNumber = 1) {
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;

        // Get letter cluster positions for this letter
        let allPositions = getLetterClusterPositions(letter);
        let myPosition = allPositions[pieceIndex % allPositions.length];

        // Calculate letter center position - centered horizontally, at 50% down
        const letterSpacing = 135; // Spacing between letter centers (adjusted)
        const totalWidth = 6 * letterSpacing; // 6 gaps between 7 letters
        const firstLetterX = (width - totalWidth) / 2;
        let letterCenterX = firstLetterX + letterIndex * letterSpacing;
        let letterCenterY = height * 0.50; // Letters at 50% height (in feeding zone 45-55%)

        // Target position spreads out from letter center to form the shape
        this.targetX = letterCenterX + myPosition.x;
        this.targetY = letterCenterY + myPosition.y;

        this.size = random(6, 9); // Small pieces
        this.fallSpeed = random(8, 10); // Fast fall so food settles quickly
        this.wobble = random(0.01, 0.03);
        this.wobbleOffset = random(TWO_PI);
        this.fishEating = 0; // Number of fish eating this piece
        this.eatenAmount = 0; // How much has been eaten (0-1)
        this.settled = false;
        this.settledFrames = 0; // How many frames has this been settled
        this.waveNumber = waveNumber; // Track which wave (1 or 2)

        // Letter this piece represents
        this.letter = letter;
        this.letterIndex = letterIndex; // Which letter (0-6)
        this.pieceIndex = pieceIndex; // Which piece of the letter
        this.myLetterPosition = myPosition; // Where this piece sits in the letter

        // Flake color (brownish/orange fish food)
        this.hue = random(20, 40);
        this.saturation = random(70, 90);
        this.brightness = random(60, 80);
    }

    update() {
        if (!this.settled) {
            // Fall with smooth wobble
            this.y += this.fallSpeed;

            // Gradually spread out towards target X position as falling
            let fallProgress = min(1, this.y / this.targetY);
            let currentTargetX = lerp(this.startX, this.targetX, fallProgress);

            // Gentle drift towards target position
            let driftX = (currentTargetX - this.x) * 0.02;
            this.x += driftX;

            // Add natural wobble
            let wobbleX = sin(frameCount * this.wobble + this.wobbleOffset) * 0.5;
            this.x += wobbleX;

            // Settle when reaching target Y
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.x = lerp(this.x, this.targetX, 0.3); // Faster X convergence
                // More lenient settling condition - settle as soon as Y is reached
                if (abs(this.x - this.targetX) < 10) {
                    this.settled = true;
                    this.x = this.targetX; // Snap to exact position
                }
            }
        }

        // Track how long this has been settled
        if (this.settled) {
            this.settledFrames++;
        }

        // Get eaten by fish - but only if settled for at least 5 frames
        // This prevents food from disappearing the instant it settles
        if (this.fishEating > 0 && this.settledFrames >= 5) {
            // Slow eating rate so letters stay visible for a while
            let eatRate = 0.003;
            this.eatenAmount += eatRate * this.fishEating;
            if (this.eatenAmount > 1) {
                this.eatenAmount = 1;
            }
        }
    }

    display() {
        if (this.eatenAmount >= 1) return; // Don't draw if fully eaten

        let currentSize = this.size * (1 - this.eatenAmount);

        push();
        colorMode(HSB, 360, 100, 100);
        fill(this.hue, this.saturation, this.brightness);
        noStroke();

        // Draw simple circle for food piece
        ellipse(this.x, this.y, currentSize, currentSize);
        pop();
    }

    isEaten() {
        return this.eatenAmount >= 1;
    }

    claimFish() {
        this.fishEating++;
    }

    releaseFish() {
        this.fishEating = max(0, this.fishEating - 1);
    }
}

class Guppy {
    constructor(x, y, startAngle, fishIndex, assignedLetterIndex, assignedPieceIndex) {
        this.x = x;
        this.y = y;
        this.angle = startAngle;
        this.speed = random(1.5, 2.5);
        this.wobble = random(0.03, 0.06);
        this.size = random(8, 14); // Smaller fish for clearer letter formation

        // Random guppy colors (tropical bright colors)
        let colorPalettes = [
            { body: color(255, 100, 50), tail: color(255, 150, 0) },
            { body: color(50, 150, 255), tail: color(100, 200, 255) },
            { body: color(255, 200, 50), tail: color(255, 220, 100) },
            { body: color(150, 50, 200), tail: color(200, 100, 255) },
            { body: color(255, 50, 150), tail: color(255, 100, 200) },
            { body: color(50, 200, 150), tail: color(100, 255, 200) },
        ];

        this.palette = random(colorPalettes);
        this.wiggle = 0;
        this.finOffset = random(TWO_PI);
        this.fishIndex = fishIndex;
        this.assignedLetterIndex = assignedLetterIndex; // Which letter (0-6) this fish is assigned to
        this.assignedPieceIndex = assignedPieceIndex; // Which food piece (0-14) within the letter

        // Feeding behavior
        this.targetFlake = null;
        this.eating = false;
        this.feedingOffset = null; // Random offset around food for natural clustering
        this.anticipating = false;
        this.anticipationPosition = null; // Where fish will wait for food

        // Store starting position for seamless loop
        this.startX = x;
        this.startY = y;
        this.returning = false; // Whether fish is returning to start position
    }

    swim() {
        // Natural swimming behavior - stay in bottom half of aquarium
        let nearby = this.findNearbyFish();
        let alignment = createVector(0, 0);
        let cohesion = createVector(0, 0);
        let separation = createVector(0, 0);

        if (nearby.length > 0) {
            // Extremely weak alignment for independent movement
            for (let other of nearby) {
                alignment.add(createVector(cos(other.angle), sin(other.angle)));
            }
            alignment.div(nearby.length);
            alignment.mult(0.001); // Extremely weak (was 0.005)

            // Extremely weak cohesion for maximum dispersal
            for (let other of nearby) {
                cohesion.add(createVector(other.x, other.y));
            }
            cohesion.div(nearby.length);
            cohesion.sub(createVector(this.x, this.y));
            cohesion.normalize();
            cohesion.mult(0.0005); // Extremely weak (was 0.002)

            // Very strong separation to keep fish well dispersed
            for (let other of nearby) {
                let d = dist(this.x, this.y, other.x, other.y);
                if (d < 100 && d > 0) { // Larger radius for more separation (was 80)
                    let diff = createVector(this.x - other.x, this.y - other.y);
                    diff.div(d);
                    separation.add(diff);
                }
            }
            if (nearby.length > 0) {
                separation.div(nearby.length);
                separation.mult(0.5); // Even stronger separation (was 0.3)
            }
        }

        // If fish is in top half, add strong downward bias to return to bottom
        let returnHome = createVector(0, 0);
        if (this.y < height * 0.5) {
            // Create downward force proportional to how high up we are
            let distanceAbove = height * 0.5 - this.y;
            returnHome.y = distanceAbove * 0.002; // Gentle pull downward
            returnHome.mult(2); // Stronger return force
        }

        // Apply forces with minimal influence for maximum independence
        let targetAngle = this.angle +
            alignment.heading() * 0.05 +
            cohesion.heading() * 0.02 +
            separation.heading() * 0.6 + // Stronger separation influence
            returnHome.heading() * 0.3;
        this.angle = lerp(this.angle, targetAngle, 0.05); // Slower turn rate for smoother movement

        // Very strong random wandering for highly varied, independent paths
        this.angle += random(-0.3, 0.3); // Increased randomness (was -0.2, 0.2)

        // Vary speed for more natural movement
        let speedVariation = sin(frameCount * 0.05 + this.fishIndex) * 0.3;
        let currentSpeed = this.speed * (1 + speedVariation);

        // Move with varied direction
        this.x += cos(this.angle) * currentSpeed;
        this.y += sin(this.angle) * currentSpeed;

        // Keep fish within frame boundaries (no wrapping)
        // Left and right boundaries
        if (this.x < this.size * 2) {
            this.x = this.size * 2;
            this.angle = random(-PI/3, PI/3); // Point right
        }
        if (this.x > width - this.size * 2) {
            this.x = width - this.size * 2;
            this.angle = random(PI - PI/3, PI + PI/3); // Point left
        }

        // Top and bottom boundaries
        if (this.y < height * 0.5) {
            // Bias angle downward when at boundary
            if (sin(this.angle) < 0) { // Swimming upward
                this.angle = random(0, PI); // Point downward
            }
        }
        if (this.y > height - 170) {
            this.y = height - 170 - random(0, 20);
            this.angle = random(PI, TWO_PI); // Random upward angle
        }

        this.wiggle += this.wobble;
    }

    returnToStart() {
        // Swim back to starting position for seamless loop
        let dx = this.startX - this.x;
        let dy = this.startY - this.y;
        let distance = sqrt(dx * dx + dy * dy);

        if (distance > 20) {
            // Still returning to start position
            let targetAngle = atan2(dy, dx);
            this.angle = lerp(this.angle, targetAngle, 0.1);
            let moveSpeed = this.speed * 2.5; // Moderate speed to return
            this.x += cos(this.angle) * moveSpeed;
            this.y += sin(this.angle) * moveSpeed;
        } else {
            // Close to start - transition to normal swimming
            this.returning = false;
            this.swim();
        }

        this.wiggle += this.wobble;
    }

    anticipateFood() {
        // Calculate position in feeding zone (40-50% height) and swim there to wait
        if (!this.anticipationPosition) {
            // Calculate the target position for our assigned food piece
            const word = "GENUARY";
            let letter = word[this.assignedLetterIndex];
            let allPositions = getLetterClusterPositions(letter);
            let myPosition = allPositions[this.assignedPieceIndex % allPositions.length];

            const letterSpacing = 135; // Spacing between letter centers (adjusted)
            const totalWidth = 6 * letterSpacing;
            const firstLetterX = (width - totalWidth) / 2;
            let letterCenterX = firstLetterX + this.assignedLetterIndex * letterSpacing;

            // Food will settle at 50%, fish wait in feeding zone (45-55%)
            // Position fish proportionally in the feeding zone based on where food will land
            let foodTargetY = height * 0.50; // Where food will settle
            let feedingZoneTop = height * 0.45;
            let feedingZoneBottom = height * 0.55;

            // Center of feeding zone
            let letterCenterY = height * 0.50; // Center of feeding zone

            let targetX = letterCenterX + myPosition.x;
            let targetY = letterCenterY + myPosition.y;

            // Clamp to feeding zone
            targetY = constrain(targetY, feedingZoneTop, feedingZoneBottom);

            // Add random offset for natural clustering (tighter for clearer letters)
            let angle = random(TWO_PI);
            let radius = random(2, 8); // Reduced max radius for tighter clustering (was 12)
            this.anticipationPosition = {
                x: targetX + cos(angle) * radius,
                y: targetY + sin(angle) * radius
            };
            this.anticipating = true;
        }

        // Swim to anticipation position
        let dx = this.anticipationPosition.x - this.x;
        let dy = this.anticipationPosition.y - this.y;
        let distance = sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            // Still swimming to position
            let targetAngle = atan2(dy, dx);
            this.angle = lerp(this.angle, targetAngle, 0.15);
            let moveSpeed = this.speed * 3; // Fast movement to position
            this.x += cos(this.angle) * moveSpeed;
            this.y += sin(this.angle) * moveSpeed;
        } else {
            // At position - gentle hovering/waiting
            this.x = lerp(this.x, this.anticipationPosition.x, 0.05);
            this.y = lerp(this.y, this.anticipationPosition.y, 0.05);
            // Small random movements while waiting
            this.angle += random(-0.1, 0.1);
        }

        this.wiggle += this.wobble;
    }

    findNearbyFish() {
        let nearby = [];
        for (let other of fishes) {
            if (other !== this) {
                let d = dist(this.x, this.y, other.x, other.y);
                if (d < 100) {
                    nearby.push(other);
                }
            }
        }
        return nearby;
    }

    feedOnFlakes(flakes) {
        // Each fish targets its specifically assigned food piece

        // If current target is eaten, release it
        if (this.targetFlake && this.targetFlake.isEaten()) {
            this.targetFlake.releaseFish();
            this.targetFlake = null;
            this.eating = false;
            this.feedingOffset = null;
        }

        // Find the specific food piece assigned to this fish (if we don't have one)
        if (!this.targetFlake) {
            let targetFlake = null;

            for (let flake of flakes) {
                // Look for MY specific assigned letter AND piece index
                if (flake.letterIndex === this.assignedLetterIndex &&
                    flake.pieceIndex === this.assignedPieceIndex) {
                    // Only target SETTLED flakes that aren't eaten
                    if (flake.settled && !flake.isEaten()) {
                        targetFlake = flake;
                        break; // Found our assigned piece!
                    }
                }
            }

            if (targetFlake) {
                this.targetFlake = targetFlake;
                this.eating = false;
                // Use anticipation position as feeding offset if available, otherwise create new one
                if (this.anticipationPosition) {
                    this.feedingOffset = {
                        x: this.anticipationPosition.x - targetFlake.x,
                        y: this.anticipationPosition.y - targetFlake.y
                    };
                } else {
                    // Fallback: create random offset (tighter for clearer letters)
                    let angle = random(TWO_PI);
                    let radius = random(2, 8); // Reduced max radius for tighter clustering (was 12)
                    this.feedingOffset = {
                        x: cos(angle) * radius,
                        y: sin(angle) * radius
                    };
                }
            } else {
                // Our assigned food piece isn't available yet - just swim
                this.swim();
                return;
            }
        }

        // Swim to the food piece (with offset)
        if (this.targetFlake && this.feedingOffset) {
            // Target position is food location + random offset
            let targetX = this.targetFlake.x + this.feedingOffset.x;
            let targetY = this.targetFlake.y + this.feedingOffset.y;

            let dx = targetX - this.x;
            let dy = targetY - this.y;
            let distance = sqrt(dx * dx + dy * dy);

            if (distance < 15) {
                // Close enough - eating!
                if (!this.eating) {
                    this.targetFlake.claimFish();
                    this.eating = true;
                }

                // Stay near the offset position around food
                this.x = lerp(this.x, targetX, 0.08);
                this.y = lerp(this.y, targetY, 0.08);

                // Face towards the actual food piece
                let foodDx = this.targetFlake.x - this.x;
                let foodDy = this.targetFlake.y - this.y;
                let targetAngle = atan2(foodDy, foodDx);
                this.angle = lerp(this.angle, targetAngle, 0.1);

                // Gentle wiggle while eating
                this.wiggle += this.wobble * 0.5;
            } else {
                // Swim towards offset position
                let targetAngle = atan2(dy, dx);
                this.angle = lerp(this.angle, targetAngle, 0.15); // Faster turning

                // Move towards food - much faster!
                let moveSpeed = this.speed * 4; // 4x speed when swimming to food
                this.x += cos(this.angle) * moveSpeed;
                this.y += sin(this.angle) * moveSpeed;

                this.wiggle += this.wobble;
            }
        } else {
            // No target - swim normally
            this.swim();
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);

        // Tail (fan-shaped) with smooth multi-frequency wiggle
        let tailWiggle = sin(this.wiggle * 2) * 0.25;
        tailWiggle += sin(this.wiggle * 3.5) * 0.15; // Secondary wiggle frequency
        fill(this.palette.tail);
        stroke(red(this.palette.tail) * 0.7, green(this.palette.tail) * 0.7, blue(this.palette.tail) * 0.7);
        strokeWeight(1);

        beginShape();
        vertex(-this.size * 0.8, 0);
        vertex(-this.size * 1.4, -this.size * 0.6 + tailWiggle);
        vertex(-this.size * 1.5, tailWiggle * 0.3);
        vertex(-this.size * 1.4, this.size * 0.6 - tailWiggle);
        endShape(CLOSE);

        // Body (small oval) with subtle squash and stretch
        let bodyStretch = 1 + sin(this.wiggle * 2) * 0.05;
        fill(this.palette.body);
        stroke(red(this.palette.body) * 0.7, green(this.palette.body) * 0.7, blue(this.palette.body) * 0.7);
        strokeWeight(1);
        ellipse(0, 0, this.size * 1.5 * bodyStretch, this.size / bodyStretch);

        // Dorsal fin with smooth wave
        let finWave = sin(this.wiggle * 1.5 + this.finOffset) * 0.15;
        finWave += sin(this.wiggle * 2.8 + this.finOffset * 1.3) * 0.08;
        fill(this.palette.tail);
        noStroke();
        triangle(
            -this.size * 0.2, -this.size * 0.5,
            this.size * 0.1, -this.size * 0.8 + finWave,
            this.size * 0.3, -this.size * 0.5
        );

        // Pectoral fins with gentle flapping
        let finFlap = sin(this.wiggle * 1.2) * 0.1;
        fill(this.palette.tail);
        push();
        translate(this.size * 0.2, this.size * 0.4);
        rotate(finFlap);
        ellipse(0, 0, this.size * 0.4, this.size * 0.6);
        pop();

        push();
        translate(this.size * 0.2, -this.size * 0.4);
        rotate(-finFlap);
        ellipse(0, 0, this.size * 0.4, this.size * 0.6);
        pop();

        // Eye with subtle movement
        fill(255);
        noStroke();
        let eyeShift = sin(this.wiggle * 0.5) * 0.02;
        ellipse(this.size * 0.4 + eyeShift, -this.size * 0.15, this.size * 0.3, this.size * 0.3);
        fill(0);
        ellipse(this.size * 0.45 + eyeShift, -this.size * 0.15, this.size * 0.15, this.size * 0.15);

        pop();
    }
}
