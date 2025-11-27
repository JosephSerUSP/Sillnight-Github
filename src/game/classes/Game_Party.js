import { Game_Actor } from './Game_Actor.js';
import { Data } from '../../assets/data/data.js';

export class Game_Party {
    constructor() {
        this._gold = 500;
        this._steps = 0;
        this._roster = []; // All Game_Actor instances
        this._activeSlots = [null, null, null, null, null, null]; // References to actors in roster
        this._inventory = {
            items: {},
            equipment: {}
        };
    }

    get gold() { return this._gold; }
    get inventory() { return this._inventory; }
    get activeSlots() { return this._activeSlots; }
    get roster() { return this._roster; }

    gainGold(amount) {
        this._gold += amount;
    }

    loseGold(amount) {
        this._gold = Math.max(0, this._gold - amount);
    }

    gainItem(itemId, amount = 1) {
        this._inventory.items[itemId] = (this._inventory.items[itemId] || 0) + amount;
    }

    gainEquipment(equipId, amount = 1) {
        this._inventory.equipment[equipId] = (this._inventory.equipment[equipId] || 0) + amount;
    }

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

    swapOrder(slot1, slot2) {
        const temp = this._activeSlots[slot1];
        this._activeSlots[slot1] = this._activeSlots[slot2];
        this._activeSlots[slot2] = temp;

        if (this._activeSlots[slot1]) this._activeSlots[slot1].slotIndex = slot1;
        if (this._activeSlots[slot2]) this._activeSlots[slot2].slotIndex = slot2;
    }

    // Helper to get active members for battle
    battleMembers() {
        return this._activeSlots.filter(actor => actor !== null);
    }
}
