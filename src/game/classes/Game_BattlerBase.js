import { Data } from '../../assets/data/data.js';

/**
 * The foundational class for any entity that participates in battle.
 * Manages basic parameters (HP, MP, TP), states, and buffs.
 */
export class Game_BattlerBase {
    constructor() {
        /** @type {number} Current HP. */
        this._hp = 0;
        /** @type {number} Current MP. */
        this._mp = 0;
        /** @type {number} Current TP. */
        this._tp = 0;
        /** @type {boolean} Visibility flag. */
        this._hidden = false;
        /** @type {Array<number>} Additive bonuses for parameters (mhp, mmp, atk, def, mat, mdf, agi, luk). */
        this._paramPlus = [0, 0, 0, 0, 0, 0, 0, 0];
        /** @type {Array<number>} IDs of active states. */
        this._states = [];
        /** @type {Array<number>} Buff levels for parameters. */
        this._buffs = [0, 0, 0, 0, 0, 0, 0, 0];
        /** @type {Array<number>} Duration of buffs. */
        this._buffTurns = [0, 0, 0, 0, 0, 0, 0, 0];
    }

    /**
     * @returns {number} Current HP.
     */
    get hp() { return this._hp; }
    /** @param {number} value - New HP value. Triggers refresh. */
    set hp(value) {
        const diff = value - this._hp;
        this._hp = value;
        this.refresh();
        if (diff !== 0 && window.Game && window.Game.ui && window.Game.ui.mode === 'EXPLORE') {
            if (window.Game.Windows && window.Game.Windows.Party) {
                window.Game.Windows.Party.onUnitHpChange(this, diff);
            }
        }
    }

    /**
     * @returns {number} Current MP.
     */
    get mp() { return this._mp; }
    /** @param {number} value - New MP value. Triggers refresh. */
    set mp(value) {
        this._mp = value;
        this.refresh();
    }

    /**
     * @returns {number} Current TP.
     */
    get tp() { return this._tp; }
    /** @param {number} value - New TP value. Triggers refresh. */
    set tp(value) {
        this._tp = value;
        this.refresh();
    }

    /**
     * @returns {number} Maximum HP.
     */
    get mhp() { return this.param(0); }

    /**
     * @returns {number} Maximum MP.
     */
    get mmp() { return this.param(1); }

    /**
     * Checks if the battler is alive.
     * @returns {boolean} True if HP > 0.
     */
    isAlive() {
        return this.hp > 0;
    }

    /**
     * Checks if the battler is dead (state #1 or hp 0).
     * @returns {boolean} True if dead.
     */
    isDead() {
        return this.isStateAffected(1) || this.hp <= 0;
    }

    /**
     * Checks if a specific state is active.
     * @param {number} stateId - The state ID.
     * @returns {boolean} True if affected.
     */
    isStateAffected(stateId) {
        return this._states.includes(stateId);
    }

    /**
     * Adds a state to the battler.
     * @param {number} stateId - The state ID.
     */
    addState(stateId) {
        if (this.isStateAddable(stateId)) {
            if (!this.isStateAffected(stateId)) {
                this._states.push(stateId);
                this.refresh();
            }
        }
    }

    /**
     * Removes a state from the battler.
     * @param {number} stateId - The state ID.
     */
    removeState(stateId) {
        if (this.isStateAffected(stateId)) {
            this._states = this._states.filter(id => id !== stateId);
            this.refresh();
        }
    }

    /**
     * Checks if a state can be added (resistances).
     * @param {number} stateId - The state ID.
     * @returns {boolean} True if addable.
     */
    isStateAddable(stateId) {
        return true;
    }

    /**
     * Refreshes the battler's status, clamping HP/MP to valid ranges.
     */
    refresh() {
        // Clamp HP/MP
        this._hp = Math.max(0, Math.min(this._hp, this.mhp));
        this._mp = Math.max(0, Math.min(this._mp, this.mmp));
    }

    /**
     * Calculates the value of a parameter.
     * Formula: (Base + Plus) * Rate * BuffRate
     * @param {number} paramId - 0:mhp, 1:mmp, 2:atk, 3:def, 4:mat, 5:mdf, 6:agi, 7:luk
     * @returns {number} The final parameter value.
     */
    param(paramId) {
        let value = this.paramBase(paramId) + this.paramPlus(paramId);
        value *= this.paramRate(paramId);
        value *= this.paramBuffRate(paramId);
        return Math.round(Math.max(0, value));
    }

    /**
     * Gets the base value of a parameter (from class/race data).
     * @param {number} paramId - The parameter ID.
     * @returns {number} The base value.
     */
    paramBase(paramId) { return 0; }

    /**
     * Gets the additive bonus for a parameter.
     * @param {number} paramId - The parameter ID.
     * @returns {number} The additive bonus.
     */
    paramPlus(paramId) { return this._paramPlus[paramId]; }

    /**
     * Gets the multiplicative rate for a parameter (from traits).
     * @param {number} paramId - The parameter ID.
     * @returns {number} The multiplier.
     */
    paramRate(paramId) { return 1; }

    /**
     * Gets the multiplier from buffs/debuffs.
     * @param {number} paramId - The parameter ID.
     * @returns {number} The buff multiplier.
     */
    paramBuffRate(paramId) { return 1; }

    /**
     * Returns the list of objects containing traits.
     * To be overridden by subclasses.
     * @returns {Array<Object>} List of trait-bearing objects.
     */
    traitObjects() {
        return [];
    }

    /**
     * Aggregates all traits from trait objects.
     * @returns {Array<Object>} The combined list of traits.
     */
    traits() {
        return this.traitObjects().reduce((r, obj) => {
            if (obj && obj.traits) {
                return r.concat(obj.traits);
            }
            return r;
        }, []);
    }

    /**
     * Gets all traits with a specific type/code.
     * @param {string} type - The trait type code.
     * @returns {Array<Object>} Filtered traits.
     */
    traitsSet(type) {
        return this.traits().filter(trait => trait.type === type);
    }

    /**
     * Calculates the multiplicative value of all traits with a specific type.
     * @param {string} type - The trait type code.
     * @returns {number} The product of all values.
     */
    traitsPi(type) {
        return this.traitsSet(type).reduce((r, trait) => r * (trait.formula !== undefined ? parseFloat(trait.formula) : 1), 1);
    }

    /**
     * Calculates the additive sum of all traits with a specific type.
     * @param {string} type - The trait type code.
     * @returns {number} The sum of all values.
     */
    traitsSum(type) {
        return this.traitsSet(type).reduce((r, trait) => r + (trait.formula !== undefined ? parseFloat(trait.formula) : 0), 0);
    }
}
