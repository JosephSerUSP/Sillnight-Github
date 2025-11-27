import { Data } from '../../assets/data/data.js';

export class Game_BattlerBase {
    constructor() {
        this._hp = 0;
        this._mp = 0;
        this._tp = 0;
        this._hidden = false;
        this._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0]; // mhp, mmp, atk, def, mat, mdf, agi, luk
        this._states = [];
        this._buffs = [0, 0, 0, 0, 0, 0, 0, 0];
        this._buffTurns = [0, 0, 0, 0, 0, 0, 0, 0];
    }

    /**
     * @returns {number} Current HP
     */
    get hp() { return this._hp; }
    set hp(value) {
        this._hp = value;
        this.refresh();
    }

    /**
     * @returns {number} Current MP
     */
    get mp() { return this._mp; }
    set mp(value) {
        this._mp = value;
        this.refresh();
    }

    /**
     * @returns {number} Current TP
     */
    get tp() { return this._tp; }
    set tp(value) {
        this._tp = value;
        this.refresh();
    }

    /**
     * @returns {number} Max HP
     */
    get mhp() { return this.param(0); }

    /**
     * @returns {number} Max MP
     */
    get mmp() { return this.param(1); }

    // Other parameter getters can be added as needed: atk, def, etc.

    /**
     * Checks if the battler is alive.
     */
    isAlive() {
        return this.hp > 0;
    }

    /**
     * Checks if the battler is dead (state #1 or hp 0).
     */
    isDead() {
        return this.isStateAffected(1) || this.hp <= 0;
    }

    isStateAffected(stateId) {
        return this._states.includes(stateId);
    }

    addState(stateId) {
        if (this.isStateAddable(stateId)) {
            if (!this.isStateAffected(stateId)) {
                this._states.push(stateId);
                this.refresh();
            }
            // Reset state turn counters if implemented
        }
    }

    removeState(stateId) {
        if (this.isStateAffected(stateId)) {
            this._states = this._states.filter(id => id !== stateId);
            this.refresh();
        }
    }

    isStateAddable(stateId) {
        // Implement resistance checks here
        return true;
    }

    refresh() {
        // Clamp HP/MP
        this._hp = Math.max(0, Math.min(this._hp, this.mhp));
        this._mp = Math.max(0, Math.min(this._mp, this.mmp));
    }

    /**
     * Calculates the value of a parameter.
     * @param {number} paramId - 0:mhp, 1:mmp, 2:atk, 3:def, 4:mat, 5:mdf, 6:agi, 7:luk
     */
    param(paramId) {
        let value = this.paramBase(paramId) + this.paramPlus(paramId);
        value *= this.paramRate(paramId);
        value *= this.paramBuffRate(paramId);
        return Math.round(Math.max(0, value));
    }

    paramBase(paramId) { return 0; }
    paramPlus(paramId) { return this._paramPlus[paramId]; }
    paramRate(paramId) { return 1; } // Trait multipliers
    paramBuffRate(paramId) { return 1; } // Buff/Debuff multipliers

    /**
     * Trait handling
     */
    traits() {
        return [];
    }

    traitsSet(code) {
        return this.traits().filter(trait => trait.code === code);
    }

    traitsPi(code, id) {
        return this.traitsSet(code).reduce((r, trait) => r * (trait.value !== undefined ? trait.value : 1), 1);
    }

    traitsSum(code, id) {
        return this.traitsSet(code).reduce((r, trait) => r + (trait.value !== undefined ? trait.value : 0), 0);
    }
}
