// Fibonacci Golden Spiral Animation
// Instagram Reels format: 1080x1920, 30fps

const PHI = 1.618033988749895; // Golden ratio
let currentAngle;
let maxAngle;
let animationComplete;
let totalFrames;
let currentFrame;
let recording = false; // Set to true to record frames

function setup() {
    createCanvas(1080, 1920);
    frameRate(30);
    colorMode(HSB, 360, 100, 100, 255);

    currentAngle = 0;
    animationComplete = false;
    totalFrames = 10 * 30; // 10 seconds at 30fps
    currentFrame = 0;

    // Set max angle to 25 rotations to fill frame
    maxAngle = TWO_PI * 25;
}

function draw() {
    background(0, 0, 5);

    // Animate spiral growth over 10 seconds
    if (!animationComplete && currentFrame < totalFrames) {
        currentFrame++;
        currentAngle = map(currentFrame, 0, totalFrames, 0, maxAngle);
    } else {
        animationComplete = true;
        if (recording) {
            console.log('Recording complete!');
            noLoop();
        }
    }

    translate(width / 2, height / 2);

    // Draw golden spiral using color
    let angleStep = 0.02; // Smaller step = more dots

    for (let angle = 0; angle < currentAngle; angle += angleStep) {
        // Golden spiral formula with slower growth rate
        let radius = 3 * pow(PHI, angle / (PI * 4));

        // Calculate position
        let x = radius * cos(angle);
        let y = radius * sin(angle);

        // Dot size grows with the spiral
        let dotWidth = 1.5 * pow(PHI, angle / (PI * 4));
        let dotHeight = dotWidth * 3; // Vertical is much longer

        // Draw white oval with thin black outline
        stroke(0);
        strokeWeight(1);
        fill(255);
        ellipse(x, y, dotWidth, dotHeight);
    }

    // Record frame if recording is enabled (after drawing)
    if (recording && !animationComplete) {
        saveCanvas(`Fibonacci${nf(currentFrame, 3)}`, 'png');
    }
}

