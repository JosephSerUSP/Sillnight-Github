import { Game_Battler } from './Game_Battler.js';
import { Log } from '../log.js';
import * as Systems from '../systems.js';
import { Services } from '../ServiceLocator.js';
import { Config } from '../Config.js';

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
     * Resolves the full object from the Registry to ensure inheritance is applied.
     * @param {Object} obj - The action data object (must have an id).
     */
    setObject(obj) {
        const skill = Services.get('SkillRegistry').get(obj.id);
        if (skill) {
            this.setSkill(skill);
            return;
        }

        const item = Services.get('ItemRegistry').get(obj.id);
        if (item) {
            this.setItem(item);
            return;
        }

        const equip = Services.get('EquipmentRegistry').get(obj.id);
        if (equip) {
            this.setItem(equip);
            return;
        }

        // Fallback for ad-hoc objects that might not be in the registry
        this.setSkill(obj);
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
     * Uses a hardcoded strength cycle (G>B>R>G, W<>K).
     * @param {Game_Battler} target - The target battler.
     * @returns {number} The element multiplier.
     */
    calcElementRate(target) {
        const actionElement = this.item().element;
        if (!actionElement) return 1.0;

        const targetElements = target.elements || [];

        // Hardcoded element relationships
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
     * Evaluates the damage formula and calculates final damage/healing.
     * Pipeline:
     * 1. Eval formula (Base)
     * 2. Add Power Bonus (from traits)
     * 3. Apply Stat Multiplier (ATK/DEF or MAT/MDF)
     * 4. Apply Element Boost (STAB & Weakness)
     * 5. Apply Critical Hit (RNG)
     * 6. Apply Guarding (50% reduction)
     * @param {Game_Battler} target - The target battler.
     * @param {Object} effect - The specific effect being applied.
     * @returns {number} The final calculated value.
     */
    evalDamageFormula(target, effect) {
        if (!effect.formula) return 0;

        const a = this._subject;
        const b = target;
        let value = 0;

        try {
            // Evaluates the formula string (e.g. "4 + 2 * a.level")
            value = Math.max(0, eval(effect.formula));
        } catch (e) {
            console.error('Error evaluating formula:', effect.formula, e);
            return 0;
        }

        // Apply stats (ATK/DEF or MAT/MDF)
        const statType = this.item().stat || 'atk';
        let attackStat, defenseStat;

        if (statType === 'mat') {
            attackStat = a.mat;
            defenseStat = target.mdf;
        } else {
            attackStat = a.atk;
            defenseStat = target.def;
        }

        // Apply stat scaling (100 = 100%)
        // Damage = Base * (Atk/Def)
        // Ensure defense isn't 0 to avoid division by zero
        defenseStat = Math.max(1, defenseStat);

        if (effect.type === 'hp_damage') {
             // 1. Add Power Bonus
             value += a.power;

             // 2. Stat Multiplier
             value *= (attackStat / defenseStat);

             // 3. Attacker Element Boost (STAB)
             const actionElement = this.item().element;
             let attackMult = 1.0;
             if (actionElement) {
                 const subjectElements = a.elements || [];
                 if (subjectElements.includes(actionElement)) attackMult = 1.25;
             }

             // 4. Target Element Resistance
             const defenseMult = this.calcElementRate(target);

             value = Math.floor(value * attackMult * defenseMult);

             // 5. Critical Hit
             const critChance = a.cri;
             const critMult = (Config.baseCritMultiplier !== undefined) ? Config.baseCritMultiplier : 1.5;
             if (Math.random() < critChance) {
                 value = Math.floor(value * critMult);
                 this._lastResultIsCrit = true;
                 Log.battle('> Critical Hit!');
             } else {
                 this._lastResultIsCrit = false;
             }

             // 6. Guarding
             if (target.isStateAffected('guarding') || (target.status && target.status.includes('guarding'))) {
                  value = Math.floor(value / 2);
                  Log.battle('> Guarding!');
             }
        } else if (effect.type === 'hp_heal') {
            // For healing, scale by user's MAT/ATK
            value *= (attackStat / 100);
            this._lastResultIsCrit = false;
            value = Math.floor(value);
        } else {
            this._lastResultIsCrit = false;
            value = Math.floor(value);
        }

        return Math.max(0, value);
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
            let value = 0;
            if (effect.type === 'hp_heal_ratio') {
                const ratio = parseFloat(effect.formula);
                value = Math.floor(target.mhp * ratio);
            } else if (effect.type === 'revive') {
                 const ratio = parseFloat(effect.formula);
                 value = Math.floor(target.mhp * ratio);
            } else if (effect.type !== 'add_status') {
                value = this.evalDamageFormula(target, effect);
            }
            results.push({ target, value, effect, isCrit: this._lastResultIsCrit });
        });

        return results;
    }
}
