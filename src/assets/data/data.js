import { Creatures } from './creatures.js';
import { Equipment, Items } from './items.js';
import { Skills } from './skills.js';

// ------------------- DATA DEFINITIONS -------------------
export const Data = {
    // Configuration constants controlling core parameters.
    config: {
        tileSize: 48,
        viewDistance: 5,
        mapWidth: 30,
        mapHeight: 20,
        baseGoldPerEnemy: 20,
        baseXpPerEnemy: 5
    },
    // Element symbols used for skills and creatures. Elements can stack.
    elements: { R: '🔴', G: '🟢', B: '🔵', W: '⚪', K: '⚫' },
    // Skills are defined declaratively here. Each skill has a
    // category (damage/heal/guard), a target selection rule, a base power,
    // scaling factors, an optional element, and a chosen animation.
    skills: {
        wait:   { id: 'wait',   name: 'Wait',        category: 'effect', target: 'self',         speed: 2,  effect: 'wait',  script: 'flash' },
        attack: { id: 'attack', name: 'Attack',      category: 'damage', target: 'enemy-single', speed: 0,  power: 4, scaling: 2,   script: 'flash' },
        guard:  { id: 'guard',  name: 'Guard',       category: 'effect', target: 'self',         speed: 2,  effect: 'guard', script: 'flash' },

        attackRow: { id: 'attackRow', name: 'Attack Row', category: 'damage', target: 'enemy-row',   speed: 0,  power: 3, scaling: 1.5, script: 'flash' },
        cure:      { id: 'cure',      name: 'Cure',       category: 'heal',   target: 'ally-single', speed: 1,  power: 4, scaling: 2,   element: 'W', script: 'cure' },

        tornado:   { id: 'tornado',   name: 'Tornado',    category: 'damage', target: 'enemy-all',   speed: -1, power: 4, scaling: 1,   element: 'G', script: 'tornado' },
        thunder:   { id: 'thunder',   name: '🟢Thunder',   category: 'damage', target: 'enemy-single',speed: 1,  power: 6, scaling: 2,   element: 'G', script: 'thunder' },
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
    },

    
    // Effekseer definitions and action scripts used by the battle renderer.
    effects: {
        BasicHit: 'src/assets/effects/BasicHit.efkefc',
        Impact: 'src/assets/effects/Impact.efkefc',
        Cure: 'src/assets/effects/Cure.efkefc',
        Thunder: 'src/assets/effects/Thunder.efkefc',
        Tornado: 'src/assets/effects/Tornado.efkefc',
        Apocalypse: 'src/assets/effects/Apocalypse.efkefc',
        Curse: 'src/assets/effects/Curse.efkefc',
        IceWind: 'src/assets/effects/IceWind.efkefc',
        IceSpike: 'src/assets/effects/IceSpike.efkefc'
    },

    actionScripts: {
        attack: [
            { type: 'jump', height: 0.8, duration: 500 },
            { type: 'approach', distance: 1.2, duration: 250 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', height: 1.1, hold: 350 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        attackRow: [
            { type: 'jump', height: 0.6, duration: 400 },
            { type: 'approach', distance: 1.0, duration: 220 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', height: 1.1, hold: 320 },
            { type: 'apply' },
            { type: 'retreat', duration: 220 }
        ],
        guard: [
            { type: 'wait', duration: 350 },
            { type: 'apply' }
        ],
        wait: [
            { type: 'wait', duration: 400 }
        ],
        cure: [
            { type: 'effect', effect: 'Cure', bind: 'target', height: 1.3, hold: 500 },
            { type: 'apply' }
        ],
        serveDrink: [
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'Cure', bind: 'target', height: 1.1, hold: 450 },
            { type: 'apply' }
        ],
        latexPrayer: [
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Cure', bind: 'target', height: 1.4, hold: 520 },
            { type: 'apply' }
        ],
        triage: [
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'Cure', bind: 'target', height: 1.2, hold: 420 },
            { type: 'apply' }
        ],
        feast: [
            { type: 'wait', duration: 200 },
            { type: 'apply' }
        ],
        thunder: [
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Thunder', bind: 'target', height: 1.9, hold: 520 },
            { type: 'apply' }
        ],
        divineBolt: [
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Thunder', bind: 'target', height: 1.6, hold: 520 },
            { type: 'apply' }
        ],
        tornado: [
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Tornado', bind: 'target', height: 1.4, hold: 600 },
            { type: 'apply' }
        ],
        gravityWell: [
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Tornado', bind: 'target', height: 1.2, hold: 580 },
            { type: 'apply' }
        ],
        hellfire: [
            { type: 'wait', duration: 280 },
            { type: 'effect', effect: 'Apocalypse', bind: 'target', height: 1.5, hold: 640 },
            { type: 'apply' }
        ],
        apocalypse: [
            { type: 'wait', duration: 300 },
            { type: 'effect', effect: 'Apocalypse', bind: 'target', height: 1.6, hold: 650 },
            { type: 'apply' }
        ],
        curse: [
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Curse', bind: 'target', height: 1.3, hold: 520 },
            { type: 'apply' }
        ],
        sleepMist: [
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Curse', bind: 'target', height: 1.3, hold: 520 },
            { type: 'apply' }
        ],
        anvil: [
            { type: 'approach', distance: 1.0, duration: 250 },
            { type: 'effect', effect: 'Impact', bind: 'target', height: 1.0, hold: 520 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        silverTray: [
            { type: 'approach', distance: 1.0, duration: 250 },
            { type: 'effect', effect: 'Impact', bind: 'target', height: 1.0, hold: 420 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        ray: [
            { type: 'wait', duration: 180 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', height: 1.3, hold: 300 },
            { type: 'apply' }
        ],
        cosmicRay: [
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', height: 1.3, hold: 320 },
            { type: 'apply' }
        ],
        shadowSpike: [
            { type: 'jump', height: 0.9, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', height: 1.1, hold: 420 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        injection: [
            { type: 'jump', height: 0.6, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', height: 0.9, hold: 380 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        windBlades: [
            { type: 'jump', height: 0.7, duration: 380 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', height: 1.2, hold: 360 },
            { type: 'apply' },
            { type: 'retreat', duration: 220 }
        ],
        maskTear: [
            { type: 'jump', height: 0.7, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', height: 1.0, hold: 380 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        diamondDust: [
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'IceWind', bind: 'target', height: 1.4, hold: 520 },
            { type: 'apply' }
        ]
    },

    creatures: Creatures,
    equipment: Equipment,
    items: Items,
    skills: Skills
};

