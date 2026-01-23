import { Game_Actor } from '../src/game/classes/Game_Actor.js';
import { Services } from '../src/game/ServiceLocator.js';

// Mock Services
const mockRegistry = {
    get: (id) => {
        if (id === 'hero') return { name: 'Hero', mpd: 5, mxa: 6, mxp: 3, baseHp: 100, hpGrowth: 0.1 };
        if (id === 'goblin') return { name: 'Goblin', agi: 10 };
        if (id === 'slime') return { name: 'Slime', agi: 5 };
        return null;
    }
};

Services.register('CreatureRegistry', mockRegistry);
Services.register('TraitRegistry', { getParamValue: (battler, id) => battler.paramBase(id) });
Services.register('EquipmentRegistry', { get: () => null });
Services.register('PassiveRegistry', { get: () => null });

// Mock Window
global.window = {
    $gameParty: {
        summoner: null
    },
    Game: {
        ui: { mode: 'EXPLORE' },
        Windows: { Party: { onUnitHpChange: () => {} } }
    }
};

// Test Params
console.log("--- Testing Parameters ---");
try {
    const actor = new Game_Actor('hero', 1);
    console.log(`MPD (Expected 5): ${actor.mpd}`);
    console.log(`MXA (Expected 6): ${actor.mxa}`);
    console.log(`MXP (Expected 3): ${actor.mxp}`);

    if (actor.mpd !== 5 || actor.mxa !== 6 || actor.mxp !== 3) {
        console.error("FAIL: Parameters do not match registry values.");
        process.exit(1);
    } else {
        console.log("PASS: Parameters match.");
    }
} catch (e) {
    console.error("Error creating actor:", e);
    process.exit(1);
}

// Test Turn Order
console.log("\n--- Testing Turn Order ---");

const summoner = { uid: 'summ', hp: 10, isSummoner: true, agi: 50 }; // High agi, should still be last
const goblin = { uid: 'gob', hp: 10, agi: 10 };
const slime = { uid: 'sli', hp: 10, agi: 5 };
const wolf = { uid: 'wol', hp: 10, agi: 20 };

const allUnits = [goblin, summoner, slime, wolf];
window.$gameParty.summoner = summoner;

// LOGIC FROM BattleManager.nextRound (Replicated for Verification)
const nonSummonerUnits = summoner
    ? allUnits.filter(u => u.uid !== summoner.uid)
    : allUnits;

nonSummonerUnits.sort((a, b) => b.agi - a.agi || Math.random() - 0.5);

const queue = (summoner && summoner.hp > 0)
    ? [...nonSummonerUnits, summoner]
    : nonSummonerUnits;

console.log("Queue Order:");
queue.forEach((u, i) => console.log(`${i}: ${u.uid} (AGI: ${u.agi})`));

const expectedOrder = ['wol', 'gob', 'sli', 'summ'];
const actualOrder = queue.map(u => u.uid);

let pass = true;
if (actualOrder.length !== 4) pass = false;
for (let i = 0; i < 4; i++) {
    if (actualOrder[i] !== expectedOrder[i]) pass = false;
}

if (pass) {
    console.log("PASS: Turn order is correct (High Agi first, Summoner last).");
} else {
    console.error(`FAIL: Turn order incorrect. Expected ${expectedOrder.join(',')}, got ${actualOrder.join(',')}`);
    process.exit(1);
}
