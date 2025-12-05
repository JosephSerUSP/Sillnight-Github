import { Log } from '../log.js';

/**
 * Interpreter for executing event commands.
 */
export class Game_Interpreter {
    constructor(depth = 0) {
        this._depth = depth;
        this._list = []; // The list of commands
        this._index = 0; // Current command index
        this._eventId = 0; // The ID of the event being executed
        this._params = []; // Parameters for the current execution context
    }

    /**
     * Sets up the interpreter with a list of commands.
     * @param {Array<Object>} list - The list of commands to execute.
     * @param {string|number} eventId - The ID of the event.
     */
    setup(list, eventId = 0) {
        this._list = list || [];
        this._index = 0;
        this._eventId = eventId;
        this.execute();
    }

    /**
     * Starts the execution of commands.
     * @async
     */
    async execute() {
        while (this._index < this._list.length) {
            const command = this._list[this._index];
            if (!command) {
                this._index++;
                continue;
            }

            const method = this[`command_${command.code}`];
            if (typeof method === 'function') {
                try {
                    await method.call(this, command);
                } catch (e) {
                    console.error(`Error executing command ${command.code} in event ${this._eventId}:`, e);
                }
            } else {
                console.warn(`Unknown command code: ${command.code}`);
            }
            this._index++;
        }
    }

    // -------------------------------------------------------------------------
    // Command Implementations
    // -------------------------------------------------------------------------

    /**
     * Show a message.
     * { code: 'MESSAGE', text: "Hello world" }
     */
    async command_MESSAGE(params) {
        const text = params.text;
        // For now, assume Log.add is sufficient unless we have a modal message window.
        // If there was a modal message implementation, it would be called here.
        Log.add(text);
        // Note: If we had a Window_Message, we would await its show/close here.
    }

    /**
     * Wait for a certain amount of time.
     * { code: 'WAIT', duration: 1000 }
     */
    async command_WAIT(params) {
        const duration = params.duration || 0;
        await new Promise(resolve => setTimeout(resolve, duration));
    }

    /**
     * Log to the console/game log.
     * { code: 'LOG', text: "Something happened." }
     */
    command_LOG(params) {
        Log.add(params.text);
    }

    /**
     * Give an item to the party.
     * { code: 'GIVE_ITEM', id: 'potion', amount: 1 }
     */
    command_GIVE_ITEM(params) {
        const id = params.id;
        const amount = params.amount || 1;
        if (window.$gameParty) {
            import('../../assets/data/data.js').then(({ Data }) => {
                const item = Data.items[id] || Data.equipment[id];
                window.$gameParty.gainItem(id, amount);
                if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();

                if (item) {
                     Log.loot(`Found ${item.name}!`);
                } else {
                     Log.loot(`Received ${amount}x ${id}.`);
                }

                if (window.$gameMap && window.$gameMap.playerPos && window.Game.Systems.Effekseer) {
                    const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
                    window.Game.Systems.Effekseer.play('MAP_Find', pos);
                }
            });
        }
    }

    /**
     * Give gold to the party.
     * { code: 'GIVE_GOLD', amount: 100 }
     */
    command_GIVE_GOLD(params) {
        const amount = params.amount || 0;
        if (window.$gameParty) {
            window.$gameParty.gainGold(amount);
            Log.loot(`Found ${amount} Gold!`);

            if (window.$gameMap && window.$gameMap.playerPos && window.Game.Systems.Effekseer) {
                const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
                window.Game.Systems.Effekseer.play('MAP_Find', pos);
            }
        }
    }

    /**
     * Start a battle encounter.
     * { code: 'BATTLE' }
     */
    async command_BATTLE(params) {
        if (window.Game && window.Game.BattleManager) {
            await window.Game.BattleManager.startEncounter();
        }
    }

    /**
     * Trigger a Shop.
     * { code: 'SHOP', stock: [...] }
     */
    async command_SHOP(params) {
        if (window.Game && window.Game.Windows && window.Game.Windows.Shop) {
            let stock = params.stock;
            // Generate stock if not provided, using EventSystem helper
            if (!stock && window.Game.Systems.Event) {
                stock = window.Game.Systems.Event.generateShopStock();
            }
            if (stock) {
                Log.add('You discover a mysterious merchant.');
                await window.Game.Windows.Shop.show(stock);
            }
        }
    }

    /**
     * Trigger Recruit.
     * { code: 'RECRUIT', offers: [...] }
     */
    async command_RECRUIT(params) {
        if (window.Game && window.Game.Windows && window.Game.Windows.Recruit) {
            let offers = params.offers;
            // Generate offers if not provided, using EventSystem helper
            if (!offers && window.Game.Systems.Event) {
                offers = window.Game.Systems.Event.generateRecruitOffers();
            }
            if (offers) {
                Log.add('You encounter a wandering soul.');
                await window.Game.Windows.Recruit.show(offers);
            }
        }
    }

    /**
     * Trigger Shrine.
     */
    async command_SHRINE(params) {
        if (window.Game && window.Game.Systems && window.Game.Systems.Event) {
            await window.Game.Systems.Event.shrine();
        }
    }

    /**
     * Trigger Trap.
     */
    async command_TRAP(params) {
        if (window.Game && window.Game.Systems && window.Game.Systems.Event) {
            await window.Game.Systems.Event.trap();
        }
    }

    /**
     * Erase the event.
     * { code: 'ERASE_EVENT' }
     */
    command_ERASE_EVENT(params) {
        if (window.$gameMap && this._eventId) {
            const event = window.$gameMap.events.find(e => e.id === this._eventId);
            if (event) {
                event.erase();
            }
        }
    }
}
