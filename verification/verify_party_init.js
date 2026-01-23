import { Party } from '../src/assets/data/party.js';

console.log("Verifying Party Initial Configuration...");

const inventorySetup = Party.initial.inventory;
if (!inventorySetup) {
    console.error("FAILED: Party.initial.inventory is missing");
    process.exit(1);
}

const equipment = inventorySetup.equipment;
if (!equipment) {
    console.error("FAILED: Party.initial.inventory.equipment is missing");
    process.exit(1);
}

// Check for new items
const expectedItems = [
    'charm_magic', 'hermes_boots', 'mars_emblem',
    'mercury_crest', 'exp_boost', 'straw_doll',
    'holy_sword_gram', 'dark_scepter_lucille'
];

const foundItems = equipment.map(e => e.id);
const missing = expectedItems.filter(id => !foundItems.includes(id));

if (missing.length > 0) {
    console.error(`FAILED: Missing expected items in configuration: ${missing.join(', ')}`);
    process.exit(1);
}

console.log("Configuration check passed. Simulating inventory generation...");

// Simulation
const iterations = 1000;
const counts = {};
equipment.forEach(e => counts[e.id] = 0);

for (let i = 0; i < iterations; i++) {
    for (const equip of equipment) {
        if (Math.random() < equip.chance) {
            counts[equip.id]++;
        }
    }
}

console.log("Simulation results (approximate counts per 1000 runs):");
for (const id in counts) {
    console.log(`${id}: ${counts[id]}`);
    if (counts[id] === 0 && Party.initial.inventory.equipment.find(e => e.id === id).chance > 0) {
        // It's possible but unlikely for very low chance items to appear 0 times in 1000 runs if chance is extremely low,
        // but lowest is 0.05, so expected 50. 0 is suspicious.
        console.warn(`WARNING: Item ${id} was never selected in 1000 runs.`);
    }
}

console.log("Verification Passed!");
