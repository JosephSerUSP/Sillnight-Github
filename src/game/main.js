import { GameState } from './state.js';
import { Log } from './log.js';
import { Systems } from './systems.js';
import { InputManager, SceneManager } from './managers.js';
import { registerScenes } from './scenes.js';
import { UI } from './windows.js';
import { createUnit, swapPartySlots } from './objects.js';

// Group systems under a single Game object for easy access in HTML event handlers
export const Game = {
    Systems,
    Views: { UI },
    init() {
        UI.initializeShell();
        // Initial map generation
        Systems.Map.generateFloor();
        // Initialize canvas and 3D
        Systems.Explore.init();
        Systems.Battle3D.init();
        // Setup initial party: create default units and populate active slots
        // Starting party: titania lvl 5, goblin lvl 3, empty, pixie lvl 2, empty, empty
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
                const unit = createUnit(slot.species, slot.lvl, idx);
                GameState.roster.push(unit);
                GameState.party.activeSlots[idx] = unit;
            } else {
                GameState.party.activeSlots[idx] = null;
            }
        });
        UI.on('party-swap', ({ from, to }) => {
            if (GameState.ui.mode === 'BATTLE') {
                Systems.Battle.swapUnits(from, to);
            } else {
                swapPartySlots(from, to);
                UI.renderParty();
            }
        });
        // Render party UI and update HUD
        UI.renderParty();
        // Log welcome message
        Log.add('Welcome to Stillnight.');
        registerScenes(Systems, UI);
        SceneManager.change('explore');
        InputManager.bind('arrowup', 'up');
        InputManager.bind('arrowdown', 'down');
        InputManager.bind('arrowleft', 'left');
        InputManager.bind('arrowright', 'right');
        InputManager.bind('p', 'party');
        InputManager.bind('b', 'inventory');
        InputManager.bind('f', 'formation');
        InputManager.bind(' ', 'confirm');
        InputManager.attach();
    }
};

// Event listeners for resizing and keyboard input
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
