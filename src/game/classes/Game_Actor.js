import { Game_Battler } from './Game_Battler.js';
import { Services } from '../ServiceLocator.js';

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
        this._exp = this.currentLevelExp(); // Start with minimum EXP for this level
        const def = Services.get('CreatureRegistry').get(speciesId);
        if (!def) {
             console.error(`Actor species not found in registry: ${speciesId}`);
             this._name = 'Unknown';
             return;
        }
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
        const species = Services.get('CreatureRegistry').get(this._speciesId);
        if (species) {
            objects.push(species);
            // 2. Species Passives
            if (species.passives) {
                species.passives.forEach(pId => {
                    const passive = Services.get('PassiveRegistry').get(pId);
                    if (passive) objects.push(passive);
                });
            }
        }
        // 3. Equipment
        if (this._equipmentId) {
            const equip = Services.get('EquipmentRegistry').get(this._equipmentId);
            if (equip) objects.push(equip);
        }
        return objects;
    }

    /** @returns {string} The name of the actor. */
    get name() { return this._name; }

    /** @returns {string} The sprite character to render. */
    get sprite() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.sprite : '?';
    }

    /** @returns {string|undefined} The path to the sprite asset image. */
    get spriteAsset() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.spriteAsset : undefined;
    }

    /**
     * Calculates the base value for a parameter based on species and level.
     * @param {number} paramId - The parameter ID (0 for MaxHP).
     * @returns {number} The base parameter value.
     */
    paramBase(paramId) {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        if (!def) return 0;

        // 0: mhp
        if (paramId === 0) {
            return Math.round(def.baseHp * (1 + def.hpGrowth * (this._level - 1)));
        }
        // 1: mmp
        if (paramId === 1) {
            const baseMp = def.baseMp || 0;
            const growth = def.mpGrowth || 0;
            return Math.round(baseMp * (1 + growth * (this._level - 1)));
        }
        // 2: atk, 3: def, 4: mat, 5: mdf, 6: agi, 7: luk
        if (paramId >= 2 && paramId <= 7) {
            const keys = [null, null, 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
            const key = keys[paramId];
            return def[key] !== undefined ? def[key] : 100;
        }
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
        while (this.currentExp() >= this.nextLevelExp()) {
            this.levelUp();
        }
    }

    /** @returns {number} The current total EXP. */
    currentExp() { return this._exp; }

    /**
     * Returns the accumulated EXP required to reach the *current* level.
     * Used for gauge start point.
     * @returns {number}
     */
    currentLevelExp() {
        return this.expForLevel(this._level);
    }

    /**
     * Returns the accumulated EXP required to reach the *next* level.
     * Used for gauge end point and level up check.
     * @returns {number}
     */
    nextLevelExp() {
         return this.expForLevel(this._level + 1);
    }

    /**
     * Calculates the EXP required to reach a specific level.
     * Uses a cubic-like growth curve based on species 'xpCurve'.
     * @param {number} level - The target level.
     * @returns {number} The total accumulated EXP required.
     */
    expForLevel(level) {
        if (level <= 1) return 0;

        const def = Services.get('CreatureRegistry').get(this._speciesId);
        const curve = def ? (def.xpCurve || 10) : 10;

        // Formula: Curve * 10 * (Level-1)^1.5
        // Example with Curve 10:
        // L1: 0
        // L2: 10 * 10 * 1 = 100
        // L3: 10 * 10 * 2.82 = 282
        // L4: 10 * 10 * 5.2 = 520
        return Math.floor(curve * 10 * Math.pow(level - 1, 1.5));
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
    get acts() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.acts : [];
    }
    /** @returns {string} The temperament of the creature. */
    get temperament() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.temperament : 'free';
    }
    /** @returns {Array} The elemental affinities of the creature. */
    get elements() {
        // Start with innate elements
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        const innate = def ? (def.elements || []) : [];
        // Check for element overrides from traits
        const traitElements = this.elementTraits; // Assumes getter exists in parent or mixin
        return traitElements && traitElements.length > 0 ? traitElements : innate;
    }
}
