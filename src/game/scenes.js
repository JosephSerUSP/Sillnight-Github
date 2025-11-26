// Scene controllers (similar to rmmz_scenes.js).
// Scenes coordinate systems, windows, and input without owning the persistent DOM.

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
        $gameSystem.ui.mode = 'EXPLORE';
        this.ui.switchScene(false, () => this.systems.Explore.render());
    }

    handleInput(e) {
        if ($gameSystem.ui.mode !== 'EXPLORE') return false;
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
        $gameSystem.ui.mode = 'BATTLE';
        this.ui.switchScene(true);
    }

    handleInput(e) {
        if ($gameSystem.ui.mode !== 'BATTLE' && $gameSystem.ui.mode !== 'BATTLE_WIN') return false;
        if (e.code === 'Space') {
            if ($gameSystem.battle && $gameSystem.battle.phase === 'PLAYER_INPUT') this.systems.Battle.resumeAuto();
            else this.systems.Battle.requestPlayerTurn();
        }
        return true;
    }
}
