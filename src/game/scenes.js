// Scene controllers (similar to rmmz_scenes.js).
// Scenes coordinate systems, windows, and input without owning the persistent DOM.

import { GameState } from './state.js';
import { Scene } from './scene.js';
import { BattleManager } from './managers.js';

export class Scene_Base extends Scene {
    constructor(systems, windows) {
        super(systems, windows);
    }
    onEnter() {}
    onExit() {}
    update() {}
    handleInput() { return false; }
}

export class Scene_Explore extends Scene_Base {
    onEnter() {
        GameState.ui.mode = 'EXPLORE';
        this.switchScene(false, () => this.systems.Explore.render());
    }

    handleInput(e) {
        if (GameState.ui.mode !== 'EXPLORE') return false;
        if (e.key === 'ArrowUp') this.systems.Explore.move(0, -1);
        if (e.key === 'ArrowDown') this.systems.Explore.move(0, 1);
        if (e.key === 'ArrowLeft') this.systems.Explore.move(-1, 0);
        if (e.key === 'ArrowRight') this.systems.Explore.move(1, 0);
        if (e.key === 'p' || e.key === 'P') this.windows.PartyMenu.toggle();
        if (e.key === 'b' || e.key === 'B') this.windows.Inventory.toggle();
        return true;
    }
}

export class Scene_Battle extends Scene_Base {
    onEnter() {
        GameState.ui.mode = 'BATTLE';
        this.switchScene(true);
    }

    handleInput(e) {
        if (GameState.ui.mode !== 'BATTLE' && GameState.ui.mode !== 'BATTLE_WIN') return false;
        if (e.code === 'Space') {
            if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT') BattleManager.resumeAuto();
            else BattleManager.requestPlayerTurn();
        }
        return true;
    }
}
