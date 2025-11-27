// ------------------- GLOBAL GAME STATE -------------------
// Now using classes. This file primarily exports the global instances.
// However, the instances themselves are typically attached to window for easy access
// or exported from here if they were singletons.
// Since we are attaching to window.$gameParty etc in DataManager, we can expose them here too?
// Or just keep the structure for now.

// For backward compatibility during refactor, we might want to map GameState to these new objects
// or just replace usages of GameState.

/**
 * A legacy proxy object to access global game state.
 * It provides backward compatibility by mapping properties to the new global objects ($gameParty, $gameMap).
 * @namespace GameState
 */
export const GameState = {
    // Deprecated structure accessors
    /**
     * Accessor for run-specific data like floor and gold.
     */
    get run() {
        return {
            get floor() { return window.$gameMap ? window.$gameMap.floor : 1; },
            set floor(v) { if (window.$gameMap) window.$gameMap.floor = v; },
            get gold() { return window.$gameParty ? window.$gameParty.gold : 0; },
            set gold(v) {
                if (window.$gameParty) {
                    const diff = v - window.$gameParty.gold;
                    if (diff > 0) window.$gameParty.gainGold(diff);
                    else window.$gameParty.loseGold(-diff);
                }
            }
        }
    },
    /**
     * Accessor for exploration state like map data, visited tiles, and player position.
     */
    get exploration() {
        if (!window.$gameMap) return {};
        return {
            get map() { return window.$gameMap._data; },
            get visited() { return window.$gameMap._visited; },
            get playerPos() { return window.$gameMap.playerPos; },
            set playerPos(v) { window.$gameMap._playerPos = v; }
        }
    },
    /**
     * Accessor for party state.
     */
    get party() {
        if (!window.$gameParty) return {};
        return {
            get activeSlots() { return window.$gameParty.activeSlots; }
        };
    },
    /**
     * Accessor for the full roster of creatures.
     */
    get roster() {
        return window.$gameParty ? window.$gameParty.roster : [];
    },
    /**
     * Accessor for the inventory.
     */
    get inventory() {
        return window.$gameParty ? window.$gameParty.inventory : {};
    },
    // Battle is still transient, maybe managed by BattleManager?
    /**
     * The current battle state.
     * @type {Object|null}
     */
    battle: null,
    /**
     * UI state configuration.
     * @property {string} mode - The current UI mode (e.g., 'EXPLORE', 'BATTLE').
     * @property {boolean} formationMode - Whether the formation editor is active.
     */
    ui: {
        mode: 'EXPLORE',
        formationMode: false
    }
};
