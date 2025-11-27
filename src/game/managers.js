// Managers for scene flow and input.
import { DataManager } from './DataManager.js';
import { BattleManager } from './managers/BattleManager.js';

export { DataManager, BattleManager };

export class SceneManager {
    constructor() {
        this.currentScene = null;
    }

    changeScene(scene) {
        if (this.currentScene?.onExit) this.currentScene.onExit();
        this.currentScene = scene;
        this.currentScene?.onEnter?.();
    }

    update(delta) {
        this.currentScene?.update?.(delta);
    }

    handleInput(event) {
        if (!this.currentScene?.handleInput) return false;
        return this.currentScene.handleInput(event);
    }
}

export class InputManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
    }

    boot() {
        window.addEventListener('keydown', (e) => {
            this.sceneManager.handleInput(e);
        });
    }
}
