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

        // Don't auto-attach to window.Game here, let main.js do it explicitly
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
