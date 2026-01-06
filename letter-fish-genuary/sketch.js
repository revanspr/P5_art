// Instagram Reel dimensions (1080x1920)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

// Frame recording settings
let isRecording = false; // Set to true to record frames
let recordingFrameCount = 0;
const TOTAL_RECORDING_FRAMES = 300; // 300 frames at 30fps = 10 seconds

let fishes = [];
let bubbles = [];
let foodFlakes = [];
let animationState = 'swimming'; // Start with swimming
let totalDrops = 0;
const MAX_DROPS = 2; // Only 2 waves for 10 second reel
let firstWaveDropped = false;
let animationTimer = 0;
const LOOP_DURATION = 300; // 10 seconds at 30fps
const SWIM_START_DURATION = 30; // 1 second of swimming at start (at 30fps)
const FEEDING_START = 30; // Start feeding at 1 second (at 30fps)
const SECOND_WAVE_START = 120; // Second wave starts at 4 seconds
const FEEDING_END = 270; // End feeding at 9 seconds, return to swimming for seamless loop

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

    // Create many small guppy fish (increased: 400-500 fish for better letter visibility)
    // Each fish is assigned to one of the 7 flakes (letters)
    let totalFish = int(random(400, 500));
    for (let i = 0; i < totalFish; i++) {
        let assignedFlakeIndex = i % 7; // Assign fish to one of 7 flakes (0-6)
        fishes.push(new Guppy(
            random(width),
            random(height / 2, height - 200), // Start in bottom half
            random(TWO_PI),
            i,  // Give each fish a unique index
            assignedFlakeIndex  // Which flake (letter) this fish belongs to
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
            animationTimer = 0;
            totalDrops = 0;
            firstWaveDropped = false;
            foodFlakes = [];
            animationState = 'swimming';

            for (let fish of fishes) {
                if (fish.targetFlake) {
                    fish.targetFlake.releaseFish();
                }
                fish.targetFlake = null;
                fish.eating = false;
            }
        }
    } else if (isRecording && recordingFrameCount < TOTAL_RECORDING_FRAMES) {
        // During recording, animation timer matches the current frame being recorded
        animationTimer = recordingFrameCount;
    }

    // State transitions for seamless loop
    if (animationTimer === FEEDING_START) {
        // Transition from swimming to feeding
        animationState = 'feeding';
    } else if (animationTimer === FEEDING_END) {
        // Transition back to swimming for seamless loop
        animationState = 'swimming';
        // Clear remaining flakes
        foodFlakes = [];
        // Reset all fish to swimming state
        for (let fish of fishes) {
            if (fish.targetFlake) {
                fish.targetFlake.releaseFish();
            }
            fish.targetFlake = null;
            fish.eating = false;
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

    // Drop food flakes at specific times for 10-second reel
    if (animationState === 'feeding') {
        // Drop first wave at start of feeding (frame 30 / 1 second)
        if (animationTimer === FEEDING_START && !firstWaveDropped) {
            dropFoodFlakes();
            firstWaveDropped = true;
            totalDrops = 1;
        }

        // Drop second wave at 4 seconds (frame 120) - this will be most legible
        if (animationTimer === SECOND_WAVE_START && totalDrops === 1) {
            dropFoodFlakes();
            totalDrops = 2;
        }
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
        if (animationState === 'feeding' && foodFlakes.length > 0) {
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

    // Cave structure (gray/brown rock)
    fill(80, 70, 60);
    stroke(60, 50, 40);
    strokeWeight(2);

    // Cave main body
    beginShape();
    vertex(-80, 0);
    vertex(-90, -80);
    vertex(-60, -130);
    vertex(0, -140);
    vertex(60, -130);
    vertex(90, -80);
    vertex(80, 0);
    endShape(CLOSE);

    // Cave opening (dark)
    fill(20, 20, 25);
    ellipse(0, -50, 70, 80);

    // Rock texture
    fill(100, 90, 80, 100);
    noStroke();
    ellipse(-40, -70, 30, 25);
    ellipse(35, -90, 25, 20);
    ellipse(-20, -110, 20, 18);

    // Moss/algae on rocks
    fill(40, 80, 40, 120);
    ellipse(-50, -30, 35, 20);
    ellipse(40, -40, 30, 18);

    pop();

    // Draw clam in front of cave (moved to the right)
    drawClam(280, height - 150);
}

function drawClam(x, y) {
    push();
    translate(x, y);

    // Bottom shell
    fill(180, 160, 140);
    stroke(140, 120, 100);
    strokeWeight(2);
    arc(0, 0, 80, 50, 0, PI);

    // Top shell (opens and closes)
    push();
    rotate(-clamOpenAmount);
    fill(190, 170, 150);
    stroke(150, 130, 110);
    arc(0, 0, 80, 50, PI, TWO_PI);

    // Shell ridges
    stroke(130, 110, 90);
    strokeWeight(1);
    for (let i = -30; i < 30; i += 10) {
        line(i, -5, i, -20);
    }
    pop();

    // Pearl inside when open
    if (clamOpenAmount > 0.3) {
        fill(255, 250, 240);
        noStroke();
        ellipse(0, -5, 15, 15);
        fill(255, 255, 255, 200);
        ellipse(-2, -7, 6, 6);
    }

    pop();
}

function drawCastleOrnament() {
    push();
    translate(width - 200, height - 150); // Moved right and on gravel surface

    // Castle base
    fill(160, 160, 180);
    stroke(120, 120, 140);
    strokeWeight(2);
    rect(-100, -80, 200, 80);

    // Castle towers
    rect(-90, -180, 60, 100);
    rect(30, -180, 60, 100);
    rect(-30, -140, 60, 60);

    // Tower tops (battlements)
    fill(140, 140, 160);
    for (let i = -90; i < -30; i += 15) {
        rect(i, -190, 10, 10);
    }
    for (let i = 30; i < 90; i += 15) {
        rect(i, -190, 10, 10);
    }
    for (let i = -30; i < 30; i += 15) {
        rect(i, -150, 10, 10);
    }

    // Windows
    fill(60, 60, 80);
    rect(-70, -150, 20, 30);
    rect(50, -150, 20, 30);
    rect(-10, -120, 20, 25);

    // Door
    fill(80, 60, 40);
    arc(0, -40, 40, 60, PI, TWO_PI);
    rect(-20, -40, 40, 40);

    // Moss/algae
    fill(40, 80, 40, 120);
    noStroke();
    ellipse(-80, -50, 30, 20);
    ellipse(60, -60, 35, 22);

    pop();

    // Draw treasure chest next to castle (moved to the left)
    drawTreasureChest(width - 350, height - 150);
}

function drawTreasureChest(x, y) {
    push();
    translate(x, y);

    // Chest bottom
    fill(101, 67, 33);
    stroke(70, 45, 20);
    strokeWeight(2);
    rect(-40, -20, 80, 40, 5);

    // Chest lid
    push();
    translate(0, -20);
    rotate(-chestOpenAmount);
    fill(110, 75, 38);
    stroke(75, 50, 23);
    arc(0, 0, 80, 40, PI, TWO_PI);
    rect(-40, 0, 80, 10);

    // Metal bands
    stroke(180, 160, 100);
    strokeWeight(3);
    line(-30, -15, -30, 5);
    line(30, -15, 30, 5);
    line(0, -15, 0, 5);
    pop();

    // Lock
    fill(180, 160, 100);
    stroke(140, 120, 70);
    strokeWeight(2);
    ellipse(0, -10, 12, 12);

    // Treasure inside when open
    if (chestOpenAmount > 0.5) {
        // Gold coins
        fill(255, 215, 0);
        ellipse(-10, -25, 12, 12);
        ellipse(5, -28, 10, 10);
        ellipse(-5, -30, 11, 11);

        // Gems
        fill(255, 50, 100);
        ellipse(10, -26, 8, 8);
        fill(50, 150, 255);
        ellipse(15, -23, 7, 7);
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

    if (clamState === 'closed' && clamTimer > 180) {
        clamState = 'opening';
        clamTimer = 0;
    } else if (clamState === 'opening') {
        clamOpenAmount = lerp(clamOpenAmount, PI / 3, 0.05);
        if (clamOpenAmount > PI / 3 - 0.1) {
            clamState = 'open';
            clamTimer = 0;
            // Release bubbles (doubled count)
            for (let i = 0; i < 10; i++) {
                bubbles.push(new Bubble(280, height - 150));
            }
        }
    } else if (clamState === 'open' && clamTimer > 90) {
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

    if (chestState === 'closed' && chestTimer > 200) {
        chestState = 'opening';
        chestTimer = 0;
    } else if (chestState === 'opening') {
        chestOpenAmount = lerp(chestOpenAmount, PI / 2.5, 0.05);
        if (chestOpenAmount > PI / 2.5 - 0.1) {
            chestState = 'open';
            chestTimer = 0;
            // Release bubbles (doubled count)
            for (let i = 0; i < 12; i++) {
                bubbles.push(new Bubble(width - 350, height - 150));
            }
        }
    } else if (chestState === 'open' && chestTimer > 100) {
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

    const letterSpacing = 150; // Spacing between letters (matches FoodFlake spacing)
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
    let scale = 60; // Even larger scale for clearly visible letters on 1920px tall canvas

    switch(letter) {
        case 'G':
            positions = [
                {x: -2*scale, y: -3*scale}, {x: -2*scale, y: -1.5*scale}, {x: -2*scale, y: 0}, {x: -2*scale, y: 1.5*scale}, {x: -2*scale, y: 3*scale},
                {x: 0, y: -3*scale}, {x: 1*scale, y: -3*scale}, {x: 2*scale, y: -3*scale},
                {x: 0, y: 3*scale}, {x: 1*scale, y: 3*scale}, {x: 2*scale, y: 3*scale},
                {x: 2*scale, y: 1.5*scale}, {x: 0, y: 0}, {x: 1*scale, y: 0}, {x: 0.5*scale, y: 1.5*scale}
            ];
            break;
        case 'E':
            positions = [
                {x: -2*scale, y: -3*scale}, {x: -2*scale, y: -1.5*scale}, {x: -2*scale, y: 0}, {x: -2*scale, y: 1.5*scale}, {x: -2*scale, y: 3*scale},
                {x: 0, y: -3*scale}, {x: 1*scale, y: -3*scale}, {x: 1.5*scale, y: -3*scale},
                {x: 0, y: 0}, {x: 0.5*scale, y: 0}, {x: 1*scale, y: 0},
                {x: 0, y: 3*scale}, {x: 1*scale, y: 3*scale}, {x: 1.5*scale, y: 3*scale}, {x: -1*scale, y: -1.5*scale}
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

        // Calculate letter center position - centered horizontally, 50% down vertically
        const letterSpacing = 150; // Spacing between letter centers (wider for clarity)
        const totalWidth = 6 * letterSpacing; // 6 gaps between 7 letters
        const firstLetterX = (width - totalWidth) / 2;
        let letterCenterX = firstLetterX + letterIndex * letterSpacing;
        let letterCenterY = height * 0.50; // Letters at 50% height (middle of screen)

        // Target position spreads out from letter center to form the shape
        this.targetX = letterCenterX + myPosition.x;
        this.targetY = letterCenterY + myPosition.y;

        this.size = random(6, 9); // Small pieces
        this.fallSpeed = random(2.5, 3.2);
        this.wobble = random(0.01, 0.03);
        this.wobbleOffset = random(TWO_PI);
        this.fishEating = 0; // Number of fish eating this piece
        this.eatenAmount = 0; // How much has been eaten (0-1)
        this.settled = false;
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
                this.x = lerp(this.x, this.targetX, 0.15);
                if (abs(this.x - this.targetX) < 2) {
                    this.settled = true;
                    this.x = this.targetX; // Snap to exact position
                }
            }
        }

        // Get eaten by fish (fish start eating once pieces reach 33%)
        if (this.fishEating > 0) {
            // First wave eats much faster, second wave eats VERY slowly for better legibility
            let eatRate = this.waveNumber === 1 ? 0.015 : 0.003;
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
    constructor(x, y, startAngle, fishIndex, assignedFlakeIndex) {
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
        this.assignedFlakeIndex = assignedFlakeIndex; // Which flake (0-6) this fish is assigned to

        // Feeding behavior
        this.targetFlake = null;
        this.eating = false;
    }

    swim() {
        // More natural swimming with varied vertical movement
        let nearby = this.findNearbyFish();
        let alignment = createVector(0, 0);
        let cohesion = createVector(0, 0);
        let separation = createVector(0, 0);

        if (nearby.length > 0) {
            // Weaker alignment to prevent horizontal clustering
            for (let other of nearby) {
                alignment.add(createVector(cos(other.angle), sin(other.angle)));
            }
            alignment.div(nearby.length);
            alignment.mult(0.02); // Reduced from 0.05

            // Weaker cohesion for more dispersal
            for (let other of nearby) {
                cohesion.add(createVector(other.x, other.y));
            }
            cohesion.div(nearby.length);
            cohesion.sub(createVector(this.x, this.y));
            cohesion.normalize();
            cohesion.mult(0.01); // Reduced from 0.02

            // Stronger separation to prevent clustering
            for (let other of nearby) {
                let d = dist(this.x, this.y, other.x, other.y);
                if (d < 60 && d > 0) { // Increased from 40
                    let diff = createVector(this.x - other.x, this.y - other.y);
                    diff.div(d);
                    separation.add(diff);
                }
            }
            if (nearby.length > 0) {
                separation.div(nearby.length);
                separation.mult(0.15); // Increased from 0.1
            }
        }

        // Apply forces with more randomness
        let targetAngle = this.angle + alignment.heading() * 0.2 + cohesion.heading() * 0.1 + separation.heading() * 0.5;
        this.angle = lerp(this.angle, targetAngle, 0.08);

        // Strong random wandering for varied paths
        this.angle += random(-0.2, 0.2); // Increased from -0.08, 0.08

        // Vary speed for more natural movement
        let speedVariation = sin(frameCount * 0.05 + this.fishIndex) * 0.3;
        let currentSpeed = this.speed * (1 + speedVariation);

        // Move with varied direction
        this.x += cos(this.angle) * currentSpeed;
        this.y += sin(this.angle) * currentSpeed;

        // Wrap around edges smoothly
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;

        // Gentler boundary behavior with more vertical variation
        if (this.y < height * 0.5) {
            this.y = height * 0.5 + random(0, 20);
            this.angle = random(0, PI); // Random downward angle
        }
        if (this.y > height - 170) {
            this.y = height - 170 - random(0, 20);
            this.angle = random(PI, TWO_PI); // Random upward angle
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
        // Simple behavior: find closest food from my assigned letter and swim to it

        // If current target is eaten, release it
        if (this.targetFlake && this.targetFlake.isEaten()) {
            this.targetFlake.releaseFish();
            this.targetFlake = null;
            this.eating = false;
        }

        // Find a food piece to target (if we don't have one)
        if (!this.targetFlake) {
            let closestFlake = null;
            let closestDist = Infinity;
            const DETECTION_HEIGHT = height * 0.33; // Fish notice flakes at 33% from top

            for (let flake of flakes) {
                // Only look at food from my assigned letter
                if (flake.letterIndex === this.assignedFlakeIndex) {
                    // Only target visible flakes that aren't eaten
                    if (flake.y >= DETECTION_HEIGHT && !flake.isEaten()) {
                        let d = dist(this.x, this.y, flake.x, flake.y);
                        if (d < closestDist) {
                            closestDist = d;
                            closestFlake = flake;
                        }
                    }
                }
            }

            if (closestFlake) {
                this.targetFlake = closestFlake;
                this.eating = false;
            } else {
                // No food available - just swim
                this.swim();
                return;
            }
        }

        // Swim directly to the food piece
        if (this.targetFlake) {
            let dx = this.targetFlake.x - this.x;
            let dy = this.targetFlake.y - this.y;
            let distance = sqrt(dx * dx + dy * dy);

            if (distance < 20) {
                // Close enough - eating!
                if (!this.eating) {
                    this.targetFlake.claimFish();
                    this.eating = true;
                }

                // Stay near the food piece
                this.x = lerp(this.x, this.targetFlake.x, 0.1);
                this.y = lerp(this.y, this.targetFlake.y, 0.1);

                // Face the food
                let targetAngle = atan2(dy, dx);
                this.angle = lerp(this.angle, targetAngle, 0.1);

                // Gentle wiggle while eating
                this.wiggle += this.wobble * 0.5;
            } else {
                // Swim towards food
                let targetAngle = atan2(dy, dx);
                this.angle = lerp(this.angle, targetAngle, 0.1);

                // Move towards food
                let moveSpeed = this.speed * 2;
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
