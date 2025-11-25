    export const Skills = {
        wait:   { id: 'wait',   name: 'Wait',        category: 'effect', target: 'self',         speed: 2,  effect: 'wait',  script: 'flash' },
        attack: { id: 'attack', name: 'Attack',      category: 'damage', target: 'enemy-single', speed: 0,  power: 4, scaling: 2,   script: 'flash' },
        guard:  { id: 'guard',  name: 'Guard',       category: 'effect', target: 'self',         speed: 2,  effect: 'guard', script: 'flash' },

        attackRow: { id: 'attackRow', name: 'Attack Row', category: 'damage', target: 'enemy-row',   speed: 0,  power: 3, scaling: 1.5, script: 'flash' },
        cure:      { id: 'cure',      name: 'Cure',       category: 'heal',   target: 'ally-single', speed: 1,  power: 4, scaling: 2,   element: 'W', script: 'cure' },

        tornado:   { id: 'tornado',   name: 'Tornado',    category: 'damage', target: 'enemy-all',   speed: -1, power: 4, scaling: 1,   element: 'G', script: 'tornado' },
        thunder:   { id: 'thunder',   name: 'Thunder',   category: 'damage', target: 'enemy-single',speed: 1,  power: 6, scaling: 2,   element: 'G', script: 'thunder' },
        ray:       { id: 'ray',       name: 'Ray',        category: 'damage', target: 'enemy-single',speed: 0,  power: 2, scaling: 1,   repeat: 3,   element: 'W', script: 'flash' },
        curse:     { id: 'curse',     name: 'Curse',      category: 'damage', target: 'enemy-single',speed: 0,  power: 16,scaling: 2,   element: 'K', script: 'flash' },

        apocalypse: {
            id: 'apocalypse',
            name: 'Apocalypse',
            category: 'damage',
            target: 'enemy-all',
            speed: -2,               // Very slow, very strong
            power: 8,
            scaling: 2.5,
            element: 'K',
            script: 'apocalypse'
        },
        anvil: {
            id: 'anvil',
            name: 'Anvil Drop',
            category: 'damage',
            target: 'enemy-single',
            speed: -1,               // Heavy, slightly slower
            power: 9,
            scaling: 2.2,
            element: 'R',
            script: 'anvil'
        },

        cosmicRay: {
            id: 'cosmicRay',
            name: 'Cosmic Ray',
            category: 'damage',
            target: 'enemy-single',
            speed: 1,                // Snappy snipe
            power: 5,
            scaling: 2,
            element: 'W',
            script: 'cosmicRay'
        },
        gravityWell: {
            id: 'gravityWell',
            name: 'Gravity Well',
            category: 'damage',
            target: 'enemy-all',
            speed: -1,
            power: 3,
            scaling: 1.8,
            element: 'B',
            script: 'gravityWell'
        },

        // --- Waiter: hybrid row attacker & single-target healer ---
        silverTray: {
            id: 'silverTray',
            name: 'Silver Tray',
            category: 'damage',
            target: 'enemy-row',
            speed: 0,
            power: 4,
            scaling: 1.6,
            element: 'K',
            script: 'silverTray'
        },
        serveDrink: {
            id: 'serveDrink',
            name: 'Serve Drink',
            category: 'heal',
            target: 'ally-single',
            speed: 1,
            power: 3,
            scaling: 1.5,
            element: 'W',
            script: 'serveDrink'
        },

        // --- Inori: single-target premium healer + holy nuke ---
        latexPrayer: {
            id: 'latexPrayer',
            name: 'Latex Prayer',
            category: 'heal',
            target: 'ally-single',
            speed: 0,
            power: 6,
            scaling: 2.5,
            element: 'W',
            script: 'latexPrayer'
        },
        divineBolt: {
            id: 'divineBolt',
            name: 'Divine Bolt',
            category: 'damage',
            target: 'enemy-single',
            speed: 1,
            power: 6,
            scaling: 2.2,
            element: 'W',
            script: 'divineBolt'
        },

        // --- Slumber: dreamy AoE caster ---
        sleepMist: {
            id: 'sleepMist',
            name: 'Sleep Mist',
            category: 'damage',
            target: 'enemy-all',
            speed: 0,
            power: 3,
            scaling: 1.6,
            element: 'B',
            script: 'sleepMist'
        },

        // --- Shiva: ice row control (plus Apocalypse) ---
        diamondDust: {
            id: 'diamondDust',
            name: 'Diamond Dust',
            category: 'damage',
            target: 'enemy-row',
            speed: 0,
            power: 5,
            scaling: 2.0,
            element: 'B',
            script: 'diamondDust'
        },

        // --- Shadow Servant: surgical dark ST burst ---
        shadowSpike: {
            id: 'shadowSpike',
            name: 'Shadow Spike',
            category: 'damage',
            target: 'enemy-single',
            speed: 0,
            power: 7,
            scaling: 2.0,
            element: 'K',
            script: 'shadowSpike'
        },

        // --- Ifrit: big fire AoE ---
        hellfire: {
            id: 'hellfire',
            name: 'Hellfire',
            category: 'damage',
            target: 'enemy-all',
            speed: -1,
            power: 5,
            scaling: 2.0,
            element: 'R',
            script: 'hellfire'
        },

        // --- Nurse: risky ST poke + fast triage heal ---
        injection: {
            id: 'injection',
            name: 'Injection',
            category: 'damage',
            target: 'enemy-single',
            speed: 0,
            power: 5,
            scaling: 1.8,
            element: 'K',
            script: 'injection'
        },
        triage: {
            id: 'triage',
            name: 'Triage',
            category: 'heal',
            target: 'ally-single',
            speed: 2,
            power: 4,
            scaling: 2.0,
            element: 'W',
            script: 'triage'
        },

        // --- No. 7: ultra-fast multi-hit row pressure ---
        windBlades: {
            id: 'windBlades',
            name: 'Wind Blades',
            category: 'damage',
            target: 'enemy-row',
            speed: 2,
            power: 4,
            scaling: 1.5,
            repeat: 2,
            element: 'G',
            script: 'windBlades'
        },

        // --- Masque: single-target dark pressure ---
        maskTear: {
            id: 'maskTear',
            name: 'Mask Tear',
            category: 'damage',
            target: 'enemy-single',
            speed: 0,
            power: 6,
            scaling: 2.0,
            element: 'K',
            script: 'maskTear'
        },

        // --- Joulart: greedy self-sustain ---
        feast: {
            id: 'feast',
            name: 'Feast',
            category: 'heal',
            target: 'self',
            speed: 0,
            power: 5,
            scaling: 1.5,
            element: 'R',
            script: 'feast'
        }
    };