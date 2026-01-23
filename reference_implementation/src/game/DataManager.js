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

        // Reset Variables and Switches
        if (Services.get('GameVariables')) Services.get('GameVariables').clear();
        if (Services.get('GameSwitches')) Services.get('GameSwitches').clear();

        window.$gameMap.setup(0); // Floor 0 (Hub)

        this.populateInitialParty();
        this.populateInitialInventory();
    }

    /**
     * Populates the player's party with initial creatures.
     * Selects 3 random unique creatures from the registry.
     * @static
     */
    static populateInitialParty() {
        const count = 3;
        const creatureRegistry = Services.get('CreatureRegistry');
        const allCreatureIds = creatureRegistry.getAll()
            .map(c => c.id)
            .filter(id => id !== 'summoner' && !id.startsWith('base_'));

        if (allCreatureIds.length === 0) {
            console.warn("No valid creatures found for initial party.");
            return;
        }

        // Shuffle IDs
        const shuffled = [...allCreatureIds].sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, count);

        for (const id of selectedIds) {
            const level = 1 + Math.floor(Math.random() * 3); // Random level 1-3
            window.$gameParty.addActor(id, level);
        }
    }

    /**
     * Populates the player's inventory with a random selection of starting items and equipment.
     * @static
     */
    static populateInitialInventory() {
        // Random assortment of 3 consumables
        const allItems = Object.keys(Data.items).filter(id => !id.startsWith('base_'));
        if (allItems.length > 0) {
            const shuffledItems = [...allItems].sort(() => 0.5 - Math.random());
            const selectedItems = shuffledItems.slice(0, 3);
            for (const id of selectedItems) {
                window.$gameParty.gainItem(id, 1);
            }
        }

        // Random assortment of 5 equipment
        const allEquip = Object.keys(Data.equipment).filter(id => !id.startsWith('base_'));
        if (allEquip.length > 0) {
            const shuffledEquip = [...allEquip].sort(() => 0.5 - Math.random());
            const selectedEquip = shuffledEquip.slice(0, 5);
            for (const id of selectedEquip) {
                window.$gameParty.gainEquipment(id, 1);
            }
        }
    }
}
