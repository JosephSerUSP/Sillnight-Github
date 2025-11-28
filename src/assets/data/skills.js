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
        effects: []
    };

    export const Skills = {
        wait:   { id: 'wait',   name: 'Wait',        category: 'effect', target: 'self',         speed: 2,  effects: [] },
        attack: { id: 'attack', name: 'Attack',      script: 'attack', effects: [{ type: 'hp_damage', formula: '4 + 2 * a.level' }] },
        guard:  { id: 'guard',  name: 'Guard',       category: 'effect', target: 'self',         speed: 2,  effects: [{ type: 'add_status', status: 'guarding', chance: 1 }] },

        attackRow: { id: 'attackRow', name: 'Attack Row', target: 'enemy-row', script: 'attackRow', effects: [{ type: 'hp_damage', formula: '3 + 1.5 * a.level' }] },
        cure:      { id: 'cure',      name: 'Cure',       category: 'heal',   target: 'ally-single', speed: 1,  element: 'W', script: 'cure', effects: [{ type: 'hp_heal', formula: '4 + 2 * a.level' }] },

        tornado:   { id: 'tornado',   name: 'Tornado',    target: 'enemy-all',   speed: -1, element: 'G', script: 'tornado', effects: [{ type: 'hp_damage', formula: '4 + a.level' }] },
        thunder:   { id: 'thunder',   name: 'Thunder',   speed: 1,  element: 'G', script: 'thunder', effects: [{ type: 'hp_damage', formula: '6 + 2 * a.level' }] },
        ray:       { id: 'ray',       name: 'Ray',        repeat: 3,   element: 'W', script: 'ray', effects: [{ type: 'hp_damage', formula: '2 + a.level' }] },
        curse:     { id: 'curse',     name: 'Curse',      element: 'K', script: 'curse', effects: [{ type: 'hp_damage', formula: '16 + 2 * a.level' }] },

        apocalypse: {
            id: 'apocalypse',
            name: 'Apocalypse',
            target: 'enemy-all',
            speed: -2,               // Very slow, very strong
            element: 'K',
            script: 'apocalypse',
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
            effects: [{ type: 'hp_damage', formula: '5 + 2 * a.level' }]
        },
        gravityWell: {
            id: 'gravityWell',
            name: 'Gravity Well',
            target: 'enemy-all',
            speed: -1,
            element: 'B',
            script: 'gravityWell',
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
            effects: [{ type: 'hp_heal', formula: '6 + 2.5 * a.level' }]
        },
        divineBolt: {
            id: 'divineBolt',
            name: 'Divine Bolt',
            speed: 1,
            element: 'W',
            script: 'divineBolt',
            effects: [{ type: 'hp_damage', formula: '6 + 2.2 * a.level' }]
        },

        // --- Slumber: dreamy AoE caster ---
        sleepMist: {
            id: 'sleepMist',
            name: 'Sleep Mist',
            target: 'enemy-all',
            element: 'B',
            script: 'sleepMist',
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
            effects: [{ type: 'hp_damage', formula: '5 + 2.0 * a.level' }]
        },

        // --- Shadow Servant: surgical dark ST burst ---
        shadowSpike: {
            id: 'shadowSpike',
            name: 'Shadow Spike',
            element: 'K',
            script: 'shadowSpike',
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
            effects: [{ type: 'hp_heal', formula: '5 + 1.5 * a.level' }]
        },

        // --- CAMPAIGN SKILLS ---
        stabilize: { id: 'stabilize', name: 'Stabilize', element: 'W', script: 'attack', effects: [{ type: 'hp_damage', formula: '5 + 2 * a.level' }] },
        fractureStrike: { id: 'fractureStrike', name: 'Fracture Strike', element: 'K', script: 'attack', effects: [{ type: 'hp_damage', formula: '10 + 3 * a.level' }, { type: 'self_damage', formula: '5' }] },
        crystalShield: { id: 'crystalShield', name: 'Crystal Shield', category: 'effect', target: 'ally-all', script: 'cure', effects: [{ type: 'add_status', status: 'guarding', chance: 1 }] },
        voidGaze: { id: 'voidGaze', name: 'Void Gaze', category: 'effect', target: 'enemy-single', script: 'curse', effects: [{ type: 'debuff', stat: 'def', amount: 5 }] },
        mend: { id: 'mend', name: 'Mend', category: 'heal', target: 'ally-single', script: 'cure', effects: [{ type: 'hp_heal', formula: '10 + 3 * a.level' }] },
        cleave: { id: 'cleave', name: 'Cleave', target: 'enemy-row', script: 'attackRow', effects: [{ type: 'hp_damage', formula: '5 + 1.8 * a.level' }] },
        pierce: { id: 'pierce', name: 'Pierce', script: 'attack', effects: [{ type: 'hp_damage', formula: '5 + 2 * a.level' }] }, // Ignores def logic implied
        aetherBeam: { id: 'aetherBeam', name: 'Aether Beam', element: 'W', script: 'ray', effects: [{ type: 'hp_damage', formula: '8 + 2 * a.level' }] },
        timeWarp: { id: 'timeWarp', name: 'Time Warp', category: 'effect', target: 'ally-single', script: 'flash', effects: [{ type: 'add_status', status: 'haste', chance: 1 }] },
        realityBreak: { id: 'realityBreak', name: 'Reality Break', target: 'enemy-all', element: 'K', script: 'apocalypse', effects: [{ type: 'hp_damage', formula: '20 + 4 * a.level' }] }
    };
