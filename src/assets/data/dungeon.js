export const Dungeons = {
    // A sample dungeon configuration. In the future, we could have multiple dungeons.
    default: {
        visual: {
            floorColor: 0x333333,
            wallColor: 0x1a1a1a,
            backgroundColor: 0x050510,
            fogColor: 0x051015
        },
        // Default map parameters. These can be overridden on a per-floor basis.
        map: {
            // These were previously in Data.config
            tileSize: 48,
            viewDistance: 5,
            width: 30,
            height: 20,
            // Parameters for the random walk cavern generation.
            carveSteps: 400,
            // Defines how many of each tile type to place on the map.
            // Can be a fixed number or an object with base and perFloor values.
            tileCounts: {
                enemies: { base: 5, perFloor: 1 }, // e.g., Floor 1: 6, Floor 2: 7
                stairs: 1,
                treasure: 2,
                // For events, the count is `max(1, floor(currentFloor / 2))`.
                shops:    { base: 0, perFloor: 0.5, min: 1, round: 'floor' },
                recruits: { base: 0, perFloor: 0.5, min: 1, round: 'floor' },
                shrines: 1,
                traps:    { base: 0, perFloor: 0.5, min: 1, round: 'floor' },
            }
        },

        // Defines enemy encounters for this dungeon.
        encounters: {
            // Number of enemies per encounter.
            count: { min: 1, max: 3 },

            // Defines which enemies can appear on which floors.
            // The system will find the first pool that matches the current floor.
            pools: [
                { floors: [1, 2], enemies: ['goblin', 'skeleton', 'pixie'] },
                { floors: [3, 4], enemies: ['skeleton', 'pixie', 'golem', 'lich'] },
                { floors: [5, 6], enemies: ['golem', 'lich', 'inori', 'nurse', 'waiter'] },
                { floors: [7, 8], enemies: ['waiter', 'ifrit', 'shiva', 'joulart'] },
                { floors: [9, 10], enemies: ['masque', 'titania', 'no7', 'shadowServant'] },
                { floors: [11, Infinity], enemies: ['titania', 'no7', 'nurse', 'shadowServant', 'slumber'] }
            ]
        }
    }
};
