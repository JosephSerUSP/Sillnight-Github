// src/game/Game_Actor.js

import { Game_Battler } from './Game_Battler.js';
import { Data } from '../assets/data/data.js';

export class Game_Actor extends Game_Battler {
    constructor(actorData) {
        super();
        // Merge actorData properties into this instance
        Object.assign(this, actorData);
        this._hp = this.hp;
    }

    getMaxHp() {
        const def = Data.creatures[this.speciesId];
        let baseMax = Math.round(def.baseHp * (1 + def.hpGrowth * (this.level - 1)));
        if (this.equipmentId) {
            const eq = Data.equipment[this.equipmentId];
            if (eq?.hpBonus) baseMax = Math.round(baseMax * (1 + eq.hpBonus));
        }
        return baseMax;
    }
}
