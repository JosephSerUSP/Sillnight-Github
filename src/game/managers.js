// Managers for scene flow and input (similar to rmmz_managers.js).
// Add new managers here (SceneManager, InputManager, etc.) instead of scattering globals.

import { Game_Actor } from './Game_Actor.js';
import { Game_Party } from './Game_Party.js';
import { Game_Map } from './Game_Map.js';
import { Game_System } from './Game_System.js';
import { Game_Troop } from './Game_Troop.js';
import { Data } from '../assets/data/data.js';

export class DataManager {
    static setupNewGame() {
        window.$gameParty = new Game_Party();
        window.$gameMap = new Game_Map();
        window.$gameSystem = new Game_System();
        window.$gameTroop = new Game_Troop();

        $gameParty.gainGold(500);
        this.populateInitialParty();
    }

    static populateInitialParty() {
        const { creatures, count } = Data.party.initial;
        const partyToCreate = [];

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

        partyToCreate.forEach((data, idx) => {
            if (idx < 6) {
                const actor = new Game_Actor(data.species, data.lvl);
                $gameParty.addActor(actor, idx);
            }
        });
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
