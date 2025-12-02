import { Data } from '../../assets/data/data.js';
import { Game_Event } from './Game_Event.js';

/**
 * Manages the map state, including grid data, player position, and visited tiles.
 */
export class Game_Map {
    constructor() {
        /** @type {number} */
        this._mapId = 0;
        /** @type {number} */
        this._width = 0;
        /** @type {number} */
        this._height = 0;
        /** @type {Array<Array<number>>} The map grid data. */
        this._data = [];
        /** @type {Array<Array<boolean>>} The visited state of tiles. */
        this._visited = [];
        /** @type {Object} The player's current coordinate {x, y}. */
        this._playerPos = { x: 0, y: 0 };
        /** @type {number} The current dungeon floor number. */
        this._floor = 1;
        /** @type {Map<string, Game_Event>} Map of active events keyed by "x,y". */
        this._events = new Map();
    }

    /** @returns {number} The map width. */
    get width() { return this._width; }
    /** @returns {number} The map height. */
    get height() { return this._height; }
    /** @returns {Object} The player position {x, y}. */
    get playerPos() { return this._playerPos; }
    /** @returns {number} The current floor. */
    get floor() { return this._floor; }
    /** @param {number} v - The new floor number. */
    set floor(v) { this._floor = v; }
    /** @returns {Array<Game_Event>} List of all active events. */
    get events() { return Array.from(this._events.values()); }

    /**
     * Sets up the map for a specific floor.
     * Generates a new random layout.
     * @param {number} [floor=1] - The floor number.
     */
    setup(floor = 1) {
        this._floor = floor;
        this._events.clear();
        this.generateFloor();
    }

    /**
     * Generates a new random floor layout based on dungeon configuration.
     * Populates the map with walls, empty space, enemies, treasure, etc.
     */
    generateFloor() {
        // Logic moved from Systems.Map.generateFloor
        // We need to access Data.dungeons
        const dungeon = Data.dungeons.default;
        const mapCfg = dungeon.map;

        this._width = mapCfg.width;
        this._height = mapCfg.height;

        const map = Array(mapCfg.height).fill().map(() => Array(mapCfg.width).fill(1));
        let x = Math.floor(mapCfg.width / 2);
        let y = Math.floor(mapCfg.height / 2);
        this._playerPos = { x, y };

        for (let i = 0; i < mapCfg.carveSteps; i++) {
            map[y][x] = 0;
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0 && y > 1) y--;
            else if (dir === 1 && y < mapCfg.height - 2) y++;
            else if (dir === 2 && x > 1) x--;
            else if (dir === 3 && x < mapCfg.width - 2) x++;
        }

        const emptyTiles = [];
        for (let ry = 0; ry < mapCfg.height; ry++) {
            for (let rx = 0; rx < mapCfg.width; rx++) {
                if (map[ry][rx] === 0 && (rx !== this._playerPos.x || ry !== this._playerPos.y)) {
                    emptyTiles.push({ x: rx, y: ry });
                }
            }
        }

        const place = (type, count) => {
            for (let i = 0; i < count; i++) {
                if (emptyTiles.length === 0) break;
                const idx = Math.floor(Math.random() * emptyTiles.length);
                const tile = emptyTiles.splice(idx, 1)[0];

                // Static tiles handled by integer grid
                if (type === 'STAIRS') {
                    map[tile.y][tile.x] = 3;
                }
                // Dynamic entities handled by Game_Event
                else {
                    this.createEvent(type, tile.x, tile.y);
                }
            }
        };

        const getCount = (def) => {
            if (typeof def === 'number') return def;
            const { base = 0, perFloor = 0, min = 0, max = Infinity, round = 'round' } = def;
            const count = base + perFloor * this._floor;
            const rounded = Math[round](count);
            return Math.max(min, Math.min(max, rounded));
        };

        place('ENEMY', getCount(mapCfg.tileCounts.enemies));
        place('STAIRS', getCount(mapCfg.tileCounts.stairs));
        place('TREASURE', getCount(mapCfg.tileCounts.treasure));
        place('SHOP', getCount(mapCfg.tileCounts.shops));
        place('RECRUIT', getCount(mapCfg.tileCounts.recruits));
        place('SHRINE', getCount(mapCfg.tileCounts.shrines));
        place('TRAP', getCount(mapCfg.tileCounts.traps));

        this._data = map;
        this._visited = Array(mapCfg.height).fill().map(() => Array(mapCfg.width).fill(false));
    }

    /**
     * Creates an event of the specified type.
     * @param {string} type
     * @param {number} x
     * @param {number} y
     */
    createEvent(type, x, y) {
        let data = {};
        switch (type) {
            case 'ENEMY':
                data = {
                    type: 'ENEMY',
                    trigger: 'TOUCH',
                    visual: { type: 'ENEMY' },
                    commands: [{ code: 'BATTLE' }, { code: 'ERASE_EVENT' }]
                };
                break;
            case 'TREASURE':
                const treasure = Data.events.treasure;
                const amt = treasure.gold.base
                    + Math.floor(Math.random() * treasure.gold.random)
                    + treasure.gold.perFloor * this._floor;
                data = {
                    type: 'TREASURE',
                    trigger: 'TOUCH',
                    visual: { type: 'TREASURE' },
                    commands: [
                        { code: 'GIVE_GOLD', amount: amt },
                        { code: 'ERASE_EVENT' }
                    ]
                };
                break;
            case 'SHOP':
                data = {
                    type: 'SHOP',
                    trigger: 'ACTION', // Press to interact
                    visual: { type: 'SHOP' },
                    commands: [{ code: 'SHOP' }, { code: 'ERASE_EVENT' }]
                };
                break;
            case 'RECRUIT':
                data = {
                    type: 'RECRUIT',
                    trigger: 'TOUCH',
                    visual: { type: 'RECRUIT' },
                    commands: [{ code: 'RECRUIT' }, { code: 'ERASE_EVENT' }]
                };
                break;
            case 'SHRINE':
                data = {
                    type: 'SHRINE',
                    trigger: 'TOUCH',
                    visual: { type: 'SHRINE' },
                    commands: [{ code: 'SHRINE' }, { code: 'ERASE_EVENT' }]
                };
                break;
            case 'TRAP':
                data = {
                    type: 'TRAP',
                    trigger: 'TOUCH',
                    visual: { type: 'TRAP' }, // Invisible or trap visual
                    commands: [{ code: 'TRAP' }, { code: 'ERASE_EVENT' }]
                };
                break;
        }

        if (data.type) {
            const event = new Game_Event(x, y, data);
            this.addEvent(event);
        }
    }

    /**
     * Gets the tile code at the specified coordinates.
     * @param {number} x - The X coordinate.
     * @param {number} y - The Y coordinate.
     * @returns {number} The tile code (1 for wall, 0 for empty, etc.).
     */
    tileAt(x, y) {
        if (y < 0 || y >= this._height || x < 0 || x >= this._width) return 1;
        return this._data[y][x];
    }

    /**
     * Sets the tile code at the specified coordinates.
     * @param {number} x - The X coordinate.
     * @param {number} y - The Y coordinate.
     * @param {number} code - The new tile code.
     */
    setTile(x, y, code) {
         if (y >= 0 && y < this._height && x >= 0 && x < this._width) {
             this._data[y][x] = code;
         }
    }

    /**
     * Checks if a tile has been visited.
     * @param {number} x - The X coordinate.
     * @param {number} y - The Y coordinate.
     * @returns {boolean} True if visited.
     */
    isVisited(x, y) {
        if (y < 0 || y >= this._height || x < 0 || x >= this._width) return false;
        return this._visited[y][x];
    }

    /**
     * Sets the visited status of a tile.
     * @param {number} x - The X coordinate.
     * @param {number} y - The Y coordinate.
     * @param {boolean} [visited=true] - The new status.
     */
    setVisited(x, y, visited = true) {
        if (y >= 0 && y < this._height && x >= 0 && x < this._width) {
            this._visited[y][x] = visited;
        }
    }

    /**
     * Updates visibility around a center point.
     * @param {number} cx - Center X.
     * @param {number} cy - Center Y.
     * @param {number} radius - View radius.
     */
    updateVisibility(cx, cy, radius) {
        const r2 = radius * radius;
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                if (x >= 0 && x < this._width && y >= 0 && y < this._height) {
                    const dx = x - cx;
                    const dy = y - cy;
                    if (dx * dx + dy * dy <= r2) {
                        this.setVisited(x, y, true);
                    }
                }
            }
        }
    }

    /**
     * Adds an event to the map.
     * @param {Game_Event} event
     */
    addEvent(event) {
        if (!event) return;
        const key = `${event.x},${event.y}`;
        this._events.set(key, event);
    }

    /**
     * Removes an event from the map.
     * @param {Game_Event} event
     */
    removeEvent(event) {
        if (!event) return;
        const key = `${event.x},${event.y}`;
        // Ensure we are removing the correct event instance
        if (this._events.get(key) === event) {
            this._events.delete(key);
        }
    }

    /**
     * Moves an event to a new location, updating the spatial index.
     * @param {Game_Event} event
     * @param {number} x
     * @param {number} y
     */
    moveEvent(event, x, y) {
        if (!event) return;

        // Remove from old location
        this.removeEvent(event);

        // Update position
        event.setPosition(x, y);

        // Add to new location
        this.addEvent(event);
    }

    /**
     * Gets the event at specific coordinates.
     * @param {number} x
     * @param {number} y
     * @returns {Game_Event|null}
     */
    eventAt(x, y) {
        return this._events.get(`${x},${y}`) || null;
    }
}
