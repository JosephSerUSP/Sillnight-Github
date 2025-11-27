import { Game_Battler } from './Game_Battler.js';

export class Game_Enemy extends Game_Battler {
    constructor(enemyData) {
        super();
        this.uid = enemyData.uid;
        this.speciesId = enemyData.speciesId;
        this.name = enemyData.name;
        this.sprite = enemyData.sprite;
        this.spriteAsset = enemyData.spriteAsset;
        this.level = enemyData.level;
        this.maxhp = enemyData.maxhp;
        this.hp = enemyData.hp;
        this.temperament = enemyData.temperament;
        this.elements = enemyData.elements;
        this.acts = enemyData.acts;
        this.equipmentId = enemyData.equipmentId;
        this.slotIndex = enemyData.slotIndex;
    }
}
