// Domain helpers for game objects (similar to rmmz_objects.js).
// Keep logic that manipulates GameState/Data here; avoid DOM work. To add a new helper,
// export a function or lightweight class that can be shared across scenes/systems.

import { Data } from '../assets/data/data.js';
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

export function populateActiveSlots(setup) {
    const { creatures, count } = setup;
    const partyToCreate = [];

    // Handle edge case: No creatures defined in party.js
    if (!creatures || creatures.length === 0) {
        const allCreatureIds = Object.keys(Data.creatures);
        if (allCreatureIds.length > 0) {
            const randomSpeciesId = allCreatureIds[Math.floor(Math.random() * allCreatureIds.length)];
            const randomLevel = 1 + Math.floor(Math.random() * 3); // 1-3
            partyToCreate.push({ species: randomSpeciesId, lvl: randomLevel });
        }
    } else {
        // Shuffle the pool to ensure random selection
        const shuffledCreatures = [...creatures].sort(() => 0.5 - Math.random());
        const selectedCreatures = [];
        const selectedSpecies = new Set();

        // Pick unique species from the shuffled pool
        for (const creature of shuffledCreatures) {
            if (!selectedSpecies.has(creature.species)) {
                selectedCreatures.push(creature);
                selectedSpecies.add(creature.species);
                if (selectedCreatures.length >= count) break;
            }
        }

        // If not enough unique species, fill the rest with duplicates from the start of the shuffled list
        if (selectedCreatures.length < count) {
            const remainingNeeded = count - selectedCreatures.length;
            for(let i=0; i < remainingNeeded; i++) {
                // This might add duplicates if the initial pool is smaller than count
                selectedCreatures.push(shuffledCreatures[i % shuffledCreatures.length]);
            }
        }

        // Generate level and add to final party list
        for (const creature of selectedCreatures.slice(0, count)) {
            const level = creature.minLevel + Math.floor(Math.random() * (creature.maxLevel - creature.minLevel + 1));
            partyToCreate.push({ species: creature.species, lvl: level });
        }
    }

    // Clear active slots and populate
    GameState.party.activeSlots.fill(null);
    partyToCreate.forEach((slot, idx) => {
        if (idx < 6) { // Ensure we don't go over the 6 slots
            const unit = createUnit(slot.species, slot.lvl, idx);
            GameState.roster.push(unit);
            GameState.party.activeSlots[idx] = unit;
        }
    });
}
