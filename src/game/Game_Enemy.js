// src/game/Game_Enemy.js

import { Game_Battler } from './Game_Battler.js';
import { Data } from '../assets/data/data.js';

export class Game_Enemy extends Game_Battler {
    constructor(enemyData) {
        super();
        // Merge enemyData properties into this instance
        Object.assign(this, enemyData);
        this._hp = this.hp;
    }

    getMaxHp() {
        // A simple max HP calculation for enemies for now
        const def = Data.creatures[this.speciesId];
        return Math.round(def.baseHp * (1 + def.hpGrowth * (this.level - 1)));
    }
}
