import { Creatures } from './creatures.js';
import { Dungeons } from './dungeon.js';
import { Events } from './events.js';
import { Equipment } from './equipment.js';
import { Items } from './items.js';
import { Party } from './party.js';
import { Skills } from './skills.js';
import { Passives } from './passives.js';

// ------------------- DATA DEFINITIONS -------------------
export const Data = {
    // Configuration constants controlling core parameters.
    config: {
        baseGoldPerEnemy: 20,
        baseXpPerEnemy: 5,
        battle: {
            turnStartDelay: 600,  // Time to focus on actor before action starts
            actionWait: 300,      // General wait between action steps if needed
            postTurnDelay: 1000,  // Time after action finishes before next turn
            deathDelay: 500,      // Time between HP hitting 0 and death fade starting
            flashDuration: 300    // Duration of the "Turn Start" flash
        }
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
        MAP_Shrine: 'src/assets/effects/MAP_Shrine.efkefc'
    },

    actionScripts: {
        attack: [
            { type: 'jump', height: 0.8, duration: 500 },
            { type: 'approach', distance: 1.2, duration: 250 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.5, hold: 400 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        attackRow: [
            { type: 'jump', height: 0.6, duration: 400 },
            { type: 'approach', distance: 1.0, duration: 220 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.5, hold: 400 },
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
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 100 },
            { type: 'effect', effect: 'Cure', bind: 'target', anchor: 0.5, hold: 500 },
            { type: 'apply' }
        ],
        serveDrink: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'Cure', bind: 'target', anchor: 0.5, hold: 450 },
            { type: 'apply' }
        ],
        latexPrayer: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Cure', bind: 'target', anchor: 0.5, hold: 520 },
            { type: 'apply' }
        ],
        triage: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'Cure', bind: 'target', anchor: 0.5, hold: 420 },
            { type: 'apply' }
        ],
        feast: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 200 },
            { type: 'apply' }
        ],
        thunder: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Thunder', bind: 'target', anchor: 0.0, hold: 600 },
            { type: 'apply' }
        ],
        divineBolt: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Thunder', bind: 'target', anchor: 0.0, hold: 600 },
            { type: 'apply' }
        ],
        tornado: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Tornado', bind: 'target', anchor: 0.0, hold: 650 },
            { type: 'apply' }
        ],
        gravityWell: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 250 },
            { type: 'effect', effect: 'Tornado', bind: 'target', anchor: 0.0, hold: 600 },
            { type: 'apply' }
        ],
        hellfire: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 280 },
            { type: 'effect', effect: 'Apocalypse', bind: 'target', anchor: 0.0, hold: 700 },
            { type: 'apply' }
        ],
        apocalypse: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 300 },
            { type: 'effect', effect: 'Apocalypse', bind: 'target', anchor: 0.0, hold: 700 },
            { type: 'apply' }
        ],
        curse: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Curse', bind: 'target', anchor: 0.5, hold: 600 },
            { type: 'apply' }
        ],
        sleepMist: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 220 },
            { type: 'effect', effect: 'Curse', bind: 'target', anchor: 0.5, hold: 600 },
            { type: 'apply' }
        ],
        anvil: [
            { type: 'approach', distance: 1.0, duration: 250 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.0, hold: 550 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        silverTray: [
            { type: 'approach', distance: 1.0, duration: 250 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.0, hold: 450 },
            { type: 'apply' },
            { type: 'retreat', duration: 250 }
        ],
        ray: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 180 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.0, hold: 400 },
            { type: 'apply' }
        ],
        cosmicRay: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.0, hold: 420 },
            { type: 'apply' }
        ],
        shadowSpike: [
            { type: 'jump', height: 0.9, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.0, hold: 450 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        injection: [
            { type: 'jump', height: 0.6, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.0, hold: 400 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        windBlades: [
            { type: 'jump', height: 0.7, duration: 380 },
            { type: 'effect', effect: 'BasicHit', bind: 'target', anchor: 0.5, hold: 400 },
            { type: 'apply' },
            { type: 'retreat', duration: 220 }
        ],
        maskTear: [
            { type: 'jump', height: 0.7, duration: 420 },
            { type: 'effect', effect: 'Impact', bind: 'target', anchor: 0.5, hold: 400 },
            { type: 'apply' },
            { type: 'retreat', duration: 240 }
        ],
        diamondDust: [
            { type: 'jump', height: 0.5, duration: 300 },
            { type: 'wait', duration: 200 },
            { type: 'effect', effect: 'IceWind', bind: 'target', anchor: 0.0, hold: 600 },
            { type: 'apply' }
        ]
    },

    creatures: Creatures,
    dungeons: Dungeons,
    events: Events,
    equipment: Equipment,
    items: Items,
    party: Party,
    skills: Skills,
    passives: Passives
};
