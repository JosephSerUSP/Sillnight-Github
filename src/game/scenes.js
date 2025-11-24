// scenes.js - similar to rmmz_scenes.js
// Scenes act as controllers that drive Systems and ShellUI without owning DOM.
// Add new scenes by subclassing Scene_Base and registering with SceneManager.

import { GameState } from './state.js';

class Scene_Base {
    constructor(systems, ui) {
        this.systems = systems;
        this.ui = ui;
    }
    start() {}
    stop() {}
    update() {}
}

export class Scene_Explore extends Scene_Base {
    start() {
        GameState.ui.mode = 'EXPLORE';
        this.ui.switchScene(false);
        this.ui.updateHUD();
        this.ui.renderParty();
        this.systems.Explore.render();
    }
    move(dx, dy) {
        this.systems.Explore.move(dx, dy);
    }
    openParty() { this.ui.toggleParty(); }
    openBag() { this.ui.toggleInventory(); }
}

export class Scene_Battle extends Scene_Base {
    start() {
        GameState.ui.mode = 'BATTLE';
        this.ui.switchScene(true);
        this.ui.togglePlayerTurn(false);
    }
    togglePlayerTurn() {
        if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT') this.systems.Battle.resumeAuto();
        else this.systems.Battle.requestPlayerTurn();
    }
}

export { Scene_Base };
