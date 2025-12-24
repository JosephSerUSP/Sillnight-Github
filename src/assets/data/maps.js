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
        width: 12,
        height: 12,
        // 0: Floor, 1: Wall, 3: Stairs
        grid: [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1,
            1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1,
            1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1,
            1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
        ],
        events: [
            {
                x: 4, y: 4,
                type: 'NPC',
                visual: { type: 'SHRINE' }, // Placeholder visual
                text: "The mana is stable here. Rest easy."
            },
            {
                x: 7, y: 4,
                type: 'NPC',
                visual: { type: 'RECRUIT' }, // Placeholder visual
                text: "The dungeon lies ahead. Be careful."
            }
        ],
        startX: 5,
        startY: 8
    }
};
