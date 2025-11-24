// rmmz_scenes.js equivalent: scene controllers orchestrating systems and windows.
// Scenes are controllers only; the shell UI remains persistent between scenes.

import { GameState } from './state.js';

export class Scene_Base {
    constructor(systems, ui) {
        this.systems = systems;
        this.ui = ui;
    }
    start() {}
    stop() {}
    pause() {}
    resume() {}
    update() {}
    onAction() {}
}

export class Scene_Explore extends Scene_Base {
    start() {
        GameState.ui.mode = 'EXPLORE';
        this.ui.switchScene(false);
        this.systems.Explore.resize();
    }
    onAction(action) {
        if (GameState.ui.mode !== 'EXPLORE') return;
        if (action === 'move-up') this.systems.Explore.move(0, -1);
        if (action === 'move-down') this.systems.Explore.move(0, 1);
        if (action === 'move-left') this.systems.Explore.move(-1, 0);
        if (action === 'move-right') this.systems.Explore.move(1, 0);
        if (action === 'party') this.ui.toggleParty();
        if (action === 'inventory') this.ui.toggleInventory();
    }
}

export class Scene_Battle extends Scene_Base {
    start() {
        GameState.ui.mode = 'BATTLE';
        this.ui.switchScene(true);
        this.systems.Battle3D.resize();
    }
    onAction(action) {
        if (GameState.ui.mode !== 'BATTLE' && GameState.ui.mode !== 'BATTLE_WIN') return;
        if (action === 'confirm') {
            if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT') {
                this.systems.Battle.resumeAuto();
            } else {
                this.systems.Battle.requestPlayerTurn();
            }
        }
    }
    stop() {
        this.ui.switchScene(false);
    }
}

export class Scene_Menu extends Scene_Base {}
