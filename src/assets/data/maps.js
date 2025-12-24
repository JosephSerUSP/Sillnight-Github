export const Maps = {
    hub: {
        flags: ['NO_MP_DRAIN'],
        visual: {
            floorColor: 0xfaf0e6, // Linen / Warm White
            wallColor: 0xfffff0, // Ivory
            backgroundColor: 0xfdf5e6, // Old Lace
            fogColor: 0xfdf5e6, // Match Background
            fogDensity: 0.02,
            fogRevealRadius: 2, // Starts closer
            fogFadeRadius: 8,   // Extends to same range (2+8 = 10 approx same as 6+4=10)
            fogType: 'transient',
            playerLightIntensity: 0.2, // Slightly more light to show off pearlescence
            floorMaterial: 'ivory_floor',
            wallMaterial: 'ivory_wall'
        },
        width: 19,
        height: 19,
        // 0: Floor, 1: Wall, 3: Stairs
        // Layout:
        // #########G######### (0)
        // #########.######### (1)
        // #.......#.#.......# (2)
        // #.###.........###.# (3)
        // #.###.........###.# (4)
        // #.#W#.........#U#.# (5)
        // #.................# (6)
        // #.###.........#L#.# (7)
        // #.##H...#.#...###.# (8)
        // #.###S...R....A##.# (9)
        // #.###...#.#...###.# (10)
        // #.................# (11)
        // #########....#P#..# (12)
        // #########....###..# (13)
        // ########T....###..# (14)
        // #########....###..# (15)
        // #########....###..# (16)
        // #.................# (17)
        // #############.##### (18)
        grid: [
            1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,
            1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,
            1,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0,1,
            1,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0,1,
            1,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,
            1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
            1,0,1,1,1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,
            1,0,1,1,0,0,0,0,1,0,1,0,0,0,1,1,1,0,1,
            1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,
            1,0,1,1,1,0,0,0,1,0,1,0,0,0,1,1,1,0,1,
            1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
            1,1,1,1,1,1,1,1,1,0,0,0,0,1,0,1,0,0,1,
            1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,0,1,
            1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,0,0,1,
            1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,0,1,
            1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,0,1,
            1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1
        ],
        events: [
            {
                id: "npc_gate_guard",
                x: 9, y: 0,
                type: 'NPC',
                visual: { type: 'NPC' },
                trigger: 'TOUCH', // Bump to talk
                commands: [
                    { code: 'LOG', text: "Guard: Halt! Only those prepared may enter the Dungeon." },
                    { code: 'LOG', text: "Guard: Are you ready?" },
                    // Hacky way to simulate choice/entry: Just enter for now.
                    { code: 'LOG', text: "Descending to Floor 1..." },
                    { code: 'EVAL', script: 'window.$gameMap.floor = 1; window.$gameMap.generateFloor(); window.Game.Systems.Explore.rebuildLevel();' }
                ]
            },
            {
                id: "npc_weapon_shop",
                x: 3, y: 5,
                type: 'SHOP',
                visual: { type: 'SHOP' },
                trigger: 'ACTION',
                commands: [{ code: 'SHOP' }]
            },
            {
                id: "recruit",
                x: 15, y: 5,
                type: 'RECRUIT',
                visual: { type: 'RECRUIT' },
                trigger: 'TOUCH',
                commands: [{ code: 'RECRUIT' }]
            },
            {
                id: "npc_laura",
                x: 15, y: 7,
                type: 'NPC',
                visual: { type: 'NPC' },
                commands: [{ code: 'LOG', text: "Laura: Welcome to our town, traveler." }]
            },
            {
                id: "loc_abandoned_house",
                x: 4, y: 8,
                type: 'NPC',
                visual: { type: 'NPC' }, // Or create a 'DOOR' visual type later
                commands: [{ code: 'LOG', text: "The house is boarded up. No one lives here anymore." }]
            },
            {
                id: "recovery",
                x: 9, y: 9,
                type: 'SHRINE',
                visual: { type: 'SHRINE' },
                trigger: 'TOUCH',
                commands: [{ code: 'SHRINE' }]
            },
            {
                id: "npc_alicia",
                x: 14, y: 9,
                type: 'NPC',
                visual: { type: 'NPC' },
                commands: [{ code: 'LOG', text: "Alicia: Please, save my sister..." }]
            },
            {
                id: "loc_pub",
                x: 14, y: 12,
                type: 'NPC',
                visual: { type: 'NPC' },
                commands: [{ code: 'LOG', text: "Pub Owner: We're out of ale. Dark times." }]
            },
            {
                id: "npc_auction",
                x: 10, y: 13,
                type: 'NPC',
                visual: { type: 'NPC' },
                commands: [{ code: 'LOG', text: "Auctioneer: Nothing to sell today. Come back later." }]
            },
            {
                id: "loc_temple",
                x: 8, y: 14,
                type: 'NPC',
                visual: { type: 'NPC' },
                commands: [{ code: 'LOG', text: "Priest: May the Light guide you." }]
            }
        ],
        startX: 13,
        startY: 18
    }
};
