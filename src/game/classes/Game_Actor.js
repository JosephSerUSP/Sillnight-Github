import { Game_Battler } from './Game_Battler.js';
import { Data } from '../../assets/data/data.js';

/**
 * The class for actors.
 */
export class Game_Actor extends Game_Battler {
    constructor(speciesId, level, slotIndex = -1) {
        super();
        this.setup(speciesId, level, slotIndex);
    }

    setup(speciesId, level, slotIndex) {
        const def = Data.creatures[speciesId];
        this.uid = `u_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        this.speciesId = def.id;
        this.name = def.name;
        this.sprite = def.sprite;
        this.spriteAsset = def.spriteAsset;
        this.level = level;
        this.exp = 0;
        this.temperament = def.temperament;
        this.elements = def.elements ? [...def.elements] : [];
        this.acts = def.acts;
        this.equipmentId = null;
        this.slotIndex = slotIndex;
        this.hp = this.mhp();
    }

    xpRate() {
        const getXpForNextLevel = (level) => {
            return Math.round(100 * Math.pow(level, 1.1));
        };
        const currentLvlXp = this.level > 1 ? getXpForNextLevel(this.level - 1) : 0;
        const nextLvlXp = getXpForNextLevel(this.level);
        const xpInCurrentLvl = this.exp - currentLvlXp;
        const xpForThisLvl = nextLvlXp - currentLvlXp;
        return (xpInCurrentLvl / xpForThisLvl) * 100;
    }
}
