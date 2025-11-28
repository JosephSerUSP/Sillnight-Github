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
        // Can add other stat scaling here if needed
        return 0;
    }

    /**
     * Collects all trait objects from species (enemies have no equips usually).
     * @returns {Array<Object>}
     */
    traits() {
        const traits = [];
        // Species Traits (Passives)
        const def = Data.creatures[this._speciesId];
        if (def && def.passives) {
            def.passives.forEach(pid => {
                const p = Data.passives[pid];
                if (p && p.traits) traits.push(...p.traits);
            });
        }
        return traits;
    }

    /**
     * Gets the additive bonus for a parameter.
     * @param {number} paramId - The parameter ID.
     * @returns {number} The additive bonus.
     */
    paramPlus(paramId) {
        let plus = super.paramPlus(paramId);

        // Legacy "power_bonus" was flat, mapping to atk (2)
        if (paramId === 2) { // Atk
            this.traits().forEach(t => {
                if (t.type === 'power_bonus') plus += (parseInt(t.formula) || 0);
            });
        }

        // Legacy "speed_bonus" mapped to agi (6)
        if (paramId === 6) { // Agi
            this.traits().forEach(t => {
                if (t.type === 'speed_bonus') plus += (parseInt(t.formula) || 0);
            });
        }

        return plus;
    }

    // Compatibility
    /** @returns {number} The nominal level. */
    get level() { return this._level; }
    /** @returns {Array} List of action patterns. */
    get acts() { return Data.creatures[this._speciesId].acts; }
    /** @returns {string} The temperament. */
    get temperament() { return Data.creatures[this._speciesId].temperament; }
    /** @returns {Array} Elemental affinities. */
    get elements() { return Data.creatures[this._speciesId].elements || []; }
}
