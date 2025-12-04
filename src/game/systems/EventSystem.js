import { Game_Interpreter } from '../classes/Game_Interpreter.js';
import { Data } from '../../assets/data/data.js';

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
        const shopData = Data.events.shop;
        const stock = [];
        for (let i = 0; i < shopData.stock.count.items; i++) {
            const pool = shopData.stock.pools.items;
            const key = pool[Math.floor(Math.random() * pool.length)];
            if (Data.items[key]) stock.push({ type: 'item', id: key });
        }
        for (let i = 0; i < shopData.stock.count.equipment; i++) {
            const pool = shopData.stock.pools.equipment;
            const key = pool[Math.floor(Math.random() * pool.length)];
            if (Data.equipment[key]) stock.push({ type: 'equip', id: key });
        }
        return stock;
    }

    /**
     * Generates random recruit offers.
     * @returns {Array<Object>} List of creature definitions.
     */
    generateRecruitOffers() {
        const count = Math.random() < 0.5 ? 1 : 2;
        const speciesList = Object.keys(Data.creatures);
        const offers = [];
        for (let i = 0; i < count; i++) {
            const sp = speciesList[Math.floor(Math.random() * speciesList.length)];
            offers.push(Data.creatures[sp]);
        }
        return offers;
    }
}
