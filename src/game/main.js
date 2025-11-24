import { GameState } from './state.js';
import { Log } from './log.js';
import { Systems } from './systems.js';
import { createUnitFromDef } from './objects.js';
import { SceneManager, InputManager } from './managers.js';
import { Scene_Explore, Scene_Battle } from './scenes.js';

// Group systems under a single Game object for easy access in HTML event handlers
export const Game = {
    Systems,
    Views: { UI: Systems.UI },
    SceneManager,
    InputManager,
    init() {
        SceneManager.init({ systems: Systems, ui: Systems.UI });
        Systems.sceneHooks = {
            enterBattle: () => SceneManager.changeScene(new Scene_Battle(Systems, Systems.UI)),
            returnToExplore: () => SceneManager.changeScene(new Scene_Explore(Systems, Systems.UI))
        };
        // Initial map generation
        Systems.Map.generateFloor();
        // Initialize canvas and 3D
        Systems.Explore.init();
        Systems.Battle3D.init();
        // Setup initial party
        const startSetup = [
            { species: 'inori', lvl: 5 },
            { species: 'shiva', lvl: 3 },
            null,
            { species: 'nurse', lvl: 2 },
            null,
            null
        ];
        startSetup.forEach((slot, idx) => {
            if (slot) {
                const unit = createUnitFromDef(slot.species, slot.lvl, idx);
                GameState.roster.push(unit);
                GameState.party.activeSlots[idx] = unit;
            } else {
                GameState.party.activeSlots[idx] = null;
            }
        });
        Systems.UI.renderParty();
        Log.add('Welcome to Stillnight.');
        SceneManager.changeScene(new Scene_Explore(Systems, Systems.UI));
        InputManager.start();
        InputManager.onAction((action) => SceneManager.handleAction(action));
    }
};

// Event listeners for resizing
window.addEventListener('resize', () => {
    Systems.Explore.resize();
    Systems.Battle3D.resize();
});

// Start the game once the page loads
window.addEventListener('load', () => {
    Game.init();
});

// Expose Game for inline handlers
window.Game = Game;
