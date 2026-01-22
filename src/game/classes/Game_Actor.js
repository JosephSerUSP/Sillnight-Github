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

        /** @type {Array<string>} List of learned skill IDs. */
        this._learnedSkills = [];
        /** @type {Array<string>} List of learned passive IDs. */
        this._learnedPassives = [];
        /** @type {Array<string>} List of added elemental affinities. */
        this._addedElements = [];
        /** @type {Array<string>|null} Override for elemental affinities (e.g. transformation). */
        this._elementOverride = null;

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
     * Learns a new skill.
     * @param {string} skillId - The skill ID.
     */
    learnSkill(skillId) {
        if (!this._learnedSkills.includes(skillId)) {
            this._learnedSkills.push(skillId);
        }
    }

    /**
     * Forgets a skill.
     * @param {string} skillId - The skill ID.
     */
    forgetSkill(skillId) {
        this._learnedSkills = this._learnedSkills.filter(id => id !== skillId);
    }

    /**
     * Learns a new passive.
     * @param {string} passiveId - The passive ID.
     */
    learnPassive(passiveId) {
        if (!this._learnedPassives.includes(passiveId)) {
            this._learnedPassives.push(passiveId);
            this.refresh();
        }
    }

    /**
     * Forgets a passive.
     * @param {string} passiveId - The passive ID.
     */
    forgetPassive(passiveId) {
        this._learnedPassives = this._learnedPassives.filter(id => id !== passiveId);
        this.refresh();
    }

    /**
     * Adds an elemental affinity.
     * @param {string} element - The element code.
     */
    addElement(element) {
        if (!this._addedElements.includes(element)) {
            this._addedElements.push(element);
        }
    }

    /**
     * Sets the elemental override.
     * @param {Array<string>|null} elements - The new elements or null to reset.
     */
    setElements(elements) {
        this._elementOverride = elements;
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
        // 3. Learned Passives
        this._learnedPassives.forEach(pId => {
            const passive = Services.get('PassiveRegistry').get(pId);
            if (passive) objects.push(passive);
        });
        // 4. Equipment
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
    get acts() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        const innate = def ? (def.acts || []) : [];
        // Append learned skills as a new group
        if (this._learnedSkills.length > 0) {
            return [...innate, [...this._learnedSkills]];
        }
        return innate;
    }
    /** @returns {string} The temperament of the creature. */
    get temperament() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.temperament : 'free';
    }
    /** @returns {Array} The elemental affinities of the creature. */
    get elements() {
        // 1. Check for element overrides from traits (highest priority usually)
        const traitElements = this.elementTraits;
        if (traitElements && traitElements.length > 0) return traitElements;

        // 2. Check for manual override (e.g. from elementChange effect)
        if (this._elementOverride) return this._elementOverride;

        // 3. Innate + Added
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        const innate = def ? (def.elements || []) : [];
        return [...innate, ...this._addedElements];
    }
}
