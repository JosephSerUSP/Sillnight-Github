/**
 * Service Locator for managing game dependencies.
 * Facilitates dependency injection by providing a central registry for services.
 */
export class ServiceLocator {
    constructor() {
        this._services = new Map();
    }

    /**
     * Registers a service.
     * @param {string} key - The identifier for the service (e.g., 'party', 'map').
     * @param {Object} service - The service instance.
     */
    register(key, service) {
        if (this._services.has(key)) {
            console.warn(`[ServiceLocator] Overwriting existing service: ${key}`);
        }
        this._services.set(key, service);
    }

    /**
     * Retrieves a service.
     * @param {string} key - The identifier for the service.
     * @returns {Object} The service instance.
     * @throws {Error} If the service is not found.
     */
    get(key) {
        const service = this._services.get(key);
        if (!service) {
            throw new Error(`[ServiceLocator] Service not found: ${key}`);
        }
        return service;
    }

    /**
     * Checks if a service is registered.
     * @param {string} key - The identifier for the service.
     * @returns {boolean}
     */
    has(key) {
        return this._services.has(key);
    }

    /**
     * Clears all services.
     */
    clear() {
        this._services.clear();
    }
}

// Export a singleton instance for global access during transition.
export const Services = new ServiceLocator();
