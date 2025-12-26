import { Creatures } from './creatures.js';
import { Dungeons } from './dungeon.js';
import { Events } from './events.js';
import { Equipment } from './equipment.js';
import { Items } from './items.js';
import { Party } from './party.js';
import { Skills } from './skills.js';
import { Passives } from './passives.js';
import { Materials } from './materials.js';

// ------------------- DATA DEFINITIONS -------------------
export const Data = {
    // Configuration constants controlling core parameters.
    config: {
        baseGoldPerEnemy: 20,
        baseXpPerEnemy: 5,
        summonerBaseMp: 820,
        summonerActionMpDrain: 5,
        summonerStepMpDrain: 3
    },
    // Element symbols used for skills and creatures. Elements can stack.
    elements: { R: '🔴', G: '🟢', B: '🔵', W: '⚪', K: '⚫' },
    
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
        IceSpike: 'src/assets/effects/IceSpike.efkefc',
        MAP_Find: 'src/assets/effects/MAP_Find.efkefc',
        MAP_Trap: 'src/assets/effects/MAP_Trap.efkefc',
        MAP_Shrine: 'src/assets/effects/MAP_Shrine.efkefc',
        Guard: 'src/assets/effects/Guard.efkefc',
        Comet: 'src/assets/effects/Comet.efkefc',
        Tap: 'src/assets/effects/Tap.efkefc'
    },

    actionScripts: {
        attack: [
            { type: 'jump', height: 0.8, duration: 500 },
            { type: 'approach', distance: 1.2, duration: 250 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.5, hold: 350 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        attackRow: [
            { type: 'jump', height: 0.6, duration: 400 },
            { type: 'approach', distance: 1.0, duration: 220 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.5, hold: 320 },
            { type: 'apply' },
            { type: 'retreat', duration: 220 }
        ],
        guard: [
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'Guard', bind: 'self', anchor: 0.5, hold: 400 },
            { type: 'apply' }
        ],
        wait: [
            { type: 'wait', duration: 400 }
        ],
        cure: [
            { type: 'effect', effect: 'Cure', bind: 'target', anchor: 0.5, hold: 500 },
            { type: 'apply' }
        ],
        serveDrink: [
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'Cure', bind: 'target', anchor: 0.5, hold: 450 },
            { type: 'apply' }
        ],
        latexPrayer: [
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Cure', bind: 'target', anchor: 0.5, hold: 520 },
            { type: 'apply' }
        ],
        triage: [
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'Cure', bind: 'target', anchor: 0.5, hold: 420 },
            { type: 'apply' }
        ],
        feast: [
            { type: 'wait', duration: 200 },
            { type: 'apply' }
        ],
        thunder: [
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Thunder', bind: 'target', anchor: 0.0, hold: 520 },
            { type: 'apply' }
        ],
        divineBolt: [
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Thunder', bind: 'target', anchor: 0.0, hold: 520 },
            { type: 'apply' }
        ],
        tornado: [
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Tornado', bind: 'center', anchor: 0.0, hold: 600 },
            { type: 'apply' }
        ],
        gravityWell: [
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Tornado', bind: 'center', anchor: 0.0, hold: 580 },
            { type: 'apply' }
        ],
        hellfire: [
            { type: 'wait', duration: 280 },
            { type: 'effect', effect: 'Apocalypse', bind: 'center', anchor: 0.0, hold: 640 },
            { type: 'apply' }
        ],
        apocalypse: [
            { type: 'dim_ground', duration: 0 },
            { type: 'jump', height: 0.5, duration: 400 },
            { type: 'focus', target: 'enemy', duration: 400 },
            { type: 'effect', effect: 'Apocalypse', bind: 'center', anchor: 0.0, hold: 650 },
            { type: 'apply' },
            { type: 'reset_visuals', duration: 250 }
        ],
        curse: [
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Curse', bind: 'target', anchor: 0.5, hold: 520 },
            { type: 'apply' }
        ],
        sleepMist: [
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Curse', bind: 'center', anchor: 0.5, hold: 520 },
            { type: 'apply' }
        ],
        anvil: [
            { type: 'approach', distance: 1.0, duration: 250 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.0, hold: 520 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        silverTray: [
            { type: 'approach', distance: 1.0, duration: 250 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.0, hold: 420 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        ray: [
            { type: 'wait', duration: 180 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.0, hold: 300 },
            { type: 'apply' }
        ],
        cosmicRay: [
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'Comet', bind: 'target', anchor: 0.0, hold: 320 },
            { type: 'apply' }
        ],
        shadowSpike: [
            { type: 'jump', height: 0.9, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.0, hold: 420 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        injection: [
            { type: 'jump', height: 0.6, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.0, hold: 380 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        windBlades: [
            { type: 'jump', height: 0.7, duration: 380 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.5, hold: 360 },
            { type: 'apply' },
            { type: 'retreat', duration: 220 }
        ],
        maskTear: [
            { type: 'jump', height: 0.7, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.5, hold: 380 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        diamondDust: [
            { type: 'dim_ground', duration: 0 },
            { type: 'jump', height: 0.5, duration: 400 },
            { type: 'focus', target: 'enemy', duration: 400 },
            { type: 'effect', effect: 'IceWind', bind: 'center', anchor: 0.0, hold: 520 },
            { type: 'apply' },
            { type: 'reset_visuals', duration: 250 }
        ]
    },

    creatures: Creatures,
    dungeons: Dungeons,
    events: Events,
    equipment: Equipment,
    items: Items,
    party: Party,
    skills: Skills,
    passives: Passives,
    materials: Materials,

    // Create an index by ID for faster lookups
    equipmentById: Object.values(Equipment).reduce((acc, val) => {
        acc[val.id] = val;
        return acc;
    }, {}),

    itemsById: Object.values(Items).reduce((acc, val) => {
        acc[val.id] = val;
        return acc;
    }, {})
};
