import { Data } from '../assets/data/data.js';
import { GameState } from './state.js';
import { Log } from './log.js';
import { resolveAssetPath } from './core.js';

// ------------------- HELPER CLASSES -------------------

class ParticleSystem {
    constructor(scene) {
        this.scene = scene; this.particles = [];
        const geo = new THREE.PlaneGeometry(0.1, 0.1);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });
        for(let i=0; i<50; i++) {
            const p = new THREE.Mesh(geo, mat.clone()); p.visible = false; scene.add(p);
            this.particles.push({ mesh: p, life: 0, velocity: new THREE.Vector3() });
        }
    }

    spawnBurst(x, y, color, count=10) {
        let spawned = 0;
        for(let p of this.particles) {
            if(p.life <= 0 && spawned < count) {
                p.mesh.visible = true; p.mesh.position.set(x, 0.5, y);
                p.mesh.material.color.setHex(color); p.mesh.material.opacity = 1;
                const angle = Math.random() * Math.PI * 2; const speed = 0.05 + Math.random() * 0.05;
                p.velocity.set(Math.cos(angle) * speed, (Math.random() * 0.1), Math.sin(angle) * speed);
                p.life = 1.0; spawned++;
            }
        }
    }

    spawnSparkle(x, y) {
        let count = 5; let spawned = 0;
        for(let p of this.particles) {
             if(p.life <= 0 && spawned < count) {
                p.mesh.visible = true;
                p.mesh.position.set(x + (Math.random()-0.5)*0.5, 0.2, y + (Math.random()-0.5)*0.5);
                p.mesh.material.color.setHex(0xffff00); p.mesh.material.opacity = 1;
                p.life = 1.5; p.velocity.set(0, 0.03 + Math.random()*0.02, 0);
                spawned++;
             }
        }
    }

    update() {
        for(let p of this.particles) {
            if(p.life > 0) {
                p.life -= 0.02; p.mesh.position.add(p.velocity);
                p.mesh.material.opacity = Math.min(1, p.life); p.mesh.rotation.z += 0.1;
                if(p.life <= 0) p.mesh.visible = false;
            }
        }
    }
}

// ------------------- SYSTEMS DEFINITIONS -------------------

/**
 * A collection of game systems handling various aspects of gameplay.
 * @namespace Systems
 */
export const Systems = {
    /**
     * Hooks for triggering scene transitions.
     */
    sceneHooks: { onBattleStart: null, onBattleEnd: null },

    /**
     * The Effekseer particle system wrapper.
     * Manages initialization, loading, and playing of effects.
     * @namespace Effekseer
     */
    Effekseer: {
        context: null,
        initPromise: null,
        cache: {},
        zToYUpMatrix: new THREE.Matrix4().makeRotationX(-Math.PI / 2),
        yToZUpMatrix: new THREE.Matrix4().makeRotationX(Math.PI / 2),

        /**
         * Converts a coordinate from the game's coordinate system to Effekseer's.
         * @param {Object} position - The {x, y, z} position.
         * @returns {Object} The converted position.
         */
        convertToEffekseerPosition(position = { x: 0, y: 0, z: 0 }) {
            const vec = new THREE.Vector3(position.x, position.y, position.z);
            vec.applyMatrix4(this.zToYUpMatrix);
            return { x: vec.x, y: vec.y, z: vec.z };
        },

        /**
         * Initializes the Effekseer runtime.
         * @param {THREE.WebGLRenderer} renderer - The Three.js renderer.
         * @returns {Promise<Object|null>} A promise resolving to the Effekseer context.
         */
        init(renderer) {
            if (!window.effekseer || !renderer) return Promise.resolve(null);
            if (this.context) return Promise.resolve(this.context);
            if (this.initPromise) return this.initPromise;

            const wasmPath = resolveAssetPath('src/libs/effekseer.wasm');

            this.initPromise = new Promise((resolve) => {
                if (!wasmPath || typeof effekseer.initRuntime !== 'function') {
                    console.warn('Effekseer runtime is unavailable.');
                    resolve(null);
                    return;
                }

                const onload = () => {
                    this.context = effekseer.createContext();
                    const gl = renderer.getContext();
                    if (!this.context || !gl) {
                        console.warn('Failed to create Effekseer context.');
                        resolve(null);
                        return;
                    }
                    this.context.init(gl, { instanceMaxCount: 256, squareMaxCount: 2048 });
                    this.context.setRestorationOfStatesFlag(true);
                    resolve(this.context);
                };

                const onerror = (err) => {
                    console.error('Effekseer runtime initialization failed.', err);
                    resolve(null);
                };

                effekseer.initRuntime(wasmPath, onload, onerror);
            });

            return this.initPromise;
        },

        /**
         * Preloads all effects defined in Data.effects.
         * @returns {Promise<Array>} A promise that resolves when all effects are loaded.
         */
        preload() {
            const effectPromises = Object.entries(Data.effects).map(([name, path]) => {
                return this.loadEffect(name, path);
            });
            return Promise.all(effectPromises);
        },

        /**
         * Loads a single effect by name and path.
         * @param {string} name - The name/key of the effect.
         * @param {string} path - The file path to the effect.
         * @returns {Promise<Object|null>} A promise resolving to the loaded effect.
         */
        loadEffect(name, path) {
            if (!path) return Promise.resolve(null);
            const ready = this.initPromise || Promise.resolve(this.context);
            return ready.then(() => {
                if (!this.context) return null;
                if (this.cache[name]) return this.cache[name];
                const resolved = resolveAssetPath(path);
                if (!resolved) return null;
                const p = new Promise((resolve) => {
                    const effect = this.context.loadEffect(resolved, 1.0, (efk) => resolve(efk || effect || null));
                    if (effect && typeof effect.then !== 'function') {
                        resolve(effect);
                    }
                });
                this.cache[name] = p;
                return p;
            });
        },

        /**
         * Plays an effect at a specific position.
         * @param {string} name - The name of the effect to play.
         * @param {Object} position - The {x, y, z} position to play the effect at.
         * @returns {Promise<Object|null>} A promise resolving to the playing effect handle.
         */
        play(name, position) {
            const path = Data.effects?.[name];
            if (!path) return Promise.resolve(null);
            const ready = this.initPromise || Promise.resolve(this.context);
            return ready.then(() => this.loadEffect(name, path)).then(effect => {
                if (!effect || !this.context) return null;
                const effekseerPos = this.convertToEffekseerPosition(position);
                return this.context.play(effect, effekseerPos.x, effekseerPos.y, effekseerPos.z);
            });
        },

        /**
         * Updates the Effekseer context for the current frame.
         * @param {THREE.Camera} camera - The Three.js camera.
         */
        update(camera) {
            if (!this.context || !camera) return;
            const viewMatrix = new THREE.Matrix4().multiplyMatrices(
                camera.matrixWorldInverse,
                this.yToZUpMatrix
            );
            this.context.setProjectionMatrix(camera.projectionMatrix.elements);
            this.context.setCameraMatrix(viewMatrix.elements);
            this.context.update();
            this.context.draw();
        }
    },

    /**
     * System for managing the dungeon map.
     * @namespace Map
     */
    Map: {
        /**
         * Generates a new random floor layout.
         */
        generateFloor() {
            if (window.$gameMap) {
                window.$gameMap.generateFloor();
                Log.add(`Floor ${window.$gameMap.floor} generated.`);
            }
            if(Systems.Explore.initialized) Systems.Explore.rebuildLevel();
        },
        /**
         * Gets the tile code at a specific coordinate.
         * @param {number} x - The X coordinate.
         * @param {number} y - The Y coordinate.
         * @returns {number} The tile code (1 for wall, 0 for empty, etc.).
         */
        tileAt(x, y) {
            if (window.$gameMap) {
                return window.$gameMap.tileAt(x, y);
            }
            return 1;
        },
        /**
         * Resolves the effect of stepping on a specific tile code.
         * @param {number} code - The tile code.
         */
        resolveTile(code) {
            if (code === 2) { 
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Battle.startEncounter();
            } else if (code === 3) { 
                window.Game.CampaignManager.checkTrigger('endFloor').then(() => {
                    GameState.run.floor++;
                    Log.add('Descended...');
                    Systems.Map.generateFloor();
                    window.Game.CampaignManager.checkTrigger('startFloor');
                });
            } else if (code === 4) { 
                const treasure = Data.events.treasure;
                const amt = treasure.gold.base
                    + Math.floor(Math.random() * treasure.gold.random)
                    + treasure.gold.perFloor * GameState.run.floor;
                GameState.run.gold += amt;
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Log.loot(`Found ${amt} Gold!`);
            } else if (code === 5) { 
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Events.shop();
            } else if (code === 6) { 
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Events.recruit();
            } else if (code === 7) { 
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Events.shrine();
            } else if (code === 8) { 
                GameState.exploration.map[GameState.exploration.playerPos.y][GameState.exploration.playerPos.x] = 0;
                Systems.Events.trap();
            }
        }
    },

    /**
     * System for handling the 3D exploration view and rendering.
     * @namespace Explore
     */
    Explore: {
        scene: null,
        camera: null,
        renderer: null,
        playerMesh: null,
        mapGroup: null,
        dynamicGroup: null,
        instancedFloor: null,
        instancedWalls: null,
        particles: null,
        moveLerpStart: new THREE.Vector3(),
        moveLerpEnd: new THREE.Vector3(),
        moveLerpProgress: 1,
        isAnimating: false,
        playerTarget: new THREE.Vector3(),
        cameraLookCurrent: new THREE.Vector3(),
        initialized: false,

        /** Initializes the exploration system. */
        init() {
            const container = document.getElementById('explore-container');
            if(!container) return;

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x050510);
            this.scene.fog = new THREE.FogExp2(0x051015, 0.05);

            // Fixed PS1 Style Resolution (480x270)
            const targetW = 480;
            const targetH = 270;
            const aspect = targetW / targetH;

            this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);

            this.renderer = new THREE.WebGLRenderer({ antialias: false });
            this.renderer.setPixelRatio(1); // Force 1:1 pixel ratio
            this.renderer.setSize(targetW, targetH, false);
            this.renderer.domElement.id = 'explore-canvas-3d';

            // Ensure canvas scales up
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.imageRendering = 'pixelated';

            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);

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

            this.initialized = true;
            this.rebuildLevel();
            this.animate();
        },

        /** Rebuilds the 3D map based on GameState.exploration.map */
        rebuildLevel() {
            if(!this.scene) return;
            this.mapGroup.clear();
            const map = GameState.exploration.map;
            const height = map.length;
            const width = map[0].length;
            const count = width * height;

            const geoFloor = new THREE.PlaneGeometry(0.95, 0.95);
            const matFloor = new THREE.MeshLambertMaterial({ color: 0x333333 });
            this.instancedFloor = new THREE.InstancedMesh(geoFloor, matFloor, count);

            const geoBlock = new THREE.BoxGeometry(0.95, 1, 0.95);
            const matWall = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            this.instancedWalls = new THREE.InstancedMesh(geoBlock, matWall, count);

            const dummy = new THREE.Object3D();
            let fIdx = 0, wIdx = 0;

            const hasFloorNeighbor = (x, y) => {
                const check = (nx, ny) => nx>=0 && nx<width && ny>=0 && ny<height && map[ny][nx] !== 1;
                return check(x+1,y) || check(x-1,y) || check(x,y+1) || check(x,y-1);
            };

            for(let y=0; y<height; y++) {
                for(let x=0; x<width; x++) {
                    const tile = map[y][x];
                    if(tile === 0 || tile >= 2) {
                        // Floor
                        dummy.position.set(x, 0, y);
                        dummy.rotation.set(-Math.PI/2, 0, 0);
                        dummy.scale.set(1,1,1);
                        dummy.updateMatrix();
                        this.instancedFloor.setMatrixAt(fIdx++, dummy.matrix);

                        // Special Static Tiles (Stairs)
                        if (tile === 3) {
                            const numSteps = 5; const maxH = 0.4; const sliceW = 0.8 / numSteps;
                            for(let s=0; s<numSteps; s++) {
                                const h = maxH * (numSteps - s) / numSteps;
                                const yPos = h / 2; const zPos = y - 0.4 + (s * sliceW) + (sliceW / 2);
                                const step = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, sliceW * 0.9), new THREE.MeshPhongMaterial({ color: 0x00ffaa, flatShading: true }));
                                step.position.set(x, yPos, zPos);
                                this.mapGroup.add(step);
                            }
                        }
                    } else if (tile === 1) {
                        // Wall
                         if(hasFloorNeighbor(x,y)) {
                            dummy.position.set(x, 0.5, y);
                            dummy.rotation.set(0,0,0);
                            dummy.scale.set(1,1,1);
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

            const startX = GameState.exploration.playerPos.x;
            const startY = GameState.exploration.playerPos.y;
            this.playerMesh.position.set(startX, 0.5, startY);
            this.playerTarget.set(startX, 0.5, startY);
            this.cameraLookCurrent.set(startX, 0, startY);
            this.moveLerpProgress = 1;
            this.isAnimating = false;
        },

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

            const map = GameState.exploration.map;
            const height = map.length;
            const width = map[0].length;

            for(let y=0; y<height; y++) {
                for(let x=0; x<width; x++) {
                    const tile = map[y][x];
                    if(tile === 2) { // Enemy
                       const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 4), new THREE.MeshPhongMaterial({color: 0xff0000}));
                       mesh.position.set(x, 0.3, y);
                       this.dynamicGroup.add(mesh);
                    }
                    else if(tile === 4) { // Gold
                       const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshPhongMaterial({color: 0xffd700}));
                       mesh.position.set(x, 0.25, y);
                       this.dynamicGroup.add(mesh);
                    }
                    else if(tile === 5) { // Shop
                       const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6), new THREE.MeshPhongMaterial({color: 0x0000ff}));
                       mesh.position.set(x, 0.1, y);
                       this.dynamicGroup.add(mesh);
                    }
                    // Recruit(6), Shrine(7), Trap(8) can have markers too if desired
                    else if (tile === 6) { // Recruit
                       const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshPhongMaterial({color: 0x00ff00}));
                       mesh.position.set(x, 0.3, y);
                       this.dynamicGroup.add(mesh);
                    }
                    else if (tile === 7) { // Shrine
                       const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshPhongMaterial({color: 0xffffff}));
                       mesh.position.set(x, 0.3, y);
                       this.dynamicGroup.add(mesh);
                    }
                }
            }
        },

        /** Resizes the canvas to match the window dimensions. */
        resize() {
            if(!this.renderer || !this.camera) return;
            // Resolution is fixed, so we just ensure the renderer stays at fixed size.
            // Aspect ratio is fixed 16:9 (480x270)
            const targetW = 480;
            const targetH = 270;
            const aspect = targetW / targetH;

            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(targetW, targetH, false);
        },

        /**
         * Moves the player in the given direction.
         * @param {number} dx - The change in X.
         * @param {number} dy - The change in Y.
         */
        move(dx, dy) {
            if (GameState.ui.mode !== 'EXPLORE' || GameState.ui.formationMode) return;
            if (this.isAnimating) return;

            const newX = GameState.exploration.playerPos.x + dx;
            const newY = GameState.exploration.playerPos.y + dy;
            const tile = Systems.Map.tileAt(newX, newY);

            if (tile !== 1) {
                // Update Logical Position
                GameState.exploration.playerPos = { x: newX, y: newY };

                // Trigger Animation
                this.moveLerpStart.copy(this.playerMesh.position);
                this.moveLerpEnd.set(newX, 0.5, newY);
                this.moveLerpProgress = 0;
                this.playerTarget.set(newX, 0.5, newY);
                this.isAnimating = true;

                // Trigger events after delay or checkTile handles it
                // We'll let the animation finish before fully giving back control, but events trigger on arrival
                // For now, trigger tile logic immediately, but visual update handles smooth transition
                this.checkTile(tile);
            }
        },

        /**
         * Checks the tile the player landed on and triggers its effect.
         * @param {number} code - The tile code.
         */
        checkTile(code) {
            Systems.Map.resolveTile(code);
            window.Game.Windows.HUD.refresh();
            // Rebuild if map changed (e.g. loot picked up, floor changed)
            // resolveTile for gold/shop/etc sets tile to 0
            if (code === 2 || code === 3 || code === 4 || code === 5 || code === 6 || code === 7 || code === 8) {
                // Delay rebuild slightly to allow move animation to start/complete?
                // For floor change (code 3), it calls generateFloor which calls rebuildLevel.
                // For others, we might want to update visuals.
                if (code !== 3) {
                     // Only sync dynamic objects if not changing floor
                     setTimeout(() => this.syncDynamic(), 300);
                }
            }
        },

        /**
         * Main animation loop.
         */
        animate() {
            if (GameState.ui.mode === 'EXPLORE') {
                requestAnimationFrame(() => this.animate());
            } else {
                // Keep loop running but maybe skip render if hidden?
                // Or just keep running to ensure state resumes correctly.
                // Better to request animation frame always if we want smooth transition back.
                 requestAnimationFrame(() => this.animate());
            }

            if(!this.scene || !this.camera) return;

             // Movement Interpolation
            if (this.moveLerpProgress < 1) {
                this.moveLerpProgress += 0.06;
                if(this.moveLerpProgress > 1) this.moveLerpProgress = 1;

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
            this.playerMesh.position.y = 0.5 + Math.sin(Date.now()*0.005)*0.05;
            this.playerLight.position.copy(this.playerMesh.position).add(new THREE.Vector3(0, 1, 0));

            // Camera follow
            const lx = this.playerTarget.x; const lz = this.playerTarget.z;
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
            this.renderer.render(this.scene, this.camera);
        },

        /**
         * Renders the exploration view.
         * Now just ensures the loop is running.
         */
        render() {
             // 3D renderer handles its own loop in animate()
             if(!this.initialized) this.init();
        }
    },

    /**
     * System for handling in-game event modals (Shop, Recruit, etc.).
     * @namespace Events
     */
    Events: {
        /**
         * Displays an event modal.
         * @param {string} title - The title of the event.
         * @param {string|HTMLElement} content - The content to display.
         */
        show(title, content) {
            const modal = document.getElementById('event-modal');
            const tEl = document.getElementById('event-title');
            const cEl = document.getElementById('event-content');
            tEl.innerText = title;
            cEl.innerHTML = '';
            if (typeof content === 'string') cEl.innerHTML = content;
            else cEl.appendChild(content);
            modal.classList.remove('hidden');
        },
        /** Closes the event modal. */
        close() {
            document.getElementById('event-modal').classList.add('hidden');
        },
        /** Triggers the shop event. */
        shop() {
            Log.add('You discover a mysterious merchant.');
            const container = document.createElement('div');
            container.className = 'space-y-2';
            const shopData = Data.events.shop;
            const stock = [];
            for (let i = 0; i < shopData.stock.count.items; i++) {
                const pool = shopData.stock.pools.items;
                const key = pool[Math.floor(Math.random() * pool.length)];
                if (Data.items[key]) stock.push({ type: 'item', id: key });
            }
            for (let i = 0; i < shopData.stock.count.equipment; i++) {
                const pool = shopData.stock.pools.equipment;
                const key = pool[Math.floor(Math.random() * pool.length)];
                if (Data.equipment[key]) stock.push({ type: 'equip', id: key });
            }

            stock.forEach(s => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';
                let def, name, desc, price;
                if (s.type === 'item') {
                    def = Data.items[s.id]; name = def.name; desc = def.description; price = def.cost;
                } else {
                    def = Data.equipment[s.id]; name = def.name; desc = def.description; price = def.cost;
                }
                row.innerHTML = `<div class="flex flex-col"><span class="text-yellow-100">${name}</span><span class="text-xs text-gray-500">${desc}</span><span class="text-xs text-gray-400">${price} G</span></div>`;
                const btn = document.createElement('button');
                btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                btn.innerText = 'BUY';
                btn.onclick = () => {
                    if (GameState.run.gold >= price) {
                        GameState.run.gold -= price;
                        if (s.type === 'item') {
                            GameState.inventory.items[s.id] = (GameState.inventory.items[s.id] || 0) + 1;
                        } else {
                            GameState.inventory.equipment[s.id] = (GameState.inventory.equipment[s.id] || 0) + 1;
                        }
                        Log.loot(`Bought ${def.name}.`);
                        window.Game.Windows.HUD.refresh();
                        btn.disabled = true;
                        btn.innerText = 'SOLD';
                    } else {
                        alert('Not enough gold!');
                    }
                };
                row.appendChild(btn);
                container.appendChild(row);
            });
            const leaveBtn = document.createElement('button');
            leaveBtn.className = 'mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700';
            leaveBtn.innerText = 'Leave';
            leaveBtn.onclick = () => { Systems.Events.close(); };
            container.appendChild(leaveBtn);
            this.show('SHOP', container);
        },
        /** Triggers the recruit event. */
        recruit() {
            Log.add('You encounter a wandering soul.');
            const container = document.createElement('div');
            container.className = 'space-y-2';
            const count = Math.random() < 0.5 ? 1 : 2;
            const speciesList = Object.keys(Data.creatures);
            const offers = [];
            for (let i = 0; i < count; i++) {
                const sp = speciesList[Math.floor(Math.random() * speciesList.length)];
                offers.push(Data.creatures[sp]);
            }
            offers.forEach(def => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';
                row.innerHTML = `<div class="flex items-center gap-2">${window.Game.Windows.Party.spriteMarkup(def, 'h-10 w-10 object-contain')}<div><div class="text-yellow-100">${def.name}</div><div class="text-xs text-gray-500">HP ${def.baseHp}</div></div></div>`;
                const btn = document.createElement('button');
                btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                btn.innerText = 'RECRUIT';
                btn.onclick = () => {
                    const empty = GameState.party.activeSlots.findIndex(u => u === null);
                    const unit = {
                        uid: 'n' + Date.now() + '_' + Math.random().toString(16).slice(2),
                        speciesId: def.id,
                        name: def.name,
                        sprite: def.sprite,
                        spriteAsset: def.spriteAsset,
                        level: GameState.run.floor,
                        maxhp: Math.round(def.baseHp * (1 + def.hpGrowth * (GameState.run.floor - 1))),
                        hp: Math.round(def.baseHp * (1 + def.hpGrowth * (GameState.run.floor - 1))),
                        exp: 0,
                        temperament: def.temperament,
                        elements: def.elements ? [...def.elements] : [],
                        acts: def.acts,
                        equipmentId: null,
                        slotIndex: -1
                    };
                    GameState.roster.push(unit);
                    if (empty !== -1) {
                        unit.slotIndex = empty;
                        GameState.party.activeSlots[empty] = unit;
                        Log.add(`${unit.name} joins your party.`);
                    } else {
                        Log.add(`${unit.name} waits in reserve.`);
                    }
                    window.Game.Windows.Party.refresh();
                    btn.disabled = true;
                    btn.innerText = 'TAKEN';
                };
                row.appendChild(btn);
                container.appendChild(row);
            });
            const leave = document.createElement('button');
            leave.className = 'mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700';
            leave.innerText = 'Leave';
            leave.onclick = () => { Systems.Events.close(); };
            container.appendChild(leave);
            this.show('RECRUIT', container);
        },
        /** Triggers the shrine event (heal). */
        shrine() {
            Log.add('You find a glowing shrine.');
            GameState.roster.forEach(u => {
                const def = Data.creatures[u.speciesId];
                u.maxhp = Math.round(def.baseHp * (1 + def.hpGrowth * (u.level - 1)));
                u.hp = u.maxhp;
            });
            window.Game.Windows.Party.refresh();
            const msg = document.createElement('div');
            msg.className = 'text-center space-y-2';
            msg.innerHTML = `<div class="text-green-500 text-xl">Your party feels rejuvenated.</div><button class="mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700">Continue</button>`;
            msg.querySelector('button').onclick = () => { Systems.Events.close(); };
            this.show('SHRINE', msg);
        },
        /** Triggers the trap event. */
        trap() {
            Log.add('A hidden trap triggers!');
            const damage = (u) => {
                const maxhp = Systems.Battle.getMaxHp(u);
                const dmg = Math.ceil(maxhp * 0.2);
                u.hp = Math.max(0, u.hp - dmg);
                if (u.hp === 0) Log.battle(`${u.name} was knocked out by the trap!`);
            };
            GameState.party.activeSlots.forEach(u => { if (u) damage(u); });
            window.Game.Windows.Party.refresh();
            const msg = document.createElement('div');
            msg.className = 'text-center space-y-2';
            msg.innerHTML = `<div class="text-red-500 text-xl">A trap harms your party!</div><button class="mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700">Continue</button>`;
            msg.querySelector('button').onclick = () => { Systems.Events.close(); };
            this.show('TRAP', msg);
        }
    },

    /**
     * System for rendering the 3D battle scene.
     * Uses Three.js and Effekseer.
     * @namespace Battle3D
     */
    Battle3D: {
        scene: null,
        camera: null,
        renderer: null,
        group: null,
        sprites: {},
        textureLoader: null,
        textureCache: {},
        spriteScaleFactor: 3,
        cameraState: { angle: -Math.PI / 4, targetAngle: -Math.PI / 4, targetX: 0, targetY: 0 },
        damageLabels: [], // Track damage numbers

        /** Initializes the 3D scene. */
        init() {
            const container = document.getElementById('three-container');
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a0a0a);
            
            // Fixed Resolution 480x270
            const targetW = 480;
            const targetH = 270;
            const aspect = targetW / targetH;

            this.camera = new THREE.PerspectiveCamera(28, aspect, 0.1, 1000);
            this.camera.up.set(0, 0, 1);
            
            this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
            this.renderer.setPixelRatio(1); // Force 1:1 pixel ratio for consistency
            this.renderer.setSize(targetW, targetH, false);
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.imageRendering = 'pixelated';
            container.appendChild(this.renderer.domElement);
            
            Systems.Effekseer.init(this.renderer);
            
            const amb = new THREE.AmbientLight(0xffffff, 0.6);
            const dir = new THREE.DirectionalLight(0xffffff, 0.8);
            dir.position.set(10, -10, 20);
            this.scene.add(amb);
            this.scene.add(dir);
            
            const grid = new THREE.GridHelper(30, 30, 0x444444, 0x111111);
            grid.rotation.x = Math.PI / 2;
            this.scene.add(grid);
            
            this.textureLoader = new THREE.TextureLoader();
            this.group = new THREE.Group();
            this.scene.add(this.group);
            
            this.animate();
        },
        /** Resizes the renderer and camera aspect ratio. */
        resize() {
            if (!this.camera || !this.renderer) return;
            // Fixed Resolution 480x270
            const targetW = 480;
            const targetH = 270;
            const aspect = targetW / targetH;

            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(targetW, targetH, false);
        },
        /**
         * Sets up the battle scene with ally and enemy sprites.
         * @param {Array<Object>} allies - The list of ally units.
         * @param {Array<Object>} enemies - The list of enemy units.
         */
        setupScene(allies, enemies) {
            this.group.clear();
            this.sprites = {};
            const getPos = (isEnemy, slot) => {
                const rowOffset = isEnemy ? 2.5 : -2.5;
                const backOffset = isEnemy ? 2 : -2;
                const xMap = [-2, 0, 2];
                const isBack = slot > 2;
                const col = slot % 3;
                return { x: xMap[col], y: rowOffset + (isBack ? backOffset : 0) };
            };
            const loadTexture = (assetPath, ready) => {
                if (!assetPath || !this.textureLoader) return ready(null);
                const resolvedPath = resolveAssetPath(assetPath);
                if (!resolvedPath) return ready(null);
                if (this.textureCache[resolvedPath]) return ready(this.textureCache[resolvedPath]);
                this.textureLoader.load(
                    resolvedPath,
                    (texture) => {
                        texture.magFilter = THREE.NearestFilter;
                        this.textureCache[resolvedPath] = texture;
                        ready(texture);
                    },
                    undefined,
                    () => ready(null)
                );
            };
            const computeSpriteScale = (texture) => {
                const aspect = (texture?.image?.width && texture?.image?.height)
                    ? texture.image.width / texture.image.height
                    : 1;
                const referencePixelHeight = 64;
                const targetHeight = (texture?.image?.height)
                    ? Math.max(1, Math.round((texture.image.height / referencePixelHeight) * this.spriteScaleFactor))
                    : this.spriteScaleFactor;
                return { x: targetHeight * aspect, y: targetHeight };
            };
            const createSprite = (unit, isEnemy) => {
                if (!unit) return;
                const pos = getPos(isEnemy, unit.slotIndex);
                const addSpriteToScene = (texture) => {
                    if (!texture) {
                        const canvas = document.createElement('canvas');
                        canvas.width = 128; canvas.height = 128;
                        const cx = canvas.getContext('2d');
                        cx.font = '90px serif';
                        cx.textAlign = 'center';
                        cx.textBaseline = 'middle';
                        cx.fillStyle = 'white';
                        cx.shadowColor = 'black';
                        cx.shadowBlur = 4;
                        cx.fillText(unit.sprite, 64, 74);
                        texture = new THREE.CanvasTexture(canvas);
                        texture.magFilter = THREE.NearestFilter;
                    }
                    const mat = new THREE.SpriteMaterial({
                        map: texture,
                        transparent: true,
                        depthWrite: false,
                        alphaTest: 0.01
                    });
                    const sprite = new THREE.Sprite(mat);
                    const baseScale = computeSpriteScale(texture);
                    sprite.scale.set(baseScale.x, baseScale.y, 1);
                    sprite.position.set(pos.x, pos.y, baseScale.y / 2);
                    sprite.userData.uid = unit.uid;
                    sprite.userData.baseScale = baseScale;
                    sprite.userData.baseZ = baseScale.y / 2;
                    
                    const shadow = new THREE.Mesh(
                        new THREE.CircleGeometry(0.8, 16),
                        new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.5, transparent: true })
                    );
                    shadow.position.set(pos.x, pos.y, 0.05);
                    this.group.add(sprite);
                    this.group.add(shadow);
                    this.sprites[unit.uid] = sprite;
                };
                if (unit.spriteAsset) {
                    loadTexture(unit.spriteAsset, addSpriteToScene);
                } else {
                    addSpriteToScene(null);
                }
            };
            allies.forEach(u => createSprite(u, false));
            enemies.forEach(u => createSprite(u, true));
        },
        /**
         * Moves the camera focus to a specific target type.
         * @param {string} type - 'ally', 'enemy', 'victory', or default.
         */
        setFocus(type) {
            const BASE = -Math.PI / 4;
            const SHIFT = Math.PI / 12;
            if (type === 'ally') {
                this.cameraState.targetAngle = BASE - SHIFT;
                this.cameraState.targetX = 0;
                this.cameraState.targetY = 0;
            } else if (type === 'enemy') {
                this.cameraState.targetAngle = BASE + SHIFT;
                this.cameraState.targetX = 0;
                this.cameraState.targetY = 0;
            } else if (type === 'victory') {
                this.cameraState.targetAngle = this.cameraState.angle + Math.PI * 2;
                this.cameraState.targetX = 0;
                this.cameraState.targetY = -3.5;
            } else {
                if (this.cameraState.angle > Math.PI * 2 || this.cameraState.angle < -Math.PI * 2) {
                    this.cameraState.angle = BASE;
                }
                this.cameraState.targetAngle = BASE;
                this.cameraState.targetX = 0;
                this.cameraState.targetY = 0;
            }
        },
        /**
         * Main animation loop for the 3D scene.
         */
        animate() {
            requestAnimationFrame(() => this.animate());
            const cs = this.cameraState;
            if (GameState.ui.mode === 'BATTLE_WIN') {
                cs.angle += 0.005;
            } else {
                cs.angle += (cs.targetAngle - cs.angle) * 0.05;
            }
            const R = 28.28;
            const Z_HEIGHT = 16;
            this.camera.position.x = cs.targetX + Math.cos(cs.angle) * R;
            this.camera.position.y = cs.targetY + Math.sin(cs.angle) * R;
            this.camera.position.z = Z_HEIGHT;
            this.camera.lookAt(cs.targetX, cs.targetY, 2);
            
            this.renderer.render(this.scene, this.camera);
            Systems.Effekseer.update(this.camera);

            // Update damage labels every frame
            this.updateDamageLabels();
        },
        /**
         * Projects a 3D object's position to 2D screen coordinates.
         * @param {THREE.Object3D} obj - The object to project.
         * @returns {Object} The {x, y} screen coordinates.
         */
        toScreen(obj) {
            const vec = new THREE.Vector3();
            obj.updateMatrixWorld();
            this.camera.updateMatrixWorld();
            vec.setFromMatrixPosition(obj.matrixWorld);
            vec.project(this.camera);

            // Map 0..1 coordinates to the UI container size (960x540)
            const width = 960;
            const height = 540;

            return {
                x: (vec.x * 0.5 + 0.5) * width,
                y: (-(vec.y * 0.5) + 0.5) * height
            };
        },
        /**
         * Resets a sprite's visual state (color, opacity, scale, position).
         * @param {string} uid - The unique ID of the unit/sprite.
         */
        resetSprite(uid) {
            const sprite = this.sprites[uid];
            if (sprite) {
                sprite.material.color.setHex(0xffffff);
                sprite.material.blending = THREE.NormalBlending;
                sprite.material.opacity = 1.0;
                const baseScale = sprite.userData?.baseScale || { x: this.spriteScaleFactor, y: this.spriteScaleFactor };
                sprite.scale.set(baseScale.x, baseScale.y, 1);
                const baseZ = sprite.userData?.baseZ ?? baseScale.y / 2;
                sprite.position.z = baseZ;
            }
        },
        /**
         * Plays a death fade animation for a unit.
         * @param {string} uid - The unique ID of the unit.
         */
        playDeathFade(uid) {
            const sprite = this.sprites[uid];
            if (!sprite) return;

            const duration = 800;
            let startTime = null;
            const startZ = sprite.position.z;
            const baseHeight = sprite.userData.baseScale.y;

            const animateFade = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const p = Math.min(1, elapsed / duration);

                const easeIn = p * p;
                const easeOut = p * (2 - p); 

                sprite.material.blending = THREE.AdditiveBlending;
                sprite.material.color.setHex(0xff00ff);

                const newScaleX = sprite.userData.baseScale.x * (1 - easeIn);
                const newScaleY = baseHeight * (1 + easeOut * 2);

                sprite.scale.x = newScaleX;
                sprite.scale.y = newScaleY;

                const heightDifference = newScaleY - baseHeight;
                sprite.position.z = startZ + (heightDifference / 2);

                sprite.material.opacity = 1 - easeIn; 

                if (p < 1) {
                    requestAnimationFrame(animateFade);
                } else {
                    sprite.visible = false;
                }
            };
            requestAnimationFrame(animateFade);
        },
        
// Physics-based Damage Numbers (The "Final Fantasy" Bounce)
/**
 * Shows a bouncing damage number above a unit.
 * @param {string} uid - The unit ID.
 * @param {number} val - The damage value.
 * @param {boolean} [isCrit=false] - Whether it was a critical hit.
 */
showDamageNumber(uid, val, isCrit = false) {
            if (val === 0) return;
            const sprite = this.sprites[uid];
            if (!sprite) return;

            const valStr = Math.abs(val).toString();
            const prefix = ''; 
            
            // 1. Setup Spacing (WIDER)
            const spacing = 0.35; // Increased from 0.25
            const totalWidth = (valStr.length - 1) * spacing;
            const startX = -(totalWidth / 2);

            // 2. Setup Spawn Position (Knee/Waist height)
            const basePos = sprite.position.clone();
            basePos.z += (sprite.userData.baseScale.y * 0.25); 

            // 3. Physics Setup (Subtle)
            const sharedVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.01, 
                (Math.random() - 0.5) * 0.01, 
                0.06 + (Math.random() * 0.02)
            );

            for (let i = 0; i < valStr.length; i++) {
                const char = valStr[i];
                
                const el = document.createElement('div');
                el.className = 'damage-number';
                el.innerText = (i === 0 ? prefix : '') + char;
                el.style.opacity = '0'; 

                if (val > 0) {
                     el.style.color = '#4ade80';
                } else {
                    el.style.color = isCrit ? '#ffcc00' : '#ffffff'; 
                    if (isCrit) el.style.fontSize = '3rem';
                }

                document.getElementById('battle-ui-overlay').appendChild(el);

                const digitPos = basePos.clone();
                digitPos.x += startX + (i * spacing);

                this.damageLabels.push({
                    el: el,
                    worldPos: digitPos,
                    offset: new THREE.Vector3(0, 0, 0),
                    velocity: sharedVelocity.clone(), 
                    gravity: 0.008, 
                    elasticity: 0.5,
                    floorHit: false,
                    life: 60,
                    wait: i * 3 
                });
            }
        },

        /** Updates the physics and rendering of active damage labels. */
        updateDamageLabels() {
            if (this.damageLabels.length === 0) return;

            for (let i = this.damageLabels.length - 1; i >= 0; i--) {
                const label = this.damageLabels[i];

                if (label.wait > 0) {
                    label.wait--;
                    continue; 
                } else {
                    if (label.el.style.opacity === '0') label.el.style.opacity = '1';
                }

                // Apply velocity to offset
                label.velocity.z -= label.gravity;
                label.offset.add(label.velocity);

                // Floor Logic
                const floorLevel = -1.25; 

                if (label.offset.z <= floorLevel) {
                    label.offset.z = floorLevel; // Clamp to floor
                    
                    if (!label.floorHit) {
                        // First Bounce: Reverse vertical velocity
                        label.velocity.z *= -label.elasticity;
                        label.floorHit = true;
                    } else {
                        // Second Hit (Slide): Kill ALL movement (X, Y, Z)
                        // This stops the drifting immediately.
                        label.velocity.set(0, 0, 0);
                        label.gravity = 0; // Disable gravity so it doesn't build up negative Z
                    }
                }

                const currentWorldPos = label.worldPos.clone().add(label.offset);
                currentWorldPos.project(this.camera);

                const width = window.innerWidth;
                const height = window.innerHeight;
                
                const x = (currentWorldPos.x * 0.5 + 0.5) * width;
                const y = (-(currentWorldPos.y * 0.5) + 0.5) * height;

                label.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

                label.life--;
                if (label.life < 15) {
                    label.el.style.opacity = (label.life / 15).toString();
                }

                if (label.life <= 0) {
                    label.el.remove();
                    this.damageLabels.splice(i, 1);
                }
            }
        },
        /**
         * Plays a sequence of animations for a unit.
         * @param {string} uid - The unit ID.
         * @param {Array<Object>} steps - The animation steps.
         * @param {Object} [context={}] - Context containing targets and callbacks.
         */
        playAnim(uid, steps = [], context = {}) {
            const sprite = this.sprites[uid];
            if (!sprite) { context.onComplete?.(); return; }
            this.resetSprite(uid);
            const origin = sprite.position.clone();
            const targets = context.targets || [];

            const wait = (ms) => new Promise(res => setTimeout(res, ms));
            const averageTargetPosition = () => {
                if (!targets.length) return { x: origin.x, y: origin.y, z: origin.z };
                const total = targets.reduce((acc, t) => {
                    const ts = this.sprites[t.uid];
                    if (ts) {
                        acc.x += ts.position.x;
                        acc.y += ts.position.y;
                        acc.z += ts.position.z;
                        acc.count++;
                    }
                    return acc;
                }, { x: 0, y: 0, z: 0, count: 0 });
                const divisor = Math.max(1, total.count);
                return { x: total.x / divisor, y: total.y / divisor, z: total.z / divisor };
            };

            const stepHandlers = {
                // FIXED FEEDBACK HANDLER (Flicker Shake)
                feedback: (step) => new Promise(resolve => {
                    const boundSprites = step.bind === 'target' ? targets.map(t => this.sprites[t.uid]).filter(Boolean) : [sprite];
                    const startPositions = boundSprites.map(sp => sp.position.clone());
                    const duration = step.duration || 250;
                    let startTime = null;

                    const animateFlash = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const elapsed = timestamp - startTime;
                        const p = Math.min(1, elapsed / duration);
                        const isFlashFrame = Math.floor(elapsed / 40) % 2 === 0;
                        const currentShake = (step.shake || 0) * (1 - p);

                        boundSprites.forEach((sp, i) => {
                            const base = startPositions[i];
                            if (currentShake > 0) {
                                sp.position.x = base.x + (Math.random() - 0.5) * currentShake;
                                sp.position.y = base.y + (Math.random() - 0.5) * currentShake;
                            }
                            if (step.color) {
                                if (isFlashFrame) {
                                    sp.material.color.setHex(step.color);
                                    sp.material.blending = THREE.AdditiveBlending;
                                } else {
                                    sp.material.color.setHex(0xffffff);
                                    sp.material.blending = THREE.NormalBlending;
                                }
                            }
                        });

                        if (p < 1) {
                            requestAnimationFrame(animateFlash);
                        } else {
                            boundSprites.forEach((sp, i) => {
                                sp.position.copy(startPositions[i]);
                                this.resetSprite(sp.userData.uid);
                            });
                            resolve();
                        }
                    };
                    requestAnimationFrame(animateFlash);
                }),
                wait: (step) => wait(step.duration || 300),
                jump: (step) => new Promise(resolve => {
                    const axis = 'z';
                    const startPos = sprite.position[axis];
                    const amp = step.height || 0.8;
                    const duration = step.duration || 500;
                    let startTime = null;
                    const animateJump = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const elapsed = timestamp - startTime;
                        const progress = Math.min(1, elapsed / duration);
                        sprite.position[axis] = startPos + Math.sin(progress * Math.PI) * amp;
                        if (progress < 1) {
                            requestAnimationFrame(animateJump);
                        } else {
                            sprite.position[axis] = startPos;
                            resolve();
                        }
                    };
                    requestAnimationFrame(animateJump);
                }),
                approach: (step) => new Promise(resolve => {
                    const targetPos = averageTargetPosition();
                    const dir = new THREE.Vector3(targetPos.x - origin.x, targetPos.y - origin.y, 0);
                    if (dir.length() === 0) { resolve(); return; }
                    dir.normalize();
                    dir.multiplyScalar(step.distance || 1);
                    const destination = {
                        x: origin.x + dir.x,
                        y: origin.y + dir.y,
                        z: sprite.position.z
                    };
                    const duration = step.duration || 250;
                    let startTime = null;
                    const animateMove = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const elapsed = timestamp - startTime;
                        const p = Math.min(1, elapsed / duration);
                        sprite.position.x = origin.x + (destination.x - origin.x) * p;
                        sprite.position.y = origin.y + (destination.y - origin.y) * p;
                        if (p < 1) {
                            requestAnimationFrame(animateMove);
                        } else {
                            resolve();
                        }
                    };
                    requestAnimationFrame(animateMove);
                }),
                retreat: (step) => new Promise(resolve => {
                    const duration = step.duration || 250;
                    const start = sprite.position.clone();
                    let startTime = null;
                    const animateMove = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const elapsed = timestamp - startTime;
                        const p = Math.min(1, elapsed / duration);
                        sprite.position.lerpVectors(start, origin, p);
                        if (p < 1) {
                            requestAnimationFrame(animateMove);
                        } else {
                            sprite.position.copy(origin);
                            resolve();
                        }
                    };
                    requestAnimationFrame(animateMove);
                }),
                effect: (step) => {
                    const boundSprites = step.bind === 'target' ? targets.map(t => this.sprites[t.uid]).filter(Boolean) : [sprite];
                    const plays = boundSprites.map(sp => {
                        const anchor = step.anchor ?? 0.5;
                        const zOffset = sp.position.z - sp.userData.baseZ;
                        const zPos = zOffset + (sp.userData.baseScale.y * anchor);
                        const pos = { x: sp.position.x, y: sp.position.y, z: zPos };
                        return Systems.Effekseer.play(step.effect, pos);
                    });
                    const hold = step.hold ?? 300;
                    return Promise.all(plays).then(() => wait(hold));
                },
                apply: (step) => {
                    context.onApply?.();
                    return wait(step?.duration || 0);
                }
            };

            const runStep = (idx) => {
                if (idx >= steps.length) {
                    sprite.position.copy(origin);
                    context.onComplete?.();
                    return;
                }
                const step = steps[idx];
                const handler = stepHandlers[step.type];
                (handler ? handler(step) : Promise.resolve()).then(() => runStep(idx + 1));
            };

            if (steps.length === 0) { context.onComplete?.(); return; }
            runStep(0);
        }
    },

    /**
     * System for handling passive triggers and traits.
     * @namespace Triggers
     */
    Triggers: {
        /**
         * Fires an event to all units, triggering any relevant traits.
         * @param {string} eventName - The name of the event (e.g., 'onBattleEnd').
         * @param {...any} args - Additional arguments to pass to the handler.
         */
        fire(eventName, ...args) {
            const allUnits = [...(GameState.battle?.allies || []), ...(GameState.battle?.enemies || [])];
            allUnits.forEach(unit => {
                if(unit.hp <= 0) return;
                const unitWithStats = Systems.Battle.getUnitWithStats(unit);
                const traits = [];
                const species = Data.creatures[unit.speciesId];
                if (species && species.passives) {
                    species.passives.forEach(passiveId => {
                        const passive = Data.passives[passiveId];
                        if (passive) traits.push(...passive.traits);
                    });
                }
                if (unit.equipmentId) {
                    const equipment = Data.equipment[unit.equipmentId];
                    if (equipment) traits.push(...equipment.traits);
                }
                traits.forEach(trait => {
                    this.handleTrait(eventName, trait, unit, ...args);
                });
            });
        },
        /**
         * Logic to handle a specific trait trigger.
         * @param {string} eventName - The event name.
         * @param {Object} trait - The trait definition.
         * @param {Object} unit - The unit possessing the trait.
         * @param {...any} args - Additional arguments.
         */
        handleTrait(eventName, trait, unit, ...args) {
            switch (eventName) {
                case 'onBattleEnd':
                    if(unit.evadeBonus) unit.evadeBonus = 0;
                    if (trait.type === 'post_battle_heal') {
                        const healAmount = Math.floor(Math.pow(Math.random(), 2) * unit.level) + 1;
                        unit.hp = Math.min(Systems.Battle.getMaxHp(unit), unit.hp + healAmount);
                        Log.add(`${unit.name} was healed by Soothing Breeze.`);
                    } else if (trait.type === 'post_battle_leech') {
                        const party = args[0];
                        const adjacent = this.getAdjacentUnits(unit, party);
                        let totalDamage = 0;
                        adjacent.forEach(target => {
                            const damage = parseInt(trait.formula) || 0;
                            target.hp = Math.max(0, target.hp - damage);
                            totalDamage += damage;
                            Log.add(`${unit.name} leeched ${damage} HP from ${target.name}.`);
                        });
                        const leechHeal = Math.floor(totalDamage / 2);
                        unit.hp = Math.min(Systems.Battle.getMaxHp(unit), unit.hp + leechHeal);
                        Log.add(`${unit.name} recovered ${leechHeal} HP.`);
                    }
                    break;
                case 'onTurnStart':
                    if (trait.type === 'turn_heal') {
                        const healAmount = parseInt(trait.formula) || 0;
                        unit.hp = Math.min(Systems.Battle.getMaxHp(unit), unit.hp + healAmount);
                    }
                    break;
                case 'onUnitDeath':
                    if (trait.type === 'on_death_cast') {
                        const [deadUnit] = args;
                        if (deadUnit.uid === unit.uid) {
                            const skill = Data.skills[trait.skill.toLowerCase()];
                            if (skill) {
                                const enemies = GameState.battle.enemies.filter(e => e.hp > 0);
                                Systems.Battle.applyEffects(skill, unit, enemies);
                                Log.battle(`${unit.name} casts ${skill.name} upon death!`);
                            }
                        }
                    }
                    break;
                case 'onUnitEvade':
                     if (trait.type === 'evade_bonus') {
                        const [evadingUnit] = args;
                        if (evadingUnit.uid === unit.uid) {
                            const maxBonus = Math.floor(unit.level / 2);
                            if(!unit.evadeBonus) unit.evadeBonus = 0;
                            if(unit.evadeBonus < maxBonus){
                                unit.evadeBonus += 1;
                                Log.battle(`${unit.name} gained +1 bonus from evading!`);
                            }
                        }
                    }
                    break;
            }
        },
        /**
         * Gets adjacent units in the formation.
         * @param {Object} unit - The reference unit.
         * @param {Array<Object>} party - The party array.
         * @returns {Array<Object>} List of adjacent units.
         */
        getAdjacentUnits(unit, party) {
            const adjacent = [];
            const index = unit.slotIndex;
            if(index === -1) return [];
            const potentialAdjacent = [
                index - 1, 
                index + 1, 
                index - 3, 
                index + 3  
            ];
            potentialAdjacent.forEach(adjIndex => {
                if(index % 3 === 0 && adjIndex === index-1) return;
                if(index % 3 === 2 && adjIndex === index+1) return;
                const adjacentUnit = party.find(u => u && u.slotIndex === adjIndex);
                if(adjacentUnit) adjacent.push(adjacentUnit);
            });
            return adjacent;
        }
    },

    /**
     * Legacy battle system containing calculation logic.
     * Most state management has moved to BattleManager.
     * @namespace Battle
     */
    Battle: {
        // Refactor Note: This should be moved to BattleManager or Game_Action
        elementStrengths: { G: 'B', B: 'R', R: 'G', W: 'K', K: 'W' },
        elementWeaknesses: { G: 'R', B: 'G', R: 'B', W: 'W', K: 'K' },

        /**
         * Calculates the effectiveness multiplier of an element against another.
         * @param {string} actionElement - The element of the action.
         * @param {string} creatureElement - The element of the creature.
         * @param {string} role - 'attacker' or 'defender'.
         * @returns {number} The multiplier (0.75, 1, or 1.25).
         */
        elementRelation(actionElement, creatureElement, role) {
            if (!actionElement || !creatureElement) return 1;
            const strongAgainst = this.elementStrengths[actionElement];
            const weakAgainst = this.elementWeaknesses[actionElement];
            if (role === 'attacker') {
                if (creatureElement === actionElement) return 1.25;
                if (this.elementStrengths[creatureElement] === actionElement) return 0.75;
                return 1;
            }
            if (creatureElement === actionElement && (creatureElement === 'W' || creatureElement === 'K')) return 0.75;
            if (strongAgainst === creatureElement) return 1.25;
            if (weakAgainst === creatureElement || this.elementStrengths[creatureElement] === actionElement) return 0.75;
            return 1;
        },
        /**
         * Calculates the total elemental multiplier for a unit.
         * @param {string} actionElement - The action's element.
         * @param {Object} unit - The unit.
         * @param {string} role - 'attacker' or 'defender'.
         * @returns {number} The cumulative multiplier.
         */
        elementMultiplier(actionElement, unit, role) {
            if (!actionElement) return 1;
            const elems = unit.elements || [];
            return elems.reduce((mult, e) => mult * this.elementRelation(actionElement, e, role), 1);
        },
        /**
         * Calculates the numeric value of an effect.
         * @param {Object} effect - The effect definition.
         * @param {Object} action - The action definition.
         * @param {Object} a - The user (attacker).
         * @param {Object} b - The target (defender).
         * @returns {number} The calculated value (damage/heal).
         */
        calculateEffectValue(effect, action, a, b) {
            if (!effect.formula) return 0;
            let value = 0;
            try {
                value = Math.floor(eval(effect.formula));
            } catch (e) {
                console.error('Error evaluating formula:', effect.formula, e);
                return 0;
            }
            const element = action.element;
            const attackerWithStats = this.getUnitWithStats(a);
            const attackMult = this.elementMultiplier(element, attackerWithStats, 'attacker');
            const defenderWithStats = this.getUnitWithStats(b);
            const defenseMult = this.elementMultiplier(element, defenderWithStats, 'defender');

            const baseDamage = value + attackerWithStats.power_bonus;
            let finalValue = Math.floor(baseDamage * attackMult * defenseMult);

            const evadeChance = (defenderWithStats.evade_chance || 0);
            if (Math.random() < evadeChance) {
                Systems.Triggers.fire('onUnitEvade', b);
                return 0;
            }

            const critChance = (Data.config.baseCritChance || 0.05) + (attackerWithStats.crit_bonus_percent || 0);
            if (Math.random() < critChance) {
                finalValue = Math.floor(finalValue * (Data.config.baseCritMultiplier || 1.5));
                Log.battle('> Critical Hit!');
            }

            if (effect.type === 'hp_damage' && b.status?.includes('guarding')) {
                finalValue = Math.floor(finalValue / 2);
                Log.battle('> Guarding!');
            }
            return finalValue;
        },
        /**
         * Applies effects of an action to targets.
         * @param {Object} action - The action/skill.
         * @param {Object} user - The user.
         * @param {Array<Object>} targets - The targets.
         * @returns {Array<Object>} Results of the application.
         */
        applyEffects(action, user, targets) {
            const results = [];
            (action.effects || []).forEach(effect => {
                targets.forEach(target => {
                    let value = 0;
                    if (effect.type !== 'add_status') {
                        value = this.calculateEffectValue(effect, action, user, target);
                    }
                    results.push({ target, value, effect });
                });
            });
            return results;
        },
        /**
         * Returns a unit object with dynamic stats calculated (traits, equipment).
         * @param {Object} unit - The raw unit object.
         * @returns {Object} The unit with computed stats.
         */
        getUnitWithStats(unit) {
            const unitWithStats = { ...unit };
            if (unit.elements) unitWithStats.elements = [...unit.elements];
            if (unit.status) unitWithStats.status = [...unit.status];

            unitWithStats.power_bonus = 0;
            unitWithStats.speed_bonus = 0;
            unitWithStats.crit_bonus_percent = 0;
            unitWithStats.survive_ko_chance = 0;
            unitWithStats.revive_on_ko_chance = 0;
            unitWithStats.revive_on_ko_percent = 0;
            unitWithStats.xp_bonus_percent = 0;

            const processTraits = (traits) => {
              traits.forEach(trait => {
                switch (trait.type) {
                    case 'hp_bonus_percent': break;
                    case 'power_bonus': unitWithStats.power_bonus += parseInt(trait.formula) || 0; break;
                    case 'speed_bonus': unitWithStats.speed_bonus += parseInt(trait.formula) || 0; break;
                    case 'element_change': unitWithStats.elements = [trait.element]; break;
                    case 'crit_bonus_percent': unitWithStats.crit_bonus_percent += parseFloat(trait.formula) || 0; break;
                    case 'survive_ko': unitWithStats.survive_ko_chance += parseFloat(trait.formula) || 0; break;
                    case 'revive_on_ko':
                        unitWithStats.revive_on_ko_chance += parseFloat(trait.chance) || 0;
                        unitWithStats.revive_on_ko_percent += parseFloat(trait.formula) || 0;
                        break;
                    case 'xp_bonus_percent': unitWithStats.xp_bonus_percent += parseFloat(trait.formula) || 0; break;
                }
              });
            }

            if (unit.equipmentId) {
                const equipment = Data.equipment[unit.equipmentId];
                if (equipment) processTraits(equipment.traits);
            }
            const species = Data.creatures[unit.speciesId];
            if (species && species.passives) {
                species.passives.forEach(passiveId => {
                    const passive = Data.passives[passiveId];
                    if (passive) processTraits(passive.traits);
                });
            }
            return unitWithStats;
        },
        /**
         * Calculates the maximum HP of a unit.
         * @param {Object} unit - The unit.
         * @returns {number} The maximum HP.
         */
        getMaxHp(unit) {
            // Using the class method if available, otherwise fallback (for enemies using old structure temporarily or robustness)
            if (typeof unit.mhp === 'number') return unit.mhp; // Getter
            if (typeof unit.mhp === 'function') return unit.mhp(); // Method

            // Fallback for raw objects (e.g. enemies created in startEncounter until refactored)
            const def = Data.creatures[unit.speciesId];
            let baseMax = Math.round(def.baseHp * (1 + def.hpGrowth * (unit.level - 1)));
            if (unit.equipmentId) {
                const eq = Data.equipment[unit.equipmentId];
                if (eq) {
                    eq.traits.forEach(trait => {
                        if (trait.type === 'hp_bonus_percent') {
                            baseMax = Math.round(baseMax * (1 + parseFloat(trait.formula)));
                        }
                    });
                }
            }
            return baseMax + (unit.maxHpBonus || 0);
        },
        /**
         * Starts a new encounter.
         * Delegates to BattleManager.
         */
        startEncounter() {
            import('./managers.js').then(({ BattleManager }) => {
                BattleManager.startEncounter();
            });
        },
        nextRound() {
            // Deprecated, use BattleManager
        },
        requestPlayerTurn() {
             // Deprecated
        },
        resumeAuto() {
             // Deprecated
        },
        /**
         * Swaps the positions of two units in the active party.
         * @param {number} idx1 - Index of the first unit.
         * @param {number} idx2 - Index of the second unit.
         */
        swapUnits(idx1, idx2) {
            const u1 = GameState.party.activeSlots[idx1];
            const u2 = GameState.party.activeSlots[idx2];
            GameState.party.activeSlots[idx1] = u2;
            GameState.party.activeSlots[idx2] = u1;
            if (GameState.party.activeSlots[idx1]) GameState.party.activeSlots[idx1].slotIndex = idx1;
            if (GameState.party.activeSlots[idx2]) GameState.party.activeSlots[idx2].slotIndex = idx2;
            window.Game.Windows.Party.refresh();
            if (GameState.ui.mode === 'BATTLE') {
                GameState.battle.allies = GameState.party.activeSlots.filter(u => u !== null);
                Systems.Battle3D.setupScene(GameState.battle.allies, GameState.battle.enemies);
            }
            Log.add('Formation changed.');
        },
        processNextTurn() {
             // Deprecated
        },
        end(win) {
             // Deprecated
        }
    },
};
