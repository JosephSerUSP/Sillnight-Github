import { Registry } from './Registry.js';
import { Log } from '../log.js';

/**
 * Registry for handling trait logic.
 * Manages the definition and execution of traits.
 */
export class TraitRegistry extends Registry {
    constructor() {
        super();
    }

    /**
     * Triggers a trait event on a subject or list of subjects.
     * @param {string} triggerName - The name of the event (e.g., 'onTurnStart').
     * @param {Object|Array<Object>} subject - The unit(s) triggering the event.
     * @param {...any} args - Additional arguments.
     */
    trigger(triggerName, subject, ...args) {
        if (!subject) return;
        const subjects = Array.isArray(subject) ? subject : [subject];

        subjects.forEach(unit => {
            // Check traits from registry aggregation
            const traits = this.traits(unit);
            // Future: filter traits by triggerName and execute
        });
    }

    /**
     * Calculates the value of a parameter for a battler.
     * @param {Object} battler
     * @param {number} paramId
     * @returns {number}
     */
    getParamValue(battler, paramId) {
        const base = battler.paramBase(paramId);
        // Additive traits (PARAM_PLUS)
        const traitPlus = this.traitsSum(battler, 'PARAM_PLUS', paramId);
        const plus = battler.paramPlus(paramId) + traitPlus; // paramPlus() returns _paramPlus[id] usually

        // Multiplicative traits (PARAM_RATE)
        const rate = this.traitsPi(battler, 'PARAM_RATE', paramId);

        const buffRate = battler.paramBuffRate(paramId);

        return Math.round(Math.max(0, (base + plus) * rate * buffRate));
    }

    /**
     * Aggregates all traits from a battler.
     * @param {Object} battler
     * @returns {Array<Object>}
     */
    traits(battler) {
        if (typeof battler.traitObjects === 'function') {
            return battler.traitObjects().reduce((r, obj) => {
                return r.concat(obj.traits || []);
            }, []);
        }
        return [];
    }

    /**
     * Filters traits by code.
     */
    traitsSet(battler, code) {
        return this.traits(battler).filter(t => t.code === code);
    }

    /**
     * Calculates the sum of values for traits with a specific code and dataId.
     */
    traitsSum(battler, code, id) {
        return this.traitsSet(battler, code)
            .filter(t => t.dataId === id)
            .reduce((r, trait) => r + (trait.value || 0), 0);
    }

    /**
     * Calculates the product of values for traits with a specific code and dataId.
     */
    traitsPi(battler, code, id) {
        return this.traitsSet(battler, code)
            .filter(t => t.dataId === id)
            .reduce((r, trait) => r * (trait.value !== undefined ? trait.value : 1), 1);
    }
}
