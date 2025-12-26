// Skills are defined declaratively here. Each skill has an ID, a name,
// and a list of effects that are applied when the skill is used.

export const Skills = {
    // --- Abstract Base Skills (Parents) ---
    // These are registered so they can be inherited from.
    base_physical: {
        id: 'base_physical',
        name: 'Base Physical',
        category: 'damage',
        stat: 'atk',
        element: null,
        script: 'attack'
    },
    base_magical: {
        id: 'base_magical',
        name: 'Base Magical',
        category: 'damage',
        stat: 'mat',
        script: 'flash'
    },
    base_heal: {
        id: 'base_heal',
        name: 'Base Heal',
        category: 'heal',
        stat: 'mat',
        element: 'W',
        target: 'ally-single',
        script: 'cure'
    },

    // --- Basic Skills ---
    wait:   { id: 'wait',   name: 'Wait',        category: 'effect', target: 'self',         script: 'wait', speed: 2,  effects: [] },
    guard:  { id: 'guard',  name: 'Guard',       category: 'effect', target: 'self',         speed: 2,  effects: [{ type: 'add_status', status: 'guarding', chance: 1 }] },

    // --- Physical Skills ---
    attack: {
        id: 'attack',
        parent: 'base_physical',
        name: 'Attack',
        effects: [{ type: 'hp_damage', formula: '4 + 2 * a.level' }]
    },
    attackRow: {
        id: 'attackRow',
        parent: 'base_physical',
        name: 'Attack Row',
        target: 'enemy-row',
        script: 'attackRow',
        effects: [{ type: 'hp_damage', formula: '3 + 1.5 * a.level' }]
    },
    slash: {
        id: 'slash',
        parent: 'base_physical',
        name: 'Slash',
        description: "A powerful slash attack.",
        mpCost: 8,
        script: 'slash',
        icon: "sword",
        effects: [{ type: 'hp_damage', formula: 'a.atk * 6 - b.def * 2', variance: 10 }]
    },

    // --- Healing Skills ---
    cure: {
        id: 'cure',
        parent: 'base_heal',
        name: 'Cure',
        speed: 1,
        effects: [{ type: 'hp_heal', formula: '4 + 2 * a.level' }]
    },
    triage: {
        id: 'triage',
        parent: 'base_heal',
        name: 'Triage',
        speed: 2,
        script: 'triage',
        effects: [{ type: 'hp_heal', formula: '4 + 2.0 * a.level' }]
    },
    serveDrink: {
        id: 'serveDrink',
        parent: 'base_heal',
        name: 'Serve Drink',
        speed: 1,
        script: 'serveDrink',
        effects: [{ type: 'hp_heal', formula: '3 + 1.5 * a.level' }]
    },
    latexPrayer: {
        id: 'latexPrayer',
        parent: 'base_heal',
        name: 'Latex Prayer',
        script: 'latexPrayer',
        effects: [{ type: 'hp_heal', formula: '6 + 2.5 * a.level' }]
    },
    feast: {
        id: 'feast',
        parent: 'base_heal', // Inherits heal category
        name: 'Feast',
        target: 'self',
        element: 'R',
        script: 'feast',
        stat: 'atk', // Override stat to ATK (physical biting)
        effects: [{ type: 'hp_heal', formula: '5 + 1.5 * a.level' }]
    },

    // --- Magic Skills ---
    fire: {
        id: 'fire',
        parent: 'base_magical',
        name: 'Fire',
        mpCost: 5,
        animation: 'fire',
        icon: 'fire',
        effects: [{ type: 'hp_damage', formula: 'a.mat * 2 - b.mdf * 1', element: 'fire' }]
    },
    tornado: {
        id: 'tornado',
        parent: 'base_magical',
        name: 'Tornado',
        target: 'enemy-all',
        speed: -1,
        element: 'G',
        script: 'tornado',
        effects: [{ type: 'hp_damage', formula: '4 + a.level' }]
    },
    thunder: {
        id: 'thunder',
        parent: 'base_magical',
        name: 'Thunder',
        speed: 1,
        element: 'G',
        script: 'thunder',
        effects: [{ type: 'hp_damage', formula: '6 + 2 * a.level' }]
    },
    ray: {
        id: 'ray',
        parent: 'base_magical',
        name: 'Ray',
        repeat: 3,
        element: 'W',
        script: 'ray',
        effects: [{ type: 'hp_damage', formula: '2 + a.level' }]
    },
    curse: {
        id: 'curse',
        parent: 'base_magical',
        name: 'Curse',
        element: 'K',
        script: 'curse',
        effects: [{ type: 'hp_damage', formula: '16 + 2 * a.level' }]
    },
    apocalypse: {
        id: 'apocalypse',
        parent: 'base_magical',
        name: 'Apocalypse',
        target: 'enemy-all',
        speed: -2,
        element: 'K',
        script: 'apocalypse',
        effects: [{ type: 'hp_damage', formula: '8 + 2.5 * a.level' }]
    },
    cosmicRay: {
        id: 'cosmicRay',
        parent: 'base_magical',
        name: 'Cosmic Ray',
        speed: 1,
        element: 'W',
        script: 'cosmicRay',
        effects: [{ type: 'hp_damage', formula: '5 + 2 * a.level' }]
    },
    gravityWell: {
        id: 'gravityWell',
        parent: 'base_magical',
        name: 'Gravity Well',
        target: 'enemy-all',
        speed: -1,
        element: 'B',
        script: 'gravityWell',
        effects: [{ type: 'hp_damage', formula: '3 + 1.8 * a.level' }]
    },
    sleepMist: {
        id: 'sleepMist',
        parent: 'base_magical',
        name: 'Sleep Mist',
        target: 'enemy-all',
        element: 'B',
        script: 'sleepMist',
        effects: [
            { type: 'hp_damage', formula: '3 + 1.6 * a.level' },
            { type: 'add_status', status: 'sleep', chance: 0.3 }
        ]
    },
    diamondDust: {
        id: 'diamondDust',
        parent: 'base_magical',
        name: 'Diamond Dust',
        target: 'enemy-row',
        element: 'B',
        script: 'diamondDust',
        effects: [{ type: 'hp_damage', formula: '5 + 2.0 * a.level' }]
    },
    divineBolt: {
        id: 'divineBolt',
        parent: 'base_magical',
        name: 'Divine Bolt',
        speed: 1,
        element: 'W',
        script: 'divineBolt',
        effects: [{ type: 'hp_damage', formula: '6 + 2.2 * a.level' }]
    },
    hellfire: {
        id: 'hellfire',
        parent: 'base_magical',
        name: 'Hellfire',
        target: 'enemy-all',
        speed: -1,
        element: 'R',
        script: 'hellfire',
        effects: [{ type: 'hp_damage', formula: '5 + 2.0 * a.level' }]
    },

    // --- Unique Physical Skills ---
    anvil: {
        id: 'anvil',
        parent: 'base_physical',
        name: 'Anvil Drop',
        speed: -1,
        element: 'R',
        script: 'anvil',
        effects: [{ type: 'hp_damage', formula: '9 + 2.2 * a.level' }]
    },
    silverTray: {
        id: 'silverTray',
        parent: 'base_physical',
        name: 'Silver Tray',
        target: 'enemy-row',
        element: 'K',
        script: 'silverTray',
        effects: [{ type: 'hp_damage', formula: '4 + 1.6 * a.level' }]
    },
    shadowSpike: {
        id: 'shadowSpike',
        parent: 'base_physical', // Dark physical
        name: 'Shadow Spike',
        element: 'K',
        script: 'shadowSpike',
        effects: [{ type: 'hp_damage', formula: '7 + 2.0 * a.level' }]
    },
    injection: {
        id: 'injection',
        parent: 'base_physical',
        name: 'Injection',
        element: 'K',
        script: 'injection',
        effects: [{ type: 'hp_damage', formula: '5 + 1.8 * a.level' }]
    },
    windBlades: {
        id: 'windBlades',
        parent: 'base_physical',
        name: 'Wind Blades',
        target: 'enemy-row',
        speed: 2,
        repeat: 2,
        element: 'G',
        script: 'windBlades',
        effects: [{ type: 'hp_damage', formula: '4 + 1.5 * a.level' }]
    },
    maskTear: {
        id: 'maskTear',
        parent: 'base_physical',
        name: 'Mask Tear',
        element: 'K',
        script: 'maskTear',
        effects: [{ type: 'hp_damage', formula: '6 + 2.0 * a.level' }]
    }
};
