// Domain helpers for game objects (similar to rmmz_objects.js).
// Keep logic that manipulates GameState/Data here; avoid DOM work. To add a new helper,
// export a function or lightweight class that can be shared across scenes/systems.

import { Data } from './assets/data/data.js';
import { GameState } from './state.js';

export function getMaxHp(unit) {
    const def = Data.creatures[unit.speciesId];
    let baseMax = Math.round(def.baseHp * (1 + def.hpGrowth * (unit.level - 1)));
    if (unit.equipmentId) {
        const eq = Data.equipment[unit.equipmentId];
        if (eq?.hpBonus) baseMax = Math.round(baseMax * (1 + eq.hpBonus));
    }
    return baseMax;
}

export function applyHealing(unit, amount) {
    unit.hp = Math.min(getMaxHp(unit), unit.hp + amount);
}

export function createUnit(speciesId, level, slotIndex = -1) {
    const def = Data.creatures[speciesId];
    const maxhp = Math.round(def.baseHp * (1 + def.hpGrowth * (level - 1)));
    return {
        uid: `u_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
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

export function populateActiveSlots(setup) {
    setup.forEach((slot, idx) => {
        if (!slot) {
            GameState.party.activeSlots[idx] = null;
            return;
        }
        const unit = createUnit(slot.species, slot.lvl, idx);
        GameState.roster.push(unit);
        GameState.party.activeSlots[idx] = unit;
    });
}
