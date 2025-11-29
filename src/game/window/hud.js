import { GameState } from '../state.js';
import { Window_Base } from '../windows.js';

/**
 * Heads-Up Display window.
 * Shows the current floor and gold amount.
 */
export class Window_HUD extends Window_Base {
    constructor() {
        super('hud');
    }

    /**
     * Initializes the HUD window.
     */
    initialize() {
        super.initialize();
        this._floorEl = document.getElementById('hud-floor');
        this._goldEl = document.getElementById('hud-gold');

        if (!this._floorEl || !this._goldEl) {
             this.createLayout();
        }
    }

    createLayout() {
        this.clear();
        this.root.className = 'absolute top-0 left-0 w-full flex justify-between p-2 text-yellow-500 font-mono text-lg pointer-events-none z-10';
        // Wait, text-lg is 1.125rem (18px).
        // This overrides window base style.
        // HUD is top level, maybe it SHOULD be larger?
        // But the user said "all current windows should be impacted".
        // I should remove text-lg? Or reduce it?
        // Let's remove text-lg and see.
        this.root.classList.remove('text-lg');

        const left = this.createEl('div', 'flex gap-4');
        const floorContainer = this.createEl('div', '', left);
        floorContainer.innerHTML = 'FLOOR <span id="hud-floor" class="text-white">1</span>';
        this._floorEl = floorContainer.querySelector('#hud-floor');

        const right = this.createEl('div');
        right.innerHTML = 'GOLD <span id="hud-gold" class="text-white">0</span>';
        this._goldEl = right.querySelector('#hud-gold');
    }

    /**
     * Updates the HUD with current game state values.
     */
    refresh() {
        if (this._floorEl) this._floorEl.innerText = GameState.run.floor;
        if (this._goldEl) this._goldEl.innerText = GameState.run.gold;
    }
}
