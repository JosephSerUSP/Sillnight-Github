import { Game_Actor } from './Game_Actor.js';
import { Data } from '../../assets/data/data.js';

/**
 * The class for the party.
 */
export class Game_Party {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        this._roster = [];
        this._actors = [null, null, null, null, null, null];
        this._items = {};
        this._equipment = {};
        this._gold = 0;
    }

    get roster() {
        return this._roster;
    }

    get actors() {
        return this._actors;
    }

    get items() {
        return this._items;
    }

    get equipment() {
        return this._equipment;
    }

    get gold() {
        return this._gold;
    }

    set gold(amount) {
        this._gold = amount;
    }

    gainGold(amount) {
        this._gold += amount;
    }

    gainItem(item, amount) {
        const container = this.items;
        container[item.id] = (container[item.id] || 0) + amount;
    }

    populateActiveSlots(setup) {
        const { creatures, count } = setup;
        const partyToCreate = [];

        if (!creatures || creatures.length === 0) {
            const allCreatureIds = Object.keys(Data.creatures);
            if (allCreatureIds.length > 0) {
                const randomSpeciesId = allCreatureIds[Math.floor(Math.random() * allCreatureIds.length)];
                const randomLevel = 1 + Math.floor(Math.random() * 3);
                partyToCreate.push({ species: randomSpeciesId, lvl: randomLevel });
            }
        } else {
            const shuffledCreatures = [...creatures].sort(() => 0.5 - Math.random());
            const selectedCreatures = [];
            const selectedSpecies = new Set();

            for (const creature of shuffledCreatures) {
                if (!selectedSpecies.has(creature.species)) {
                    selectedCreatures.push(creature);
                    selectedSpecies.add(creature.species);
                    if (selectedCreatures.length >= count) break;
                }
            }

            if (selectedCreatures.length < count) {
                const remainingNeeded = count - selectedCreatures.length;
                for (let i = 0; i < remainingNeeded; i++) {
                    selectedCreatures.push(shuffledCreatures[i % shuffledCreatures.length]);
                }
            }

            for (const creature of selectedCreatures.slice(0, count)) {
                const level = creature.minLevel + Math.floor(Math.random() * (creature.maxLevel - creature.minLevel + 1));
                partyToCreate.push({ species: creature.species, lvl: level });
            }
        }

        this._actors.fill(null);
        partyToCreate.forEach((slot, idx) => {
            if (idx < 6) {
                const actor = new Game_Actor(slot.species, slot.lvl, idx);
                this._roster.push(actor);
                this._actors[idx] = actor;
            }
        });
    }
}
