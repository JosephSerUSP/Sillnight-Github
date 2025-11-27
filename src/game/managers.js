// Managers for scene flow and input (similar to rmmz_managers.js).
// Add new managers here (DataManager, SceneManager, InputManager, etc.) instead of scattering globals.
import { $gameParty, $gameMap } from './globals.js';
import { Data } from '../assets/data/data.js';
import { Game_Actor } from './classes/Game_Actor.js';
import { createUnit } from './objects.js';

export class DataManager {
    static setupNewGame() {
        this.createGameObjects();
        this.setupStartingParty();
        this.setupStartingMap();
    }

    static createGameObjects() {
        // The globals are already instantiated, but we can reset them here if needed.
        // For now, this method is a placeholder for any future global object creation.
    }

    static setupStartingParty() {
        $gameParty.gainGold(Data.party.initial.gold);
        const { creatures, count } = Data.party.initial;
        const partyToCreate = [];

        if (!creatures || creatures.length === 0) {
            const allCreatureIds = Object.keys(Data.creatures);
            if (allCreatureIds.length > 0) {
                const randomSpeciesId = allCreatureIds[Math.floor(Math.random() * allCreatureIds.length)];
                const randomLevel = 1 + Math.floor(Math.random() * 3); // 1-3
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
                for(let i=0; i < remainingNeeded; i++) {
                    selectedCreatures.push(shuffledCreatures[i % shuffledCreatures.length]);
                }
            }

            for (const creature of selectedCreatures.slice(0, count)) {
                const level = creature.minLevel + Math.floor(Math.random() * (creature.maxLevel - creature.minLevel + 1));
                partyToCreate.push({ species: creature.species, lvl: level });
            }
        }

        partyToCreate.forEach((slot, idx) => {
            if (idx < 6) {
                const unit = createUnit(slot.species, slot.lvl, idx);
                const actor = new Game_Actor(unit);
                $gameParty.roster.push(actor);
                $gameParty.actors[idx] = actor;
            }
        });
    }

    static setupStartingMap() {
        $gameMap.generateFloor(1);
    }
}

export class SceneManager {
    constructor() {
        this.currentScene = null;
    }

    changeScene(scene) {
        if (this.currentScene?.onExit) this.currentScene.onExit();
        this.currentScene = scene;
        this.currentScene?.onEnter?.();
    }

    update(delta) {
        this.currentScene?.update?.(delta);
    }

    handleInput(event) {
        if (!this.currentScene?.handleInput) return false;
        return this.currentScene.handleInput(event);
    }
}

export class InputManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
    }

    boot() {
        window.addEventListener('keydown', (e) => {
            this.sceneManager.handleInput(e);
        });
    }
}
