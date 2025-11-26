// src/game/Game_Party.js

import { Game_Actor } from './Game_Actor.js';

export class Game_Party {
    constructor() {
        this._gold = 0;
        this._inventory = { items: {}, equipment: {} };
        this._activeSlots = [null, null, null, null, null, null];
        this._roster = [];
    }

    gold() {
        return this._gold;
    }

    gainGold(amount) {
        this._gold = Math.max(0, this._gold + amount);
    }

    gainItem(item, amount) {
        const container = item.etypeId ? this._inventory.equipment : this._inventory.items;
        const id = item.id;
        container[id] = (container[id] || 0) + amount;
        if (container[id] <= 0) {
            delete container[id];
        }
    }

    swapOrder(index1, index2) {
        const temp = this._activeSlots[index1];
        this._activeSlots[index1] = this._activeSlots[index2];
        this._activeSlots[index2] = temp;
    }

    members() {
        return this._activeSlots;
    }

    addRosterMember(member) {
        this._roster.push(member);
    }

    setPartyMember(slotId, member) {
        this._activeSlots[slotId] = member;
    }

    inventory() {
        return JSON.parse(JSON.stringify(this._inventory));
    }
}
