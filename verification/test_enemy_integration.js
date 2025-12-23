
import { Services } from '../src/game/ServiceLocator.js';
import { CreatureRegistry } from '../src/game/registries/CreatureRegistry.js';
import { Game_Enemy } from '../src/game/classes/Game_Enemy.js';
import { Data } from '../src/assets/data/data.js';

// Setup Registry
const registry = new CreatureRegistry();
Services.register('CreatureRegistry', registry);
registry.load();

console.log("--- Testing Game_Enemy with Registry ---");

// Test with a real creature from data (e.g., 'goblin')
try {
    const goblin = new Game_Enemy('goblin', 0, 0);
    console.log(`Created Enemy: ${goblin.name}`);
    console.log(`HP: ${goblin.mhp}`);
    console.log(`Acts: ${JSON.stringify(goblin.acts)}`);

    if (goblin.name !== 'Goblin') throw new Error("Name mismatch");
    if (goblin.mhp <= 0) throw new Error("HP invalid");
    if (!goblin.acts || goblin.acts.length === 0) throw new Error("Acts missing");

    console.log("PASS: Game_Enemy instantiated successfully from Registry.");
} catch (e) {
    console.error("FAIL: " + e.message);
    console.error(e.stack);
    process.exit(1);
}
