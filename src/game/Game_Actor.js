// Game_Actor.js

import { Game_Battler } from './Game_Battler.js';
import { Data } from '../assets/data/data.js';

export class Game_Actor extends Game_Battler {
    constructor(speciesId, level) {
        super();
        this.speciesId = speciesId;
        this.level = level;
        this._hp = this.getMaxHp();
    }

    name() {
        return Data.creatures[this.speciesId].name;
    }
}
