import { Game_Battler } from './Game_Battler.js';
import { Data } from '../../assets/data/data.js';

export class Game_Actor extends Game_Battler {
    constructor(speciesId, level = 1) {
        super();
        this._speciesId = speciesId;
        this._level = level;
        this._exp = 0;
        this._equipmentId = null;
        this._uid = `u_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        this.setup(speciesId, level);
    }

    get uid() { return this._uid; }
    get level() { return this._level; }
    get exp() { return this._exp; }
    get speciesId() { return this._speciesId; }
    get equipmentId() { return this._equipmentId; }
    set equipmentId(id) { this._equipmentId = id; this.refresh(); }

    setup(speciesId, level) {
        this._speciesId = speciesId;
        this._level = level;
        const def = Data.creatures[speciesId];
        this._name = def.name;
        this.recoverAll();
    }

    get name() { return this._name; }

    get sprite() {
        return Data.creatures[this._speciesId].sprite;
    }

    get spriteAsset() {
        return Data.creatures[this._speciesId].spriteAsset;
    }

    paramBase(paramId) {
        const def = Data.creatures[this._speciesId];
        // 0: mhp
        if (paramId === 0) {
            return Math.round(def.baseHp * (1 + def.hpGrowth * (this._level - 1)));
        }
        // Add other params if they exist in data
        return 0;
    }

    paramRate(paramId) {
        let rate = super.paramRate(paramId);
        // Equipment traits
        if (this._equipmentId) {
            const eq = Data.equipment[this._equipmentId];
            if (eq && eq.traits) {
                eq.traits.forEach(trait => {
                    // Mapping paramId to trait types for now
                    if (paramId === 0 && trait.type === 'hp_bonus_percent') {
                         rate *= (1 + parseFloat(trait.formula));
                    }
                    // Add other param traits
                });
            }
        }
        // Passive traits
        const def = Data.creatures[this._speciesId];
        if (def && def.passives) {
             def.passives.forEach(pid => {
                 const p = Data.passives[pid];
                 if (p && p.traits) {
                     p.traits.forEach(trait => {
                        if (paramId === 0 && trait.type === 'hp_bonus_percent') {
                            rate *= (1 + parseFloat(trait.formula));
                        }
                     });
                 }
             });
        }
        return rate;
    }

    paramPlus(paramId) {
        let plus = super.paramPlus(paramId);
        if (paramId === 0) {
            // maxHpBonus logic from duplicated systems/objects
             plus += (this._maxHpBonus || 0);
        }
        return plus;
    }

    recoverAll() {
        this._hp = this.mhp;
        this._mp = this.mmp;
        this._states = [];
    }

    gainExp(exp) {
        this._exp += exp;
        // Level up logic
        const def = Data.creatures[this._speciesId];
        while (this.currentExp() >= this.nextLevelExp()) {
            this.levelUp();
        }
    }

    currentExp() { return this._exp; }

    nextLevelExp() {
         const def = Data.creatures[this._speciesId];
         // Using the logic from objects.js: getXpForNextLevel
         // Math.round(100 * Math.pow(level, 1.1)) is total XP for next level?
         // Or is it accumulated? objects.js logic was a bit weird.
         // Let's stick to a simple formula for now or adapt objects.js
         return Math.round(100 * Math.pow(this._level, 1.1));
    }

    levelUp() {
        this._level++;
        // Stat growth handling
        // Full heal on level up?
        this.recoverAll();
    }

    // Compatibility with old object structure
    get acts() { return Data.creatures[this._speciesId].acts; }
    get temperament() { return Data.creatures[this._speciesId].temperament; }
    get elements() { return Data.creatures[this._speciesId].elements || []; }
}
