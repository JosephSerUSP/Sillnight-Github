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

/**
 * Modifies a material to support the Fog of War effect using a texture lookup.
 * @param {THREE.Material} material
 * @param {boolean} [displace=false] - Whether to apply vertical vertex displacement based on fog.
 */
function modifyMaterialWithFog(material, displace = false) {
    material.transparent = true;

    material.onBeforeCompile = (shader) => {
        material.userData.shader = shader;

        // Uniforms
        shader.uniforms.uFogMap = { value: null };
        shader.uniforms.uMapSize = { value: new THREE.Vector2(1, 1) };

        // --- Vertex Shader Modification ---
        // Inject uniforms, varyings, and helper function via #include <common>
        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec2 vFogUV;
            uniform vec2 uMapSize;
            ${displace ? 'uniform sampler2D uFogMap;' : ''}

            float getFogNoise(vec2 co){
                return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
            }
            `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            `
            vec4 worldPos = modelMatrix * vec4( transformed, 1.0 );
            #ifdef USE_INSTANCING
                worldPos = instanceMatrix * worldPos;
            #endif

            // Map World (X, Z) to Texture UV
            // Map (0,0) is Top-Left. Texture (0,0) is Bottom-Left.
            // So X maps directly, Z needs inversion relative to map height.
            // vFogUV.x = (x + 0.5) / width
            // vFogUV.y = 1.0 - (z + 0.5) / height

            vFogUV = vec2(
                (worldPos.x + 0.5) / uMapSize.x,
                1.0 - (worldPos.z + 0.5) / uMapSize.y
            );

            ${displace ? `
            // Sample fog texture in vertex shader
            float fogValVS = texture2D(uFogMap, vFogUV).r;

            // Random Vertex Warp - Per Tile Logic
            // Use rounded worldPos to get consistent tile coordinate for all vertices of the block
            vec2 tilePos = floor(worldPos.xz + 0.5);
            float r = getFogNoise(tilePos);

            // Direction: +1 or -1
            float dir = step(0.5, r) * 2.0 - 1.0;

            // Apply displacement: +/- 1.0 unit (1 tile) scaled by invisibility
            worldPos.y += dir * 1.0 * (1.0 - fogValVS);
            ` : ''}

            vec4 mvPosition = viewMatrix * worldPos;
            gl_Position = projectionMatrix * mvPosition;
            `
        );

        // --- Fragment Shader Modification ---
        // Inject uniforms and varyings via #include <common>
        // Note: Fragment shader <common> is different, but safe to inject there.
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec2 vFogUV;
            uniform sampler2D uFogMap;
            `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>

            // Sample the fog texture
            // R channel contains visited state (0.0 to 1.0)
            float fogVal = texture2D(uFogMap, vFogUV).r;

            // Apply fog to alpha
            gl_FragColor.a *= fogVal;

            // Optional: Completely discard if invisible to solve depth sorting issues
            // if (gl_FragColor.a < 0.01) discard;
            `
        );
    };

    return material;
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

        this.fogTexture = null;
        this.fogValues = null;
        this.fogTarget = null;
        this.fogRadius = 4;

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
        this.matFloor = new THREE.MeshLambertMaterial({ color: 0x333333 });
        modifyMaterialWithFog(this.matFloor, false);

        this.matWall = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        modifyMaterialWithFog(this.matWall, true);

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

        // --- FOG TEXTURE SETUP ---
        // Create DataTexture for fog of war
        // Use LuminanceFormat (1 channel)
        const size = width * height;
        const data = new Uint8Array(size); // Initialized to 0 (hidden)

        // Initialize simulation arrays
        this.fogValues = new Float32Array(size); // For smooth lerping
        this.fogTarget = new Uint8Array(size);   // Target values

        this.fogTexture = new THREE.DataTexture(data, width, height, THREE.LuminanceFormat, THREE.UnsignedByteType);
        this.fogTexture.magFilter = THREE.LinearFilter;
        this.fogTexture.minFilter = THREE.LinearFilter;
        this.fogTexture.needsUpdate = true;

        // Populate initial fogTarget based on map visited state
        // This ensures saving/loading preserves "fully visited" tiles,
        // though partial analog states are reset to 0 or 255.
        const gMap = window.$gameMap;
        for (let y = 0; y < height; y++) {
             const texRow = (height - 1) - y;
             for (let x = 0; x < width; x++) {
                 const visited = gMap.isVisited(x, y);
                 const val = visited ? 255 : 0;
                 const idx = texRow * width + x;
                 this.fogTarget[idx] = val;
             }
        }

        // Perform an initial distance update to set immediate surroundings
        // Ensure playerMesh exists before using it
        if (this.playerMesh) {
             this.updateFogTarget();
        }

        // Populate fogValues instantly on rebuild to prevent fade-in on load
        for (let i = 0; i < size; i++) {
            this.fogValues[i] = this.fogTarget[i];
            data[i] = this.fogTarget[i];
        }
        this.fogTexture.needsUpdate = true;

        // Update Static Materials
        const updateMat = (mat) => {
            if (mat && mat.userData.shader) {
                mat.userData.shader.uniforms.uFogMap.value = this.fogTexture;
                mat.userData.shader.uniforms.uMapSize.value.set(width, height);
            }
        };
        updateMat(this.matFloor);
        updateMat(this.matWall);
        // -------------------------

        const geoFloor = new THREE.PlaneGeometry(0.95, 0.95);
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

                    if (tile === 3) {
                        const numSteps = 5;
                        const maxH = 0.4;
                        const sliceW = 0.8 / numSteps;
                        for (let s = 0; s < numSteps; s++) {
                            const h = maxH * (numSteps - s) / numSteps;
                            const yPos = h / 2;
                            const zPos = y - 0.4 + (s * sliceW) + (sliceW / 2);
                            const mat = new THREE.MeshPhongMaterial({ color: 0x00ffaa, flatShading: true });
                            // Apply fog to stairs too
                            modifyMaterialWithFog(mat);
                            const step = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, sliceW * 0.9), mat);
                            step.position.set(x, yPos, zPos);

                            // Store material for update
                            step.userData.isFogObject = true;

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
     * Updates fog target values based on distance from the player's current position.
     * Uses Accumulative Reveal logic: Visibility only increases, never decreases.
     */
    updateFogTarget() {
        if (!this.fogTarget || !window.$gameMap) return;
        if (!this.playerMesh) return; // Guard against missing player mesh

        const map = window.$gameMap;
        const w = map.width;
        const h = map.height;

        // Use current interpolated position for smooth gradients
        const px = this.playerMesh.position.x;
        const py = this.playerMesh.position.z; // Z is Y in grid coords

        const r = this.fogRadius;

        for (let y = 0; y < h; y++) {
            const texRow = (h - 1) - y;
            for (let x = 0; x < w; x++) {
                // Distance from player
                const dx = x - px;
                const dy = y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Calculate dynamic visibility (1.0 at 0 dist, 0.0 at r dist)
                let val = 1.0 - (dist / r);
                if (val < 0) val = 0;
                if (val > 1) val = 1;

                // Scale to 0-255
                const byteVal = Math.floor(val * 255);
                const idx = texRow * w + x;

                // Accumulate: Take the max of current known visibility and new potential visibility
                this.fogTarget[idx] = Math.max(this.fogTarget[idx], byteVal);
            }
        }
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
                let color = 0xffffff;
                let geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);

                if (visual.type === 'ENEMY') {
                    color = 0xff0000;
                    geo = new THREE.ConeGeometry(0.2, 0.6, 4);
                } else if (visual.type === 'TREASURE') {
                    color = 0xffd700;
                    geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                } else if (visual.type === 'SHOP') {
                    color = 0x0000ff;
                    geo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6);
                } else if (visual.type === 'RECRUIT') {
                    color = 0x00ff00;
                    geo = new THREE.SphereGeometry(0.2);
                } else if (visual.type === 'SHRINE') {
                    color = 0xffffff;
                    geo = new THREE.OctahedronGeometry(0.2);
                }

                if (visual.type !== 'TRAP') {
                    const mat = new THREE.MeshPhongMaterial({ color: color });
                    modifyMaterialWithFog(mat);

                    const mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(x, 0.3, y);
                    mesh.userData.isFogObject = true; // Mark for uniform updates
                    this.dynamicGroup.add(mesh);
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

            // Update Map Visited State (logical only)
            window.$gameMap.updateVisibility(newX, newY, this.fogRadius);

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

        // Calculate fog targets based on current player mesh position (smooth interpolation)
        this.updateFogTarget();

        // --- FOG ANIMATION ---
        if (this.fogValues && this.fogTarget && this.fogTexture) {
            let fogChanged = false;
            const texData = this.fogTexture.image.data;
            const lerpFactor = 0.2; // Faster response for distance gradients

            for(let i = 0; i < this.fogValues.length; i++) {
                const target = this.fogTarget[i];
                let current = this.fogValues[i];

                if (Math.abs(current - target) > 0.1) {
                    current += (target - current) * lerpFactor;
                    this.fogValues[i] = current;
                    texData[i] = Math.floor(current);
                    fogChanged = true;
                } else if (current !== target) {
                    current = target;
                    this.fogValues[i] = current;
                    texData[i] = current;
                    fogChanged = true;
                }
            }
            if (fogChanged) {
                this.fogTexture.needsUpdate = true;
            }
        }
        // ---------------------

        // Helper to update uniforms on a material/object
        const updateUniforms = (obj) => {
            if (obj && obj.material && obj.material.userData.shader && this.fogTexture) {
                const s = obj.material.userData.shader;
                s.uniforms.uFogMap.value = this.fogTexture;
                // Assuming map size hasn't changed without rebuildLevel
                if (window.$gameMap) {
                     s.uniforms.uMapSize.value.set(window.$gameMap.width, window.$gameMap.height);
                }
            }
        };

        // Update Shader Uniforms for Dynamic Objects
        // We traverse dynamic group
        this.dynamicGroup.traverse((child) => {
            if (child.userData.isFogObject) {
                updateUniforms(child);
            }
        });

        // Also Stairs in mapGroup have isFogObject
        this.mapGroup.traverse((child) => {
            if (child.userData.isFogObject) {
                updateUniforms(child);
            }
        });

        // Update Static Floor/Wall Materials (InstancedMesh)
        // These are not traversed by dynamicGroup or mapGroup traversal above.
        // We must ensure their uniforms are set once the shader compiles.
        if (this.matFloor && this.matFloor.userData.shader && this.fogTexture) {
            this.matFloor.userData.shader.uniforms.uFogMap.value = this.fogTexture;
            if (window.$gameMap) {
                this.matFloor.userData.shader.uniforms.uMapSize.value.set(window.$gameMap.width, window.$gameMap.height);
            }
        }
        if (this.matWall && this.matWall.userData.shader && this.fogTexture) {
            this.matWall.userData.shader.uniforms.uFogMap.value = this.fogTexture;
            if (window.$gameMap) {
                this.matWall.userData.shader.uniforms.uMapSize.value.set(window.$gameMap.width, window.$gameMap.height);
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
