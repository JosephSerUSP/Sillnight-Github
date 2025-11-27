// Game_Troop.js

import { Game_Enemy } from './Game_Enemy.js';

export class Game_Troop {
    constructor() {
        this._enemies = [];
    }

    members() {
        return this._enemies;
    }

    setup(enemyIds) {
        this._enemies = enemyIds.map((id, index) => {
            const enemy = new Game_Enemy(id, 1); // Placeholder level
            enemy.slotIndex = index;
            return enemy;
        });
    }
}
