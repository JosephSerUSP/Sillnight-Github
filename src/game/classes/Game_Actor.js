import { Game_Battler } from './Game_Battler.js';
import { Data } from '../../assets/data/data.js';

/**
 * @class Game_Actor
 * @extends Game_Battler
 * @description The class for actors.
 */
export class Game_Actor extends Game_Battler {
    /**
     * @param {string} speciesId The ID of the creature species.
     * @param {number} level The level of the actor.
     */
    constructor(speciesId, level) {
        super();
        this.setup(speciesId, level);
    }

    /**
     * Initializes the actor's properties.
     * @param {string} speciesId The ID of the creature species.
     * @param {number} level The level of the actor.
     */
    setup(speciesId, level) {
        const speciesData = Data.creatures[speciesId];
        this.uid = `u_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        this.speciesId = speciesId;
        this._name = speciesData.name;
        this.sprite = speciesData.sprite;
        this.spriteAsset = speciesData.spriteAsset;
        this.level = level;
        this.exp = 0;
        this.temperament = speciesData.temperament;
        this.elements = speciesData.elements ? [...speciesData.elements] : [];
        this.acts = speciesData.acts;
        this.equipmentId = null;

        // Initialize HP/MP
        this._hp = this.mhp();
        this._mp = 0;
    }

    /**
     * @returns {string} The name of the actor.
     */
    name() {
        return this._name;
    }

    getXpProgress() {
        const xpForNextLevel = (level) => Math.round(100 * Math.pow(level, 1.1));
        const currentLvlXp = this.level > 1 ? xpForNextLevel(this.level - 1) : 0;
        const nextLvlXp = xpForNextLevel(this.level);
        const xpInCurrentLvl = this.exp - currentLvlXp;
        const xpForThisLvl = nextLvlXp - currentLvlXp;
        return (xpInCurrentLvl / xpForThisLvl) * 100;
    }

    gainExp(amount) {
        this.exp += amount;
        const xpForNextLevel = (level) => Math.round(100 * Math.pow(level, 1.1));
        let levelUpOccurred = false;
        while (this.exp >= xpForNextLevel(this.level)) {
            this.level++;
            levelUpOccurred = true;
        }
        if (levelUpOccurred) {
            this._hp = this.mhp();
            // TODO: Log level up message
        }
    }
}
