import { Game_Battler } from './Game_Battler.js';
import { Data } from '../../assets/data/data.js';

/**
 * The class for enemies.
 */
export class Game_Enemy extends Game_Battler {
    constructor(speciesId, level, slotIndex = -1) {
        super();
        this.setup(speciesId, level, slotIndex);
    }

    setup(speciesId, level, slotIndex) {
        const def = Data.creatures[speciesId];
        this.uid = `e_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        this.speciesId = def.id;
        this.name = def.name;
        this.sprite = def.sprite;
        this.spriteAsset = def.spriteAsset;
        this.level = level;
        this.temperament = def.temperament;
        this.elements = def.elements ? [...def.elements] : [];
        this.acts = def.acts;
        this.slotIndex = slotIndex;
        this.hp = this.mhp();
    }
}
