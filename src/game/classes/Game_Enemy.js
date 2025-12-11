import { Game_Battler } from './Game_Battler.js';
import { Data } from '../../assets/data/data.js';

/**
 * Represents an enemy in the game.
 * Extends Game_Battler to add enemy-specific logic like drop items and AI.
 */
export class Game_Enemy extends Game_Battler {
    /**
     * @param {string} speciesId - The species ID from Data.creatures.
     * @param {number} x - The X coordinate (unused in 3D battle).
     * @param {number} y - The Y coordinate (unused in 3D battle).
     * @param {number} [levelMultiplier=1] - Multiplier for stats to simulate higher levels.
     */
    constructor(speciesId, x, y, levelMultiplier = 1) {
        super();
        /** @type {string} */
        this._speciesId = speciesId;
        /** @type {number} */
        this._levelMultiplier = levelMultiplier;
        /** @type {string} */
        this._uid = `e_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        /** @type {number} */
        this._level = 1; // Enemies nominally level 1, but stats scaled by multiplier

        this.setup(speciesId);
    }

    /** @returns {string} The unique ID. */
    get uid() { return this._uid; }
    /** @returns {string} The species ID. */
    get speciesId() { return this._speciesId; }

    /**
     * Sets up the enemy based on species data.
     * @param {string} speciesId - The species ID.
     */
    setup(speciesId) {
        const def = Data.creatures[speciesId];
        this._name = def.name;
        this.recoverAll(); // Sets HP/MP to max
    }

    /**
     * returns the objects that provide traits.
     * @returns {Array<Object>}
     */
    traitObjects() {
        const objects = super.traitObjects();
        const species = Data.creatures[this._speciesId];
        if (species) {
            objects.push(species);
            if (species.passives) {
                species.passives.forEach(pId => {
                    const passive = Data.passives[pId];
                    if (passive) objects.push(passive);
                });
            }
        }
        return objects;
    }

    /**
     * Fully recovers HP and MP, and clears states.
     */
    recoverAll() {
        this._hp = this.mhp;
        this._mp = this.mmp;
        this._states = [];
    }

    /** @returns {string} The name of the enemy. */
    get name() { return this._name; }

    /** @returns {string} The sprite character. */
    get sprite() { return Data.creatures[this._speciesId].sprite; }
    /** @returns {string|undefined} The sprite asset path. */
    get spriteAsset() { return Data.creatures[this._speciesId].spriteAsset; }

    /**
     * Calculates the base parameter value.
     * Scales MaxHP by the level multiplier.
     * @param {number} paramId - The parameter ID.
     * @returns {number} The base value.
     */
    paramBase(paramId) {
        const def = Data.creatures[this._speciesId];
        if (paramId === 0) { // mhp
             return Math.floor(def.baseHp * this._levelMultiplier);
        }
        // 2: atk, 3: def, 4: mat, 5: mdf, 6: agi, 7: luk
        if (paramId >= 2 && paramId <= 7) {
            const keys = [null, null, 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
            const key = keys[paramId];
            return def[key] !== undefined ? def[key] : 100;
        }
        return 0;
    }

    // Compatibility
    /** @returns {number} The nominal level. */
    get level() { return this._level; }
    /** @returns {Array} List of action patterns. */
    get acts() { return Data.creatures[this._speciesId].acts; }
    /** @returns {string} The temperament. */
    get temperament() { return Data.creatures[this._speciesId].temperament; }
    /** @returns {Array} Elemental affinities. */
    get elements() {
        // Start with innate elements
        const innate = Data.creatures[this._speciesId].elements || [];
        // Check for element overrides from traits
        const traitElements = this.elementTraits;
        return traitElements.length > 0 ? traitElements : innate;
    }

    /**
     * Calculates the XP value yielded by this enemy.
     * Based on species BaseXP and Level Multiplier.
     * @returns {number} The XP value.
     */
    xpValue() {
        const def = Data.creatures[this._speciesId];
        const base = (def && def.baseXp) || 0;
        // Formula: (BaseXP + 2) * ConfigBase * LevelMultiplier
        // Adding +2 ensures even 0 baseXp creatures give something if configured.
        const configBase = Data.config.baseXpPerEnemy || 5;
        return Math.floor((base + 2) * configBase * this._levelMultiplier);
    }
}
