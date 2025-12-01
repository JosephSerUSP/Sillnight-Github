// Scene controllers (similar to rmmz_scenes.js).
// Scenes coordinate systems, windows, and input without owning the persistent DOM.

import { Scene } from './scene.js';
import { BattleManager } from './managers.js';

/**
 * Base class for all scene types.
 * Extends the basic Scene class with lifecycle methods.
 */
export class Scene_Base extends Scene {
    /**
     * @param {Object} systems - The game systems.
     * @param {Object} windows - The game windows.
     */
    constructor(systems, windows) {
        super(systems, windows);
    }
    /**
     * Called when the scene is entered.
     */
    onEnter() {}
    /**
     * Called when the scene is exited.
     */
    onExit() {}
    /**
     * Updates the scene.
     * @param {number} [delta] - Time delta.
     */
    update(delta) {}
    /**
     * Handles keyboard input.
     * @param {KeyboardEvent} e - The key event.
     * @returns {boolean} True if the input was handled.
     */
    handleInput(e) { return false; }
}

/**
 * The scene controlling the exploration gameplay loop.
 * Handles movement, interaction with the map, and transitions to menus.
 */
export class Scene_Explore extends Scene_Base {
    /**
     * Sets the UI mode to EXPLORE and switches the visual scene.
     */
    onEnter() {
        window.Game.ui.mode = 'EXPLORE';
        this.switchScene(false, () => this.systems.Explore.render());
    }

    /**
     * Handles exploration-specific inputs like movement and menu toggles.
     * @param {KeyboardEvent} e - The key event.
     * @returns {boolean} True if input was handled.
     */
    handleInput(e) {
        if (window.Game.ui.mode !== 'EXPLORE') return false;
        if (e.key === 'ArrowUp') this.systems.Explore.move(0, -1);
        if (e.key === 'ArrowDown') this.systems.Explore.move(0, 1);
        if (e.key === 'ArrowLeft') this.systems.Explore.move(-1, 0);
        if (e.key === 'ArrowRight') this.systems.Explore.move(1, 0);
        if (e.key === 'p' || e.key === 'P') this.windows.PartyMenu.toggle();
        if (e.key === 'b' || e.key === 'B') this.windows.Inventory.toggle();
        return true;
    }
}

/**
 * The scene controlling the battle gameplay loop.
 * Handles the turn-based combat interactions.
 */
export class Scene_Battle extends Scene_Base {
    /**
     * Sets the UI mode to BATTLE and switches the visual scene.
     */
    onEnter() {
        window.Game.ui.mode = 'BATTLE';
        this.switchScene(true);
    }

    /**
     * Handles battle-specific inputs, primarily the spacebar for turn progression.
     * @param {KeyboardEvent} e - The key event.
     * @returns {boolean} True if input was handled.
     */
    handleInput(e) {
        if (window.Game.ui.mode !== 'BATTLE' && window.Game.ui.mode !== 'BATTLE_WIN') return false;
        if (e.code === 'Space') {
             // Access phase directly from BattleManager
             if (BattleManager.phase === 'PLAYER_INPUT') BattleManager.resumeAuto();
            else BattleManager.requestPlayerTurn();
        }
        return true;
    }
}
