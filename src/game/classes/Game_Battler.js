import { Game_BattlerBase } from './Game_BattlerBase.js';
import { Data } from '../../assets/data/data.js';

export class Game_Battler extends Game_BattlerBase {
    constructor() {
        super();
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

    applyHealing(amount) {
        this.hp = Math.min(this.getMaxHp(), this.hp + amount);
    }
}
