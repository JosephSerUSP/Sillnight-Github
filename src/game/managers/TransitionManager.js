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

        // Quad buffer (standard)
        this.buffer = null;

        // Shatter buffers (for BATTLE_START)
        this.shatterBuffers = null; // { pos, centroid, random, uv, count }

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
        this.canvas.style.zIndex = '9999';
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
        this.setupShatterBuffers();
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

    setupShatterBuffers() {
        const gl = this.gl;
        const cols = 16;
        const rows = 9;

        // Generate perturbed grid
        const points = []; // [y][x] -> {x, y} (normalized 0..1)
        for (let y = 0; y <= rows; y++) {
            const row = [];
            for (let x = 0; x <= cols; x++) {
                let px = x / cols;
                let py = y / rows;

                // Perturb inner points
                if (x > 0 && x < cols && y > 0 && y < rows) {
                    const ampX = (1.0 / cols) * 0.4;
                    const ampY = (1.0 / rows) * 0.4;
                    px += (Math.random() - 0.5) * 2.0 * ampX;
                    py += (Math.random() - 0.5) * 2.0 * ampY;
                }
                row.push({ x: px, y: py });
            }
            points.push(row);
        }

        const positions = [];
        const centroids = [];
        const randoms = []; // x: speed, y: rotation, z: delay
        const uvs = [];

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                // Quad p1, p2, p3, p4
                const p1 = points[y][x];
                const p2 = points[y][x + 1];
                const p3 = points[y + 1][x];
                const p4 = points[y + 1][x + 1];

                // Two triangles: T1(p1, p2, p3), T2(p2, p4, p3)
                // Actually standard quad indices: (0,1,2), (1,3,2)
                // p1(0,0), p2(1,0), p3(0,1), p4(1,1)

                const addTriangle = (v1, v2, v3) => {
                    // Centroid
                    const cx = (v1.x + v2.x + v3.x) / 3.0;
                    const cy = (v1.y + v2.y + v3.y) / 3.0;

                    // Convert to clip space (-1 to 1) for position, 0-1 for UV
                    const makeVert = (v) => {
                        positions.push(v.x * 2 - 1, v.y * 2 - 1);

                        // FLIP Y for UV to fix upside-down texture issue
                        uvs.push(v.x, 1.0 - v.y);

                        centroids.push(cx * 2 - 1, cy * 2 - 1); // Centroid in clip space
                    };

                    const speed = 0.5 + Math.random() * 1.5;
                    const rot = (Math.random() - 0.5) * 4.0;
                    const delay = Math.random() * 0.5; // Random start delay

                    makeVert(v1); randoms.push(speed, rot, delay);
                    makeVert(v2); randoms.push(speed, rot, delay);
                    makeVert(v3); randoms.push(speed, rot, delay);
                };

                addTriangle(p1, p2, p3);
                addTriangle(p2, p4, p3);
            }
        }

        this.shatterBuffers = {
            position: gl.createBuffer(),
            centroid: gl.createBuffer(),
            random: gl.createBuffer(),
            uv: gl.createBuffer(),
            count: positions.length / 2
        };

        gl.bindBuffer(gl.ARRAY_BUFFER, this.shatterBuffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.shatterBuffers.centroid);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centroids), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.shatterBuffers.random);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(randoms), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.shatterBuffers.uv);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
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
     * Start battle transition: Shatter -> Fly Left -> Reveal Black.
     * @param {HTMLCanvasElement} [sourceCanvas] - If provided, captures screen for effect.
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
        this.hasCapture = false;
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

        // Select Shaders
        const fs = this.getFragmentShader(this.type);
        const vs = this.getVertexShader(this.type);

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
            // Note: BATTLE_START leaves the screen black (fragments flew away).
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

        // Bind Texture
        if (this.hasCapture && this.capturedTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.capturedTexture);
            gl.uniform1i(uScreen, 0);
            gl.uniform1i(uHasCapture, 1);
        } else {
            gl.uniform1i(uHasCapture, 0);
        }

        // --- Render Logic Based on Type ---
        if (this.type === 'BATTLE_START') {
            // Render SHATTER mesh
            // Clear background to Black so gaps reveal blackness
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (this.shatterBuffers) {
                const enableAttr = (name, buffer, size) => {
                    const loc = gl.getAttribLocation(this.program, name);
                    if (loc !== -1) {
                        gl.enableVertexAttribArray(loc);
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
                    }
                };

                enableAttr('position', this.shatterBuffers.position, 2);
                enableAttr('aCentroid', this.shatterBuffers.centroid, 2);
                enableAttr('aRandom', this.shatterBuffers.random, 3);
                enableAttr('aUv', this.shatterBuffers.uv, 2);

                gl.drawArrays(gl.TRIANGLES, 0, this.shatterBuffers.count);
            }
        } else {
            // Standard QUAD render
            // Map transitions use alpha, so clear to transparent
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const posAttrib = gl.getAttribLocation(this.program, 'position');
            gl.enableVertexAttribArray(posAttrib);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    getVertexShader(type) {
        if (type === 'BATTLE_START') {
            return `
            precision mediump float;
            attribute vec2 position;
            attribute vec2 aCentroid;
            attribute vec3 aRandom; // x: speed, y: rotation speed, z: delay
            attribute vec2 aUv;

            uniform float uProgress;
            varying vec2 vUv;
            varying float vVisible;

            void main() {
                vUv = aUv;

                // Crack Logic
                // Delay movement
                float startMove = 0.2;
                float activeTime = max(0.0, uProgress - startMove - (aRandom.z * 0.1));

                // Displacement
                // Move Left (-x) + some random Y drift
                // INCREASED SPEED: 2.5 -> 5.0 to ensure exit
                vec2 dir = vec2(-1.0, (aRandom.y * 0.2));
                vec2 offset = dir * activeTime * aRandom.x * 5.0;

                // Rotation
                float angle = activeTime * aRandom.y * 5.0;
                float s = sin(angle);
                float c = cos(angle);
                mat2 rot = mat2(c, -s, s, c);

                vec2 pos = position;

                // Rotate around centroid
                vec2 local = pos - aCentroid;
                local = rot * local;
                pos = aCentroid + local + offset;

                // Shrink slightly to show cracks initially
                float shrink = 1.0 - smoothstep(0.0, 0.3, uProgress) * 0.02;
                // Or simply scale local
                pos = aCentroid + (local * shrink) + offset;

                gl_Position = vec4(pos, 0.0, 1.0);
            }
            `;
        }

        // Default Quad Shader
        return `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;
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
                // Simple texture lookup
                vec4 texColor = vec4(0.0, 0.0, 0.0, 1.0);
                if (uHasCapture == 1) {
                    texColor = texture2D(uScreen, vUv);
                }
                gl_FragColor = texColor;
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
