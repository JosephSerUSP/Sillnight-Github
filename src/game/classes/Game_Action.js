import { Data } from '../../assets/data/data.js';
import { Game_Battler } from './Game_Battler.js';
import { Log } from '../log.js';
import * as Systems from '../systems.js';
import { EffectRegistry } from '../registries/EffectRegistry.js';

/**
 * Handles the execution of battle actions (skills/items).
 * Manages targeting, damage calculation, and effect application.
 */
export class Game_Action {
    /**
     * @param {Game_Battler} subject - The battler performing the action.
     */
    constructor(subject) {
        this._subject = subject;
        this._item = null;
        this._skill = null;
        this._lastResultIsCrit = false;
    }

    /**
     * Sets the item to be used.
     * @param {Object} item - The item data object.
     */
    setItem(item) {
        this._item = item;
        this._skill = null;
    }

    /**
     * Sets the skill to be used.
     * @param {Object} skill - The skill data object.
     */
    setSkill(skill) {
        this._skill = skill;
        this._item = null;
    }

    /**
     * Sets the action object directly (skill or item).
     * @param {Object} obj - The action data object.
     */
    setObject(obj) {
        if (Data.skills[obj.id]) this.setSkill(obj);
        else if (Data.items[obj.id]) this.setItem(obj);
        else this.setSkill(obj);
    }

    /**
     * Gets the current action data object.
     * @returns {Object} The skill or item object.
     */
    item() {
        return this._item || this._skill;
    }

    /**
     * Checks if the action is a skill.
     * @returns {boolean}
     */
    isSkill() {
        return !!this._skill;
    }

    /**
     * Checks if the action is an item.
     * @returns {boolean}
     */
    isItem() {
        return !!this._item;
    }

    /**
     * Calculates the element rate for a target.
     * @param {Game_Battler} target - The target battler.
     * @returns {number} The element multiplier.
     */
    calcElementRate(target) {
        const actionElement = this.item().element;
        if (!actionElement) return 1.0;

        const targetElements = target.elements || [];

        const strengths = { G: 'B', B: 'R', R: 'G', W: 'K', K: 'W' };

        return targetElements.reduce((mult, e) => {
            let rate = 1.0;
            if (e === actionElement) {
                // Same element resist
                rate = 0.75;
            } else if (strengths[actionElement] === e) {
                // Action Strong vs Target Element
                rate = 1.25;
            } else if (strengths[e] === actionElement) {
                // Target Element Strong vs Action
                rate = 0.75;
            }
            return mult * rate;
        }, 1.0);
    }

    /**
     * Applies the action to the target.
     * @param {Game_Battler} target - The target battler.
     * @returns {Array<Object>} List of results { target, value, effect, isCrit, isMiss }.
     */
    apply(target) {
        const results = [];
        const item = this.item();
        if (!item || !item.effects) return results;

        // Evasion Check (Only for damage actions)
        const isDamage = item.effects.some(e => e.type === 'hp_damage');
        if (isDamage) {
            const hitRate = this._subject.hit;
            const evaRate = target.eva;
            const chanceToHit = Math.max(0, hitRate - evaRate);

            if (Math.random() > chanceToHit) {
                if (Systems.Observer) Systems.Observer.fire('onUnitEvade', target);
                Log.battle('> Miss!');
                results.push({ target, value: 0, effect: { type: 'miss' }, isMiss: true });
                return results;
            }
        }

        item.effects.forEach(effect => {
            const result = EffectRegistry.process(this, target, effect);

            // Sync local crit state (legacy support)
            this._lastResultIsCrit = !!result.isCrit;

            results.push({
                target,
                value: result.value,
                effect,
                isCrit: result.isCrit,
                isMiss: result.isMiss
            });
        });

        return results;
    }
}
