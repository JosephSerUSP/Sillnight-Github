import { Config } from '../Config.js';

export class TransitionManager {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.frameId = null;
        this.isActive = false;
        this.startTime = 0;
        this.duration = 1000;
        this.type = null; // 'BATTLE_START', 'BATTLE_INTRO', 'MAP_OUT', 'MAP_IN'
        this.resolvePromise = null;

        // Quad buffer
        this.buffer = null;

        // Texture for screen capture (optional, if we want to distort the previous frame)
        // For now, we will use procedural patterns on black/transparent.
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'transition-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.inset = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '9999'; // Below CRT (which is 9999 in css? wait, crt is 9999. Let's adjust.)
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.display = 'none';

        // Append to wrapper or container
        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.canvas);
        } else {
            console.error("TransitionManager: #game-container not found.");
            return;
        }

        // Init GL
        this.gl = this.canvas.getContext('webgl', { alpha: true, depth: false, antialias: false });
        if (!this.gl) {
            console.error("TransitionManager: WebGL not supported.");
            return;
        }

        this.setupBuffers();
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        // Match internal logic resolution or container size?
        // Since this is a fullscreen effect over the container, we should match the canvas size to the CSS size or a fixed high res?
        // Let's use the logic resolution for pixel consistency: 960x540
        this.canvas.width = 960;
        this.canvas.height = 540;
        this.gl.viewport(0, 0, 960, 540);
    }

    setupBuffers() {
        const gl = this.gl;
        const vertices = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0
        ]);

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    }

    compileShader(src, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vsSrc, fsSrc) {
        const gl = this.gl;
        const vs = this.compileShader(vsSrc, gl.VERTEX_SHADER);
        const fs = this.compileShader(fsSrc, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    // --- TRANSITION METHODS ---

    /**
     * Start battle transition: Swirl + Fade to Black.
     */
    async startBattleTransition() {
        this.type = 'BATTLE_START';
        this.duration = 1500;
        return this.run();
    }

    /**
     * Start battle intro: Horizontal Cut In (Opening from black).
     */
    async startBattleIntro() {
        this.type = 'BATTLE_INTRO';
        this.duration = 1500; // Slower reveal
        return this.run();
    }

    /**
     * Map Transfer Out: Diagonal Swipe + Distort -> Black
     */
    async startMapTransitionOut() {
        this.type = 'MAP_OUT';
        this.duration = 1000;
        return this.run();
    }

    /**
     * Map Transfer In: Diagonal Swipe Reveal -> Clear
     */
    async startMapTransitionIn() {
        this.type = 'MAP_IN';
        this.duration = 1000;
        return this.run();
    }

    async run() {
        if (this.isActive) return; // Prevent overlap
        this.isActive = true;
        this.canvas.style.display = 'block';
        this.startTime = performance.now();

        // Select Shader
        const fs = this.getFragmentShader(this.type);
        const vs = `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        if (this.program) this.gl.deleteProgram(this.program);
        this.program = this.createProgram(vs, fs);

        return new Promise(resolve => {
            this.resolvePromise = resolve;
            this.loop();
        });
    }

    loop() {
        if (!this.isActive) return;
        const now = performance.now();
        const elapsed = now - this.startTime;
        const progress = Math.min(1.0, elapsed / this.duration);

        this.render(progress);

        if (progress < 1.0) {
            this.frameId = requestAnimationFrame(() => this.loop());
        } else {
            this.complete();
        }
    }

    complete() {
        this.isActive = false;
        if (this.type === 'BATTLE_START' || this.type === 'MAP_OUT') {
            // Keep canvas visible (black)
        } else {
            // Hide canvas (revealed)
            this.canvas.style.display = 'none';
        }
        if (this.resolvePromise) {
            const r = this.resolvePromise;
            this.resolvePromise = null;
            r();
        }
    }

    render(progress) {
        const gl = this.gl;
        gl.useProgram(this.program);

        const uProgress = gl.getUniformLocation(this.program, 'uProgress');
        const uRes = gl.getUniformLocation(this.program, 'uResolution');
        const uTime = gl.getUniformLocation(this.program, 'uTime');

        gl.uniform1f(uProgress, progress);
        gl.uniform2f(uRes, this.canvas.width, this.canvas.height);
        gl.uniform1f(uTime, performance.now() / 1000.0);

        const posAttrib = gl.getAttribLocation(this.program, 'position');
        gl.enableVertexAttribArray(posAttrib);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    getFragmentShader(type) {
        // Common uniforms
        const header = `
            precision mediump float;
            varying vec2 vUv;
            uniform float uProgress;
            uniform vec2 uResolution;
            uniform float uTime;
        `;

        if (type === 'BATTLE_START') {
            // Swirl + Fade to Black
            // We can't easily capture the screen behind us in a separate canvas context without significant re-architecture (rendering scene to texture).
            // However, the prompt asks for "screen has a swirl like blur".
            // Since we can't distort the actual HTML elements behind the canvas without `backdrop-filter` (which is limited),
            // and `backdrop-filter` doesn't support complex swirls, we might have to fake it or use a simpler effect.
            // BUT: We can simulate the visual confusion.
            // Let's render a "black hole" swirl that consumes the screen.
            // Or: just a procedural swirl pattern that fades in opacity.

            // "screen has a swirl like blur while it fades to black"
            // We can overlay a swirling texture that increases in opacity.
            // We can use a noise function to create a "blur" texture.
            return `${header}

            void main() {
                vec2 uv = vUv - 0.5;
                float dist = length(uv);
                float angle = atan(uv.y, uv.x);

                // Swirl
                float swirl = sin(dist * 10.0 - uTime * 5.0 + angle * 5.0);

                // Vignette closing in
                // uProgress goes 0 -> 1
                // We want transparency at 0, black at 1.

                float alpha = uProgress;

                // Add swirl distortion to opacity?
                // Visualizing: The screen gets darker and darker.
                // The prompt implies the IMAGE swirls. Since we don't have the image,
                // we will create a visual effect that distracts/covers it.
                // Simulating "blur" with noise.

                gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);

                // Let's add the swirl visual as a greyscale additive or subtractive pattern?
                // Actually, just fading to black is boring.
                // Let's make a "implosion" effect.

                float radius = 1.0 - uProgress;
                float swirlStrength = uProgress * 20.0;

                // Just return black with increasing alpha.
                // To support "swirl blur", we'd need the backbuffer.
                // Given constraints, we will do a fancy "fade to black" pattern.

                // Spiral pattern
                float spiral = sin(dist * 30.0 + angle * 6.0 - uProgress * 20.0);
                float mask = step(dist, uProgress * 1.5); // Circle expanding from center?

                // Let's try: Screen starts clear. Then pixels getting pulled into center (simulated by overlaying swirling pixels).
                // Just a simple black fade is safe, but let's try to match "swirl".

                // We will render Black, but alpha is modulated by swirl.
                // As progress increases, alpha goes to 1 everywhere.

                float a = smoothstep(0.0, 1.0, uProgress * 1.5 - (1.0 - dist));
                // Add swirl lines
                float lines = sin(angle * 10.0 + dist * 40.0 * uProgress);

                // Mix
                vec3 col = vec3(0.0);
                gl_FragColor = vec4(col, uProgress + (lines * 0.1 * uProgress));
            }`;
        }

        if (type === 'BATTLE_INTRO') {
            // Horizontal cut in.
            // Screen is black (from previous transition).
            // We reveal the center horizontally.
            // uProgress 0 -> 1 (Reveal)
            return `${header}
            void main() {
                float center = 0.5;
                float halfHeight = uProgress * 0.6; // Expands to 0.6 (full height coverage needed > 0.5)

                float distY = abs(vUv.y - center);

                // If within the opening, alpha = 0. Else alpha = 1.
                // Add a smooth edge.

                float alpha = 1.0 - smoothstep(halfHeight - 0.05, halfHeight, distY);

                // Invert: We want alpha 1 (Black) outside, 0 inside.
                // Wait, smoothstep(edge0, edge1, x) returns 0 if x < edge0, 1 if x > edge1.
                // So inside (distY < halfHeight), it's small.
                // Let's rethink.

                // Solid black where distY > halfHeight.
                float mask = smoothstep(halfHeight, halfHeight + 0.01, distY);

                gl_FragColor = vec4(0.0, 0.0, 0.0, mask);
            }`;
        }

        if (type === 'MAP_OUT') {
            // Diagonal swipe + Distort -> Fade Out (to Black)
            // uProgress 0 -> 1
            return `${header}
            void main() {
                // Diagonal: x + y
                float diag = vUv.x + vUv.y; // Range 0 to 2
                float threshold = uProgress * 2.5; // Move across

                float mask = smoothstep(threshold - 0.2, threshold, diag);

                // "Distort": We can add noise to the edge?
                float noise = sin(vUv.x * 20.0 + uTime) * 0.05;

                float alpha = 1.0 - smoothstep(threshold - 0.2 + noise, threshold + noise, diag);

                // Wait, we want to fade OUT to BLACK.
                // So at progress 0: Transparent.
                // At progress 1: Black.
                // Swipe should fill with black.

                // Current: mask is 1 when diag > threshold (uncovered).
                // We want black where swipe HAS passed.
                // Let's say swipe moves Top-Left to Bottom-Right.
                // diag increases.
                // If diag < threshold, it is BLACK.

                float blackness = step(diag, threshold + noise);
                // Smooth
                blackness = smoothstep(threshold + noise - 0.1, threshold + noise, diag);
                // Actually smoothstep(edge0, edge1, x). if x < edge0 (0), if x > edge1 (1).
                // We want 1 where diag < threshold.
                // so 1.0 - smoothstep.

                float a = 1.0 - smoothstep(threshold - 0.1 + noise, threshold + noise, diag);

                gl_FragColor = vec4(0.0, 0.0, 0.0, a);
            }`;
        }

        if (type === 'MAP_IN') {
             // Diagonal swipe Reveal (Black to Clear)
             // Similar to Out but reversed or continuing?
             // "similar diagonal swipe fades the screen back in"
             // Usually this means the swipe continues, revealing the new map behind it.
             // OR swipe reverses.
             // Let's make it swipe OFF.
             // Initially Full Black. Swipe removes black.
             return `${header}
            void main() {
                float diag = vUv.x + vUv.y;
                // Move threshold from -0.5 to 2.5
                float threshold = (uProgress * 3.0) - 0.5;

                float noise = sin(vUv.x * 20.0 + uTime) * 0.05;

                // We want BLACK where diag > threshold. (Revealing from top-left)
                // Or revealing from bottom-right?
                // Let's reveal from Top-Left (same direction as fill).
                // So area < threshold is Clear (0). Area > threshold is Black (1).

                float a = smoothstep(threshold - 0.1 + noise, threshold + noise, diag);

                gl_FragColor = vec4(0.0, 0.0, 0.0, a);
            }`;
        }

        return `${header} void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }`; // Error pink
    }
}
