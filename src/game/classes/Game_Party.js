import { Game_Actor } from './Game_Actor.js';
import { Data } from '../../assets/data/data.js';

/**
 * @class Game_Party
 * @description The class for the player's party.
 */
export class Game_Party {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        /** @type {Game_Actor[]} */
        this._actors = []; // Active party members
        /** @type {Game_Actor[]} */
        this._roster = []; // All owned units
        /** @type {Object.<string, number>} */
        this._items = {};
        /** @type {Object.<string, number>} */
        this._equipment = {};
        /** @type {number} */
        this._gold = 500;
    }

    /**
     * @returns {Game_Actor[]} The active party members.
     */
    actors() {
        return this._actors;
    }

    /**
     * @returns {number} The party's gold.
     */
    gold() {
        return this._gold;
    }

    gainGold(amount) {
        this._gold += amount;
    }

    loseGold(amount) {
        this._gold -= amount;
    }

    /**
     * @returns {Game_Actor[]} The party's roster.
     */
    roster() {
        return this._roster;
    }

    /**
     * @returns {Object.<string, number>} The party's items.
     */
    items() {
        return this._items;
    }

    /**
     * @returns {Object.<string, number>} The party's equipment.
     */
    equipment() {
        return this._equipment;
    }

    gainItem(itemId, amount) {
        this._items[itemId] = (this._items[itemId] || 0) + amount;
    }

    gainEquipment(equipmentId, amount) {
        this._equipment[equipmentId] = (this._equipment[equipmentId] || 0) + amount;
    }

    loseEquipment(equipmentId, amount) {
        const prevAmount = this.equipment()[equipmentId] || 0;
        if (prevAmount > 0) {
            this._equipment[equipmentId] = prevAmount - amount;
            if (this._equipment[equipmentId] <= 0) {
                delete this._equipment[equipmentId];
            }
        }
    }

    /**
     * Populates the initial party with random creatures.
     */
    setupStartingMembers() {
        const { creatures, count } = Data.party.initial;
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

        partyToCreate.forEach(member => {
            const actor = new Game_Actor(member.species, member.lvl);
            this._roster.push(actor);
        });

        this._actors = this._roster.slice(0, 6);
    }
}
