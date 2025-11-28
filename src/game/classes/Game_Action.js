import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';

/**
 * Represents a battle action (Skill or Item usage).
 * Handles targeting, damage calculation, and effect application.
 */
export class Game_Action {
    /**
     * @param {Game_Battler} subject - The unit performing the action.
     * @param {boolean} [force=false] - Whether this is a forced action (skips cost).
     */
    constructor(subject, force = false) {
        this._subject = subject;
        this._forcing = force;
        this._item = null;
        this._targetIndex = -1;
    }

    /**
     * Sets the item or skill to be used.
     * @param {Object} item - The item/skill data object.
     */
    setItemObject(item) {
        this._item = item;
    }

    /** @returns {Object} The item or skill data object. */
    item() { return this._item; }

    /** @returns {Game_Battler} The subject of the action. */
    subject() { return this._subject; }

    /**
     * Checks if the action is valid.
     * @returns {boolean}
     */
    isValid() {
        return (this._forcing && this.item()) || (this.testApply(this.subject())); // Simplified
    }

    /**
     * Tests if the action can be applied to the target.
     * @param {Game_Battler} target
     * @returns {boolean}
     */
    testApply(target) {
        return (this.item() && target && target.isAlive()); // Simplified
    }

    /**
     * Decides targets for the action.
     * @returns {Array<Game_Battler>} List of targets.
     */
    makeTargets() {
        if (!this._item) return [];
        const item = this.item();
        const targets = [];

        // Quick access helper
        const getFriends = () => this.subject().friendsUnit();
        const getOpponents = () => this.subject().opponentsUnit();

        const validFriends = getFriends().filter(u => u.isAlive());
        const validOpponents = getOpponents().filter(u => u.isAlive());

        if (item.target === 'self') {
            targets.push(this.subject());
        } else if (item.target === 'ally-single') {
            // Logic: AI picks most hurt, Player picks selection
            targets.push(validFriends.sort((a, b) => a.hp - b.hp)[0] || this.subject());
        } else if (item.target === 'enemy-all') {
            targets.push(...validOpponents);
        } else if (item.target === 'enemy-row') {
            // Assuming slotIndex logic
            const frontRow = validOpponents.filter(e => e.slotIndex < 3);
            const backRow = validOpponents.filter(e => e.slotIndex >= 3);
            targets.push(...(frontRow.length > 0 ? frontRow : backRow));
        } else {
            // Single Enemy
            const t = validOpponents[Math.floor(Math.random() * validOpponents.length)];
            if(t) targets.push(t);
        }

        return targets;
    }

    /**
     * Applies the action to a target.
     * @param {Game_Battler} target
     * @returns {Array<Object>} Results of effects.
     */
    apply(target) {
        const result = target.result();
        this.subject().useItem(this.item()); // Deduct costs

        const results = [];
        this.item().effects.forEach(effect => {
            const realEffect = this.executeEffect(effect, target);
            if (realEffect) results.push(realEffect);
        });

        return results;
    }

    /**
     * Executes a single effect on the target.
     * @param {Object} effect
     * @param {Game_Battler} target
     */
    executeEffect(effect, target) {
        // Calculate value
        let value = 0;
        if (['hp_damage', 'hp_heal', 'hp_heal_ratio'].includes(effect.type)) {
            value = this.evalDamageFormula(target, effect);
        }

        // Apply Logic
        let success = true;

        // Hit/Miss/Evade logic could go here
        if (effect.type === 'hp_damage') {
             // Basic Evade check
             const hit = this.subject().hit ? this.subject().hit() : 1;
             const eva = target.eva ? target.eva() : 0;
             if (Math.random() < (eva - hit + 1)) { // Simplified
                  // Miss logic would go here, currently simplified
             }
        }

        return { target, value, effect };
    }

    /**
     * Evaluates the damage formula.
     * @param {Game_Battler} target
     * @param {Object} effect
     * @returns {number}
     */
    evalDamageFormula(target, effect) {
        if (!effect.formula) return 0;
        const a = this.subject();
        const b = target;
        const item = this.item();
        let value = 0;

        try {
            // Helper to safely allow formula access
            value = Math.max(0, Math.floor(eval(effect.formula)));
        } catch (e) {
            console.error('Formula Error:', effect.formula, e);
            return 0;
        }

        // Element Calc
        if (this.item().element) {
            value *= target.elementRate(this.item().element);
        }

        // Critical Check
        if (this.calcCritical(target)) {
            value *= 1.5; // TODO: Config
        }

        // Guard Check
        if (target.isStateAffected('guarding')) {
             value /= 2;
        }

        return Math.floor(value);
    }

    /**
     * Checks for critical hit.
     * @param {Game_Battler} target
     */
    calcCritical(target) {
        const rate = this.subject().cri ? this.subject().cri() : 0.04;
        return Math.random() < rate;
    }
}
