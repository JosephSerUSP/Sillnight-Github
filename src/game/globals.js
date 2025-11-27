import { Game_Party } from './classes/Game_Party.js';
import { Game_Map } from './classes/Game_Map.js';

export let $gameParty = null;
export let $gameMap = null;
export let $gameBattle = null;

export function initializeGlobals() {
    $gameParty = new Game_Party();
    $gameMap = new Game_Map();

    // Expose to window for debugging
    window.$gameParty = $gameParty;
    window.$gameMap = $gameMap;
}
