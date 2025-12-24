import { Log } from '../log.js';
import * as Systems from '../systems.js';

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
        // Temporary implementation until Window_Message is fully integrated
        // Using a basic DOM overlay

        return new Promise((resolve) => {
            const modalId = 'interpreter-message-modal';
            let modal = document.getElementById(modalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.className = 'absolute inset-0 bg-black/80 flex items-center justify-center z-50';
                document.getElementById('game-container').appendChild(modal);
            } else {
                modal.classList.remove('hidden');
            }

            modal.innerHTML = '';

            const container = document.createElement('div');
            container.className = 'bg-gray-900 border border-white p-4 max-w-md w-full flex flex-col gap-4';
            container.innerHTML = `<div class="text-white text-lg">${text}</div>`;

            const btn = document.createElement('button');
            btn.className = 'border border-gray-600 px-4 py-2 text-white hover:bg-gray-700 w-full';
            btn.innerText = 'Continue';
            btn.onclick = () => {
                modal.classList.add('hidden');
                resolve();
            };

            container.appendChild(btn);
            modal.appendChild(container);
        });
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
            import('../ServiceLocator.js').then(({ Services }) => {
                const itemRegistry = Services.get('ItemRegistry');
                const equipRegistry = Services.get('EquipmentRegistry');

                const item = itemRegistry.get(id) || equipRegistry.get(id);
                window.$gameParty.gainItem(id, amount);
                if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();

                if (item) {
                     Log.loot(`Found ${item.name}!`);
                } else {
                     Log.loot(`Received ${amount}x ${id}.`);
                }

                if (window.$gameMap && window.$gameMap.playerPos && Systems.Effekseer) {
                    const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
                    Systems.Effekseer.play('MAP_Find', pos);
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

            if (window.$gameMap && window.$gameMap.playerPos && Systems.Effekseer) {
                const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
                Systems.Effekseer.play('MAP_Find', pos);
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
        Log.add('You discover a mysterious merchant.');

        // Generate stock if needed
        let stock = params.stock;
        if (!stock) {
            stock = Systems.Event.generateShopStock();
        }

        // Direct call to Window
        if (window.Game && window.Game.Windows && window.Game.Windows.Shop) {
            await window.Game.Windows.Shop.show(stock);
        } else {
            console.error("Window_Shop not found.");
        }
    }

    /**
     * Trigger Recruit.
     * { code: 'RECRUIT', offers: [...], offer: {...} }
     */
    async command_RECRUIT(params) {
        Log.add('You encounter a wandering soul.');

        // Support legacy list or new single offer
        let offer = params.offer;

        // Backwards compatibility/Fallback
        if (!offer && params.offers && params.offers.length > 0) {
            offer = { speciesId: params.offers[0].id, level: 1, cost: { type: 'FREE', value: 0 } };
        } else if (!offer) {
             offer = Systems.Event.generateRecruit(1);
        }

        if (window.Game && window.Game.Windows && window.Game.Windows.Recruit) {
            const recruited = await window.Game.Windows.Recruit.show(offer);

            if (recruited) {
                // If successfully recruited, erase the event
                this.command_ERASE_EVENT();
            } else {
                // If not recruited (cancelled), do nothing (event persists)
                // Stop execution if there were subsequent commands (though RECRUIT is usually last or alone)
                this._index = this._list.length;
            }
        } else {
            console.error("Window_Recruit not found.");
        }
    }

    /**
     * Trigger Shrine.
     */
    async command_SHRINE(params) {
        Log.add('You find a glowing shrine.');

        // Logic moved inline or to EventSystem methods if complex
        if (window.$gameParty) {
            window.$gameParty.roster.forEach(u => u.recoverAll());
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        }

        if (window.$gameMap && window.$gameMap.playerPos && Systems.Effekseer) {
            const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
            Systems.Effekseer.play('MAP_Shrine', pos);
        }

        Log.add('Your party feels rejuvenated.');
    }

    /**
     * Trigger Trap.
     */
    async command_TRAP(params) {
        Log.add('A hidden trap triggers!');

        if (window.$gameParty) {
            const damage = (u) => {
                const maxhp = u.mhp;
                const dmg = Math.ceil(maxhp * 0.2);
                u.hp = Math.max(0, u.hp - dmg);
                if (u.hp === 0) Log.battle(`${u.name} was knocked out by the trap!`);
            };
            window.$gameParty.activeSlots.forEach(u => { if (u) damage(u); });
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        }

        if (window.$gameMap && window.$gameMap.playerPos && Systems.Effekseer) {
            const pos = { x: window.$gameMap.playerPos.x, y: 0.5, z: window.$gameMap.playerPos.y };
            Systems.Effekseer.play('MAP_Trap', pos);
        }

        Log.add('A trap harms your party!');
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
