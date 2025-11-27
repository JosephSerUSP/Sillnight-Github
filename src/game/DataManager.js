// Factory for creating and managing game state
import { Game_Party } from './classes/Game_Party.js';
import { Game_Map } from './classes/Game_Map.js';
import { Data } from '../assets/data/data.js';

export class DataManager {
    static setupNewGame() {
        window.$gameParty = new Game_Party();
        window.$gameMap = new Game_Map();
        window.$gameMap.setup(1); // Floor 1

        this.populateInitialParty();
    }

    static populateInitialParty() {
        const setup = Data.party.initial;
        const { creatures, count } = setup;

        // Use logic from objects.js to select creatures
         if (!creatures || creatures.length === 0) {
            const allCreatureIds = Object.keys(Data.creatures);
            if (allCreatureIds.length > 0) {
                const randomSpeciesId = allCreatureIds[Math.floor(Math.random() * allCreatureIds.length)];
                const randomLevel = 1 + Math.floor(Math.random() * 3);
                window.$gameParty.addActor(randomSpeciesId, randomLevel);
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
                for(let i=0; i < remainingNeeded; i++) {
                    selectedCreatures.push(shuffledCreatures[i % shuffledCreatures.length]);
                }
            }

            for (const creature of selectedCreatures.slice(0, count)) {
                const level = creature.minLevel + Math.floor(Math.random() * (creature.maxLevel - creature.minLevel + 1));
                window.$gameParty.addActor(creature.species, level);
            }
        }
    }
}
