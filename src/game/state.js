// ------------------- GLOBAL GAME STATE -------------------
export const GameState = {
    // Runtime run-level data.
    run: {
        floor: 1,
        gold: 500
    },
    // Exploration layer state: map, visited tiles and player position.
    exploration: {
        map: [],            // 2D array of tile codes
        visited: [],        // 2D boolean array
        playerPos: { x: 0, y: 0 }
    },
    // Party and roster definitions. roster holds all owned units; activeSlots references uids from roster.
    party: {
        activeSlots: [ null, null, null, null, null, null ] // up to 6 active slots referencing roster entries
    },
    roster: [],
    // Inventory holds counts of items and equipment
    inventory: {
        items: {},
        equipment: {}
    },
    // Current battle state; becomes non-null during battles.
    battle: null,
    // UI state holds mode and formation mode flags.
    ui: {
        mode: 'EXPLORE',
        formationMode: false
    }
};

