import { Game_Actor } from './Game_Actor.js';
import { Data } from '../../assets/data/data.js';

/**
 * Manages the player's party, inventory, and gold.
 */
export class Game_Party {
    constructor() {
        /** @type {number} Current gold amount. */
        this._gold = 500;
        /** @type {number} Steps taken (unused). */
        this._steps = 0;
        /** @type {Array<Game_Actor>} List of all owned units. */
        this._roster = [];
        /** @type {Array<Game_Actor|null>} The active party formation (fixed size 6). */
        this._activeSlots = [null, null, null, null, null, null];
        /** @type {Object} The inventory (items and equipment). */
        this._inventory = {
            items: {},
            equipment: {}
        };
        /** @type {Set<string>} Set of owned artifact IDs. */
        this._artifacts = new Set();
    }

    /** @returns {number} Current gold. */
    get gold() { return this._gold; }
    /** @returns {Object} Inventory object. */
    get inventory() { return this._inventory; }
    /** @returns {Array<string>} List of owned artifact IDs. */
    get artifacts() { return Array.from(this._artifacts); }
    /** @returns {Array<Game_Actor|null>} Active slots array. */
    get activeSlots() { return this._activeSlots; }
    /** @returns {Array<Game_Actor>} Full roster. */
    get roster() { return this._roster; }

    /**
     * Adds gold to the party.
     * @param {number} amount - Amount to add.
     */
    gainGold(amount) {
        this._gold += amount;
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
     * Adds an artifact to the collection.
     * @param {string} artifactId - The artifact ID.
     */
    gainArtifact(artifactId) {
        if (!this._artifacts.has(artifactId)) {
            this._artifacts.add(artifactId);
            // Refresh all actors to apply new global traits
            this._roster.forEach(actor => actor.refresh());
        }
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
        const emptyIdx = this._activeSlots.findIndex(s => s === null);
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
}
