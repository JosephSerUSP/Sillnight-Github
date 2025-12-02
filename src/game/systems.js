import { Data } from '../assets/data/data.js';
import { Log } from './log.js';
import { resolveAssetPath } from './core.js';
import { ExploreSystem } from './systems/ExploreSystem.js';

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
            if (window.Game && window.Game.ui && window.Game.ui.mode === 'EXPLORE') {
                return { x: position.x, y: position.y, z: position.z };
            }
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
            let viewMatrix;
            if (window.Game && window.Game.ui && window.Game.ui.mode === 'EXPLORE') {
                viewMatrix = camera.matrixWorldInverse;
            } else {
                viewMatrix = new THREE.Matrix4().multiplyMatrices(
                    camera.matrixWorldInverse,
                    this.yToZUpMatrix
                );
            }
            this.context.setProjectionMatrix(camera.projectionMatrix.elements);
            this.context.setCameraMatrix(viewMatrix.elements);
            this.context.update();
            this.context.draw();
        }
    },

    /**
     * System for handling the 3D exploration view and rendering.
     * @type {ExploreSystem}
     */
    Explore: new ExploreSystem(),

    /**
     * System for handling in-game event modals (Shop, Recruit, etc.).
     * @namespace Events
     */
    Events: {
        _resolve: null,

        /**
         * Displays an event modal and waits for it to close.
         * @param {string} title - The title of the event.
         * @param {string|HTMLElement} content - The content to display.
         * @returns {Promise<void>} Resolves when the modal is closed.
         */
        show(title, content) {
            return new Promise(resolve => {
                this._resolve = resolve;
                const modal = document.getElementById('event-modal');
                const tEl = document.getElementById('event-title');
                const cEl = document.getElementById('event-content');
                tEl.innerText = title;
                cEl.innerHTML = '';
                if (typeof content === 'string') cEl.innerHTML = content;
                else cEl.appendChild(content);
                modal.classList.remove('hidden');
            });
        },
        /** Closes the event modal. */
        close() {
            document.getElementById('event-modal').classList.add('hidden');
            if (this._resolve) {
                this._resolve();
                this._resolve = null;
            }
        },

        /**
         * Generates random shop stock.
         * @returns {Array<Object>} List of items/equipment.
         */
        generateShopStock() {
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
            return stock;
        },

        /**
         * Displays the shop UI.
         * @param {Array<Object>} stock - The stock to display.
         * @returns {Promise<void>} Resolves when closed.
         */
        showShop(stock) {
            Log.add('You discover a mysterious merchant.');
            const container = document.createElement('div');
            container.className = 'space-y-2';

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
                    if (window.$gameParty.gold >= price) {
                        window.$gameParty.loseGold(price);
                        if (s.type === 'item') {
                            window.$gameParty.gainItem(s.id, 1);
                        } else {
                            window.$gameParty.gainItem(s.id, 1);
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
            return this.show('SHOP', container);
        },

        /** Triggers the shop event (legacy/default). */
        shop(stock) {
            return this.showShop(stock || this.generateShopStock());
        },

        /**
         * Generates random recruit offers.
         * @returns {Array<Object>} List of creature definitions.
         */
        generateRecruitOffers() {
            const count = Math.random() < 0.5 ? 1 : 2;
            const speciesList = Object.keys(Data.creatures);
            const offers = [];
            for (let i = 0; i < count; i++) {
                const sp = speciesList[Math.floor(Math.random() * speciesList.length)];
                offers.push(Data.creatures[sp]);
            }
            return offers;
        },

        /**
         * Displays the recruit UI.
         * @param {Array<Object>} offers - List of creature definitions.
         * @returns {Promise<void>} Resolves when closed.
         */
        showRecruit(offers) {
            Log.add('You encounter a wandering soul.');
            const container = document.createElement('div');
            container.className = 'space-y-2';

            const spriteMarkup = (def, classes = '') => {
                const path = resolveAssetPath(def.spriteAsset) || '';
                return path ? `<img src="${path}" class="${classes}" alt="${def.name}">` : `<div class="${classes} flex items-center justify-center bg-gray-800 text-white text-xs">${def.sprite}</div>`;
            };

            offers.forEach(def => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';
                row.innerHTML = `<div class="flex items-center gap-2">${spriteMarkup(def, 'h-10 w-10 object-contain')}<div><div class="text-yellow-100">${def.name}</div><div class="text-xs text-gray-500">HP ${def.baseHp}</div></div></div>`;
                const btn = document.createElement('button');
                btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black';
                btn.innerText = 'RECRUIT';
                btn.onclick = () => {
                    const floor = window.$gameMap.floor;
                    window.$gameParty.addActor(def.id, floor);
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
            return this.show('RECRUIT', container);
        },

        /** Triggers the recruit event (legacy). */
        recruit(offers) {
            return this.showRecruit(offers || this.generateRecruitOffers());
        },

        /** Triggers the shrine event (heal). */
        shrine() {
            Log.add('You find a glowing shrine.');
            window.$gameParty.roster.forEach(u => {
                u.recoverAll();
            });
            window.Game.Windows.Party.refresh();

            if (window.$gameMap && window.$gameMap.playerPos) {
                const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
                Systems.Effekseer.play('MAP_Shrine', pos);
            }
            Log.add('Your party feels rejuvenated.');
            return Promise.resolve();
        },
        /** Triggers the trap event. */
        trap() {
            Log.add('A hidden trap triggers!');
            const damage = (u) => {
                const maxhp = u.mhp;
                const dmg = Math.ceil(maxhp * 0.2);
                u.hp = Math.max(0, u.hp - dmg);
                if (u.hp === 0) Log.battle(`${u.name} was knocked out by the trap!`);
            };
            window.$gameParty.activeSlots.forEach(u => { if (u) damage(u); });
            window.Game.Windows.Party.refresh();

            if (window.$gameMap && window.$gameMap.playerPos) {
                const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
                Systems.Effekseer.play('MAP_Trap', pos);
            }
            Log.add('A trap harms your party!');
            return Promise.resolve();
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
        // renderer: null, // Deprecated: Use RenderManager
        group: null,
        sprites: {},
        textureLoader: null,
        textureCache: {},
        spriteScaleFactor: 3,
        cameraState: { angle: -Math.PI / 4, targetAngle: -Math.PI / 4, targetX: 0, targetY: 0 },

        /** Initializes the 3D scene. */
        init() {
             // Get shared renderer
             if (window.Game && window.Game.RenderManager) {
                // Battle scene logic will attach it when needed, or we attach it now?
                // Actually, init() is called at startup. Battle isn't active yet.
                // We should rely on scene transitions to attach.
                // But for now, let's just make sure Effekseer init works.
                Systems.Effekseer.init(window.Game.RenderManager.getRenderer());
            }

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a0a0a);
            
            // Fixed Resolution 480x270
            const targetW = 480;
            const targetH = 270;
            const aspect = targetW / targetH;

            this.camera = new THREE.PerspectiveCamera(28, aspect, 0.1, 1000);
            this.camera.up.set(0, 0, 1);
            
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
            if (!this.camera) return;
            const targetW = 480;
            const targetH = 270;
            const aspect = targetW / targetH;

            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
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
                        texture.minFilter = THREE.NearestFilter;
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
                        texture.minFilter = THREE.NearestFilter;
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
            if (window.Game.ui.mode === 'BATTLE_WIN') {
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
            
            const renderer = window.Game.RenderManager.getRenderer();
            if (renderer && (window.Game.ui.mode === 'BATTLE' || window.Game.ui.mode === 'BATTLE_WIN')) {
                renderer.render(this.scene, this.camera);
                Systems.Effekseer.update(this.camera);
            }
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
            
            // Get screen position of the sprite head/top
            const headPos = sprite.position.clone();
            headPos.z += (sprite.userData.baseScale.y * 0.5);

            // Re-implement toScreen logic inline for vector since toScreen takes object
            const vec = headPos.clone();
            vec.project(this.camera);
            const width = 960;
            const height = 540;
            const x = (vec.x * 0.5 + 0.5) * width;
            const y = (-(vec.y * 0.5) + 0.5) * height;

            import('./PopupManager.js').then(({ PopupManager }) => {
                PopupManager.spawn(x, y, val, isCrit);
            });
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
            import('./managers.js').then(({ BattleManager }) => {
                const allUnits = [...(BattleManager.allies || []), ...(BattleManager.enemies || [])];
                allUnits.forEach(unit => {
                    if(unit.hp <= 0) return;

                    // Using new trait system access
                    // If unit has traitObjects method (Game_Battler), use traits()
                    // Otherwise fall back to manual gathering (if any legacy objects remain, though all should be Game_Battler now)

                    let traits = [];
                    if (typeof unit.traits === 'function') {
                        traits = unit.traits();
                    } else {
                        // Fallback for safety during transition
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
                    }

                    traits.forEach(trait => {
                        this.handleTrait(eventName, trait, unit, ...args);
                    });
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
                        // Formula evaluation
                        // trait.formula might be 'level'
                        let amount = 0;
                        if (trait.formula === 'level') amount = Math.floor(Math.pow(Math.random(), 2) * unit.level) + 1;
                        else amount = parseInt(trait.formula) || 0;

                        unit.hp = Math.min(unit.mhp, unit.hp + amount);
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
                        unit.hp = Math.min(unit.mhp, unit.hp + leechHeal);
                        Log.add(`${unit.name} recovered ${leechHeal} HP.`);
                    }
                    break;
                case 'onTurnStart':
                    if (trait.type === 'turn_heal') {
                        const healAmount = parseInt(trait.formula) || 0;
                        unit.hp = Math.min(unit.mhp, unit.hp + healAmount);
                    }
                    break;
                case 'onUnitDeath':
                    if (trait.type === 'on_death_cast') {
                        const [deadUnit] = args;
                        if (deadUnit.uid === unit.uid) {
                            const skill = Data.skills[trait.skill.toLowerCase()];
                            if (skill) {
                                // Import BattleManager dynamically or assume global access?
                                // BattleManager is imported in systems.js? No, it's circular.
                                // But BattleManager logic for applyEffects is now in Game_Action.
                                // We can instantiate Game_Action here.

                                import('./managers.js').then(({ BattleManager }) => {
                                    const enemies = BattleManager.enemies.filter(e => e.hp > 0);
                                    import('./classes/Game_Action.js').then(({ Game_Action }) => {
                                        const action = new Game_Action(unit);
                                        action.setObject(skill);
                                        enemies.forEach(target => {
                                            // apply returns results but we just want to log?
                                            // Or we need visual feedback?
                                            // Ideally we queue this action in BattleManager but that's complex.
                                            // For now, silent application or log.
                                            action.apply(target);
                                        });
                                        Log.battle(`${unit.name} casts ${skill.name} upon death!`);
                                    });
                                });
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

};
