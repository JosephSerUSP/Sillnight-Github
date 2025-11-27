import { Game_Battler } from './Game_Battler.js';
import { Data } from '../../assets/data/data.js';

/**
 * @class Game_Enemy
 * @extends Game_Battler
 * @description The class for enemies.
 */
export class Game_Enemy extends Game_Battler {
    /**
     * @param {string} speciesId The ID of the creature species.
     * @param {number} level The level of the enemy.
     */
    constructor(speciesId, level) {
        super();
        this.setup(speciesId, level);
    }

    /**
     * Initializes the enemy's properties.
     * @param {string} speciesId The ID of the creature species.
     * @param {number} level The level of the enemy.
     */
    setup(speciesId, level) {
        const speciesData = Data.creatures[speciesId];
        this.uid = `e_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        this.speciesId = speciesId;
        this._name = speciesData.name;
        this.level = level;

        // Initialize HP/MP
        this._hp = this.mhp();
        this._mp = 0;
    }

    /**
     * @returns {string} The name of the enemy.
     */
    name() {
        return this._name;
    }
}
