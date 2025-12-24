export const Maps = {
    hub: {
        flags: ['NO_MP_DRAIN'],
        visual: {
            floorColor: 0xf0f0f5,
            wallColor: 0xffffff,
            backgroundColor: 0xddddff,
            fogColor: 0xddddff,
            fogDensity: 0.02,
            fogRevealRadius: 6,
            fogFadeRadius: 4,
            fogType: 'transient',
            playerLightIntensity: 0.0,
            floorTexture: 'pearlescent',
            wallTexture: 'pearlescent'
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
