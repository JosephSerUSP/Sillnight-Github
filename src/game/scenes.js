// scenes.js - similar to rmmz_scenes.js. Defines scene controllers coordinating systems and windows.
// Add new scenes here; they should orchestrate windows and systems without recreating the shell DOM.

import { GameState } from './state.js';
import { SceneManager } from './managers.js';

export class Scene_Base {
    constructor(systems, ui) {
        this.systems = systems;
        this.ui = ui;
    }
    start() {}
    stop() {}
    handleAction() {}
}

export class Scene_Explore extends Scene_Base {
    start() {
        GameState.ui.mode = 'EXPLORE';
        this.ui.showExploreLayer();
        this.ui.updateHUD();
    }

    handleAction(action) {
        if (GameState.ui.mode !== 'EXPLORE') return;
        if (action === 'up') this.systems.Explore.move(0, -1);
        if (action === 'down') this.systems.Explore.move(0, 1);
        if (action === 'left') this.systems.Explore.move(-1, 0);
        if (action === 'right') this.systems.Explore.move(1, 0);
        if (action === 'party') this.ui.toggleParty();
        if (action === 'inventory') this.ui.toggleInventory();
        if (action === 'formation') this.ui.toggleFormationMode();
    }
}

export class Scene_Battle extends Scene_Base {
    start() {
        GameState.ui.mode = 'BATTLE';
        this.ui.showBattleLayer();
    }

    stop() {
        this.ui.showExploreLayer();
    }

    handleAction(action) {
        if (GameState.ui.mode !== 'BATTLE' && GameState.ui.mode !== 'BATTLE_WIN') return;
        if (action === 'confirm') {
            if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT') this.systems.Battle.resumeAuto();
            else this.systems.Battle.requestPlayerTurn();
        }
    }
}

export function registerScenes(systems, ui) {
    SceneManager.register('explore', new Scene_Explore(systems, ui));
    SceneManager.register('battle', new Scene_Battle(systems, ui));
}
