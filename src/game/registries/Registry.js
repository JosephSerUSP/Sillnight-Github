/**
 * Base class for data registries.
 * Handles loading, storing, and retrieving game data objects.
 */
export class Registry {
    constructor() {
        this.data = new Map();
    }

    /**
     * Registers a data item.
     * @param {string} id
     * @param {Object} item
     */
    register(id, item) {
        this.data.set(id, item);
    }

    /**
     * Retrieves an item by ID.
     * @param {string} id
     * @returns {Object|null}
     */
    get(id) {
        return this.data.get(id) || null;
    }

    /**
     * Returns all registered items.
     * @returns {Array<Object>}
     */
    getAll() {
        return Array.from(this.data.values());
    }

    /**
     * Returns the number of registered items.
     * @returns {number}
     */
    count() {
        return this.data.size;
    }
}
