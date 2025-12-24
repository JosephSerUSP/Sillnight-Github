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
        /**
         * A stack of active windows. The top-most window receives input first.
         * @type {Array<Window_Base>}
         */
        this.windowStack = [];
    }

    /**
     * Registers a window, pushing it to the top of the input stack.
     * @param {Window_Base} window - The window to register.
     */
    registerWindow(window) {
        this.unregisterWindow(window); // Avoid duplicates
        this.windowStack.push(window);
    }

    /**
     * Unregisters a window, removing it from the input stack.
     * @param {Window_Base} window - The window to unregister.
     */
    unregisterWindow(window) {
        this.windowStack = this.windowStack.filter(w => w !== window);
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
     * Delegates input handling to the top-most window or the current scene.
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {boolean|undefined} The result of the scene's handleInput method, or false if not handled.
     */
    handleInput(event) {
        if (this.windowStack.length > 0) {
            const topWindow = this.windowStack[this.windowStack.length - 1];
            if (topWindow && typeof topWindow.handleInput === 'function') {
                if (topWindow.handleInput(event)) {
                    return true; // Input was handled by the window
                }
            }
        }

        if (!this.currentScene?.handleInput) return false;
        return this.currentScene.handleInput(event);
    }
}
