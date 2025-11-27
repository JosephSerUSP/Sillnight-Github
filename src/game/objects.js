// Domain helpers for game objects (similar to rmmz_objects.js).
// Keep logic that manipulates GameState/Data here; avoid DOM work. To add a new helper,
// export a function or lightweight class that can be shared across scenes/systems.

import { Data } from '../assets/data/data.js';

export function getXpForNextLevel(level) {
    // Simple exponential curve: 100, 225, 379, 562...
    return Math.round(100 * Math.pow(level, 1.1));
}

export function getXpProgress(unit) {
    const currentLvlXp = unit.level > 1 ? getXpForNextLevel(unit.level - 1) : 0;
    const nextLvlXp = getXpForNextLevel(unit.level);
    const xpInCurrentLvl = unit.exp - currentLvlXp;
    const xpForThisLvl = nextLvlXp - currentLvlXp;
    return (xpInCurrentLvl / xpForThisLvl) * 100;
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
