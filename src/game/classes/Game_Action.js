import { Data } from '../../assets/data/data.js';
import { Game_Battler } from './Game_Battler.js';
import { Log } from '../log.js';
import { Systems } from '../systems.js';

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
        // Determine if skill or item based on ID or properties
        // For now, we assume the caller knows, or we check Data
        if (Data.skills[obj.id]) this.setSkill(obj);
        else if (Data.items[obj.id]) this.setItem(obj);
        else this.setSkill(obj); // Default to skill
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

        const targetElements = target.elements || []; // Use getter from Game_Battler

        // Logic from Systems.Battle.elementMultiplier
        const strengths = { G: 'B', B: 'R', R: 'G', W: 'K', K: 'W' };
        const weaknesses = { G: 'R', B: 'G', R: 'B', W: 'W', K: 'K' };

        return targetElements.reduce((mult, e) => {
            // Systems.Battle.elementRelation(actionElement, e, 'defender')
            // If actionElement is strong against targetElement (e), multiplier increases?
            // Wait, the logic in Systems.Battle was:
            // if (creatureElement === actionElement) return 0.75 (Resist same)
            // if (strongAgainst === creatureElement) return 1.25 (Action is Strong vs Target)
            // if (weakAgainst === creatureElement) return 0.75 (Action is Weak vs Target)

            let rate = 1.0;
            if (e === actionElement) {
                rate = (e === 'W' || e === 'K') ? 0.75 : 1.25; // Original logic had strange same-element boost for non-WK?
                // Re-reading Systems.Battle.elementRelation:
                // if (role === 'attacker') ...
                // if (role === 'defender')
                //   if (creatureElement === actionElement && (W or K)) return 0.75;
                //   if (strongAgainst === creatureElement) return 1.25; // e.g. Action G, StrongAgainst=B. If Target is B, 1.25. Correct.
                //   if (weakAgainst === creatureElement || strengths[creatureElement] === actionElement) return 0.75;
            } else {
                if (strengths[actionElement] === e) rate = 1.25;
                if (weaknesses[actionElement] === e) rate = 0.75;
                // Also check reverse relation for clarity?
                // The original code:
                // if (weakAgainst === creatureElement || this.elementStrengths[creatureElement] === actionElement) return 0.75;
                if (strengths[e] === actionElement) rate = 0.75;
            }
            return mult * rate;
        }, 1.0);
    }

    /**
     * Evaluates the damage formula and calculates final damage/healing.
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
            // Helper for eval to access 'a' and 'b'
            value = Math.floor(eval(effect.formula));
            // Note: In a real engine, avoid eval. Use a parser.
            // For this refactor, we preserve existing behavior but encapsulate it.
        } catch (e) {
            console.error('Error evaluating formula:', effect.formula, e);
            return 0;
        }

        // Apply stat bonuses
        // Systems.Battle used getUnitWithStats(a).power_bonus
        const baseDamage = value + a.power; // Game_Battler.power getter

        // Apply element multipliers
        // Attacker element multiplier? (Original logic had it, seems like STAB - Same Type Attack Bonus)
        // Systems.Battle.elementMultiplier(element, attacker, 'attacker')
        // In Systems.Battle: if creatureElement === actionElement return 1.25
        const actionElement = this.item().element;
        let attackMult = 1.0;
        if (actionElement) {
             const subjectElements = a.elements || [];
             if (subjectElements.includes(actionElement)) attackMult = 1.25;
        }

        const defenseMult = this.calcElementRate(target);

        let finalValue = Math.floor(baseDamage * attackMult * defenseMult);

        // Critical Hit
        // Systems.Battle: critChance = base + attacker.crit_bonus_percent
        const critChance = a.cri;
        if (Math.random() < critChance) {
            finalValue = Math.floor(finalValue * (Data.config.baseCritMultiplier || 1.5));
            Log.battle('> Critical Hit!');
            // We might want to store isCrit for UI display
            this._lastResultIsCrit = true;
        } else {
            this._lastResultIsCrit = false;
        }

        // Guarding
        if (effect.type === 'hp_damage' && target.isStateAffected && target.isStateAffected('guarding')) {
             // 'guarding' is currently a string in .status array in legacy,
             // but we want to move to .isStateAffected(id).
             // However, data uses string 'guarding'.
             // Let's assume for now we check the legacy status array via getter or direct prop if migration isn't 100%
             if ((target.status && target.status.includes('guarding'))) {
                 finalValue = Math.floor(finalValue / 2);
                 Log.battle('> Guarding!');
             }
        }

        return Math.max(0, finalValue);
    }

    /**
     * Applies the action to the target.
     * @param {Game_Battler} target - The target battler.
     * @returns {Array<Object>} List of results { target, value, effect }.
     */
    apply(target) {
        const results = [];
        const item = this.item();
        if (!item || !item.effects) return results;

        // Evasion Check (Physical/Magical split not fully implemented, generic evade)
        // Systems.Battle: if (Math.random() < defender.evade_chance)
        const hitRate = this._subject.hit; // Usually > 1.0
        const evaRate = target.eva;

        // Simple hit check: Random < (Hit - Eva)? Or Random < Hit * (1-Eva)?
        // Original logic: if (Math.random() < defender.evade_chance) return 0;
        // This implies 100% hit rate unless evaded.
        if (Math.random() < evaRate) {
            Systems.Triggers.fire('onUnitEvade', target);
            Log.battle('> Miss!');
             // Push a miss result?
            results.push({ target, value: 0, effect: { type: 'miss' } });
            return results;
        }

        item.effects.forEach(effect => {
            let value = 0;
            if (effect.type !== 'add_status') {
                value = this.evalDamageFormula(target, effect);
            }
            results.push({ target, value, effect, isCrit: this._lastResultIsCrit });
        });

        return results;
    }
}
