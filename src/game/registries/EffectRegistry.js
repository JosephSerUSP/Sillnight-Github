import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';
import * as Systems from '../systems.js';

export const EffectRegistry = {
    handlers: {},

    /**
     * Registers a handler for a specific effect type.
     * @param {string} type - The effect type (e.g., 'hp_damage', 'hp_heal').
     * @param {Function} handler - Function(action, target, effect, value). Returns result object or modifies it.
     */
    register(type, handler) {
        this.handlers[type] = handler;
    },

    /**
     * Evaluates the numeric value (formula) of an effect.
     * @param {Game_Action} action - The action instance.
     * @param {Game_Battler} target - The target.
     * @param {Object} effect - The effect data.
     * @returns {number} The calculated value.
     */
    evaluateValue(action, target, effect) {
        if (!effect.formula) return 0;
        const a = action._subject;
        const b = target;
        let value = 0;
        try {
            value = Math.max(0, eval(effect.formula));
        } catch (e) {
            console.error('Error evaluating formula:', effect.formula, e);
            return 0;
        }
        return value;
    },

    /**
     * Applies the effect logic (calculating final damage, etc.)
     * @param {Game_Action} action - The action.
     * @param {Game_Battler} target - The target.
     * @param {Object} effect - The effect definition.
     * @returns {Object} Result object { target, value, effect, isCrit, isMiss }.
     */
    apply(action, target, effect) {
        const handler = this.handlers[effect.type];

        // Default evaluation if no specific handler, or helper for handler
        let baseValue = this.evaluateValue(action, target, effect);

        if (handler) {
            return handler(action, target, effect, baseValue);
        }

        // Fallback result
        return { target, value: baseValue, effect, isCrit: false, isMiss: false };
    }
};

// --- Default Handlers (Migrated from Game_Action) ---

EffectRegistry.register('hp_damage', (action, target, effect, baseValue) => {
    const a = action._subject;
    const item = action.item();

    // Apply stats
    const statType = item.stat || 'atk';
    let attackStat = (statType === 'mat') ? a.mat : a.atk;
    let defenseStat = (statType === 'mat') ? target.mdf : target.def;

    defenseStat = Math.max(1, defenseStat);

    // 1. Power Bonus
    let value = baseValue + a.power;

    // 2. Stat Multiplier
    value *= (attackStat / defenseStat);

    // 3. Elements
    const actionElement = item.element;
    let attackMult = 1.0;
    if (actionElement) {
        const subjectElements = a.elements || [];
        if (subjectElements.includes(actionElement)) attackMult = 1.25;
    }
    const defenseMult = action.calcElementRate(target);

    value = Math.floor(value * attackMult * defenseMult);

    // 4. Critical
    const critChance = a.cri;
    let isCrit = false;
    if (Math.random() < critChance) {
        value = Math.floor(value * (Data.config.baseCritMultiplier || 1.5));
        isCrit = true;
        Log.battle('> Critical Hit!');
    }

    // 5. Guarding
    if (target.isStateAffected('guarding') || (target.status && target.status.includes('guarding'))) {
        value = Math.floor(value / 2);
        Log.battle('> Guarding!');
    }

    value = Math.max(0, value);

    return { target, value, effect, isCrit };
});

EffectRegistry.register('hp_heal', (action, target, effect, baseValue) => {
    const a = action._subject;
    const item = action.item();
    const statType = item.stat || 'atk'; // Usually heals scale with MAT but defaults to ATK here if unspecified
    let attackStat = (statType === 'mat') ? a.mat : a.atk;

    // Scale by user's stat %
    let value = baseValue * (attackStat / 100);
    value = Math.floor(value);

    return { target, value, effect, isCrit: false };
});

EffectRegistry.register('hp_heal_ratio', (action, target, effect) => {
    const ratio = parseFloat(effect.formula);
    const value = Math.floor(target.mhp * ratio);
    return { target, value, effect, isCrit: false };
});

EffectRegistry.register('revive', (action, target, effect) => {
    const ratio = parseFloat(effect.formula);
    const value = Math.floor(target.mhp * ratio);
    return { target, value, effect, isCrit: false };
});

EffectRegistry.register('add_status', (action, target, effect) => {
    return { target, value: 0, effect, isCrit: false };
});

EffectRegistry.register('increase_max_hp', (action, target, effect, baseValue) => {
    return { target, value: baseValue, effect, isCrit: false };
});

// Miss is handled in Game_Action.apply before calling registry,
// but we can register it just in case logic moves here.
EffectRegistry.register('miss', (action, target, effect) => {
    return { target, value: 0, effect, isCrit: false, isMiss: true };
});
