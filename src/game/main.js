import { GameState } from './state.js';
import { Log } from './log.js';
import { Systems } from './systems.js';
import { shellUI } from './windows.js';
import { sceneManager, inputManager } from './managers.js';
import { Scene_Explore, Scene_Battle } from './scenes.js';
import { createUnit } from './objects.js';

// Group systems under a single Game object for easy access in HTML event handlers
export const Game = {
    Systems,
    Views: { UI: shellUI },
    init() {
        Systems.Map.generateFloor();
        Systems.Explore.init();
        Systems.Battle3D.init();

        shellUI.setDependencies({
            swapBattleUnits: Systems.Battle.swapUnits.bind(Systems.Battle),
            refreshBattleScene: () => {
                if (GameState.ui.mode === 'BATTLE' && GameState.battle) {
                    GameState.battle.allies = GameState.party.activeSlots.filter(u => u !== null);
                    Systems.Battle3D.setupScene(GameState.battle.allies, GameState.battle.enemies);
                }
            },
            renderExplore: () => Systems.Explore.render(),
            resumeAuto: () => Systems.Battle.resumeAuto(),
            requestPlayerTurn: () => Systems.Battle.requestPlayerTurn(),
        });

        const startSetup = [
            { species: 'inori', lvl: 5 },
            { species: 'shiva', lvl: 3 },
            null,
            { species: 'nurse', lvl: 2 },
            null,
            null,
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

        shellUI.renderParty();
        Log.add('Welcome to Stillnight.');

        const exploreScene = new Scene_Explore(Systems, shellUI);
        sceneManager.changeScene(exploreScene);

        inputManager.bind('moveUp', () => exploreScene.move(0, -1));
        inputManager.bind('moveDown', () => exploreScene.move(0, 1));
        inputManager.bind('moveLeft', () => exploreScene.move(-1, 0));
        inputManager.bind('moveRight', () => exploreScene.move(1, 0));
        inputManager.bind('openParty', () => shellUI.toggleParty());
        inputManager.bind('openBag', () => shellUI.toggleInventory());
        inputManager.bind('battleToggle', () => {
            if (GameState.ui.mode === 'BATTLE' || GameState.ui.mode === 'BATTLE_WIN') {
                const battleScene = new Scene_Battle(Systems, shellUI);
                sceneManager.changeScene(battleScene);
                battleScene.togglePlayerTurn();
            }
        });
    }
};

window.addEventListener('resize', () => {
    Systems.Explore.resize();
    Systems.Battle3D.resize();
});

window.addEventListener('keydown', (e) => {
    inputManager.handleKey(e);
});

window.addEventListener('load', () => {
    Game.init();
});

window.Game = Game;
