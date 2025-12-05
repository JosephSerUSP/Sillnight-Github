import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';
import * as Systems from '../systems.js';

/**
 * Registry for handling effect logic in battle actions.
 * Decouples effect implementation from Game_Action.
 */
export const EffectRegistry = {
    _handlers: {},

    /**
     * Registers a handler for a specific effect type.
     * @param {string} effectType - The effect type (e.g., 'hp_damage').
     * @param {Function} handler - The function to execute (action, target, effect, value).
     *                             Should return the calculated value or modified result object.
     */
    register(effectType, handler) {
        this._handlers[effectType] = handler;
    },

    /**
     * Evaluates the numeric value for an effect (Damage Formula).
     * @param {Object} action - The Game_Action instance.
     * @param {Object} target - The target battler.
     * @param {Object} effect - The effect object.
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

        // Apply standard stat scaling if applicable (Standard Logic)
        // Specific handlers can modify this later, but the base formula eval is common.
        // However, 'hp_damage' has specific logic involving power, element, crit, guard.
        // We will move that into the handler or a shared helper if needed.
        // For now, let's keep the raw evaluation here as a helper, but logic in handlers.

        return value;
    },

    /**
     * Process an effect against a target.
     * @param {Object} action - The Game_Action instance.
     * @param {Object} target - The target battler.
     * @param {Object} effect - The effect object.
     * @returns {Object} Result object { value, isCrit, isMiss, ... }
     */
    process(action, target, effect) {
        const handler = this._handlers[effect.type];
        if (handler) {
            return handler(action, target, effect);
        }

        // Default fallback for generic calculation if no handler specific logic needed
        // (though usually we need a handler to define what 'value' means)
        const value = this.evaluateValue(action, target, effect);
        return { value, isCrit: false };
    }
};

// Initialize default handlers
EffectRegistry.register('hp_damage', (action, target, effect) => {
    const a = action._subject;
    const item = action.item();

    // Base Formula
    let value = 0;
    try {
        const b = target; // for eval context
        value = Math.max(0, eval(effect.formula || '0'));
    } catch (e) {
        console.error('Error evaluating hp_damage:', effect.formula, e);
    }

    // Stats
    const statType = item.stat || 'atk';
    let attackStat = (statType === 'mat') ? a.mat : a.atk;
    let defenseStat = (statType === 'mat') ? target.mdf : target.def;
    defenseStat = Math.max(1, defenseStat);

    // 1. Power Bonus
    value += a.power;

    // 2. Stat Multiplier
    value *= (attackStat / defenseStat);

    // 3. Element Boost (STAB)
    const actionElement = item.element;
    let attackMult = 1.0;
    if (actionElement) {
        const subjectElements = a.elements || [];
        if (subjectElements.includes(actionElement)) attackMult = 1.25;
    }

    // 4. Target Element Resistance
    const defenseMult = action.calcElementRate(target);

    value = Math.floor(value * attackMult * defenseMult);

    // 5. Critical Hit
    const critChance = a.cri;
    let isCrit = false;
    if (Math.random() < critChance) {
        value = Math.floor(value * (Data.config.baseCritMultiplier || 1.5));
        isCrit = true;
        Log.battle('> Critical Hit!');
    }

    // 6. Guarding
    if (target.isStateAffected('guarding') || (target.status && target.status.includes('guarding'))) {
        value = Math.floor(value / 2);
        Log.battle('> Guarding!');
    }

    value = Math.max(0, value);
    return { value, isCrit };
});

EffectRegistry.register('hp_heal', (action, target, effect) => {
    const a = action._subject;
    const item = action.item();

    // Base Formula
    let value = 0;
    try {
        const b = target;
        value = Math.max(0, eval(effect.formula || '0'));
    } catch (e) {
        console.error('Error evaluating hp_heal:', effect.formula, e);
    }

    // Stats (Heals usually scale with MAT or ATK based on source, defaulting to MAT often, but code used item stat)
    const statType = item.stat || 'atk';
    let attackStat = (statType === 'mat') ? a.mat : a.atk;

    // Scale by user's stat (percentage based usually? Or direct multiplier?)
    // Original code: value *= (attackStat / 100);
    value *= (attackStat / 100);

    value = Math.floor(Math.max(0, value));
    return { value, isCrit: false };
});

EffectRegistry.register('hp_heal_ratio', (action, target, effect) => {
    const ratio = parseFloat(effect.formula);
    const value = Math.floor(target.mhp * ratio);
    return { value, isCrit: false };
});

EffectRegistry.register('revive', (action, target, effect) => {
    const ratio = parseFloat(effect.formula);
    const value = Math.floor(target.mhp * ratio);
    return { value, isCrit: false };
});

EffectRegistry.register('increase_max_hp', (action, target, effect) => {
    const value = parseInt(effect.formula);
    return { value, isCrit: false };
});

EffectRegistry.register('add_status', (action, target, effect) => {
    // Value is irrelevant for status add, but we return 0
    return { value: 0, isCrit: false };
});

EffectRegistry.register('miss', (action, target, effect) => {
    return { value: 0, isCrit: false, isMiss: true };
});
