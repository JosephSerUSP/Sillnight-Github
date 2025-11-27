import { Game_Battler } from './Game_Battler.js';
import { Data } from '../../assets/data/data.js';

export class Game_Enemy extends Game_Battler {
    constructor(speciesId, x, y, levelMultiplier = 1) {
        super();
        this._speciesId = speciesId;
        this._levelMultiplier = levelMultiplier;
        this._uid = `e_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        this._level = 1; // Enemies nominally level 1, but stats scaled by multiplier

        this.setup(speciesId);
    }

    get uid() { return this._uid; }
    get speciesId() { return this._speciesId; }

    setup(speciesId) {
        const def = Data.creatures[speciesId];
        this._name = def.name;
        this.recoverAll(); // Sets HP/MP to max
    }

    recoverAll() {
        this._hp = this.mhp;
        this._mp = this.mmp;
        this._states = [];
    }

    get name() { return this._name; }

    get sprite() { return Data.creatures[this._speciesId].sprite; }
    get spriteAsset() { return Data.creatures[this._speciesId].spriteAsset; }

    paramBase(paramId) {
        const def = Data.creatures[this._speciesId];
        if (paramId === 0) { // mhp
             return Math.floor(def.baseHp * this._levelMultiplier);
        }
        // Can add other stat scaling here if needed
        return 0;
    }

    // Compatibility
    get level() { return this._level; }
    get acts() { return Data.creatures[this._speciesId].acts; }
    get temperament() { return Data.creatures[this._speciesId].temperament; }
    get elements() { return Data.creatures[this._speciesId].elements || []; }
}
