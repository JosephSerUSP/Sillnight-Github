import { Registry } from './Registry.js';
import { Data } from '../../assets/data/data.js';

export class DungeonRegistry extends Registry {
    constructor() {
        super();
    }

    async load() {
        // In the future, this would load JSON files.
        // For now, it wraps the legacy Data.dungeons object.
        const dungeons = Data.dungeons || {};

        for (const [key, def] of Object.entries(dungeons)) {
            // Ensure ID is set on the definition
            const dungeonData = { ...def, id: key };
            this.register(key, dungeonData);
        }

        console.log(`[DungeonRegistry] Loaded ${this.count()} dungeons.`);
    }
}
