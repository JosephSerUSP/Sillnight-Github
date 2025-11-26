import { Game_Party } from './Game_Party.js';
import { Game_Map } from './Game_Map.js';
import { Game_System } from './Game_System.js';
import { populateActiveSlots } from './objects.js';
import { Data } from '../assets/data/data.js';

// Managers for scene flow and input (similar to rmmz_managers.js).
// Add new managers here (SceneManager, InputManager, etc.) instead of scattering globals.

export class DataManager {
    static setupNewGame() {
        window.$gameParty = new Game_Party();
        window.$gameMap = new Game_Map();
        window.$gameSystem = new Game_System();

        $gameParty.gainGold(500);
        populateActiveSlots(Data.party.initial);
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
