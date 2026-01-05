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
        if (typeof value === 'number') {
            this._data[id] = Math.floor(value);
        } else {
             // Try parsing, fallback to 0
             const num = parseInt(value);
             this._data[id] = isNaN(num) ? 0 : num;
        }
        Services.events.emit('variable:change', { id, value: this._data[id] });
    }
}
