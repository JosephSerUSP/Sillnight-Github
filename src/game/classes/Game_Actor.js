import { Game_Battler } from './Game_Battler.js';

export class Game_Actor extends Game_Battler {
    constructor(actorData) {
        super();
        this.uid = actorData.uid;
        this.speciesId = actorData.speciesId;
        this.name = actorData.name;
        this.sprite = actorData.sprite;
        this.spriteAsset = actorData.spriteAsset;
        this.level = actorData.level;
        this.maxhp = actorData.maxhp;
        this.hp = actorData.hp;
        this.exp = actorData.exp;
        this.temperament = actorData.temperament;
        this.elements = actorData.elements;
        this.acts = actorData.acts;
        this.equipmentId = actorData.equipmentId;
        this.slotIndex = actorData.slotIndex;
    }
}
