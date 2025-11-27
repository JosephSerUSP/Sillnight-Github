import { $gameParty, $gameSystem } from '../globals.js';
import { Window_Base } from '../windows.js';

export class Window_HUD extends Window_Base {
    constructor() {
        super(document.getElementById('hud'));
        this._floorEl = document.getElementById('hud-floor');
        this._goldEl = document.getElementById('hud-gold');
    }

    refresh() {
        this._floorEl.innerText = $gameSystem.ui.floor;
        this._goldEl.innerText = $gameParty.gold;
        // The superclass refresh() is a no-op, but it's good practice to call it
        super.refresh();
    }
}
