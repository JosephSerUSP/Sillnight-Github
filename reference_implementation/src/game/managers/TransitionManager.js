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
        this.capturedTexture = null;
        this.hasCapture = false;
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'transition-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.inset = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '9'; // Above game (0) but below UI (10)
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

    /**
     * Captures the contents of another canvas (the game renderer) into a texture.
     * @param {HTMLCanvasElement} sourceCanvas
     */
    capture(sourceCanvas) {
        if (!sourceCanvas) return;
        const gl = this.gl;

        if (!this.capturedTexture) {
            this.capturedTexture = gl.createTexture();
        }

        gl.bindTexture(gl.TEXTURE_2D, this.capturedTexture);
        // Upload the canvas to the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

        // Set parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.hasCapture = true;
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
     * @param {HTMLCanvasElement} [sourceCanvas] - If provided, captures screen for distortion.
     */
    async startBattleTransition(sourceCanvas) {
        this.type = 'BATTLE_START';
        this.duration = 1500;
        if (sourceCanvas) {
            this.capture(sourceCanvas);
        } else {
            this.hasCapture = false;
        }
        return this.run();
    }

    /**
     * Start battle intro: Horizontal Cut In (Opening from black).
     */
    async startBattleIntro() {
        this.type = 'BATTLE_INTRO';
        this.duration = 1500;
        this.hasCapture = false; // No capture needed for intro (revealing new scene)
        return this.run();
    }

    /**
     * Map Transfer Out: Diagonal Swipe + Distort -> Black
     */
    async startMapTransitionOut() {
        this.type = 'MAP_OUT';
        this.duration = 1000;
        this.hasCapture = false;
        return this.run();
    }

    /**
     * Map Transfer In: Diagonal Swipe Reveal -> Clear
     */
    async startMapTransitionIn() {
        this.type = 'MAP_IN';
        this.duration = 1000;
        this.hasCapture = false;
        return this.run();
    }

    async run() {
        if (this.isActive) return;
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
        const uScreen = gl.getUniformLocation(this.program, 'uScreen');
        const uHasCapture = gl.getUniformLocation(this.program, 'uHasCapture');

        gl.uniform1f(uProgress, progress);
        gl.uniform2f(uRes, this.canvas.width, this.canvas.height);
        gl.uniform1f(uTime, performance.now() / 1000.0);

        if (this.hasCapture && this.capturedTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.capturedTexture);
            gl.uniform1i(uScreen, 0);
            gl.uniform1i(uHasCapture, 1);
        } else {
            gl.uniform1i(uHasCapture, 0);
        }

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
            uniform sampler2D uScreen;
            uniform int uHasCapture;
        `;

        if (type === 'BATTLE_START') {
            return `${header}

            void main() {
                // Fix Orientation: WebGL texture vs Canvas coordinate mismatch
                vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

                vec2 center = vec2(0.5, 0.5);
                vec2 toCenter = center - uv;
                float dist = length(toCenter);

                // Spiral Blur Effect
                // Combines Zoom Blur (moving towards center) with Swirl (rotation)

                vec4 accColor = vec4(0.0);
                float totalWeight = 0.0;

                // Strength parameters
                float zoomAmount = uProgress * 0.3;     // How much to zoom in
                float twistAmount = uProgress * 3.0;    // How much to twist (swirl)
                float samples = 30.0;                   // More samples for smoother swirl

                for (float i = 0.0; i < 30.0; i++) {
                    float t = i / samples;

                    // 1. Zoom Scale (1.0 -> smaller)
                    float scale = 1.0 - (zoomAmount * t);

                    // 2. Rotation Angle (increases with t and distance for swirl)
                    float angle = twistAmount * t * (1.0 + dist);
                    float s = sin(angle);
                    float c = cos(angle);

                    // Rotate the vector to center
                    vec2 rotatedVec = vec2(
                        toCenter.x * c - toCenter.y * s,
                        toCenter.x * s + toCenter.y * c
                    );

                    // Calculate sample position
                    // We move from 'uv' towards 'center' along the curved path
                    vec2 sampleUV = center - rotatedVec * scale;

                    if (uHasCapture == 1) {
                        // Clamp to valid range
                        vec2 clampedUV = clamp(sampleUV, 0.0, 1.0);
                        vec4 sColor = texture2D(uScreen, clampedUV);

                        // Additive Weighting
                        // Center samples (t=0) are sharpest, outer (t=1) are most distorted.
                        // We weight them equally for a blur, or taper off.
                        // Pure average for now.
                        accColor += sColor;
                        totalWeight += 1.0;
                    }
                }

                vec4 texColor = vec4(0.0, 0.0, 0.0, 1.0);
                if (totalWeight > 0.0) {
                    texColor = accColor / totalWeight;
                }

                // Color Grading: Additive Pop -> Burn -> Black

                // 1. Saturation (Ramps up)
                float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
                float satLevel = 1.0 + (uProgress * 3.0);
                vec3 satColor = mix(vec3(gray), texColor.rgb, satLevel);

                // 2. Contrast (Burn effect)
                // Ramp contrast up as we fade.
                float contrastStrength = 1.0 + (uProgress * 1.5); // 1.0 -> 2.5
                vec3 contrastColor = (satColor - 0.5) * contrastStrength + 0.5;

                // 3. Brightness Curve (Pop then Fade)
                // We want a "pop" at the start (uProgress 0.0 -> 0.3) then fade to 0.

                // Pop curve: Starts at 1.0, peaks around 1.3 at progress 0.2, then decays.
                // Using sine for a smooth bump.
                float pop = sin(uProgress * 3.14159) * 0.4; // Boosts up to +0.4

                // Fade curve: Standard inverse linear or smoothstep
                float fade = 1.0 - smoothstep(0.2, 0.9, uProgress);

                // Combine: Base Brightness (1.0) + Pop, then multiplied by fade
                float finalBrightness = (1.0 + pop) * fade;

                vec3 finalColor = contrastColor * finalBrightness;

                // Hard clamp to prevent negative values from contrast math
                gl_FragColor = vec4(max(vec3(0.0), finalColor), 1.0);
            }`;
        }

        if (type === 'BATTLE_INTRO') {
            return `${header}
            void main() {
                float center = 0.5;
                float halfHeight = uProgress * 0.6;
                float distY = abs(vUv.y - center);

                // Opening Mask: Black outside, Transparent inside.
                float mask = smoothstep(halfHeight, halfHeight + 0.01, distY);
                gl_FragColor = vec4(0.0, 0.0, 0.0, mask);
            }`;
        }

        if (type === 'MAP_OUT') {
            return `${header}
            void main() {
                float diag = vUv.x + vUv.y;
                float threshold = uProgress * 2.5;
                float noise = sin(vUv.x * 20.0 + uTime) * 0.05;

                // Swipe adds black
                float a = 1.0 - smoothstep(threshold - 0.1 + noise, threshold + noise, diag);
                gl_FragColor = vec4(0.0, 0.0, 0.0, a);
            }`;
        }

        if (type === 'MAP_IN') {
             return `${header}
            void main() {
                float diag = vUv.x + vUv.y;
                float threshold = (uProgress * 3.0) - 0.5;
                float noise = sin(vUv.x * 20.0 + uTime) * 0.05;

                // Swipe removes black
                float a = smoothstep(threshold - 0.1 + noise, threshold + noise, diag);
                gl_FragColor = vec4(0.0, 0.0, 0.0, a);
            }`;
        }

        return `${header} void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }`; // Error pink
    }
}
