import { Registry } from './Registry.js';
import { Data } from '../../assets/data/data.js';

/**
 * Registry for Creature definitions.
 * Handles loading, inheritance, and caching of creature data.
 */
export class CreatureRegistry extends Registry {
    constructor() {
        super();
        this._initialized = false;
        this._resolvedCache = new Map();
        // Track the current resolution stack globally to pass it through `get` calls
        // or modify `get` to accept it. But `get` is public.
        // Better: `_resolveInheritance` should handle the recursion directly rather than calling `get` which checks cache.
        // Actually, calling `get` is fine for cache hits, but for the cycle check we need to pass the stack.
        // But `get` doesn't take a stack.

        // Revised approach: `_resolveInheritance` does the heavy lifting.
    }

    /**
     * Loads creature data from the global Data object.
     */
    load() {
        if (this._initialized) return;

        const creatures = Data.creatures || {};
        for (const [id, creature] of Object.entries(creatures)) {
            this.register(id, creature);
        }

        this._initialized = true;
    }

    /**
     * Retrieves a creature definition by ID, resolving inheritance if needed.
     * @param {string} id - The creature ID.
     * @returns {Object} The resolved creature definition.
     */
    get(id) {
        if (!this._initialized) this.load();

        if (this._resolvedCache.has(id)) {
            return this._resolvedCache.get(id);
        }

        const raw = super.get(id);
        if (!raw) return null;

        // Start resolution process
        const resolved = this._resolveInternal(id, raw, new Set());
        this._resolvedCache.set(id, resolved);
        return resolved;
    }

    /**
     * Internal recursive resolution method.
     * @param {string} id - Current ID.
     * @param {Object} data - Current data.
     * @param {Set<string>} stack - Cycle detection stack.
     */
    _resolveInternal(id, data, stack) {
        if (stack.has(id)) {
            console.warn(`Circular inheritance detected for creature '${id}'.`);
            return { ...data };
        }

        if (!data.parent) {
            return { ...data };
        }

        stack.add(id);

        // Fetch parent RAW data first, then resolve it recursively with the SAME stack
        const parentRaw = super.get(data.parent);
        let parentResolved;

        if (!parentRaw) {
             console.warn(`Parent '${data.parent}' not found for creature '${id}'.`);
             parentResolved = {};
        } else {
             // Check cache first for parent?
             // If parent is cached, it's fully resolved and safe.
             if (this._resolvedCache.has(data.parent)) {
                 parentResolved = this._resolvedCache.get(data.parent);
             } else {
                 parentResolved = this._resolveInternal(data.parent, parentRaw, stack);
                 // Cache the parent result too? Yes, save work.
                 this._resolvedCache.set(data.parent, parentResolved);
             }
        }

        stack.delete(id);

        return {
            ...parentResolved,
            ...data,
            id: id // Ensure ID is correct
        };
    }
}
