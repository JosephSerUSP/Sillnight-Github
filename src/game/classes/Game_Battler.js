import { Game_BattlerBase } from './Game_BattlerBase.js';
import { Data } from '../../assets/data/data.js';

/**
 * @class Game_Battler
 * @extends Game_BattlerBase
 * @description The superclass for Game_Actor and Game_Enemy.
 * Handles parameters, traits, and battle logic.
 */
export class Game_Battler extends Game_BattlerBase {
    constructor() {
        super();
    }

    /**
     * Calculates the maximum Hit Points (HP) based on base stats,
     * equipment, and traits.
     * @returns {number} The calculated Max HP.
     */
    mhp() {
        const def = Data.creatures[this.speciesId];
        let baseMax = Math.round(def.baseHp * (1 + def.hpGrowth * (this.level - 1)));
        if (this.equipmentId) {
            const eq = Data.equipment[this.equipmentId];
            if (eq?.hpBonus) baseMax = Math.round(baseMax * (1 + eq.hpBonus));
        }
        return baseMax;
    }

    /**
     * Applies healing to the battler.
     * @param {number} amount The amount of HP to heal.
     */
    gainHp(amount) {
        this.setHp(Math.min(this.mhp(), this.hp() + amount));
    }

    /**
     * @returns {number} The current HP of the battler.
     */
    hp() {
      return this._hp;
    }

    /**
     * @param {number} newHp The new HP value for the battler.
     */
    setHp(newHp) {
        this._hp = Math.max(0, Math.min(this.mhp(), newHp));
    }

    /**
     * @returns {string[]} The current statuses of the battler.
     */
    status() {
        return this._states;
    }

    /**
     * @param {string} status The status to add to the battler.
     */
    addStatus(status) {
        if (!this._states.includes(status)) {
            this._states.push(status);
        }
    }
}
