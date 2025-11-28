import { Game_BattlerBase } from './Game_BattlerBase.js';
import { Data } from '../../assets/data/data.js';
import { GameState } from '../state.js'; // Needed for friend/opponent lookup until we have BattleManager context injected

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
     */
    get speed() { return this._speed; }
    /** @param {number} value - The new speed value. */
    set speed(value) { this._speed = value; }

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

    // Trait Helpers
    /**
     * Calculates the elemental rate.
     * @param {string} elementId - The element ID (e.g. 'F', 'I', 'L').
     * @returns {number} The multiplier (default 1).
     */
    elementRate(elementId) {
        // Legacy system used Systems.Battle.elementMultiplier
        // We will now check "element_rate" traits
        const traits = this.traits();
        // Default 1.0
        let rate = 1.0;

        // Check elements array (legacy)
        const myElements = this.elements || [];
        // Map G, B, R, W, K
        const strengths = { G: 'B', B: 'R', R: 'G', W: 'K', K: 'W' };
        const weaknesses = { G: 'R', B: 'G', R: 'B', W: 'W', K: 'K' };

        // If I have element X, and incoming is Y
        // If Y is strong against X -> I take 1.25x
        // If Y is weak against X -> I take 0.75x

        myElements.forEach(e => {
             if (strengths[e] === elementId) rate *= 0.75; // I am strong against this element
             if (weaknesses[e] === elementId) rate *= 1.25; // I am weak against this element
             if (e === elementId) {
                  if (e === 'W' || e === 'K') rate *= 0.75; // Light/Dark resist self
                  else rate *= 1.25; // Others amplify self? (Based on old logic: if creatureElement === actionElement return 1.25 if attacker... wait, elementRelation logic was complex.
                  // Old logic:
                  // if role === 'defender'
                  // if creatureElement === actionElement && (W or K) return 0.75
                  // if strongAgainst === creatureElement (The Action is Strong against Me) return 1.25
                  // if weakAgainst === creatureElement (The Action is Weak against Me) return 0.75
             }
        });

        return rate;
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

    /**
     * Gets the friends unit (Party or Troop).
     * @returns {Array<Game_Battler>}
     */
    friendsUnit() {
        // This is tricky without a BattleManager reference or "unit container" reference on the battler.
        // We will assume GameState.battle is populated if we are in battle.
        if (!GameState.battle) return [];
        if (GameState.battle.allies.includes(this)) return GameState.battle.allies;
        return GameState.battle.enemies;
    }

    /**
     * Gets the opponents unit.
     * @returns {Array<Game_Battler>}
     */
    opponentsUnit() {
        if (!GameState.battle) return [];
        if (GameState.battle.allies.includes(this)) return GameState.battle.enemies;
        return GameState.battle.allies;
    }

    /**
     * Uses an item or skill (pays cost).
     * @param {Object} item
     */
    useItem(item) {
        if (!item) return;
        // Pay MP/TP
        if (item.mpCost) this.mp -= item.mpCost;
        if (item.tpCost) this.tp -= item.tpCost;
    }

    /**
     * Gets or creates the current result object.
     * @returns {Object}
     */
    result() {
        if (!this._result) {
            this._result = {
                used: false,
                missed: false,
                evaded: false,
                physical: false,
                drain: false,
                critical: false,
                success: false,
                hpAffected: false,
                hpDamage: 0,
                mpDamage: 0,
                tpDamage: 0,
                addedStates: [],
                removedStates: [],
                addedBuffs: [],
                addedDebuffs: [],
                removedBuffs: []
            };
        }
        return this._result;
    }

    /**
     * Clears the result object.
     */
    clearResult() {
        this._result = null;
    }

    /**
     * Placeholder for hit rate.
     */
    hit() {
        return 1.0;
    }

    /**
     * Placeholder for evasion rate.
     */
    eva() {
        // Base 5% + Speed Bonus/100?
        // Old logic: defenderWithStats.evade_chance
        // Systems.Battle.getUnitWithStats didn't calculate evade_chance, it just passed it if it existed?
        // Wait, evade_chance was usually 0 unless added by something.
        return 0.05 + (this.speed * 0.001);
    }

    /**
     * Placeholder for crit rate.
     */
    cri() {
        // Base 5% + traits
        let rate = 0.05;
        this.traits().forEach(t => {
             if (t.type === 'crit_bonus_percent') rate += (parseFloat(t.formula) || 0);
        });
        return rate;
    }
}
