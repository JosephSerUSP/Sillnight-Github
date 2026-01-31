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
        this._data[id] = !!value;
        Services.events.emit('switch:change', { id, value: this._data[id] });
    }
}
