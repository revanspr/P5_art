# P5.js Generative Art Collection

This repository contains my generative art projects created with p5.js.

## Structure

Each project is organized in its own subdirectory with the following structure:

```
project-name/
├── index.html
├── sketch.js
└── style.css (optional)
```

## Projects

### 1. Golden Ratio Spiral
**Directory:** `golden-ratio-spiral/`

An animated visualization that creates a golden ratio spiral with rainbow pastel colors on a black background. The spiral animates from a=1 to a=1000 and back, with progressive line thickness and color brightness that change based on the spiral's position.

**Features:**
- Smooth bezier curves creating flowing spiral patterns
- Rainbow color progression (7 pastel colors) cycling every 10 calculations
- Progressive line thickness (1-10px) increasing as the spiral grows
- Dynamic brightness adjustment (10 levels) getting darker as spiral expands
- Configurable loop count with decimal support (e.g., 10.5 loops)
- High-speed animation (2ms update interval)

### 2. Multiple Goldies
**Directory:** `multiple-goldies/`

A new project incorporating the golden ratio spiral concept. Currently initialized with the base golden-ratio-spiral code as a starting point for further development.

**Status:** In development
