import { Game_BattlerBase } from './Game_BattlerBase.js';
import { Data } from '../../assets/data/data.js';

/**
 * Superclass for actors and enemies.
 * Adds battle-specific functionality like actions, speed, and turn handling.
 */
export class Game_Battler extends Game_BattlerBase {
    constructor() {
        super();
        /** @type {Array} The actions the battler will perform. */
        this._actions = [];
        /** @type {number} The speed of the battler for turn order. */
        this._speed = 0;
        /** @type {Object|null} The result of the last action. */
        this._result = null;
        /** @type {boolean} Whether the battler is currently selected. */
        this._selected = false;
        /** @type {number} The battler's index in the party/troop. */
        this._slotIndex = -1;
    }

    /** @returns {number} The slot index. */
    get slotIndex() { return this._slotIndex; }
    /** @param {number} val - The new slot index. */
    set slotIndex(val) { this._slotIndex = val; }

    /**
     * @returns {string} Name of the battler. To be overridden.
     */
    get name() { return ''; }

    /**
     * @returns {number} Current speed (for turn order).
     * Calculates base speed bonus from traits plus the transient speed value.
     */
    get speed() {
        return this._speed + this.traitsSum('speed_bonus');
    }

    /** @param {number} value - The new speed value. */
    set speed(value) { this._speed = value; }

    // --- Derived Stats (Traits) ---

    /** @returns {number} Critical Hit Rate (0-1). Base 5% + traits. */
    get cri() {
        return (Data.config.baseCritChance || 0.05) + this.traitsSum('crit_bonus_percent');
    }

    /** @returns {number} Evasion Rate (0-1). */
    get eva() {
        return this.traitsSum('evade_chance'); // Assuming 'evade_chance' trait type exists or will exist
    }

    /** @returns {number} Hit Rate (0-1). */
    get hit() {
        return 1.0 + this.traitsSum('hit_bonus');
    }

    /** @returns {number} Attack Power Bonus (Additive). */
    get power() {
        return this.traitsSum('power_bonus');
    }

    /** @returns {number} XP Bonus Percent. */
    get xpRate() {
        return this.traitsSum('xp_bonus_percent');
    }

    /** @returns {Array<string>} List of element changes/affinities. */
    get elementTraits() {
        return this.traitsSet('element_change').map(t => t.element);
    }

    /**
     * Called at the start of a turn.
     * Use to regenerate HP/MP or update states.
     */
    onTurnStart() {
        // Regenerate HP/MP, update states/buffs
    }

    /**
     * Called at the end of a turn.
     * Use to update state durations.
     */
    onTurnEnd() {
        // Update states/buffs turns
    }

    /**
     * Called when a battle starts.
     */
    onBattleStart() {
        this.onTurnStart();
    }

    /**
     * Called when a battle ends.
     * Clears results and temporary states.
     */
    onBattleEnd() {
        this._result = null;
        this.removeBattleStates();
    }

    /**
     * Removes states that expire at the end of battle.
     */
    removeBattleStates() {
        // Remove states that should expire at battle end
    }

    // Actions
    /**
     * Generates actions for the current turn.
     * (Placeholder for AI or input handling).
     */
    makeActions() {
        this._actions = [];
        // Logic to decide actions (AI or Input placeholder)
    }
}
