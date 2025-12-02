import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';
import { Game_Interpreter } from '../classes/Game_Interpreter.js';

class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        const geo = new THREE.PlaneGeometry(0.1, 0.1);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });
        for (let i = 0; i < 50; i++) {
            const p = new THREE.Mesh(geo, mat.clone());
            p.visible = false;
            scene.add(p);
            this.particles.push({ mesh: p, life: 0, velocity: new THREE.Vector3() });
        }
    }

    spawnBurst(x, y, color, count = 10) {
        let spawned = 0;
        for (let p of this.particles) {
            if (p.life <= 0 && spawned < count) {
                p.mesh.visible = true;
                p.mesh.position.set(x, 0.5, y);
                p.mesh.material.color.setHex(color);
                p.mesh.material.opacity = 1;
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.05 + Math.random() * 0.05;
                p.velocity.set(Math.cos(angle) * speed, (Math.random() * 0.1), Math.sin(angle) * speed);
                p.life = 1.0;
                spawned++;
            }
        }
    }

    spawnSparkle(x, y) {
        let count = 5;
        let spawned = 0;
        for (let p of this.particles) {
            if (p.life <= 0 && spawned < count) {
                p.mesh.visible = true;
                p.mesh.position.set(x + (Math.random() - 0.5) * 0.5, 0.2, y + (Math.random() - 0.5) * 0.5);
                p.mesh.material.color.setHex(0xffff00);
                p.mesh.material.opacity = 1;
                p.life = 1.5;
                p.velocity.set(0, 0.03 + Math.random() * 0.02, 0);
                spawned++;
            }
        }
    }

    update() {
        for (let p of this.particles) {
            if (p.life > 0) {
                p.life -= 0.02;
                p.mesh.position.add(p.velocity);
                p.mesh.material.opacity = Math.min(1, p.life);
                p.mesh.rotation.z += 0.1;
                if (p.life <= 0) p.mesh.visible = false;
            }
        }
    }
}

function createFogMaterial(color = 0x333333) {
    const baseMat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 1.0 });

    baseMat.onBeforeCompile = (shader) => {
        shader.uniforms.uPlayerPos = { value: new THREE.Vector3() };
        shader.uniforms.uFogRadius = { value: 6.0 };
        shader.uniforms.uMaxOffset = { value: 5.0 };

        shader.vertexShader = `
            varying float vVisibility;
            uniform vec3 uPlayerPos;
            uniform float uFogRadius;
            uniform float uMaxOffset;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            `
            // Calculate World Position from InstanceMatrix
            vec4 worldPos = instanceMatrix * vec4(transformed, 1.0);
            float dist = distance(worldPos.xz, uPlayerPos.xz);

            float fadeWidth = 4.0;
            float vis = 1.0 - smoothstep(uFogRadius, uFogRadius + fadeWidth, dist);
            vVisibility = vis;

            // Random offset based on tile position (using worldPos.xz)
            // Ideally use integer coordinates for stability
            vec2 tilePos = floor(worldPos.xz + 0.5);
            float rnd = random(tilePos);

            // Offset falling from above or below
            // Let's make it fall from above (-Y is down)
            // "Initial Z/Y randomly offset"
            float dir = (rnd - 0.5) * 2.0; // -1 to 1
            float offset = dir * uMaxOffset * (1.0 - vis);

            // Apply offset to local 'transformed' before projection?
            // No, we need to apply it to world position.
            // But standard material expects 'transformed' to be local.
            // 'mvPosition' is calculated from 'transformed'.

            // For InstancedMesh, the transform is embedded.
            // We can hack mvPosition.

            vec4 mvPosition = viewMatrix * instanceMatrix * vec4( transformed, 1.0 );

            // Apply View Space offset? No, world space offset is easier conceptually.
            // But we already calculated offset.

            // Let's modify mvPosition by adding offset projected to view space?
            // Or better, modify 'transformed' but that doesn't account for instance matrix rotation if we want global Y.

            // Let's assume tiles are flat and Y is Up.
            // offset is strictly vertical in World Space.
            // viewMatrix * (worldPos + offset) = viewMatrix * worldPos + viewMatrix * offset

            mvPosition.xyz += (viewMatrix * vec4(0.0, offset, 0.0, 0.0)).xyz;

            gl_Position = projectionMatrix * mvPosition;
            `
        );

        shader.fragmentShader = `
            varying float vVisibility;
        ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>
            gl_FragColor.a *= vVisibility;
            if (gl_FragColor.a < 0.05) discard; // Optional Dither or discard to save fill rate
            `
        );

        baseMat.userData.shader = shader;
    };

    return baseMat;
}

export class ExploreSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.playerMesh = null;
        this.mapGroup = null;
        this.dynamicGroup = null;
        this.instancedFloor = null;
        this.instancedWalls = null;
        this.particles = null;
        this.moveLerpStart = new THREE.Vector3();
        this.moveLerpEnd = new THREE.Vector3();
        this.moveLerpProgress = 1;
        this.isAnimating = false;
        this.playerTarget = new THREE.Vector3();
        this.cameraLookCurrent = new THREE.Vector3();
        this.initialized = false;
        this.playerLight = null;
        this.matPlayer = null;
        this.matFloor = null;
        this.matWall = null;

        /** @type {Game_Interpreter} */
        this.interpreter = new Game_Interpreter();
    }

    /** Initializes the exploration system. */
    init() {
        // Get shared renderer
        if (window.Game && window.Game.RenderManager) {
            window.Game.RenderManager.attachTo('explore-container');
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x051015, 0.05);

        // Fixed PS1 Style Resolution (480x270)
        const targetW = 480;
        const targetH = 270;
        const aspect = targetW / targetH;

        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);

        // Light setup
        this.scene.add(new THREE.AmbientLight(0x222222));
        const dirLight = new THREE.DirectionalLight(0x555555, 0.6);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        this.playerLight = new THREE.PointLight(0x004444, 1.5, 15);
        this.scene.add(this.playerLight);

        const geo = new THREE.OctahedronGeometry(0.35);
        this.matPlayer = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x001133 });
        this.playerMesh = new THREE.Mesh(geo, this.matPlayer);
        this.playerMesh.userData.uid = 'player';
        this.scene.add(this.playerMesh);

        this.mapGroup = new THREE.Group();
        this.scene.add(this.mapGroup);

        this.dynamicGroup = new THREE.Group();
        this.scene.add(this.dynamicGroup);

        this.particles = new ParticleSystem(this.scene);

        // Initialize Materials with Fog Shader
        this.matFloor = createFogMaterial(0x333333);
        this.matWall = createFogMaterial(0x1a1a1a);

        this.initialized = true;
        this.rebuildLevel();
        this.animate();
    }

    /** Rebuilds the 3D map based on window.$gameMap */
    rebuildLevel() {
        if (!this.scene) return;
        this.mapGroup.clear();
        // Access Game_Map data directly
        if (!window.$gameMap) return;
        const mapData = window.$gameMap._data;

        const map = mapData;
        const height = map.length;
        const width = map[0].length;
        const count = width * height;

        const geoFloor = new THREE.PlaneGeometry(0.95, 0.95);
        // Reuse materials
        this.instancedFloor = new THREE.InstancedMesh(geoFloor, this.matFloor, count);

        const geoBlock = new THREE.BoxGeometry(0.95, 1, 0.95);
        this.instancedWalls = new THREE.InstancedMesh(geoBlock, this.matWall, count);

        const dummy = new THREE.Object3D();
        let fIdx = 0, wIdx = 0;

        const hasFloorNeighbor = (x, y) => {
            const check = (nx, ny) => nx >= 0 && nx < width && ny >= 0 && ny < height && map[ny][nx] !== 1;
            return check(x + 1, y) || check(x - 1, y) || check(x, y + 1) || check(x, y - 1);
        };

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = map[y][x];

                if (tile === 0 || tile === 3) {
                    // Floor
                    dummy.position.set(x, 0, y);
                    dummy.rotation.set(-Math.PI / 2, 0, 0);
                    dummy.scale.set(1, 1, 1);
                    dummy.updateMatrix();
                    this.instancedFloor.setMatrixAt(fIdx++, dummy.matrix);

                    // Special Static Tiles (Stairs) - Not Instanced, keep standard material or apply fog?
                    // For now, keep standard but maybe we should apply fog manually to them?
                    // Let's leave them as is, they might pop out which is fine for "special" items
                    if (tile === 3) {
                        const numSteps = 5;
                        const maxH = 0.4;
                        const sliceW = 0.8 / numSteps;
                        for (let s = 0; s < numSteps; s++) {
                            const h = maxH * (numSteps - s) / numSteps;
                            const yPos = h / 2;
                            const zPos = y - 0.4 + (s * sliceW) + (sliceW / 2);
                            const step = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, sliceW * 0.9), new THREE.MeshPhongMaterial({ color: 0x00ffaa, flatShading: true }));
                            step.position.set(x, yPos, zPos);
                            this.mapGroup.add(step);
                        }
                    }
                } else if (tile === 1) {
                    // Wall
                    if (hasFloorNeighbor(x, y)) {
                        dummy.position.set(x, 0.5, y);
                        dummy.rotation.set(0, 0, 0);
                        dummy.scale.set(1, 1, 1);
                        dummy.updateMatrix();
                        this.instancedWalls.setMatrixAt(wIdx++, dummy.matrix);
                    }
                }
            }
        }

        this.instancedFloor.count = fIdx;
        this.instancedWalls.count = wIdx;
        this.instancedFloor.instanceMatrix.needsUpdate = true;
        this.instancedWalls.instanceMatrix.needsUpdate = true;
        this.mapGroup.add(this.instancedFloor);
        this.mapGroup.add(this.instancedWalls);

        // Initial dynamic sync
        this.syncDynamic();

        const startX = window.$gameMap.playerPos.x;
        const startY = window.$gameMap.playerPos.y;
        this.playerMesh.position.set(startX, 0.5, startY);
        this.playerTarget.set(startX, 0.5, startY);
        this.cameraLookCurrent.set(startX, 0, startY);
        this.moveLerpProgress = 1;
        this.isAnimating = false;
    }

    /**
     * Synchronizes dynamic elements (enemies, loot, etc.) without rebuilding static geometry.
     */
    syncDynamic() {
        // Remove existing dynamic objects
        if (!this.dynamicGroup) {
            this.dynamicGroup = new THREE.Group();
            this.scene.add(this.dynamicGroup);
        }
        this.dynamicGroup.clear();

        if (!window.$gameMap) return;

        // Iterate over active events
        const events = window.$gameMap.events;

        for (const event of events) {
            if (event.isErased) continue;

            // Render visual representation
            const visual = event.visual;
            const x = event.x;
            const y = event.y;

            if (visual) {
                if (visual.type === 'ENEMY') {
                    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 4), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
                    mesh.position.set(x, 0.3, y);
                    this.dynamicGroup.add(mesh);
                } else if (visual.type === 'TREASURE') {
                    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshPhongMaterial({ color: 0xffd700 }));
                    mesh.position.set(x, 0.25, y);
                    this.dynamicGroup.add(mesh);
                } else if (visual.type === 'SHOP') {
                    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6), new THREE.MeshPhongMaterial({ color: 0x0000ff }));
                    mesh.position.set(x, 0.1, y);
                    this.dynamicGroup.add(mesh);
                } else if (visual.type === 'RECRUIT') {
                    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
                    mesh.position.set(x, 0.3, y);
                    this.dynamicGroup.add(mesh);
                } else if (visual.type === 'SHRINE') {
                    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshPhongMaterial({ color: 0xffffff }));
                    mesh.position.set(x, 0.3, y);
                    this.dynamicGroup.add(mesh);
                }
                // Trap logic: traps might be invisible or visible
                else if (visual.type === 'TRAP') {
                     // Maybe invisible? Or a spike?
                }
            }
        }
    }

    /** Resizes the canvas to match the window dimensions. */
    resize() {
        // Handled by RenderManager mostly, but we update camera aspect
        if (!this.camera) return;
        const targetW = 480;
        const targetH = 270;
        const aspect = targetW / targetH;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Moves the player in the given direction.
     * @param {number} dx - The change in X.
     * @param {number} dy - The change in Y.
     */
    move(dx, dy) {
        if (window.Game.ui.mode !== 'EXPLORE' || window.Game.ui.formationMode) return;
        if (this.isAnimating) return;

        const newX = window.$gameMap.playerPos.x + dx;
        const newY = window.$gameMap.playerPos.y + dy;
        const tile = window.$gameMap.tileAt(newX, newY);

        if (tile !== 1) { // Not a wall
            // Update Logical Position
            window.$gameMap._playerPos = { x: newX, y: newY };

            // Trigger Animation
            this.moveLerpStart.copy(this.playerMesh.position);
            this.moveLerpEnd.set(newX, 0.5, newY);
            this.moveLerpProgress = 0;
            this.playerTarget.set(newX, 0.5, newY);
            this.isAnimating = true;

            // Trigger events after delay or checkTile handles it
            this.checkTile(newX, newY);
        }
    }

    /**
     * Checks the tile the player landed on and triggers its effect.
     * @param {number} x
     * @param {number} y
     */
    checkTile(x, y) {
        // Check for static tile events (Stairs)
        const tile = window.$gameMap.tileAt(x, y);
        if (tile === 3) {
            this.resolveStaticTile(tile);
            return;
        }

        // Check for dynamic events
        const event = window.$gameMap.eventAt(x, y);
        if (event && !event.isErased) {
             if (event.trigger === 'TOUCH' || event.trigger === 'ACTION') {
                  this.interpreter.setup(event.commands, event.id);
             }
        }

        window.Game.Windows.HUD.refresh();

        // Post-execution cleanup/sync
        setTimeout(() => this.syncDynamic(), 300);
    }

    /**
     * Resolves static tile effects (Stairs).
     * @param {number} code
     */
    resolveStaticTile(code) {
        const map = window.$gameMap;
        if (code === 3) {
             map.floor++;
             Log.add('Descended...');
             map.generateFloor();
             this.rebuildLevel();
        }
    }

    /**
     * Main animation loop.
     */
    animate() {
        if (window.Game.ui.mode === 'EXPLORE') {
            requestAnimationFrame(() => this.animate());
        } else {
            requestAnimationFrame(() => this.animate());
        }

        if (!this.scene || !this.camera) return;

        // Update Shader Uniforms
        if (this.playerMesh) {
            const p = this.playerMesh.position;
            // Update materials if they are loaded
            if (this.matFloor && this.matFloor.userData.shader) {
                this.matFloor.userData.shader.uniforms.uPlayerPos.value.copy(p);
            }
            if (this.matWall && this.matWall.userData.shader) {
                this.matWall.userData.shader.uniforms.uPlayerPos.value.copy(p);
            }
        }

        // Movement Interpolation
        if (this.moveLerpProgress < 1) {
            this.moveLerpProgress += 0.06;
            if (this.moveLerpProgress > 1) this.moveLerpProgress = 1;

            this.playerMesh.position.lerpVectors(this.moveLerpStart, this.moveLerpEnd, this.moveLerpProgress);

            // Rotate player mesh
            this.playerMesh.rotation.y = this.moveLerpProgress * Math.PI * 2;

            if (this.moveLerpProgress === 1) {
                this.isAnimating = false;
                this.playerMesh.rotation.y = 0;
            }
        } else {
            this.playerMesh.position.lerp(this.playerTarget, 0.3);
        }

        // Bobbing effect
        this.playerMesh.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.05;
        this.playerLight.position.copy(this.playerMesh.position).add(new THREE.Vector3(0, 1, 0));

        // Camera follow
        const lx = this.playerTarget.x;
        const lz = this.playerTarget.z;
        this.cameraLookCurrent.x += (lx - this.cameraLookCurrent.x) * 0.1;
        this.cameraLookCurrent.z += (lz - this.cameraLookCurrent.z) * 0.1;

        const tx = this.playerTarget.x;
        const tz = this.playerTarget.z + 6;
        const ty = 6;

        this.camera.position.x += (tx - this.camera.position.x) * 0.1;
        this.camera.position.z += (tz - this.camera.position.z) * 0.1;
        this.camera.position.y += (ty - this.camera.position.y) * 0.1;
        this.camera.lookAt(this.cameraLookCurrent.x, 0, this.cameraLookCurrent.z - 2);

        this.particles.update();

        // Render using shared renderer
        const renderer = window.Game.RenderManager.getRenderer();
        if (renderer && window.Game.ui.mode === 'EXPLORE') {
            renderer.render(this.scene, this.camera);
            if (window.Game.Systems && window.Game.Systems.Effekseer) {
                window.Game.Systems.Effekseer.update(this.camera);
            }
        }
    }

    /**
     * Helper to get generateFloor access if called from outside?
     */
    generateAndRebuild() {
         if (window.$gameMap) {
             window.$gameMap.generateFloor();
             this.rebuildLevel();
         }
    }
}
