// Game_BattlerBase.js

export class Game_BattlerBase {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        this.uid = `u_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        this._hp = 1;
        this._states = [];
    }

    get hp() {
        return this._hp;
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
        const index = this._states.indexOf(stateId);
        if (index > -1) {
            this._states.splice(index, 1);
        }
    }
}
