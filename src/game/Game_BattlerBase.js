// src/game/Game_BattlerBase.js

export class Game_BattlerBase {
    constructor() {
        this._hp = 1;
        this._states = [];
    }

    hp() {
        return this._hp;
    }

    changeHp(delta, allowDeath) {
        this._hp += delta;
        if (!allowDeath) {
            this._hp = Math.max(1, this._hp);
        }
    }

    addState(stateId) {
        if (!this.isStateAffected(stateId)) {
            this._states.push(stateId);
        }
    }

    removeState(stateId) {
        this._states = this._states.filter(id => id !== stateId);
    }

    isStateAffected(stateId) {
        return this._states.includes(stateId);
    }
}
