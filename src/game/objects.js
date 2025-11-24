// rmmz_objects.js equivalent: domain helpers that operate on GameState/Data without touching the DOM.
// Add reusable computations for creatures, party, and battle formulas here.

import { Data } from './data.js';

export function createUnitFromDef(speciesId, level, slotIndex = 0) {
    const def = Data.creatures[speciesId];
    const maxhp = Math.round(def.baseHp * (1 + def.hpGrowth * (level - 1)));
    return {
        uid: `${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        speciesId: def.id,
        name: def.name,
        sprite: def.sprite,
        spriteAsset: def.spriteAsset,
        level,
        maxhp,
        hp: maxhp,
        exp: 0,
        temperament: def.temperament,
        elements: def.elements ? [...def.elements] : [],
        acts: def.acts,
        equipmentId: null,
        slotIndex
    };
}

export function getMaxHp(unit) {
    const def = Data.creatures[unit.speciesId];
    let baseMax = Math.round(def.baseHp * (1 + def.hpGrowth * (unit.level - 1)));
    if (unit.equipmentId) {
        const eq = Data.equipment[unit.equipmentId];
        if (eq?.hpBonus) {
            baseMax = Math.round(baseMax * (1 + eq.hpBonus));
        }
    }
    return baseMax;
}
