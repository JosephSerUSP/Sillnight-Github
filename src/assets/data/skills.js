    // Skills are defined declaratively here. Each skill has an ID, a name,
    // and a list of effects that are applied when the skill is used.
    // Properties not specified will fall back to the values in `defaultSkill`.
    
    // Default values for skills
    export const defaultSkill = {
        name: 'Unnamed Skill',
        category: 'damage',
        target: 'enemy-single',
        speed: 0,
        element: null,
        script: 'flash',
        repeat: 1,
        stat: 'atk',
        effects: []
    };

    export const Skills = {
        wait:   { id: 'wait',   name: 'Wait',        category: 'effect', target: 'self',         speed: 2,  effects: [] },
        attack: { id: 'attack', name: 'Attack',      script: 'attack', effects: [{ type: 'hp_damage', formula: '4 + 2 * a.level' }] },
        guard:  { id: 'guard',  name: 'Guard',       category: 'effect', target: 'self',         speed: 2,  effects: [{ type: 'add_status', status: 'guarding', chance: 1 }] },

        attackRow: { id: 'attackRow', name: 'Attack Row', target: 'enemy-row', script: 'attackRow', effects: [{ type: 'hp_damage', formula: '3 + 1.5 * a.level' }] },
        cure:      { id: 'cure',      name: 'Cure',       category: 'heal',   target: 'ally-single', speed: 1,  element: 'W', script: 'cure', stat: 'mat', effects: [{ type: 'hp_heal', formula: '4 + 2 * a.level' }] },

        tornado:   { id: 'tornado',   name: 'Tornado',    target: 'enemy-all',   speed: -1, element: 'G', script: 'tornado', stat: 'mat', effects: [{ type: 'hp_damage', formula: '4 + a.level' }] },
        thunder:   { id: 'thunder',   name: 'Thunder',   speed: 1,  element: 'G', script: 'thunder', stat: 'mat', effects: [{ type: 'hp_damage', formula: '6 + 2 * a.level' }] },
        ray:       { id: 'ray',       name: 'Ray',        repeat: 3,   element: 'W', script: 'ray', stat: 'mat', effects: [{ type: 'hp_damage', formula: '2 + a.level' }] },
        curse:     { id: 'curse',     name: 'Curse',      element: 'K', script: 'curse', stat: 'mat', effects: [{ type: 'hp_damage', formula: '16 + 2 * a.level' }] },

        apocalypse: {
            id: 'apocalypse',
            name: 'Apocalypse',
            target: 'enemy-all',
            speed: -2,               // Very slow, very strong
            element: 'K',
            script: 'apocalypse',
            stat: 'mat',
            effects: [{ type: 'hp_damage', formula: '8 + 2.5 * a.level' }]
        },
        anvil: {
            id: 'anvil',
            name: 'Anvil Drop',
            speed: -1,               // Heavy, slightly slower
            element: 'R',
            script: 'anvil',
            effects: [{ type: 'hp_damage', formula: '9 + 2.2 * a.level' }]
        },

        cosmicRay: {
            id: 'cosmicRay',
            name: 'Cosmic Ray',
            speed: 1,                // Snappy snipe
            element: 'W',
            script: 'cosmicRay',
            stat: 'mat',
            effects: [{ type: 'hp_damage', formula: '5 + 2 * a.level' }]
        },
        gravityWell: {
            id: 'gravityWell',
            name: 'Gravity Well',
            target: 'enemy-all',
            speed: -1,
            element: 'B',
            script: 'gravityWell',
            stat: 'mat',
            effects: [{ type: 'hp_damage', formula: '3 + 1.8 * a.level' }]
        },

        // --- Waiter: hybrid row attacker & single-target healer ---
        silverTray: {
            id: 'silverTray',
            name: 'Silver Tray',
            target: 'enemy-row',
            element: 'K',
            script: 'silverTray',
            effects: [{ type: 'hp_damage', formula: '4 + 1.6 * a.level' }]
        },
        serveDrink: {
            id: 'serveDrink',
            name: 'Serve Drink',
            category: 'heal',
            target: 'ally-single',
            speed: 1,
            element: 'W',
            script: 'serveDrink',
            stat: 'mat',
            effects: [{ type: 'hp_heal', formula: '3 + 1.5 * a.level' }]
        },

        // --- Inori: single-target premium healer + holy nuke ---
        latexPrayer: {
            id: 'latexPrayer',
            name: 'Latex Prayer',
            category: 'heal',
            target: 'ally-single',
            element: 'W',
            script: 'latexPrayer',
            stat: 'mat',
            effects: [{ type: 'hp_heal', formula: '6 + 2.5 * a.level' }]
        },
        divineBolt: {
            id: 'divineBolt',
            name: 'Divine Bolt',
            speed: 1,
            element: 'W',
            script: 'divineBolt',
            stat: 'mat',
            effects: [{ type: 'hp_damage', formula: '6 + 2.2 * a.level' }]
        },

        // --- Slumber: dreamy AoE caster ---
        sleepMist: {
            id: 'sleepMist',
            name: 'Sleep Mist',
            target: 'enemy-all',
            element: 'B',
            script: 'sleepMist',
            stat: 'mat',
            effects: [
                { type: 'hp_damage', formula: '3 + 1.6 * a.level' },
                { type: 'add_status', status: 'sleep', chance: 0.3 }
            ]
        },

        // --- Shiva: ice row control (plus Apocalypse) ---
        diamondDust: {
            id: 'diamondDust',
            name: 'Diamond Dust',
            target: 'enemy-row',
            element: 'B',
            script: 'diamondDust',
            stat: 'mat',
            effects: [{ type: 'hp_damage', formula: '5 + 2.0 * a.level' }]
        },

        // --- Shadow Servant: surgical dark ST burst ---
        shadowSpike: {
            id: 'shadowSpike',
            name: 'Shadow Spike',
            element: 'K',
            script: 'shadowSpike',
            stat: 'atk', // Dark physical nuke
            effects: [{ type: 'hp_damage', formula: '7 + 2.0 * a.level' }]
        },

        // --- Ifrit: big fire AoE ---
        hellfire: {
            id: 'hellfire',
            name: 'Hellfire',
            target: 'enemy-all',
            speed: -1,
            element: 'R',
            script: 'hellfire',
            stat: 'mat',
            effects: [{ type: 'hp_damage', formula: '5 + 2.0 * a.level' }]
        },

        // --- Nurse: risky ST poke + fast triage heal ---
        injection: {
            id: 'injection',
            name: 'Injection',
            element: 'K',
            script: 'injection',
            effects: [{ type: 'hp_damage', formula: '5 + 1.8 * a.level' }]
        },
        triage: {
            id: 'triage',
            name: 'Triage',
            category: 'heal',
            target: 'ally-single',
            speed: 2,
            element: 'W',
            script: 'triage',
            stat: 'mat',
            effects: [{ type: 'hp_heal', formula: '4 + 2.0 * a.level' }]
        },

        // --- No. 7: ultra-fast multi-hit row pressure ---
        windBlades: {
            id: 'windBlades',
            name: 'Wind Blades',
            target: 'enemy-row',
            speed: 2,
            repeat: 2,
            element: 'G',
            script: 'windBlades',
            effects: [{ type: 'hp_damage', formula: '4 + 1.5 * a.level' }]
        },

        // --- Masque: single-target dark pressure ---
        maskTear: {
            id: 'maskTear',
            name: 'Mask Tear',
            element: 'K',
            script: 'maskTear',
            stat: 'atk', // Physical tear
            effects: [{ type: 'hp_damage', formula: '6 + 2.0 * a.level' }]
        },

        // --- Joulart: greedy self-sustain ---
        feast: {
            id: 'feast',
            name: 'Feast',
            category: 'heal',
            target: 'self',
            element: 'R',
            script: 'feast',
            stat: 'atk', // Physical biting
            effects: [{ type: 'hp_heal', formula: '5 + 1.5 * a.level' }]
        }
    };
