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
                    // If the command returns false, it means "wait" or "break" logic might be needed,
                    // but since we are using async/await, we can just await the command.
                    // If the command is synchronous, it returns undefined or value immediately.
                    // If async, we await it.
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
        // For now, we use the existing Systems.Events.show for simple messages,
        // or Log if it's not a modal.
        // If it's a modal message that requires user input/closure:

        // We need a way to wait for the message to close.
        // Currently Systems.Events.show just shows it and returns.
        // We might need to promisify the UI interaction.

        // Let's implement a simple promisified message if possible,
        // or just log it for now if we haven't refactored the UI to return Promises.

        if (window.Game && window.Game.Systems && window.Game.Systems.Events) {
             return new Promise((resolve) => {
                 // Create a custom content with a button that resolves the promise
                 const container = document.createElement('div');
                 container.className = 'space-y-2';
                 container.innerHTML = `<div class="text-lg">${text}</div>`;

                 const btn = document.createElement('button');
                 btn.className = 'mt-4 border border-gray-600 px-4 py-2 hover:bg-gray-700 w-full';
                 btn.innerText = 'Continue';
                 btn.onclick = () => {
                     window.Game.Systems.Events.close();
                     resolve();
                 };

                 container.appendChild(btn);
                 window.Game.Systems.Events.show('MESSAGE', container);
             });
        } else {
            Log.add(text);
        }
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
            window.$gameParty.gainItem(id, amount);
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
            Log.loot(`Received ${amount}x ${id}.`); // Ideally fetch item name
        }
    }

    /**
     * Trigger a Shop.
     * { code: 'SHOP', stock: [...] }
     */
    async command_SHOP(params) {
        if (window.Game && window.Game.Systems && window.Game.Systems.Events) {
            const events = window.Game.Systems.Events;
            // Use provided stock or generate random stock
            let stock = params.stock;
            if (!stock) {
                stock = events.generateShopStock();
            }
            // Await the UI interaction
            await events.showShop(stock);
        }
    }

    /**
     * Trigger Recruit.
     * { code: 'RECRUIT', offers: [...] }
     */
    async command_RECRUIT(params) {
        if (window.Game && window.Game.Systems && window.Game.Systems.Events) {
            const events = window.Game.Systems.Events;
            let offers = params.offers;
            if (!offers) {
                offers = events.generateRecruitOffers();
            }
            await events.showRecruit(offers);
        }
    }

    /**
     * Trigger Shrine.
     */
    async command_SHRINE(params) {
        if (window.Game && window.Game.Systems && window.Game.Systems.Events) {
            await window.Game.Systems.Events.shrine();
        }
    }

    /**
     * Trigger Trap.
     */
    async command_TRAP(params) {
        if (window.Game && window.Game.Systems && window.Game.Systems.Events) {
            await window.Game.Systems.Events.trap();
        }
    }
}
