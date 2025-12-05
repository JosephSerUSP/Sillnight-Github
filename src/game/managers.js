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

        // Sync input state at end of frame
        if (window.Game && window.Game.Input) {
            window.Game.Input.update();
        }
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
        this._currentState = {};
        this._previousState = {};

        this.keyMap = {
            'ArrowUp': 'up',
            'w': 'up',
            'ArrowDown': 'down',
            's': 'down',
            'ArrowLeft': 'left',
            'a': 'left',
            'ArrowRight': 'right',
            'd': 'right',
            'Enter': 'ok',
            ' ': 'ok', // Space
            'Space': 'ok', // Ensure code/key parity
            'Escape': 'cancel',
            'p': 'menu',
            'P': 'menu',
            'b': 'inventory',
            'B': 'inventory'
        };

        if (window.Game) {
            window.Game.Input = this;
        }
    }

    /**
     * Starts listening for global keyboard events.
     */
    boot() {
        window.addEventListener('keydown', (e) => {
            const action = this.keyMap[e.key] || this.keyMap[e.code];
            if (action) {
                this._currentState[action] = true;
            }

            // Delegate to scene's handleInput (Legacy support for direct key handling if needed,
            // though we want to move to polling or action-based event handling)
            this.sceneManager.handleInput(e);
        });

        window.addEventListener('keyup', (e) => {
            const action = this.keyMap[e.key] || this.keyMap[e.code];
            if (action) {
                this._currentState[action] = false;
            }
        });

        // Initial state sync
        this.update();
    }

    update() {
        // Copy current to previous for next frame comparison
        // This is called by SceneManager.update() at end of frame
        this._previousState = { ...this._currentState };
    }

    /**
     * Checks if an action is currently pressed.
     * @param {string} action - The abstract action name (e.g., 'up', 'ok').
     * @returns {boolean}
     */
    isPressed(action) {
        return !!this._currentState[action];
    }

    /**
     * Checks if an action was just pressed this frame (Triggered).
     * @param {string} action
     * @returns {boolean}
     */
    isTriggered(action) {
        return !!this._currentState[action] && !this._previousState[action];
    }
}
