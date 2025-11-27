// Game_Party.js

export class Game_Party {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        this._gold = 0;
        this._items = {};
        this._equipment = {};
        this._actors = []; // Roster
        this._activeSlots = [null, null, null, null, null, null];
    }

    get gold() {
        return this._gold;
    }

    get items() {
        return this._items;
    }

    get equipment() {
        return this._equipment;
    }

    get members() {
        return this._actors;
    }

    get activeMembers() {
        return this._activeSlots.filter(actor => actor);
    }

    get activeSlots() {
        return this._activeSlots;
    }

    set activeSlots(slots) {
        this._activeSlots = slots;
    }

    gainGold(amount) {
        this._gold = (this._gold || 0) + amount;
    }

    gainItem(item, amount, isEquipment = false) {
        const container = isEquipment ? this._equipment : this._items;
        const key = item.id;
        container[key] = (container[key] || 0) + amount;
    }

    hasItem(item, isEquipment = false) {
        const container = isEquipment ? this._equipment : this._items;
        return container[item.id] > 0;
    }

    swapOrder(slotIndex1, slotIndex2) {
        const temp = this._activeSlots[slotIndex1];
        this._activeSlots[slotIndex1] = this._activeSlots[slotIndex2];
        this._activeSlots[slotIndex2] = temp;
    }

    firstEmptySlot() {
        return this._activeSlots.findIndex(actor => !actor);
    }

    addActor(actor, slotIndex) {
        this._actors.push(actor);
        if (slotIndex > -1) {
            this._activeSlots[slotIndex] = actor;
        }
    }

    addActorToRoster(actor) {
        this._actors.push(actor);
    }

    swapToActive(actor, slotIndex) {
        const currentIndex = this._activeSlots.indexOf(actor);
        if (currentIndex > -1) {
            this._activeSlots[currentIndex] = null;
        }
        this._activeSlots[slotIndex] = actor;
    }

    swapToReserve(actor, reserveActor) {
        const currentIndex = this._activeSlots.indexOf(actor);
        if (currentIndex > -1) {
            this._activeSlots[currentIndex] = reserveActor;
        }
    }

    equipItem(actor, itemId) {
        if (this._equipment[itemId] > 0) {
            if (actor.equipmentId) {
                this.gainItem({ id: actor.equipmentId }, 1, true);
            }
            this._equipment[itemId]--;
            actor.equipmentId = itemId;
        }
    }

    transferEquipment(target, owner, itemId) {
        if (owner.equipmentId === itemId) {
            if (target.equipmentId) {
                this.gainItem({ id: target.equipmentId }, 1, true);
            }
            owner.equipmentId = null;
            target.equipmentId = itemId;
        }
    }

    unequipItem(actor) {
        if (actor.equipmentId) {
            this.gainItem({ id: actor.equipmentId }, 1, true);
            actor.equipmentId = null;
        }
    }
}
