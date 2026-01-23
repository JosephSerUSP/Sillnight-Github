import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';
import { Game_Interpreter } from '../classes/Game_Interpreter.js';
import { modifyMaterialWithFog } from '../materials/FogMaterial.js';
import { MaterialFactory } from '../materials/MaterialFactory.js';
import { Config } from '../Config.js';
import * as Systems from '../systems.js';

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
        this.fogRevealRadius = 2;
        this.fogFadeRadius = 2;

        this.eventMeshes = new Map();

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

        // Config Resolution
        const targetW = Config.Resolution.RenderWidth;
        const targetH = Config.Resolution.RenderHeight;
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

        // Initialize Materials using MaterialFactory
        // Disable displacement for floor (false)
        this.matFloor = MaterialFactory.create('default', true, false);
        this.matWall = MaterialFactory.create('default_wall', true, true);

        this.initialized = true;

        if (window.$gameMap) {
             this.rebuildLevel();
        }
        this.animate();
    }

    /** Rebuilds the 3D map based on window.$gameMap */
    rebuildLevel() {
        if (!this.scene) return;
        this.mapGroup.clear();
        // Access Game_Map data directly
        if (!window.$gameMap) return;

        // Update Material Colors based on Visual Data
        const visuals = window.$gameMap.visuals;

        // Reset Radius to defaults or override
        this.fogRevealRadius = visuals && visuals.fogRevealRadius !== undefined ? visuals.fogRevealRadius : 2;
        this.fogFadeRadius = visuals && visuals.fogFadeRadius !== undefined ? visuals.fogFadeRadius : 2;

        if (visuals) {
            if (visuals.backgroundColor !== undefined) this.scene.background = new THREE.Color(visuals.backgroundColor);
            if (visuals.fogColor !== undefined) this.scene.fog.color.setHex(visuals.fogColor);
            if (visuals.fogDensity !== undefined) this.scene.fog.density = visuals.fogDensity;
            if (visuals.playerLightIntensity !== undefined) this.playerLight.intensity = visuals.playerLightIntensity;

            // Materials
            if (visuals.floorMaterial) {
                // Ensure displacement is false for floor
                this.matFloor = MaterialFactory.create(visuals.floorMaterial, true, false);
            } else {
                // Fallback or Color Override
                this.matFloor = MaterialFactory.create('default', true, false);
                if (visuals.floorColor !== undefined) this.matFloor.color.setHex(visuals.floorColor);
            }

            if (visuals.wallMaterial) {
                this.matWall = MaterialFactory.create(visuals.wallMaterial, true, true);
            } else {
                 this.matWall = MaterialFactory.create('default_wall', true, true);
                 if (visuals.wallColor !== undefined) this.matWall.color.setHex(visuals.wallColor);
            }

            // REMOVED: Legacy texture generation and assignment
        } else {
            // Default Fallback
            this.matFloor = MaterialFactory.create('default', true, false);
            this.matWall = MaterialFactory.create('default_wall', true, true);

            this.scene.background = new THREE.Color(0x050510);
            this.scene.fog.color.setHex(0x051015);
            this.scene.fog.density = 0.05;
            this.playerLight.intensity = 1.5;
        }

        const mapData = window.$gameMap._data;

        const map = mapData;
        const height = map.length;
        const width = map[0].length;
        const count = width * height;

        // --- FOG TEXTURE SETUP ---
        const size = width * height;
        const data = new Uint8Array(size * 4);

        this.fogValues = new Float32Array(size);
        this.fogTarget = new Uint8Array(size);

        this.fogTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
        this.fogTexture.magFilter = THREE.LinearFilter;
        this.fogTexture.minFilter = THREE.LinearFilter;
        this.fogTexture.needsUpdate = true;

        const gMap = window.$gameMap;
        const isTransient = visuals && visuals.fogType === 'transient';

        for (let y = 0; y < height; y++) {
             const texRow = (height - 1) - y;
             for (let x = 0; x < width; x++) {
                 let val = 0;
                 if (!isTransient) {
                     const visited = gMap.isVisited(x, y);
                     val = visited ? 255 : 0;
                 }
                 const idx = texRow * width + x;
                 this.fogTarget[idx] = val;
             }
        }

        if (this.playerMesh) {
             this.updateFogTarget();
        }

        for (let i = 0; i < size; i++) {
            this.fogValues[i] = this.fogTarget[i];
            const val = this.fogTarget[i];
            const px = i * 4;
            data[px] = val;
            data[px + 1] = val;
            data[px + 2] = val;
            data[px + 3] = 255;
        }
        this.fogTexture.needsUpdate = true;

        // Update Materials with Fog Uniforms
        const updateMat = (mat) => {
            // Note: Shader uniform injection happens after compilation, handled in animate loop
            // but we can try setting them if already compiled
            if (mat && mat.userData.shader) {
                mat.userData.shader.uniforms.uFogMap.value = this.fogTexture;
                mat.userData.shader.uniforms.uMapSize.value.set(width, height);
            }
        };
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

                            const mat = MaterialFactory.create({ type: 'Phong', color: 0x00ffaa, flatShading: true }, true, false);

                            const step = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, sliceW * 0.9), mat);
                            step.position.set(x, yPos, zPos);

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

        this.syncDynamic();

        const startX = window.$gameMap.playerPos.x;
        const startY = window.$gameMap.playerPos.y;
        this.playerMesh.position.set(startX, 0.5, startY);
        this.playerTarget.set(startX, 0.5, startY);
        this.cameraLookCurrent.set(startX, 0, startY);
        this.moveLerpProgress = 1;
        this.isAnimating = false;
    }

    updateFogTarget() {
        if (!this.fogTarget || !window.$gameMap) return;
        if (!this.playerMesh) return;

        const map = window.$gameMap;
        const w = map.width;
        const h = map.height;
        const visuals = map.visuals;
        const isTransient = visuals && visuals.fogType === 'transient';

        const px = this.playerMesh.position.x;
        const py = this.playerMesh.position.z;

        const revealR = this.fogRevealRadius;
        const fadeR = this.fogFadeRadius;

        for (let y = 0; y < h; y++) {
            const texRow = (h - 1) - y;
            for (let x = 0; x < w; x++) {
                const dx = x - px;
                const dy = y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let val = 0.0;
                if (dist <= revealR) {
                    val = 1.0;
                } else if (dist < revealR + fadeR) {
                    val = 1.0 - (dist - revealR) / fadeR;
                }

                if (val < 0) val = 0;
                if (val > 1) val = 1;

                const byteVal = Math.floor(val * 255);
                const idx = texRow * w + x;

                if (isTransient) {
                    this.fogTarget[idx] = byteVal;
                } else {
                    this.fogTarget[idx] = Math.max(this.fogTarget[idx], byteVal);
                }
            }
        }
    }

    syncDynamic() {
        if (!this.dynamicGroup) {
            this.dynamicGroup = new THREE.Group();
            this.scene.add(this.dynamicGroup);
        }

        if (!window.$gameMap) return;

        const events = window.$gameMap.events;
        const activeIds = new Set();

        for (const event of events) {
            if (event.isErased) continue;

            activeIds.add(event.id);
            const x = event.x;
            const y = event.y;

            const visual = event.visual;
            let needsRebuild = false;

            if (this.eventMeshes.has(event.id)) {
                // Update existing mesh
                const mesh = this.eventMeshes.get(event.id);

                // Check for visual changes
                const cachedType = mesh.userData.visualType;
                const currentType = visual ? visual.type : null;

                if (cachedType !== currentType) {
                    needsRebuild = true;
                    // Remove old mesh
                    this.dynamicGroup.remove(mesh);
                    if (mesh.geometry) mesh.geometry.dispose();
                    this.eventMeshes.delete(event.id);
                } else {
                    // Just update position/visibility
                    if (mesh.position.x !== x || mesh.position.z !== y) {
                        mesh.position.set(x, 0.3, y);
                    }
                    if (!mesh.visible) mesh.visible = true;
                }
            }

            if (!this.eventMeshes.has(event.id) && visual && visual.type !== 'TRAP') {
                // Create new mesh
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
                } else if (visual.type === 'NPC') {
                    color = 0x00ffff; // Cyan for NPCs
                    geo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
                }

                // Use MaterialFactory for dynamic objects
                const mat = MaterialFactory.create({ type: 'Phong', color: color }, true, false);

                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x, 0.3, y);
                mesh.userData.isFogObject = true;
                mesh.userData.visualType = visual.type; // Cache type
                this.dynamicGroup.add(mesh);
                this.eventMeshes.set(event.id, mesh);
            }
        }

        // Cleanup erased or missing events
        for (const [id, mesh] of this.eventMeshes) {
            if (!activeIds.has(id)) {
                this.dynamicGroup.remove(mesh);
                if (mesh.geometry) mesh.geometry.dispose();
                // Material is managed by factory, usually we don't dispose it here unless unique
                this.eventMeshes.delete(id);
            }
        }
    }

    resize() {
        if (!this.camera) return;
        const targetW = Config.Resolution.RenderWidth;
        const targetH = Config.Resolution.RenderHeight;
        const aspect = targetW / targetH;

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    move(dx, dy) {
        if (window.Game.ui.mode !== 'EXPLORE' || window.Game.ui.formationMode) return;
        if (this.isAnimating) return;

        const newX = window.$gameMap.playerPos.x + dx;
        const newY = window.$gameMap.playerPos.y + dy;
        const tile = window.$gameMap.tileAt(newX, newY);

        if (tile !== 1) {
            window.$gameMap._playerPos = { x: newX, y: newY };

            if (window.$gameParty) {
                window.$gameParty.onMapStep();
            }

            window.$gameMap.updateVisibility(newX, newY, this.fogRevealRadius);

            this.moveLerpStart.copy(this.playerMesh.position);
            this.moveLerpEnd.set(newX, 0.5, newY);
            this.moveLerpProgress = 0;
            this.playerTarget.set(newX, 0.5, newY);
            this.isAnimating = true;
        }
    }

    checkTile(x, y) {
        const tile = window.$gameMap.tileAt(x, y);
        if (tile === 3) {
            this.resolveStaticTile(tile);
            return;
        }

        const event = window.$gameMap.eventAt(x, y);
        if (event && !event.isErased) {
             if (event.trigger === 'TOUCH' || event.trigger === 'ACTION') {
                  this.interpreter.setup(event.commands, event.id);
             }
        }

        window.Game.Windows.HUD.refresh();
    }

    async resolveStaticTile(code) {
        const map = window.$gameMap;
        if (code === 3) {

             // TRANSITION: OUT
             if (window.Game.TransitionManager) {
                 await window.Game.TransitionManager.startMapTransitionOut();
             }

             map.floor++;
             Log.add('Descended...');
             map.generateFloor();
             this.rebuildLevel();

             // Since we use instanced rendering and fog textures, we might need a moment for them to be ready.
             // (Normally handled synchronously, but let's be safe).
             await new Promise(r => requestAnimationFrame(r));

             // We need to ensure the renderer is clear of the old frame before revealing.
             // But TransitionManager overlay is blocking the view.

             // TRANSITION: IN
             if (window.Game.TransitionManager) {
                 await window.Game.TransitionManager.startMapTransitionIn();
             }
        }
    }

    animate() {
        if (window.Game.ui.mode === 'EXPLORE') {
            requestAnimationFrame(() => this.animate());
        } else {
            requestAnimationFrame(() => this.animate());
        }

        if (window.Game && window.Game.SceneManager) {
            window.Game.SceneManager.update();
        }

        if (!this.scene || !this.camera) return;

        this.updateFogTarget();

        if (this.fogValues && this.fogTarget && this.fogTexture) {
            let fogChanged = false;
            const texData = this.fogTexture.image.data;
            const lerpFactor = 0.2;

            for(let i = 0; i < this.fogValues.length; i++) {
                const target = this.fogTarget[i];
                let current = this.fogValues[i];

                if (Math.abs(current - target) > 0.1) {
                    current += (target - current) * lerpFactor;
                    this.fogValues[i] = current;
                    const val = Math.floor(current);
                    const px = i * 4;
                    texData[px] = val;
                    texData[px + 1] = val;
                    texData[px + 2] = val;
                    fogChanged = true;
                } else if (current !== target) {
                    current = target;
                    this.fogValues[i] = current;
                    const val = current;
                    const px = i * 4;
                    texData[px] = val;
                    texData[px + 1] = val;
                    texData[px + 2] = val;
                    fogChanged = true;
                }
            }
            if (fogChanged) {
                this.fogTexture.needsUpdate = true;
            }
        }

        const updateUniforms = (obj) => {
            if (obj && obj.material && obj.material.userData.shader && this.fogTexture) {
                const s = obj.material.userData.shader;
                s.uniforms.uFogMap.value = this.fogTexture;
                if (window.$gameMap) {
                     s.uniforms.uMapSize.value.set(window.$gameMap.width, window.$gameMap.height);
                }
            }
        };

        this.dynamicGroup.traverse((child) => {
            if (child.userData.isFogObject) {
                updateUniforms(child);
            }
        });

        this.mapGroup.traverse((child) => {
            if (child.userData.isFogObject) {
                updateUniforms(child);
            }
        });

        if (this.matFloor) updateUniforms({ material: this.matFloor });
        if (this.matWall) updateUniforms({ material: this.matWall });

        // Rotate Events
        for (const mesh of this.eventMeshes.values()) {
            const type = mesh.userData.visualType;
            if (type === 'ENEMY' || type === 'NPC' || type === 'RECRUIT' || type === 'SHOP') {
                mesh.rotation.y += 0.02;
            }
        }

        if (this.moveLerpProgress < 1) {
            this.moveLerpProgress += 0.06;
            if (this.moveLerpProgress > 1) this.moveLerpProgress = 1;

            this.playerMesh.position.lerpVectors(this.moveLerpStart, this.moveLerpEnd, this.moveLerpProgress);
            this.playerMesh.rotation.y = this.moveLerpProgress * Math.PI * 2;

            if (this.moveLerpProgress === 1) {
                this.isAnimating = false;
                this.playerMesh.rotation.y = 0;
                this.checkTile(this.playerTarget.x, this.playerTarget.z);
            }
        } else {
            this.playerMesh.position.lerp(this.playerTarget, 0.3);
        }

        this.playerMesh.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.05;
        this.playerLight.position.copy(this.playerMesh.position).add(new THREE.Vector3(0, 1, 0));

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

        this.syncDynamic();
        this.particles.update();

        const renderer = window.Game.RenderManager.getRenderer();
        if (renderer && window.Game.ui.mode === 'EXPLORE') {
            renderer.render(this.scene, this.camera);
            if (Systems.Effekseer) {
                Systems.Effekseer.update(this.camera);
            }
        }
    }
}
