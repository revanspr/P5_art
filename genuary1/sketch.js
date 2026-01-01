let particles = [];
let font;
let textPoints = [];
let capturer;
let recording = false;
let recordingDuration = 10; // seconds
let fps = 30;
let recordingStarted = false;

function preload() {
    font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
    createCanvas(450, 800);
    frameRate(fps);

    // Initialize capturer for automatic recording (check if CCapture is loaded)
    if (typeof CCapture !== 'undefined') {
        capturer = new CCapture({
            format: 'webm',
            framerate: fps,
            verbose: true,
            name: 'circles_animation'
        });
    }

    // Get points from text
    let centerX = width / 2;
    let centerY = height / 2;
    let radius = width * 0.3;

    // Create text points for each letter arranged in a circle
    let word = 'CIRCLES';
    let angleStep = TWO_PI / word.length;

    for (let i = 0; i < word.length; i++) {
        let angle = i * angleStep - HALF_PI; // Start from top
        let x = centerX + cos(angle) * radius;
        let y = centerY + sin(angle) * radius;

        // Get points for this letter
        let bounds = font.textBounds(word[i], 0, 0, 120);
        let letterPoints = font.textToPoints(word[i], 0, 0, 120, {
            sampleFactor: 1.5
        });

        // Rotate and position points
        for (let pt of letterPoints) {
            // Center the letter points
            let offsetX = pt.x - bounds.w / 2;
            let offsetY = pt.y - bounds.h / 2;

            // Rotate point around origin
            let rotatedX = offsetX * cos(angle) - offsetY * sin(angle);
            let rotatedY = offsetX * sin(angle) + offsetY * cos(angle);

            // Position at circle location
            textPoints.push({
                x: x + rotatedX,
                y: y + rotatedY
            });
        }
    }

    // Create flowing particles
    for (let pt of textPoints) {
        particles.push(new Particle(pt.x, pt.y));
    }
}

function draw() {
    background(0);

    // Start recording on first frame
    if (!recordingStarted && capturer) {
        capturer.start();
        recording = true;
        recordingStarted = true;
        console.log('Recording started automatically...');
    }

    // Update and display particles
    for (let p of particles) {
        p.update();
        p.show();
    }

    // Recording logic
    if (recording) {
        capturer.capture(document.getElementById('defaultCanvas0'));

        if (frameCount >= recordingDuration * fps) {
            recording = false;
            capturer.stop();
            capturer.save();
            console.log('Recording complete! Download will start automatically.');
            console.log('Note: File is in WEBM format. Convert to MP4 using an online converter or FFmpeg.');
        }
    }
}

function keyPressed() {
    // Press 'r' to start recording
    if (key === 'r' || key === 'R') {
        if (!recording && typeof CCapture !== 'undefined') {
            capturer = new CCapture({
                format: 'webm',
                framerate: fps,
                verbose: true
            });

            recording = true;
            frameCount = 0;
            capturer.start();
            console.log('Recording started...');
        }
    }
}

class Particle {
    constructor(targetX, targetY) {
        this.target = createVector(targetX, targetY);
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 3;
        this.maxForce = 0.2;
        this.offset = createVector(random(-2, 2), random(-2, 2));
    }

    update() {
        // Flow effect - add slight random movement
        let flowAngle = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01) * TWO_PI * 2;
        let flow = p5.Vector.fromAngle(flowAngle);
        flow.mult(0.1);

        // Seek target with offset
        let desired = p5.Vector.sub(this.target, this.pos);
        desired.add(this.offset);
        let d = desired.mag();

        if (d < 5) {
            let m = map(d, 0, 5, 0, this.maxSpeed);
            desired.setMag(m);
        } else {
            desired.setMag(this.maxSpeed);
        }

        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);

        this.acc.add(steer);
        this.acc.add(flow);

        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    show() {
        noStroke();
        fill(0, 200, 255, 255);
        circle(this.pos.x, this.pos.y, 4);
    }
}

function windowResized() {
    resizeCanvas(450, 800);
    particles = [];
    textPoints = [];
    setup();
}
