import { Game_Interpreter } from '../classes/Game_Interpreter.js';
import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';

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
            if (Data.creatures[sp]) {
                offers.push(Data.creatures[sp]);
            }
        }
        return offers;
    }

    /**
     * Triggers the shrine event (heal).
     * @returns {Promise<void>}
     */
    async shrine() {
        Log.add('You find a glowing shrine.');
        if (window.$gameParty) {
            window.$gameParty.roster.forEach(u => {
                u.recoverAll();
            });
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        }

        if (window.$gameMap && window.$gameMap.playerPos && window.Game.Systems.Effekseer) {
            const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
            await window.Game.Systems.Effekseer.play('MAP_Shrine', pos);
        }
        Log.add('Your party feels rejuvenated.');
    }

    /**
     * Triggers the trap event.
     * @returns {Promise<void>}
     */
    async trap() {
        Log.add('A hidden trap triggers!');
        const damage = (u) => {
            const maxhp = u.mhp;
            const dmg = Math.ceil(maxhp * 0.2);
            u.hp = Math.max(0, u.hp - dmg);
            if (u.hp === 0) Log.battle(`${u.name} was knocked out by the trap!`);
        };

        if (window.$gameParty) {
            window.$gameParty.activeSlots.forEach(u => { if (u) damage(u); });
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        }

        if (window.$gameMap && window.$gameMap.playerPos && window.Game.Systems.Effekseer) {
            const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
            await window.Game.Systems.Effekseer.play('MAP_Trap', pos);
        }
        Log.add('A trap harms your party!');
    }
}
