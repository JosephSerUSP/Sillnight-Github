import { Services } from '../ServiceLocator.js';

/**
 * Manages global game variables.
 * Variables are persistent numbers used for event logic (e.g., Quest Step ID).
 */
export class Game_Variables {
    constructor() {
        this._data = {};
    }

    /**
     * clear all variables.
     */
    clear() {
        this._data = {};
    }

    /**
     * Gets the value of a variable.
     * @param {number|string} id - The variable ID.
     * @returns {number} The value (default 0).
     */
    value(id) {
        return this._data[id] || 0;
    }

    /**
     * Sets the value of a variable.
     * @param {number|string} id - The variable ID.
     * @param {number} value - The new value.
     */
    setValue(id, value) {
        let newValue;
        if (typeof value === 'number') {
            newValue = Math.floor(value);
        } else {
             // Try parsing, fallback to 0
             const num = parseInt(value);
             newValue = isNaN(num) ? 0 : num;
        }

        // Only emit if changed (optional optimization, but good practice)
        if (this._data[id] !== newValue) {
            this._data[id] = newValue;
            // Emit change event for reactive UI
            Services.events.emit('variable:change', { id, value: newValue });
        }
    }
}
