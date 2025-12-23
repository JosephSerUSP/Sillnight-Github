import { MapGenerator } from './MapGenerator.js';

/**
 * Binary Space Partitioning Generator.
 * Creates a connected room-based layout.
 */
export class BSPGenerator extends MapGenerator {
    /**
     * @param {Object} [config]
     * @param {number} [config.width=30]
     * @param {number} [config.height=30]
     * @param {number} [config.minRoomSize=4]
     */
    constructor(config = {}) {
        super();
        this.width = config.width || 30;
        this.height = config.height || 30;
        this.minRoomSize = config.minRoomSize || 4;
    }

    generate(floor, config = {}) {
        const w = config.width || this.width;
        const h = config.height || this.height;
        const grid = Array(w * h).fill(1); // 1 = Wall

        const leaf = { x: 1, y: 1, w: w - 2, h: h - 2 };
        const rooms = [];
        this.splitSpace(leaf, rooms);

        // Draw rooms
        rooms.forEach(r => {
            for (let y = r.y; y < r.y + r.h; y++) {
                for (let x = r.x; x < r.x + r.w; x++) {
                    grid[y * w + x] = 0; // 0 = Floor
                }
            }
        });

        // Connect rooms (Simple corridor logic)
        for (let i = 0; i < rooms.length - 1; i++) {
            const r1 = rooms[i];
            const r2 = rooms[i + 1];
            const c1 = { x: Math.floor(r1.x + r1.w / 2), y: Math.floor(r1.y + r1.h / 2) };
            const c2 = { x: Math.floor(r2.x + r2.w / 2), y: Math.floor(r2.y + r2.h / 2) };
            this.carveCorridor(grid, w, c1.x, c1.y, c2.x, c2.y);
        }

        // Determine Start/End
        const startRoom = rooms[0];
        const endRoom = rooms[rooms.length - 1];

        const startX = Math.floor(startRoom.x + startRoom.w / 2);
        const startY = Math.floor(startRoom.y + startRoom.h / 2);

        // Find valid end spot
        let endX = Math.floor(endRoom.x + endRoom.w / 2);
        let endY = Math.floor(endRoom.y + endRoom.h / 2);

        // Ensure end isn't wall (paranoia check)
        if (grid[endY * w + endX] === 1) {
            // fallback search
             for(let y=endRoom.y; y<endRoom.y+endRoom.h; y++){
                 for(let x=endRoom.x; x<endRoom.x+endRoom.w; x++){
                     if(grid[y*w+x]===0) { endX=x; endY=y; break; }
                 }
             }
        }

        return { grid, rooms, startX, startY, endX, endY, width: w, height: h };
    }

    splitSpace(rect, rooms) {
        // Stop condition
        if (rect.w < this.minRoomSize * 2.5 || rect.h < this.minRoomSize * 2.5) {
            // Add room with padding
            const rW = Math.floor(Math.random() * (rect.w - 2)) + 2; // min size 2
            const rH = Math.floor(Math.random() * (rect.h - 2)) + 2;
            const rX = rect.x + Math.floor(Math.random() * (rect.w - rW));
            const rY = rect.y + Math.floor(Math.random() * (rect.h - rH));
            // Validate size
            if (rW >= 2 && rH >= 2) {
                rooms.push({ x: rX, y: rY, w: rW, h: rH });
            }
            return;
        }

        const splitH = Math.random() > 0.5;
        if (splitH) {
            const split = Math.floor(Math.random() * (rect.h - this.minRoomSize * 2)) + this.minRoomSize;
            this.splitSpace({ x: rect.x, y: rect.y, w: rect.w, h: split }, rooms);
            this.splitSpace({ x: rect.x, y: rect.y + split, w: rect.w, h: rect.h - split }, rooms);
        } else {
            const split = Math.floor(Math.random() * (rect.w - this.minRoomSize * 2)) + this.minRoomSize;
            this.splitSpace({ x: rect.x, y: rect.y, w: split, h: rect.h }, rooms);
            this.splitSpace({ x: rect.x + split, y: rect.y, w: rect.w - split, h: rect.h }, rooms);
        }
    }

    carveCorridor(grid, w, x1, y1, x2, y2) {
        let x = x1;
        let y = y1;
        while (x !== x2) {
            x += (x < x2 ? 1 : -1);
            grid[y * w + x] = 0;
        }
        while (y !== y2) {
            y += (y < y2 ? 1 : -1);
            grid[y * w + x] = 0;
        }
    }
}
