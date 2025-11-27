// Game_Enemy.js

import { Game_Battler } from './Game_Battler.js';

export class Game_Enemy extends Game_Battler {
    constructor(speciesId, level) {
        super();
        this.speciesId = speciesId;
        this.level = level;
        this._hp = this.getMaxHp();
    }
}
