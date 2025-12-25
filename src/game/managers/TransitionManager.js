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

        // Shatter buffer
        this.shatterBuffer = null;
        this.shatterVertexCount = 0;

        // Texture for screen capture
        this.capturedTexture = null;
        this.hasCapture = false;
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'transition-canvas';
        Object.assign(this.canvas.style, {
            position: 'absolute', inset: '0', width: '100%', height: '100%',
            zIndex: '9999', pointerEvents: 'none', display: 'none'
        });

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

        // Enable Alpha Blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

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
        // Voronoi-like clustering
        // 1. Define Grid
        const cols = 64;
        const rows = 36;
        const w = 2.0 / cols;
        const h = 2.0 / rows;

        // 2. Generate Seeds
        const numSeeds = 150;
        const seeds = [];
        for(let i=0; i<numSeeds; i++) {
            seeds.push({
                id: i,
                x: -1.0 + Math.random() * 2.0,
                y: -1.0 + Math.random() * 2.0,
                tris: [], // List of triangles belonging to this seed
                cx: 0, cy: 0, // Centroid
                speed: 0.5 + Math.random() * 2.5,
                rotSpeed: (Math.random() - 0.5) * 6.0
            });
        }

        // 3. Generate Grid Triangles and assign to nearest seed
        const grid = [];
        for(let y=0; y<=rows; y++) {
            for(let x=0; x<=cols; x++) {
                grid.push({ x: -1.0 + x*w, y: -1.0 + y*h });
            }
        }
        const getP = (x, y) => grid[y * (cols + 1) + x];

        for(let y=0; y<rows; y++) {
            for(let x=0; x<cols; x++) {
                const p0 = getP(x, y);
                const p1 = getP(x+1, y);
                const p2 = getP(x, y+1);
                const p3 = getP(x+1, y+1);

                // Split quad into 2 triangles
                const t1 = [p0, p1, p2]; // Top-Left
                const t2 = [p1, p3, p2]; // Bottom-Right

                [t1, t2].forEach(tri => {
                    // Find center of triangle
                    const tx = (tri[0].x + tri[1].x + tri[2].x) / 3;
                    const ty = (tri[0].y + tri[1].y + tri[2].y) / 3;

                    // Find nearest seed
                    let closest = null;
                    let minD = Infinity;

                    // Optimization: Check only subset? No, brute force is fine for setup (150 * 4000 = 600k ops, instant)
                    for(const s of seeds) {
                        const dx = tx - s.x;
                        const dy = ty - s.y;
                        const d = dx*dx + dy*dy;
                        if(d < minD) {
                            minD = d;
                            closest = s;
                        }
                    }

                    if(closest) {
                        closest.tris.push(tri);
                    }
                });
            }
        }

        // 4. Calculate Centroids for each Seed Group and Build Buffer
        const finalVertices = [];

        seeds.forEach(s => {
            if (s.tris.length === 0) return;

            // Calculate actual centroid of the cluster
            let sumX = 0, sumY = 0, count = 0;
            s.tris.forEach(tri => {
                tri.forEach(v => {
                    sumX += v.x;
                    sumY += v.y;
                    count++;
                });
            });
            s.cx = sumX / count;
            s.cy = sumY / count;

            // Add vertices
            s.tris.forEach(tri => {
                tri.forEach(v => {
                    finalVertices.push(
                        v.x, v.y,           // position
                        s.cx, s.cy,         // centroid
                        s.speed, s.rotSpeed // randoms
                    );
                });
            });
        });

        this.shatterVertexCount = finalVertices.length / 6;
        this.shatterBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shatterBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(finalVertices), this.gl.STATIC_DRAW);
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

    async startBattleTransition(sourceCanvas) {
        this.type = 'BATTLE_START';
        this.duration = 2000;
        if (sourceCanvas) {
            this.capture(sourceCanvas);
        } else {
            this.hasCapture = false;
        }
        return this.run();
    }

    async startBattleIntro() {
        this.type = 'BATTLE_INTRO';
        this.duration = 1500;
        this.hasCapture = false;
        return this.run();
    }

    async startMapTransitionOut() {
        this.type = 'MAP_OUT';
        this.duration = 1000;
        this.hasCapture = false;
        return this.run();
    }

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

        // Clear background
        if (this.type === 'BATTLE_START') {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
        } else {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
        }
        gl.clear(gl.COLOR_BUFFER_BIT);

        const uProgress = gl.getUniformLocation(this.program, 'uProgress');
        const uRes = gl.getUniformLocation(this.program, 'uResolution');
        const uTime = gl.getUniformLocation(this.program, 'uTime');
        const uScreen = gl.getUniformLocation(this.program, 'uScreen');
        const uHasCapture = gl.getUniformLocation(this.program, 'uHasCapture');
        const uAspect = gl.getUniformLocation(this.program, 'uAspect');

        gl.uniform1f(uProgress, progress);
        gl.uniform2f(uRes, this.canvas.width, this.canvas.height);
        gl.uniform1f(uTime, performance.now() / 1000.0);

        const aspect = (this.canvas.width / this.canvas.height) || (960/540);
        if (uAspect) gl.uniform1f(uAspect, aspect);

        if (this.hasCapture && this.capturedTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.capturedTexture);
            gl.uniform1i(uScreen, 0);
            gl.uniform1f(uHasCapture, 1.0);
        } else {
            gl.uniform1f(uHasCapture, 0.0);
        }

        if (this.type === 'BATTLE_START') {
            // Shatter Render
            const posAttrib = gl.getAttribLocation(this.program, 'position');
            const centAttrib = gl.getAttribLocation(this.program, 'aCentroid');
            const randAttrib = gl.getAttribLocation(this.program, 'aRandoms');

            gl.bindBuffer(gl.ARRAY_BUFFER, this.shatterBuffer);

            // Stride: 6 floats * 4 bytes = 24 bytes
            const stride = 24;
            gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, stride, 0);
            gl.enableVertexAttribArray(posAttrib);

            gl.vertexAttribPointer(centAttrib, 2, gl.FLOAT, false, stride, 8);
            gl.enableVertexAttribArray(centAttrib);

            gl.vertexAttribPointer(randAttrib, 2, gl.FLOAT, false, stride, 16);
            gl.enableVertexAttribArray(randAttrib);

            gl.drawArrays(gl.TRIANGLES, 0, this.shatterVertexCount);
        } else {
            // Quad Render
            const posAttrib = gl.getAttribLocation(this.program, 'position');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(posAttrib);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    getVertexShader(type) {
        if (type === 'BATTLE_START') {
            return `
                attribute vec2 position;
                attribute vec2 aCentroid;
                attribute vec2 aRandoms; // x: speed, y: rotSpeed
                varying vec2 vUv;
                uniform float uProgress;
                uniform float uAspect;

                vec2 rotate(vec2 v, float a) {
                    float s = sin(a);
                    float c = cos(a);
                    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
                }

                void main() {
                    // Fix upside down UVs: WebGL textures from canvas are Y-inverted relative to clip space
                    // We map -1..1 to 0..1
                    vUv = position * 0.5 + 0.5;
                    vUv.y = 1.0 - vUv.y; // Correct orientation

                    // Timeline:
                    // 0.0-0.2: Initial Crack (Flash/Shrink)
                    // 0.2-0.4: Hold
                    // 0.4-1.0: Fly

                    float flyT = smoothstep(0.4, 1.0, uProgress);

                    // Shrink slightly to show cracks immediately
                    // Reduce gap size by making shrink closer to 1.0
                    float shrink = uProgress > 0.05 ? 0.99 : 1.0;

                    // Movement
                    vec2 moveDir = vec2(-1.0, 0.0);
                    moveDir.y += (aRandoms.x - 1.0) * 0.2;

                    vec2 translation = moveDir * flyT * flyT * 3.0 * aRandoms.x;

                    // Rotation
                    float angle = flyT * aRandoms.y;

                    // Apply
                    vec2 local = (position - aCentroid) * shrink;

                    local.x *= uAspect;
                    local = rotate(local, angle);
                    local.x /= uAspect;

                    gl_Position = vec4(local + aCentroid + translation, 0.0, 1.0);
                }
            `;
        }

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
            uniform float uHasCapture;
        `;

        if (type === 'BATTLE_START') {
            return `${header}
            void main() {
                vec4 color = vec4(0.0);
                if (uHasCapture > 0.5) {
                    // Check bounds to avoid wrapping artifacts
                    if(vUv.x >= 0.0 && vUv.x <= 1.0 && vUv.y >= 0.0 && vUv.y <= 1.0) {
                        color = texture2D(uScreen, vUv);
                    }
                }
                gl_FragColor = color;
            }`;
        }

        if (type === 'BATTLE_INTRO') {
            return `${header}
            void main() {
                float center = 0.5;
                float halfHeight = uProgress * 0.6;
                float distY = abs(vUv.y - center);
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
                float a = smoothstep(threshold - 0.1 + noise, threshold + noise, diag);
                gl_FragColor = vec4(0.0, 0.0, 0.0, a);
            }`;
        }

        return `${header} void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }`; // Error pink
    }
}
