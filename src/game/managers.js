// Managers for scene flow and input.
import { DataManager } from './DataManager.js';
import { BattleManager } from './managers/BattleManager.js';
import { RenderManager } from './managers/RenderManager.js';

export { DataManager, BattleManager, RenderManager };

/**
 * Manages the transitions and updates of game scenes.
 */
export class SceneManager {
    constructor() {
        /**
         * The currently active scene.
         * @type {Object|null}
         */
        this.currentScene = null;
    }

    /**
     * Changes the current scene to the specified scene.
     * Calls `onExit` on the previous scene and `onEnter` on the new scene.
     * @param {Object} scene - The new scene object to switch to.
     */
    changeScene(scene) {
        if (this.currentScene?.onExit) this.currentScene.onExit();
        this.currentScene = scene;
        this.currentScene?.onEnter?.();
    }

    /**
     * Updates the current scene.
     * @param {number} delta - The time elapsed since the last frame.
     */
    update(delta) {
        this.currentScene?.update?.(delta);
    }

    /**
     * Delegates input handling to the current scene.
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {boolean|undefined} The result of the scene's handleInput method, or false if not handled.
     */
    handleInput(event) {
        if (!this.currentScene?.handleInput) return false;
        return this.currentScene.handleInput(event);
    }
}

/**
 * Manages global input handling and delegates to the SceneManager.
 */
export class InputManager {
    /**
     * @param {SceneManager} sceneManager - The scene manager instance to delegate input to.
     */
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
    }

    /**
     * Starts listening for global keyboard events.
     */
    boot() {
        window.addEventListener('keydown', (e) => {
            this.sceneManager.handleInput(e);
        });
    }
}
