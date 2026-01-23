import { Registry } from './Registry.js';
import { Data } from '../../assets/data/data.js';

/**
 * Registry for generic event data (like treasure amounts, trap damage config).
 * Note: This does NOT store active map events (which are in Game_Map).
 * This stores the *templates* or *configuration* for events.
 */
export class EventDataRegistry extends Registry {
    constructor() {
        super();
    }

    async load() {
        const events = Data.events || {};

        for (const [key, def] of Object.entries(events)) {
             this.register(key, { ...def, id: key });
        }

        console.log(`[EventDataRegistry] Loaded ${this.count()} event configs.`);
    }
}
