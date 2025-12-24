// Factory for creating and managing game state
import { Game_Party } from './classes/Game_Party.js';
import { Game_Map } from './classes/Game_Map.js';
import { Data } from '../assets/data/data.js';
import { Services } from './ServiceLocator.js';

/**
 * Static class responsible for creating and managing the initial game state.
 * It handles the creation of global game objects like $gameParty and $gameMap.
 */
export class DataManager {
    /**
     * Sets up a new game by creating global game objects and populating initial data.
     * Initializes $gameParty and $gameMap, and sets up the first floor.
     * @static
     */
    static setupNewGame() {
        window.$gameParty = new Game_Party();
        window.$gameMap = new Game_Map();
        window.$gameMap.setup(1); // Floor 1

        this.populateInitialParty();
        this.populateInitialInventory();
    }

    /**
     * Populates the player's party with initial creatures based on game data.
     * Selects a random set of unique creatures from the 'initial' party data pool.
     * If specific creatures are not defined, it falls back to selecting random species.
     * @static
     */
    static populateInitialParty() {
        const setup = Data.party.initial;
        const { creatures, count } = setup;

        // Use logic from objects.js to select creatures
         if (!creatures || creatures.length === 0) {
            const creatureRegistry = Services.get('CreatureRegistry');
            const allCreatureIds = creatureRegistry.getAll().map(c => c.id).filter(id => id !== 'summoner' && !id.startsWith('base_'));

            if (allCreatureIds.length > 0) {
                const randomSpeciesId = allCreatureIds[Math.floor(Math.random() * allCreatureIds.length)];
                const randomLevel = 1 + Math.floor(Math.random() * 3);
                window.$gameParty.addActor(randomSpeciesId, randomLevel);
            }
        } else {
            const shuffledCreatures = [...creatures].sort(() => 0.5 - Math.random());
            const selectedCreatures = [];
            const selectedSpecies = new Set();

            for (const creature of shuffledCreatures) {
                if (!selectedSpecies.has(creature.species)) {
                    selectedCreatures.push(creature);
                    selectedSpecies.add(creature.species);
                    if (selectedCreatures.length >= count) break;
                }
            }

            if (selectedCreatures.length < count) {
                const remainingNeeded = count - selectedCreatures.length;
                for(let i=0; i < remainingNeeded; i++) {
                    selectedCreatures.push(shuffledCreatures[i % shuffledCreatures.length]);
                }
            }

            for (const creature of selectedCreatures.slice(0, count)) {
                const level = creature.minLevel + Math.floor(Math.random() * (creature.maxLevel - creature.minLevel + 1));
                window.$gameParty.addActor(creature.species, level);
            }
        }
    }

    /**
     * Populates the player's inventory with a random selection of starting items and equipment.
     * The selection is based on the configuration in `Data.party.initial.inventory`.
     * @static
     */
    static populateInitialInventory() {
        const setup = Data.party.initial.inventory;
        if (!setup) return;

        const { items, equipment } = setup;

        if (items) {
            for (const item of items) {
                if (Math.random() < item.chance) {
                    window.$gameParty.gainItem(item.id, item.quantity);
                }
            }
        }

        if (equipment) {
            for (const equip of equipment) {
                if (Math.random() < equip.chance) {
                    window.$gameParty.gainEquipment(equip.id, equip.quantity);
                }
            }
        }
    }
}
