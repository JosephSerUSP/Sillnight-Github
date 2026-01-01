import { Services } from '../ServiceLocator.js';

/**
 * Manages global game switches.
 * Switches are persistent booleans used for event logic (e.g., Boss Defeated).
 */
export class Game_Switches {
    constructor() {
        this._data = {};
    }

    /**
     * clear all switches.
     */
    clear() {
        this._data = {};
    }

    /**
     * Gets the value of a switch.
     * @param {number|string} id - The switch ID.
     * @returns {boolean} The value (default false).
     */
    value(id) {
        return !!this._data[id];
    }

    /**
     * Sets the value of a switch.
     * @param {number|string} id - The switch ID.
     * @param {boolean} value - The new value.
     */
    setValue(id, value) {
        const newValue = !!value;
        if (this._data[id] !== newValue) {
            this._data[id] = newValue;
            // Emit change event for reactive UI
            Services.events.emit('switch:change', { id, value: newValue });
        }
    }
}
