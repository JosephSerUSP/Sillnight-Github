/**
 * Abstract base class for map generators.
 * Strategies for generating dungeon floors.
 */
export class MapGenerator {
    constructor() {
        if (this.constructor === MapGenerator) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    /**
     * Generates a map layout.
     * @param {number} floor - The current floor number.
     * @param {Object} config - Configuration options (width, height, roomCount, etc).
     * @returns {Object} The generated map data { grid, rooms, startX, startY, endX, endY }.
     */
    generate(floor, config) {
        throw new Error("Method 'generate()' must be implemented.");
    }
}
