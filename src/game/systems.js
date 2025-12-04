import { Data } from '../assets/data/data.js';
import { Log } from './log.js';
import { resolveAssetPath } from './core.js';
import { ExploreSystem } from './systems/ExploreSystem.js';
import { BattleRenderSystem } from './systems/BattleRenderSystem.js';
import { EventSystem } from './systems/EventSystem.js';

// ------------------- SYSTEMS DEFINITIONS -------------------

/**
 * The Effekseer particle system wrapper.
 * Manages initialization, loading, and playing of effects.
 * @namespace Effekseer
 */
const EffekseerSystem = {
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
};

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
     */
    Effekseer: EffekseerSystem,

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
         */
        generateShopStock: () => Systems.Event.generateShopStock(),

        /**
         * Displays the shop UI.
         */
        showShop(stock) {
            Log.add('You discover a mysterious merchant.');
            if (window.Game && window.Game.Windows && window.Game.Windows.Shop) {
                return window.Game.Windows.Shop.show(stock);
            } else {
                console.error("Window_Shop is not initialized.");
                return Promise.resolve();
            }
        },

        /** Triggers the shop event (legacy/default). */
        shop(stock) {
            return this.showShop(stock || this.generateShopStock());
        },

        /**
         * Generates random recruit offers.
         */
        generateRecruitOffers: () => Systems.Event.generateRecruitOffers(),

        /**
         * Displays the recruit UI.
         */
        showRecruit(offers) {
            Log.add('You encounter a wandering soul.');
            if (window.Game && window.Game.Windows && window.Game.Windows.Recruit) {
                return window.Game.Windows.Recruit.show(offers);
            } else {
                console.error("Window_Recruit is not initialized.");
                return Promise.resolve();
            }
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
     * @type {BattleRenderSystem}
     */
    Battle3D: new BattleRenderSystem(),

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
                    if (unit.hp <= 0) return;
                    if (typeof unit.triggerTraits === 'function') {
                        unit.triggerTraits(eventName, ...args);
                    }
                });
            });
        }
    },

    /**
     * System for global event management.
     * @type {EventSystem}
     */
    Event: new EventSystem()

};
