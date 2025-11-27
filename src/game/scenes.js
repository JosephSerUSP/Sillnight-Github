// Scene controllers (similar to rmmz_scenes.js).
// Scenes coordinate systems, windows, and input without owning the persistent DOM.

import { $gameParty, $gameMap } from './globals.js';
import { Scene } from './scene.js';
import { Game } from './main.js';

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
        Game.ui.mode = 'EXPLORE';
        this.switchScene(false, () => this.systems.Explore.render());
    }

    handleInput(e) {
        if (Game.ui.mode !== 'EXPLORE') return false;
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
        Game.ui.mode = 'BATTLE';
        this.switchScene(true);
    }

    handleInput(e) {
        if (Game.ui.mode !== 'BATTLE' && Game.ui.mode !== 'BATTLE_WIN') return false;
        if (e.code === 'Space') {
            if ($gameBattle && $gameBattle.phase === 'PLAYER_INPUT') this.systems.Battle.resumeAuto();
            else this.systems.Battle.requestPlayerTurn();
        }
        return true;
    }
}
