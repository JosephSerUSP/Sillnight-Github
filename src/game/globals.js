import { Game_Party } from './classes/Game_Party.js';
import { Game_Map } from './classes/Game_Map.js';
import { Game_Battle } from './classes/Game_Battle.js';

export let $gameParty = null;
export let $gameMap = null;
export let $gameBattle = null;

export function initializeGlobals() {
    $gameParty = new Game_Party();
    $gameMap = new Game_Map();
    $gameBattle = new Game_Battle();

    // Expose to window for debugging
    window.$gameParty = $gameParty;
    window.$gameMap = $gameMap;
    window.$gameBattle = $gameBattle;
}
