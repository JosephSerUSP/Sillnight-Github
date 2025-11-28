import { Game_Battler } from './Game_Battler.js';
import { Data } from '../../assets/data/data.js';

/**
 * Represents an actor (player character) in the game.
 * Extends Game_Battler to add leveling, experience, and equipment logic.
 */
export class Game_Actor extends Game_Battler {
    /**
     * @param {string} speciesId - The species ID from Data.creatures.
     * @param {number} [level=1] - The initial level.
     */
    constructor(speciesId, level = 1) {
        super();
        /** @type {string} */
        this._speciesId = speciesId;
        /** @type {number} */
        this._level = level;
        /** @type {number} */
        this._exp = 0;
        /** @type {string|null} */
        this._equipmentId = null;
        /** @type {string} */
        this._uid = `u_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        /** @type {number} Extra MaxHP bonus from consumption */
        this._maxHpBonus = 0;

        this.setup(speciesId, level);
    }

    /** @returns {string} The unique ID of the actor. */
    get uid() { return this._uid; }
    /** @returns {number} The current level. */
    get level() { return this._level; }
    /** @returns {number} The current experience points. */
    get exp() { return this._exp; }
    /** @returns {string} The species ID. */
    get speciesId() { return this._speciesId; }
    /** @returns {string|null} The ID of the currently equipped item. */
    get equipmentId() { return this._equipmentId; }
    /** @param {string|null} id - The new equipment ID. */
    set equipmentId(id) { this._equipmentId = id; this.refresh(); }

    /** @returns {number} */
    get maxHpBonus() { return this._maxHpBonus; }
    /** @param {number} val */
    set maxHpBonus(val) { this._maxHpBonus = val; this.refresh(); }

    /**
     * Sets up the actor with the given species and level.
     * Calculates initial EXP and fully recovers HP/MP.
     * @param {string} speciesId - The species ID.
     * @param {number} level - The level.
     */
    setup(speciesId, level) {
        this._speciesId = speciesId;
        this._level = level;
        this._exp = this.expForLevel(this._level);
        const def = Data.creatures[speciesId];
        this._name = def.name;
        this.recoverAll();
    }

    /**
     * returns the objects that provide traits.
     * @returns {Array<Object>}
     */
    traitObjects() {
        const objects = super.traitObjects();
        // 1. Species Data
        const species = Data.creatures[this._speciesId];
        if (species) {
            objects.push(species);
            // 2. Species Passives
            if (species.passives) {
                species.passives.forEach(pId => {
                    const passive = Data.passives[pId];
                    if (passive) objects.push(passive);
                });
            }
        }
        // 3. Equipment
        if (this._equipmentId) {
            const equip = Data.equipment[this._equipmentId];
            if (equip) objects.push(equip);
        }
        return objects;
    }

    /** @returns {string} The name of the actor. */
    get name() { return this._name; }

    /** @returns {string} The sprite character to render. */
    get sprite() {
        return Data.creatures[this._speciesId].sprite;
    }

    /** @returns {string|undefined} The path to the sprite asset image. */
    get spriteAsset() {
        return Data.creatures[this._speciesId].spriteAsset;
    }

    /**
     * Calculates the base value for a parameter based on species and level.
     * @param {number} paramId - The parameter ID (0 for MaxHP).
     * @returns {number} The base parameter value.
     */
    paramBase(paramId) {
        const def = Data.creatures[this._speciesId];
        // 0: mhp
        if (paramId === 0) {
            return Math.round(def.baseHp * (1 + def.hpGrowth * (this._level - 1)));
        }
        // Add other params if they exist in data
        return 0;
    }

    /**
     * Calculates the multiplicative rate for a parameter based on traits (equipment, passives).
     * @param {number} paramId - The parameter ID.
     * @returns {number} The multiplier (default 1.0).
     */
    paramRate(paramId) {
        let rate = super.paramRate(paramId);
        // Map paramId to trait types
        if (paramId === 0) { // Max HP
             rate *= (1 + this.traitsSum('hp_bonus_percent'));
        }
        return rate;
    }

    /**
     * Calculates the additive bonus for a parameter.
     * @param {number} paramId - The parameter ID.
     * @returns {number} The additive bonus.
     */
    paramPlus(paramId) {
        let plus = super.paramPlus(paramId);
        if (paramId === 0) {
             plus += this._maxHpBonus;
        }
        return plus;
    }

    /**
     * Fully recovers HP and MP, and clears states.
     */
    recoverAll() {
        this._hp = this.mhp;
        this._mp = this.mmp;
        this._states = [];
    }

    /**
     * Adds experience points and handles level ups.
     * @param {number} exp - The amount of EXP to gain.
     */
    gainExp(exp) {
        this._exp += exp;
        // Level up logic
        const def = Data.creatures[this._speciesId];
        while (this.currentExp() >= this.nextLevelExp()) {
            this.levelUp();
        }
    }

    /** @returns {number} The current total EXP. */
    currentExp() { return this._exp; }

    /** @returns {number} The EXP required for the next level. */
    nextLevelExp() {
         // Threshold to reach the *next* level (current level + 1)
         return this.expForLevel(this._level + 1);
    }

    /**
     * Calculates the EXP required to reach a specific level.
     * @param {number} level - The target level.
     * @returns {number} The EXP threshold.
     */
    expForLevel(level) {
        if (level <= 1) return 0;
        // Cumulative XP required to reach 'level'
        // Using formula: 100 * (level-1)^1.1
        return Math.round(100 * Math.pow(level - 1, 1.1));
    }

    /**
     * Increases the actor's level and recovers stats.
     */
    levelUp() {
        this._level++;
        this.recoverAll();
    }

    // Compatibility with old object structure
    /** @returns {Array} The list of actions available to the creature. */
    get acts() { return Data.creatures[this._speciesId].acts; }
    /** @returns {string} The temperament of the creature. */
    get temperament() { return Data.creatures[this._speciesId].temperament; }
    /** @returns {Array} The elemental affinities of the creature. */
    get elements() {
        // Start with innate elements
        const innate = Data.creatures[this._speciesId].elements || [];
        // Check for element overrides from traits
        const traitElements = this.elementTraits;
        return traitElements.length > 0 ? traitElements : innate;
    }
}
