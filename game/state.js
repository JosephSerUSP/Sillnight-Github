// Runtime game state container for Stillnight
export const GameState = {
    run: {
        floor: 1,
        gold: 500
    },
    exploration: {
        map: [],
        visited: [],
        playerPos: { x: 0, y: 0 }
    },
    party: {
        activeSlots: [null, null, null, null, null, null]
    },
    roster: [],
    inventory: {
        items: {},
        equipment: {}
    },
    battle: null,
    ui: {
        mode: 'EXPLORE',
        formationMode: false
    }
};
