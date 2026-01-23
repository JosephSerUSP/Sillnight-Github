import { Registry } from './Registry.js';
import { Data } from '../../assets/data/data.js';

/**
 * Registry for Skill definitions.
 * Handles loading, inheritance, and caching of skill data.
 */
export class SkillRegistry extends Registry {
    constructor() {
        super();
        this._initialized = false;
        this._resolvedCache = new Map();
    }

    /**
     * Loads skill data from the global Data object.
     */
    load() {
        if (this._initialized) return;

        const skills = Data.skills || {};
        for (const [id, skill] of Object.entries(skills)) {
            // Ensure ID is set in the object
            this.register(id, { ...skill, id });
        }

        this._initialized = true;
    }

    /**
     * Retrieves a skill definition by ID, resolving inheritance if needed.
     * @param {string} id - The skill ID.
     * @returns {Object} The resolved skill definition.
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
            console.warn(`Circular inheritance detected for skill '${id}'.`);
            return { ...data };
        }

        if (!data.parent) {
            return { ...data };
        }

        stack.add(id);

        const parentRaw = super.get(data.parent);
        let parentResolved;

        if (!parentRaw) {
             console.warn(`Parent '${data.parent}' not found for skill '${id}'.`);
             parentResolved = {};
        } else {
             if (this._resolvedCache.has(data.parent)) {
                 parentResolved = this._resolvedCache.get(data.parent);
             } else {
                 parentResolved = this._resolveInternal(data.parent, parentRaw, stack);
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
