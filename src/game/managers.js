// Managers for scene flow and input (similar to rmmz_managers.js).
// Add new managers here (SceneManager, InputManager, etc.) instead of scattering globals.
import { initializeGlobals, $gameParty, $gameMap } from './globals.js';
import { Data } from '../assets/data/data.js';

export class DataManager {
    static setupNewGame() {
        initializeGlobals();
        $gameParty.setupStartingMembers();
        $gameMap.generateFloor();
    }
}

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
