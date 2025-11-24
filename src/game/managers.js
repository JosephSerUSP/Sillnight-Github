// managers.js - similar to rmmz_managers.js
// Provides SceneManager and InputManager for scene flow and input mapping.
// Add new managers here to avoid scattering global state.

import { GameState } from './state.js';

class SceneManager {
    constructor() {
        this.currentScene = null;
    }
    changeScene(scene) {
        if (this.currentScene?.stop) this.currentScene.stop();
        this.currentScene = scene;
        this.currentScene.start();
    }
    update(delta) {
        this.currentScene?.update(delta);
    }
}

class InputManager {
    constructor() {
        this.handlers = new Map();
    }
    bind(action, handler) { this.handlers.set(action, handler); }
    handleKey(event) {
        const { key, code } = event;
        const mode = GameState.ui.mode;
        if (mode === 'EXPLORE') {
            if (key === 'ArrowUp') return this.handlers.get('moveUp')?.();
            if (key === 'ArrowDown') return this.handlers.get('moveDown')?.();
            if (key === 'ArrowLeft') return this.handlers.get('moveLeft')?.();
            if (key === 'ArrowRight') return this.handlers.get('moveRight')?.();
            if (key === 'p' || key === 'P') return this.handlers.get('openParty')?.();
            if (key === 'b' || key === 'B') return this.handlers.get('openBag')?.();
        } else if (mode === 'BATTLE' || mode === 'BATTLE_WIN') {
            if (code === 'Space') return this.handlers.get('battleToggle')?.();
        }
    }
}

export const sceneManager = new SceneManager();
export const inputManager = new InputManager();
