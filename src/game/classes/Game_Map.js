import { Data } from '../../assets/data/data.js';

/**
 * The class for the map.
 */
export class Game_Map {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        this._map = [];
        this._visited = [];
        this._playerPos = { x: 0, y: 0 };
    }

    get map() {
        return this._map;
    }

    get visited() {
        return this._visited;
    }

    get playerPos() {
        return this._playerPos;
    }

    generateFloor(floor) {
        const dungeon = Data.dungeons.default;
        const mapCfg = dungeon.map;

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

        const place = (code, count) => {
            for (let i = 0; i < count; i++) {
                if (emptyTiles.length === 0) break;
                const idx = Math.floor(Math.random() * emptyTiles.length);
                const tile = emptyTiles.splice(idx, 1)[0];
                map[tile.y][tile.x] = code;
            }
        };

        const getCount = (def) => {
            if (typeof def === 'number') return def;
            const { base = 0, perFloor = 0, min = 0, max = Infinity, round = 'round' } = def;
            const count = base + perFloor * floor;
            const rounded = Math[round](count);
            return Math.max(min, Math.min(max, rounded));
        };
        place(2, getCount(mapCfg.tileCounts.enemies));
        place(3, getCount(mapCfg.tileCounts.stairs));
        place(4, getCount(mapCfg.tileCounts.treasure));
        place(5, getCount(mapCfg.tileCounts.shops));
        place(6, getCount(mapCfg.tileCounts.recruits));
        place(7, getCount(mapCfg.tileCounts.shrines));
        place(8, getCount(mapCfg.tileCounts.traps));

        this._map = map;
        this._visited = Array(mapCfg.height).fill().map(() => Array(mapCfg.width).fill(false));
    }

    tileAt(x, y) {
        if (!this._map[y] || this._map[y][x] === undefined) return 1;
        return this._map[y][x];
    }
}
