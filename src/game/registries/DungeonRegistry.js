import { Registry } from './Registry.js';
import { Data } from '../../assets/data/data.js';

export class DungeonRegistry extends Registry {
    constructor() {
        super();
    }

    async load() {
        // In the future, this would load JSON files.
        // For now, it wraps the legacy Data.dungeons object.
        const dungeons = Data.dungeons;

        // We handle a specific structure where Data.dungeons.default exists.
        // Or it might be a flat list depending on how Dungeons is structured.
        // Let's assume Data.dungeons is an object with keys like 'default', 'volcano', etc.

        for (const [key, def] of Object.entries(dungeons)) {
            // We might want to ensure 'id' is set on the definition
            const dungeonData = { ...def, id: key };
            this.register(key, dungeonData);
        }

        console.log(`[DungeonRegistry] Loaded ${this.count()} dungeons.`);
    }
}
