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
    update(delta) {
        // Poll input every frame if needed
        this.handleInput();
    }
    /**
     * Handles input.
     * @param {KeyboardEvent} [e] - The key event (legacy).
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
        if (window.Game && window.Game.ui) {
            window.Game.ui.mode = 'EXPLORE';
        }
        this.switchScene(false);
    }

    /**
     * Handles exploration-specific inputs like movement and menu toggles.
     * @param {KeyboardEvent} [e] - The key event (optional, legacy).
     * @returns {boolean} True if input was handled.
     */
    handleInput(e) {
        if (!window.Game || !window.Game.ui || window.Game.ui.mode !== 'EXPLORE') return false;

        const Input = window.Game.Input;
        if (!Input) return false; // Safety check

        // Movement (Pressed check for continuous movement)
        if (Input.isPressed('up')) this.systems.Explore.move(0, -1);
        else if (Input.isPressed('down')) this.systems.Explore.move(0, 1);
        else if (Input.isPressed('left')) this.systems.Explore.move(-1, 0);
        else if (Input.isPressed('right')) this.systems.Explore.move(1, 0);

        // Toggles (Triggered check for single action)
        if (Input.isTriggered('menu')) this.windows.PartyMenu.toggle();
        if (Input.isTriggered('inventory')) this.windows.Inventory.toggle();

        return true;
    }

    update(delta) {
        this.handleInput();
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
        if (window.Game && window.Game.ui) {
            window.Game.ui.mode = 'BATTLE';
        }
        this.switchScene(true);
    }

    /**
     * Handles battle-specific inputs, primarily the spacebar for turn progression.
     * @param {KeyboardEvent} [e] - The key event.
     * @returns {boolean} True if input was handled.
     */
    handleInput(e) {
        if (!window.Game || !window.Game.ui) return false;
        if (window.Game.ui.mode !== 'BATTLE' && window.Game.ui.mode !== 'BATTLE_WIN') return false;

        const Input = window.Game.Input;
        if (!Input) return false;

        if (Input.isTriggered('ok')) {
             // Access phase directly from BattleManager
             if (BattleManager.phase === 'PLAYER_INPUT') BattleManager.resumeAuto();
            else BattleManager.requestPlayerTurn();
            return true;
        }
        return false;
    }

    update(delta) {
        this.handleInput();
    }
}
