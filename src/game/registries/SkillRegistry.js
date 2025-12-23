import { Registry } from './Registry.js';
import { Data } from '../../assets/data/data.js';

/**
 * Registry for Skill definitions.
 */
export class SkillRegistry extends Registry {
    constructor() {
        super();
        this._initialized = false;
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
     * Retrieves a skill definition by ID.
     * @param {string} id - The skill ID.
     * @returns {Object} The skill definition.
     */
    get(id) {
        if (!this._initialized) this.load();
        return super.get(id);
    }
}
