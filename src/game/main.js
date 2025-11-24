import { Data } from './data.js';
import { GameState } from './state.js';
import { Log } from './log.js';
import { Systems } from './systems.js';

// Group systems under a single Game object for easy access in HTML event handlers
export const Game = {
    Systems,
    Views: { UI: Systems.UI },
    init() {
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
                const def = Data.creatures[slot.species];
                const maxhp = Math.round(def.baseHp * (1 + def.hpGrowth * (slot.lvl - 1)));
                const unit = {
                    uid: `p${idx}_${Date.now()}`,
                    speciesId: def.id,
                    name: def.name,
                    sprite: def.sprite,
                    spriteAsset: def.spriteAsset,
                    level: slot.lvl,
                    maxhp: maxhp,
                    hp: maxhp,
                    exp: 0,
                    temperament: def.temperament,
                    elements: def.elements ? [...def.elements] : [],
                    acts: def.acts,
                    equipmentId: null,
                    slotIndex: idx
                };
                GameState.roster.push(unit);
                GameState.party.activeSlots[idx] = unit;
            } else {
                GameState.party.activeSlots[idx] = null;
            }
        });
        // Render party UI and update HUD
        Systems.UI.renderParty();
        // Log welcome message
        Log.add('Welcome to Stillnight.');
    }
};

// Event listeners for resizing and keyboard input
window.addEventListener('resize', () => {
    Systems.Explore.resize();
    Systems.Battle3D.resize();
});
window.addEventListener('keydown', (e) => {
    if (GameState.ui.mode === 'EXPLORE') {
        if (e.key === 'ArrowUp') Systems.Explore.move(0, -1);
        if (e.key === 'ArrowDown') Systems.Explore.move(0, 1);
        if (e.key === 'ArrowLeft') Systems.Explore.move(-1, 0);
        if (e.key === 'ArrowRight') Systems.Explore.move(1, 0);
        if (e.key === 'p' || e.key === 'P') Systems.UI.toggleParty();
        if (e.key === 'b' || e.key === 'B') Systems.UI.toggleInventory();
    } else if (GameState.ui.mode === 'BATTLE' || GameState.ui.mode === 'BATTLE_WIN') {
        if (e.code === 'Space') {
            if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT') Systems.Battle.resumeAuto();
            else Systems.Battle.requestPlayerTurn();
        }
    }
});

// Start the game once the page loads
window.addEventListener('load', () => {
    Game.init();
});

// Expose Game for inline handlers
window.Game = Game;
