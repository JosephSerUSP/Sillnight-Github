// src/game/Game_Battler.js

import { Game_BattlerBase } from './Game_BattlerBase.js';
import { Data } from '../assets/data/data.js';

export class Game_Battler extends Game_BattlerBase {
    constructor() {
        super();
    }

    getMaxHp() {
        // Default implementation, can be overridden
        return 1;
    }

    applyHealing(amount) {
        this.changeHp(amount);
        if (this.hp() > this.getMaxHp()) {
            this._hp = this.getMaxHp();
        }
    }
}
