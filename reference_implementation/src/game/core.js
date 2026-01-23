// Core utilities for the Stillnight client (similar to rmmz_core.js).
// Use this module for shared helpers (math, RNG, DOM guards) that multiple systems rely on.
// To add new helpers, export plain functions here rather than duplicating logic elsewhere.

/**
 * Random Number Generator utilities.
 * @namespace RNG
 */
export const RNG = {
    /**
     * Generates a random integer between min and max (inclusive).
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @returns {number} A random integer between min and max.
     */
    randInt(min, max) {
        const low = Math.ceil(min);
        const high = Math.floor(max);
        return Math.floor(Math.random() * (high - low + 1)) + low;
    },

    /**
     * Selects a random element from an array.
     * @param {Array<any>} list - The array to select from.
     * @returns {any|null} A random element from the list, or null if the list is empty or invalid.
     */
    choice(list) {
        if (!Array.isArray(list) || list.length === 0) return null;
        return list[Math.floor(Math.random() * list.length)];
    }
};

/**
 * Clamps a value between a minimum and maximum.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value.
 */
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Resolves a potentially relative asset path to a full path starting with 'src/'.
 * @param {string} assetPath - The asset path to resolve.
 * @returns {string|null} The resolved asset path, or null if the input is empty.
 */
export function resolveAssetPath(assetPath) {
    if (!assetPath) return null;
    const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
    return normalizedPath.startsWith('src/') ? normalizedPath : `src/${normalizedPath}`;
}

/**
 * A simple implementation of the Event Emitter pattern.
 * Allows subscribing to and emitting named events.
 */
export class SimpleEventEmitter {
    constructor() {
        /**
         * @type {Map<string, Set<Function>>}
         * @private
         */
        this.listeners = new Map();
    }

    /**
     * Registers a handler for a specific event.
     * @param {string} event - The name of the event.
     * @param {Function} handler - The callback function to execute when the event is emitted.
     */
    on(event, handler) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(handler);
    }

    /**
     * Removes a handler for a specific event.
     * @param {string} event - The name of the event.
     * @param {Function} handler - The callback function to remove.
     */
    off(event, handler) {
        const set = this.listeners.get(event);
        if (set) set.delete(handler);
    }

    /**
     * Emits an event, invoking all registered handlers with the provided payload.
     * @param {string} event - The name of the event to emit.
     * @param {any} payload - The data to pass to the event handlers.
     */
    emit(event, payload) {
        const set = this.listeners.get(event);
        if (!set) return;
        set.forEach(cb => cb(payload));
    }
}
