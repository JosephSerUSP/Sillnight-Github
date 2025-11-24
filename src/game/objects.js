// objects.js - similar to rmmz_objects.js. Domain helpers operating on GameState/Data.
// Add new helpers for creatures, parties, and growth formulas here instead of UI logic.

import { Data } from './data.js';
import { GameState } from './state.js';

export function computeMaxHp(unit) {
    const def = Data.creatures[unit.speciesId];
    if (!def) return unit.maxhp || 1;
    const base = Math.round(def.baseHp * (1 + def.hpGrowth * (unit.level - 1)));
    const equip = unit.equipmentId ? Data.equipment[unit.equipmentId] : null;
    if (equip?.hpBonus) return Math.round(base * (1 + equip.hpBonus));
    const equipBonus = equip?.hp || 0;
    return base + equipBonus;
}

export function applyDamage(unit, amount) {
    unit.hp = Math.max(0, unit.hp - amount);
}

export function healUnit(unit, amount) {
    unit.hp = Math.min(computeMaxHp(unit), unit.hp + amount);
}

export function createUnit(defId, level, slotIndex) {
    const def = Data.creatures[defId];
    const maxhp = Math.round(def.baseHp * (1 + def.hpGrowth * (level - 1)));
    return {
        uid: `${defId}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
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

export function swapPartySlots(a, b) {
    const slots = GameState.party.activeSlots;
    const u1 = slots[a];
    const u2 = slots[b];
    slots[a] = u2;
    slots[b] = u1;
    if (slots[a]) slots[a].slotIndex = a;
    if (slots[b]) slots[b].slotIndex = b;
}

export function eachActiveUnit(cb) {
    GameState.party.activeSlots.forEach((u, idx) => cb(u, idx));
}
