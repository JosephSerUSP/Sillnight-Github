// objects.js - similar to rmmz_objects.js
// Domain helpers that operate on GameState/Data without touching the DOM.
// Add new calculations or data mappers here to keep systems lean.

import { Data } from './data.js';
import { createUid } from './core.js';

export function computeMaxHp(unit) {
    const def = Data.creatures[unit.speciesId];
    if (!def) return unit.maxhp || unit.hp || 1;
    let baseMax = Math.round(def.baseHp * (1 + def.hpGrowth * (unit.level - 1)));
    if (unit.equipmentId) {
        const eq = Data.equipment[unit.equipmentId];
        if (eq?.hpBonus) baseMax = Math.round(baseMax * (1 + eq.hpBonus));
    }
    return baseMax;
}

export function recomputeHp(unit) {
    const maxhp = computeMaxHp(unit);
    if (unit.hp > maxhp) unit.hp = maxhp;
    unit.maxhp = maxhp;
    return maxhp;
}

export function createUnit(species, level, slotIndex) {
    const def = Data.creatures[species];
    const maxhp = Math.round(def.baseHp * (1 + def.hpGrowth * (level - 1)));
    return {
        uid: createUid('u'),
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
        slotIndex,
    };
}

export function swapPartySlots(party, from, to) {
    const temp = party[from];
    party[from] = party[to];
    party[to] = temp;
    if (party[from]) party[from].slotIndex = from;
    if (party[to]) party[to].slotIndex = to;
}
