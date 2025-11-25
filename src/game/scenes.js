// Scene controllers (similar to rmmz_scenes.js).
// Scenes coordinate systems, windows, and input without owning the persistent DOM.

import { GameState } from './state.js';

export class Scene_Base {
    constructor(systems, ui) {
        this.systems = systems;
        this.ui = ui;
    }
    onEnter() {}
    onExit() {}
    update() {}
    handleInput() { return false; }
}

export class Scene_Explore extends Scene_Base {
    onEnter() {
        GameState.ui.mode = 'EXPLORE';
        const instant = !this.ui.hasSwitchedOnce;
        this.ui.switchScene(false, () => this.systems.Explore.render(), { instant });
    }

    handleInput(e) {
        if (GameState.ui.mode !== 'EXPLORE') return false;
        if (e.key === 'ArrowUp') this.systems.Explore.move(0, -1);
        if (e.key === 'ArrowDown') this.systems.Explore.move(0, 1);
        if (e.key === 'ArrowLeft') this.systems.Explore.move(-1, 0);
        if (e.key === 'ArrowRight') this.systems.Explore.move(1, 0);
        if (e.key === 'p' || e.key === 'P') this.ui.toggleParty();
        if (e.key === 'b' || e.key === 'B') this.ui.toggleInventory();
        return true;
    }
}

export class Scene_Battle extends Scene_Base {
    onEnter() {
        GameState.ui.mode = 'BATTLE';
        this.ui.switchScene(true);
    }

    handleInput(e) {
        if (GameState.ui.mode !== 'BATTLE' && GameState.ui.mode !== 'BATTLE_WIN') return false;
        if (e.code === 'Space') {
            if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT') this.systems.Battle.resumeAuto();
            else this.systems.Battle.requestPlayerTurn();
        }
        return true;
    }
}
