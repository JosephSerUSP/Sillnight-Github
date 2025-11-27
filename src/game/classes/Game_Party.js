export class Game_Party {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        this._gold = 0;
        this._items = {};
        this._equipment = {};
        this._roster = [];
        this._actors = [null, null, null, null, null, null];
        this._floor = 1;
    }

    get gold() {
        return this._gold;
    }

    set gold(amount) {
        this._gold = amount;
    }

    get items() {
        return this._items;
    }

    get equipment() {
        return this._equipment;
    }

    get roster() {
        return this._roster;
    }

    get actors() {
        return this._actors;
    }

    get floor() {
        return this._floor;
    }

    set floor(floor) {
        this._floor = floor;
    }

    gainGold(amount) {
        this._gold += amount;
    }

    gainItem(item, amount) {
        const container = item.itypeId ? this._items : this._equipment;
        container[item.id] = (container[item.id] || 0) + amount;
    }

    swapOrder(index1, index2) {
        const actor1 = this._actors[index1];
        this._actors[index1] = this._actors[index2];
        this._actors[index2] = actor1;
        if (this._actors[index1]) {
            this._actors[index1].slotIndex = index1;
        }
        if (this._actors[index2]) {
            this._actors[index2].slotIndex = index2;
        }
    }
}
