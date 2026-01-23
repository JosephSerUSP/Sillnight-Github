import { MapGenerator } from './MapGenerator.js';

/**
 * Static Map Generator.
 * Loads a fixed map layout from configuration.
 */
export class StaticGenerator extends MapGenerator {
    /**
     * @param {Object} mapData - The static map data object.
     */
    constructor(mapData) {
        super();
        this.mapData = mapData;
    }

    generate(floor, config = {}) {
        const { width, height, grid, startX, startY } = this.mapData;

        // Static maps don't necessarily have "rooms" in the BSP sense,
        // but we can define the whole area as one "room" for compatibility if needed.
        // Or just leave rooms empty if not used by Game_Map (it uses rooms mainly for start/end placement in BSP).

        // Find endX/endY based on where tile 3 (Stairs) is, or default to center.
        let endX = Math.floor(width / 2);
        let endY = Math.floor(height / 2);

        // Find existing stairs
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y * width + x] === 3) {
                    endX = x;
                    endY = y;
                    break;
                }
            }
        }

        return {
            grid: [...grid], // Clone to avoid mutation if referenced
            rooms: [],
            startX: startX || Math.floor(width / 2),
            startY: startY || Math.floor(height / 2),
            endX,
            endY,
            width,
            height
        };
    }
}
