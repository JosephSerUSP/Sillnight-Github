import { EventBus } from './utils/EventBus.js';

/**
 * Central registry for game services and systems.
 * Facilitates Dependency Injection and decoupling.
 */
export class ServiceLocator {
    constructor() {
        /** @type {EventBus} */
        this.events = new EventBus();
        this.services = new Map();
    }

    /**
     * Registers a service.
     * @param {string} name
     * @param {Object} service
     */
    register(name, service) {
        this.services.set(name, service);
    }

    /**
     * Retrieves a service.
     * @param {string} name
     * @returns {Object}
     */
    get(name) {
        if (!this.services.has(name)) {
            console.warn(`Service "${name}" not found in ServiceLocator.`);
            return null;
        }
        return this.services.get(name);
    }
}

// Global instance for easy access, though passing it down is preferred where possible.
export const Services = new ServiceLocator();
