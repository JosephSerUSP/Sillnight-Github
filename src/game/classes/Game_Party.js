import { Game_Actor } from './Game_Actor.js';
import { Game_Summoner } from './Game_Summoner.js';
import { Data } from '../../assets/data/data.js';

/**
 * Manages the player's party, inventory, and gold.
 */
export class Game_Party {
    constructor() {
        /** @type {number} Current gold amount. */
        this._gold = 0;
        /** @type {number} Steps taken (unused). */
        this._steps = 0;
        /** @type {Array<Game_Actor>} List of all owned units. */
        this._roster = [];
        /** @type {Array<Game_Actor|null>} The active party formation (fixed size 7 including Summoner). */
        this._activeSlots = new Array(this.maxSlots()).fill(null);
        /** @type {Game_Summoner} The fixed summoner unit. */
        this._summoner = new Game_Summoner(1);
        this._activeSlots[this.summonerSlotIndex()] = this._summoner;
        this._summoner.slotIndex = this.summonerSlotIndex();
        /** @type {Object} The inventory (items and equipment). */
        this._inventory = {
            items: {},
            equipment: {}
        };
    }

    /** @returns {number} Current gold. */
    get gold() { return this._gold; }
    /** @returns {Object} Inventory object. */
    get inventory() { return this._inventory; }
    /** @returns {Array<Game_Actor|null>} Active slots array. */
    get activeSlots() { return this._activeSlots; }
    /** @returns {Array<Game_Actor>} Full roster. */
    get roster() { return this._roster; }
    /** @returns {Game_Summoner} The fixed summoner. */
    get summoner() { return this._summoner; }

    /** @returns {number} Total active slots including summoner. */
    maxSlots() { return 7; }

    /** @returns {number} The number of slots creatures can occupy (excluding summoner). */
    maxCreatureSlots() { return this.maxSlots() - 1; }

    /** @returns {number} The summoner's fixed slot index. */
    summonerSlotIndex() { return this.maxSlots() - 1; }

    /**
     * Checks whether a given index is reserved for the summoner.
     * @param {number} index
     * @returns {boolean}
     */
    isSummonerSlot(index) {
        return index === this.summonerSlotIndex();
    }

    /** @returns {number} Count of active non-summoner creatures. */
    activeCreatureCount() {
        return this._activeSlots.filter((u, idx) => u && !this.isSummonerSlot(idx)).length;
    }

    /**
     * Adds gold to the party.
     * @param {number} amount - Amount to add.
     */
    gainGold(amount) {
        this._gold += amount;
    }

    /**
     * Checks if the party has a specific item.
     * @param {string} itemId - The item ID.
     * @returns {boolean}
     */
    hasItem(itemId) {
        return this._inventory.items[itemId] > 0;
    }

    /**
     * Removes an item from the inventory.
     * @param {string} itemId - The item ID.
     * @param {number} [amount=1] - Quantity to remove.
     */
    loseItem(itemId, amount = 1) {
        this._inventory.items[itemId] = Math.max(0, (this._inventory.items[itemId] || 0) - amount);
        if (this._inventory.items[itemId] === 0) {
            delete this._inventory.items[itemId];
        }
    }

    /**
     * Checks if the party has a specific piece of equipment.
     * @param {string} equipId - The equipment ID.
     * @returns {boolean}
     */
    hasEquipment(equipId) {
        return this._inventory.equipment[equipId] > 0;
    }

    /**
     * Removes a piece of equipment from the inventory.
     * @param {string} equipId - The equipment ID.
     * @param {number} [amount=1] - Quantity to remove.
     */
    loseEquipment(equipId, amount = 1) {
        this._inventory.equipment[equipId] = Math.max(0, (this._inventory.equipment[equipId] || 0) - amount);
        if (this._inventory.equipment[equipId] === 0) {
            delete this._inventory.equipment[equipId];
        }
    }

    /**
     * Removes gold from the party.
     * @param {number} amount - Amount to remove.
     */
    loseGold(amount) {
        this._gold = Math.max(0, this._gold - amount);
    }

    /**
     * Adds an item to the inventory.
     * @param {string} itemId - The item ID.
     * @param {number} [amount=1] - Quantity to add.
     */
    gainItem(itemId, amount = 1) {
        this._inventory.items[itemId] = (this._inventory.items[itemId] || 0) + amount;
    }

    /**
     * Adds equipment to the inventory.
     * @param {string} equipId - The equipment ID.
     * @param {number} [amount=1] - Quantity to add.
     */
    gainEquipment(equipId, amount = 1) {
        this._inventory.equipment[equipId] = (this._inventory.equipment[equipId] || 0) + amount;
    }

    /**
     * Creates and adds a new actor to the roster.
     * Auto-assigns to an active slot if one is empty.
     * @param {string} speciesId - The species ID.
     * @param {number} level - The initial level.
     * @returns {Game_Actor} The new actor.
     */
    addActor(speciesId, level) {
        const actor = new Game_Actor(speciesId, level);
        this._roster.push(actor);
        // Auto-add to first empty slot if available
        const emptyIdx = this._activeSlots.findIndex((s, idx) => s === null && !this.isSummonerSlot(idx));
        if (emptyIdx !== -1) {
            this._activeSlots[emptyIdx] = actor;
            actor.slotIndex = emptyIdx;
        }
        return actor;
    }

    /**
     * Removes an actor from the roster and active party.
     * @param {string} uid - The actor's unique ID.
     */
    removeActor(uid) {
        if (this._summoner && this._summoner.uid === uid) return;
        const idx = this._roster.findIndex(a => a.uid === uid);
        if (idx !== -1) {
            const actor = this._roster[idx];
            this._roster.splice(idx, 1);
            const slotIdx = this._activeSlots.indexOf(actor);
            if (slotIdx !== -1) {
                this._activeSlots[slotIdx] = null;
            }
        }
    }

    /**
     * Swaps two units in the active party slots.
     * @param {number} slot1 - Index of first slot.
     * @param {number} slot2 - Index of second slot.
     */
    swapOrder(slot1, slot2) {
        if (this.isSummonerSlot(slot1) || this.isSummonerSlot(slot2)) return;

        const temp = this._activeSlots[slot1];
        this._activeSlots[slot1] = this._activeSlots[slot2];
        this._activeSlots[slot2] = temp;

        if (this._activeSlots[slot1]) this._activeSlots[slot1].slotIndex = slot1;
        if (this._activeSlots[slot2]) this._activeSlots[slot2].slotIndex = slot2;
    }

    /**
     * Returns the list of active battle members (excluding null slots).
     * @returns {Array<Game_Actor>} Active party members.
     */
    battleMembers() {
        return this._activeSlots.filter(actor => actor !== null);
    }

    /**
     * Applies MP drain to the summoner from an ally action.
     * @param {Game_Actor} actor
     */
    onAllyAction(actor) {
        if (!this._summoner || !actor || actor.isSummoner) return;
        this.drainSummonerMp(Data.config.summonerActionMpDrain || 0);
    }

    /** Applies MP drain to the summoner when moving on the map. */
    onMapStep() {
        this.drainSummonerMp(Data.config.summonerStepMpDrain || 0);
    }

    /**
     * Drains a fixed amount of MP from the summoner and refreshes UI.
     * @param {number} amount
     */
    drainSummonerMp(amount) {
        if (!this._summoner || amount <= 0) return;
        const before = this._summoner.mp;
        this._summoner.mp = Math.max(0, this._summoner.mp - amount);
        if (before !== this._summoner.mp) {
            window.Game?.Windows?.HUD?.refresh();
            window.Game?.Windows?.Party?.refresh();
        }
    }
}
