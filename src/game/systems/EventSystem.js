import { Game_Interpreter } from '../classes/Game_Interpreter.js';
import { Data } from '../../assets/data/data.js';
import { Services } from '../ServiceLocator.js';

export class EventSystem {
    constructor() {
        this._interpreter = new Game_Interpreter();
    }

    get interpreter() {
        return this._interpreter;
    }

    /**
     * Executes a list of commands.
     * @param {Array<Object>} commands
     * @param {string|number} eventId
     */
    run(commands, eventId) {
        this._interpreter.setup(commands, eventId);
    }

    /**
     * Generates random shop stock.
     * @returns {Array<Object>} List of items/equipment.
     */
    generateShopStock() {
        const eventRegistry = Services.get('EventDataRegistry');
        const shopData = eventRegistry.get('shop');
        const itemRegistry = Services.get('ItemRegistry');
        const equipRegistry = Services.get('EquipmentRegistry');

        const stock = [];
        for (let i = 0; i < shopData.stock.count.items; i++) {
            const pool = shopData.stock.pools.items;
            const key = pool[Math.floor(Math.random() * pool.length)];
            if (itemRegistry.get(key)) stock.push({ type: 'item', id: key });
        }
        for (let i = 0; i < shopData.stock.count.equipment; i++) {
            const pool = shopData.stock.pools.equipment;
            const key = pool[Math.floor(Math.random() * pool.length)];
            if (equipRegistry.get(key)) stock.push({ type: 'equip', id: key });
        }
        return stock;
    }

    /**
     * Generates a single recruit offer with requirements.
     * @param {number} [floor=1] - Current floor level.
     * @returns {Object} { speciesId, level, cost: { type, value, id? } }
     */
    generateRecruit(floor = 1) {
        const creatureRegistry = Services.get('CreatureRegistry');
        const itemRegistry = Services.get('ItemRegistry');

        // Pick a creature
        const speciesList = creatureRegistry.getAll().filter(c => c.id !== 'summoner' && !c.id.startsWith('base_')).map(c => c.id);
        const speciesId = speciesList[Math.floor(Math.random() * speciesList.length)];
        const def = creatureRegistry.get(speciesId);

        // Determine Level
        const level = Math.max(1, floor + Math.floor(Math.random() * 3) - 1); // Floor -1 to +1

        // Determine Cost
        // 30% Free, 50% Gold, 20% Item
        const roll = Math.random();
        let cost = { type: 'FREE', value: 0 };

        if (roll > 0.3 && roll <= 0.8) {
            // Gold
            // Base cost from creature def * level multiplier
            const baseCost = def.cost || 100;
            const val = Math.round(baseCost * (1 + (level - 1) * 0.2));
            cost = { type: 'GOLD', value: val };
        } else if (roll > 0.8) {
            // Item
            // Pick a random cheap item for now
            const items = ['potionSmall', 'reviveLeaf'];
            const item = items[Math.floor(Math.random() * items.length)];
            const itemData = itemRegistry.get(item);
            const itemName = itemData?.name || item;
            cost = { type: 'ITEM', id: item, name: itemName, value: 1 };
        }

        return {
            speciesId,
            level,
            cost
        };
    }

    // Legacy method for compatibility if called elsewhere
    generateRecruitOffers() {
        return [this.generateRecruit(1)];
    }
}
