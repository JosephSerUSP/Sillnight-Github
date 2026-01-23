import { Registry } from './Registry.js';
import { Data } from '../../assets/data/data.js';

/**
 * Registry for Item definitions.
 */
export class ItemRegistry extends Registry {
    constructor() {
        super();
        this._initialized = false;
    }

    /**
     * Loads item data from the global Data object.
     */
    load() {
        if (this._initialized) return;

        const items = Data.items || {};
        for (const [id, item] of Object.entries(items)) {
            // Ensure ID is set in the object
            this.register(id, { ...item, id });
        }

        this._initialized = true;
    }

    /**
     * Retrieves an item definition by ID.
     * @param {string} id - The item ID.
     * @returns {Object} The item definition.
     */
    get(id) {
        if (!this._initialized) this.load();
        return super.get(id);
    }
}
