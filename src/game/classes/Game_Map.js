import { Services } from '../ServiceLocator.js';
import { Game_Event } from './Game_Event.js';
import * as Systems from '../systems.js';
import { BSPGenerator } from '../generators/BSPGenerator.js';
import { StaticGenerator } from '../generators/StaticGenerator.js';
import { Maps } from '../../assets/data/maps.js';

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
        /** @type {Set<string>} Active flags for the current map. */
        this._flags = new Set();
        /** @type {Object} Visual configuration for the current map. */
        this._visuals = null;
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
    /** @returns {Object} Visual configuration. */
    get visuals() { return this._visuals; }

    /**
     * Sets up the map for a specific floor.
     * Generates a new random layout.
     * @param {number} [floor=0] - The floor number.
     */
    setup(floor = 0) {
        this._floor = floor;
        this._events.clear();
        this.generateFloor();
    }

    /**
     * Generates a new random floor layout based on dungeon configuration.
     * Populates the map with walls, empty space, enemies, treasure, etc.
     */
    generateFloor() {
        this._flags.clear();
        if (this._floor === 0) {
            this.generateHub();
            return;
        }

        // Retrieve dungeon data from Registry
        const dungeonRegistry = Services.get('DungeonRegistry');
        const dungeon = dungeonRegistry.get('default');

        if (!dungeon) {
            console.error("Default dungeon not found in registry.");
            return;
        }

        const mapCfg = dungeon.map;

        // Load visuals
        this._visuals = dungeon.visual;

        // Instantiate generator
        const generator = new BSPGenerator({
            width: mapCfg.width,
            height: mapCfg.height,
            minRoomSize: 5
        });

        // Generate Grid
        const result = generator.generate(this._floor);
        const { grid, rooms, startX, startY, endX, endY, width, height } = result;

        this._width = width;
        this._height = height;
        this._playerPos = { x: startX, y: startY };

        // Convert 1D grid to 2D
        const map = [];
        for (let y = 0; y < height; y++) {
            map.push(grid.slice(y * width, (y + 1) * width));
        }

        // Place Stairs at End Room center
        if (map[endY][endX] === 0) {
            map[endY][endX] = 3; // Stairs
        } else {
            console.warn("End position is a wall, force carving");
            map[endY][endX] = 3;
        }

        // Collect Empty Tiles for events
        const emptyTiles = [];
        for (let ry = 0; ry < height; ry++) {
            for (let rx = 0; rx < width; rx++) {
                // Ensure not start or end
                if (map[ry][rx] === 0 && (rx !== startX || ry !== startY) && (rx !== endX || ry !== endY)) {
                    emptyTiles.push({ x: rx, y: ry });
                }
            }
        }

        const place = (type, count) => {
            for (let i = 0; i < count; i++) {
                if (emptyTiles.length === 0) break;
                const idx = Math.floor(Math.random() * emptyTiles.length);
                const tile = emptyTiles.splice(idx, 1)[0];

                if (type === 'STAIRS') {
                    // Fallback if main stairs fail, or extra stairs?
                    // Currently main stairs are set by generator end room logic.
                } else {
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
        place('TREASURE', getCount(mapCfg.tileCounts.treasure));
        place('SHOP', getCount(mapCfg.tileCounts.shops));
        place('RECRUIT', getCount(mapCfg.tileCounts.recruits));
        place('SHRINE', getCount(mapCfg.tileCounts.shrines));
        place('TRAP', getCount(mapCfg.tileCounts.traps));

        this._data = map;
        this._visited = Array(height).fill().map(() => Array(width).fill(false));
    }

    /**
     * Generates the Hub using StaticGenerator.
     */
    generateHub() {
        // Load flags
        if (Maps.hub.flags) {
            Maps.hub.flags.forEach(f => this._flags.add(f));
        }

        // Load visuals
        this._visuals = Maps.hub.visual;

        const generator = new StaticGenerator(Maps.hub);
        const result = generator.generate(0);
        const { grid, startX, startY, width, height } = result;

        this._width = width;
        this._height = height;
        this._playerPos = { x: startX, y: startY };

        const map = [];
        for (let y = 0; y < height; y++) {
            map.push(grid.slice(y * width, (y + 1) * width));
        }

        this._data = map;
        // In the Hub, everything is visible
        this._visited = Array(height).fill().map(() => Array(width).fill(true));

        // Add static events from map data
        if (Maps.hub.events) {
            Maps.hub.events.forEach(evt => {
                const gameEvent = new Game_Event(evt.x, evt.y, {
                    type: evt.type,
                    trigger: evt.trigger || 'TOUCH',
                    visual: evt.visual,
                    commands: evt.commands || (evt.text ? [{ code: 'LOG', text: evt.text }] : [])
                });
                this.addEvent(gameEvent);
            });
        }
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
                const eventRegistry = Services.get('EventDataRegistry');
                const treasure = eventRegistry.get('treasure');

                let amt = 10; // Default fallback
                if (treasure) {
                    amt = treasure.gold.base
                        + Math.floor(Math.random() * treasure.gold.random)
                        + treasure.gold.perFloor * this._floor;
                }

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
                const offer = Systems.Event.generateRecruit(this._floor);
                data = {
                    type: 'RECRUIT',
                    trigger: 'TOUCH',
                    visual: { type: 'RECRUIT' },
                    commands: [{ code: 'RECRUIT', offer: offer }]
                    // ERASE_EVENT is removed so the event persists if not recruited
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

    /**
     * Checks if a flag is active on the current map.
     * @param {string} flag
     * @returns {boolean}
     */
    hasFlag(flag) {
        return this._flags.has(flag);
    }
}
