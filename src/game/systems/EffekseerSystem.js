import { Data } from '../../assets/data/data.js';
import { resolveAssetPath } from '../core.js';

/**
 * The Effekseer particle system wrapper.
 * Manages initialization, loading, and playing of effects.
 * @namespace Effekseer
 */
export class EffekseerSystem {
    constructor() {
        this.context = null;
        this.initPromise = null;
        this.cache = {};
        this.zToYUpMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
        this.yToZUpMatrix = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    }

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
    }

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
    }

    /**
     * Preloads all effects defined in Data.effects.
     * @returns {Promise<Array>} A promise that resolves when all effects are loaded.
     */
    preload() {
        if (!Data.effects) return Promise.resolve([]);
        const effectPromises = Object.entries(Data.effects).map(([name, path]) => {
            return this.loadEffect(name, path);
        });
        return Promise.all(effectPromises);
    }

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
                // Keep onerror to prevent hangs on 404
                const onerror = (msg, url) => {
                    console.warn(`Failed to load Effekseer effect: ${name} (${url}) - ${msg}`);
                    resolve(null);
                };

                // The effect handle is returned synchronously by loadEffect in this version
                // but the onload callback argument is undefined.
                // We must close over the returned 'effect' handle for the callback.

                let effect = null;
                const onload = () => {
                    // Use the closed-over effect handle
                    resolve(effect);
                };

                effect = this.context.loadEffect(resolved, 1.0, onload, onerror);

                // Fallback: If it's a promise (newer versions?), handle it.
                if (effect && typeof effect.then === 'function') {
                    effect.then(resolve).catch(() => resolve(null));
                }
            });
            this.cache[name] = p;
            return p;
        });
    }

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
    }

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
}
