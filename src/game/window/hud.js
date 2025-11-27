import { GameState } from '../state.js';
import { Window_Base } from '../windows.js';

export class Window_HUD extends Window_Base {
    constructor() {
        super(document.getElementById('hud'));
        this._floorEl = document.getElementById('hud-floor');
        this._goldEl = document.getElementById('hud-gold');
    }

    refresh() {
        this._floorEl.innerText = GameState.run.floor;
        this._goldEl.innerText = GameState.run.gold;
        // The superclass refresh() is a no-op, but it's good practice to call it
        super.refresh();
    }
}
