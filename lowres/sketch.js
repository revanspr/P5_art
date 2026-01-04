// Lowres One Tree Hill
// Instagram Reels format: 1080x1920, 30fps

let pixelSize = 8; // Size of each "pixel" for lowres effect
let cols, rows;
let tree;
let recording = false; // Set to true to record frames
let flowers = [];

// Hill parameters (in pixel coordinates)
let hillCenterX, hillPeakY, hillWidth;
let horizonY;

function setup() {
    createCanvas(1080, 1920);
    frameRate(30);
    noSmooth(); // Disable anti-aliasing for sharp pixels

    cols = width / pixelSize;
    rows = height / pixelSize;

    // Define horizon line (low in frame)
    horizonY = rows * 0.85;

    // Define hill parameters (shifted right, more earth)
    hillCenterX = cols * 0.6; // Shifted right
    hillPeakY = rows * 0.55; // Peak higher up for more earth
    hillWidth = cols * 0.8;

    // Create tree at the top of the hill (no gap)
    tree = new Tree(hillCenterX, hillPeakY, -90, 0);

    // Create flowers on the ground
    for (let i = 0; i < 30; i++) {
        let fx = random(5, cols - 5);
        let fy = horizonY + random(0, rows - horizonY - 5);
        let fcolor = random(['red', 'yellow', 'pink', 'purple', 'white']);
        flowers.push({x: fx, y: fy, color: fcolor});
    }
}

function draw() {
    // Draw sky
    drawSky();

    // Draw ground (flat earth at horizon)
    drawGround();

    // Draw hill
    drawHill();

    // Draw flowers
    drawFlowers();

    // Update and draw tree
    tree.update();
    tree.display();

    // Record frame if recording is enabled
    if (recording) {
        saveCanvas(`lowres${nf(frameCount, 4)}`, 'png');
    }
}

function drawSky() {
    // Sunset gradient sky from orange/pink to purple/blue
    for (let y = 0; y < rows; y++) {
        let t = y / rows;

        // Sunset colors: orange at top, pink in middle, purple at bottom
        let r, g, b;
        if (t < 0.3) {
            // Orange to pink
            r = map(t, 0, 0.3, 255, 255);
            g = map(t, 0, 0.3, 140, 100);
            b = map(t, 0, 0.3, 50, 150);
        } else if (t < 0.6) {
            // Pink to purple
            r = map(t, 0.3, 0.6, 255, 150);
            g = map(t, 0.3, 0.6, 100, 50);
            b = map(t, 0.3, 0.6, 150, 200);
        } else {
            // Purple to dark blue
            r = map(t, 0.6, 1.0, 150, 50);
            g = map(t, 0.6, 1.0, 50, 50);
            b = map(t, 0.6, 1.0, 200, 150);
        }

        fill(r, g, b);
        noStroke();
        rect(0, y * pixelSize, width, pixelSize);
    }
}

function drawGround() {
    // Draw flat green earth from horizon to bottom
    fill(34, 139, 34);
    noStroke();

    for (let y = horizonY; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            // Vary green slightly for texture
            let variation = (x * 3 + y * 5) % 10 - 5;
            fill(34 + variation, 139 + variation, 34 + variation);
            rect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
}

function drawHill() {
    // Draw rolling hill using a parabola (on top of ground)
    fill(34, 139, 34); // Green
    noStroke();

    for (let y = hillPeakY; y < horizonY; y++) {
        for (let x = 0; x < cols; x++) {
            // Parabolic hill shape
            let hillHeight = hillPeakY + pow((x - hillCenterX) / (hillWidth / 2), 2) * (horizonY - hillPeakY);

            if (y >= hillHeight && y < horizonY) {
                // Vary green slightly for texture
                let variation = (x * 3 + y * 5) % 10 - 5;
                fill(44 + variation, 149 + variation, 44 + variation);
                rect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

function drawFlowers() {
    noStroke();

    for (let flower of flowers) {
        // Flower color
        let c;
        switch(flower.color) {
            case 'red':
                c = color(220, 20, 60);
                break;
            case 'yellow':
                c = color(255, 215, 0);
                break;
            case 'pink':
                c = color(255, 182, 193);
                break;
            case 'purple':
                c = color(147, 112, 219);
                break;
            case 'white':
                c = color(255, 255, 255);
                break;
        }

        // Draw simple flower (center + 4 petals)
        fill(c);
        rect((flower.x - 1) * pixelSize, flower.y * pixelSize, pixelSize, pixelSize); // left
        rect((flower.x + 1) * pixelSize, flower.y * pixelSize, pixelSize, pixelSize); // right
        rect(flower.x * pixelSize, (flower.y - 1) * pixelSize, pixelSize, pixelSize); // top
        rect(flower.x * pixelSize, (flower.y + 1) * pixelSize, pixelSize, pixelSize); // bottom

        // Yellow center
        fill(255, 215, 0);
        rect(flower.x * pixelSize, flower.y * pixelSize, pixelSize, pixelSize);

        // Green stem
        fill(34, 100, 34);
        rect(flower.x * pixelSize, (flower.y + 2) * pixelSize, pixelSize, pixelSize);
        rect(flower.x * pixelSize, (flower.y + 3) * pixelSize, pixelSize, pixelSize);
    }
}

class Tree {
    constructor(x, y, angle, depth) {
        this.x = x;
        this.y = y;
        this.angle = angle; // degrees
        this.depth = depth;
        this.maxDepth = 5;
        this.length = 0;
        this.maxLength = depth === 0 ? 20 : 8; // Trunk is longer
        this.growing = true;
        this.children = [];
        this.segments = [];
        this.branchProbability = 0.3;
    }

    update() {
        if (this.growing) {
            this.length += 0.2;

            // Add segment to path
            if (this.length >= 1 && this.segments.length < this.maxLength) {
                let rad = radians(this.angle);
                let newX = this.x + cos(rad);
                let newY = this.y + sin(rad);

                this.segments.push({x: newX, y: newY});
                this.x = newX;
                this.y = newY;
                this.length = 0;

                // Slight angle variation
                this.angle += random(-5, 5);

                // Branch
                if (random() < this.branchProbability && this.depth < this.maxDepth && this.segments.length > 3) {
                    this.branch();
                }
            }

            if (this.segments.length >= this.maxLength) {
                this.growing = false;
            }
        }

        // Update children
        for (let child of this.children) {
            child.update();
        }
    }

    branch() {
        // Create two branches
        let leftAngle = this.angle - random(25, 35);
        let rightAngle = this.angle + random(25, 35);

        this.children.push(new Tree(this.x, this.y, leftAngle, this.depth + 1));
        this.children.push(new Tree(this.x, this.y, rightAngle, this.depth + 1));
    }

    display() {
        // Draw trunk/branches (brown)
        fill(101, 67, 33);
        noStroke();

        for (let seg of this.segments) {
            rect(seg.x * pixelSize, seg.y * pixelSize, pixelSize, pixelSize);
        }

        // Draw children
        for (let child of this.children) {
            child.display();
        }

        // Add leaves at branch ends (dark green)
        if (!this.growing && this.depth >= 2) {
            fill(34, 100, 34);
            rect(this.x * pixelSize, this.y * pixelSize, pixelSize * 2, pixelSize * 2);
            rect((this.x - 1) * pixelSize, this.y * pixelSize, pixelSize, pixelSize);
            rect((this.x + 1) * pixelSize, this.y * pixelSize, pixelSize, pixelSize);
        }
    }
}
