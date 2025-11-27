export class Game_BattlerBase {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        this._hp = 1;
        this._states = [];
        this._stateTurns = {};
    }

    get hp() {
        return this._hp;
    }

    set hp(hp) {
        this._hp = Math.round(hp);
    }

    isStateAffected(stateId) {
        return this._states.includes(stateId);
    }

    addState(stateId) {
        if (!this.isStateAffected(stateId)) {
            this._states.push(stateId);
        }
    }

    removeState(stateId) {
        this._states = this._states.filter(id => id !== stateId);
    }
}
