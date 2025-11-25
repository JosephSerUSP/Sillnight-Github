import { Data } from '../assets/data/data.js';
import { GameState } from './state.js';
import { Log } from './log.js';
import { Systems } from './systems.js';
import { UI } from './windows.js';
import { populateActiveSlots } from './objects.js';
import { SceneManager, InputManager } from './managers.js';
import { Scene_Explore, Scene_Battle } from './scenes.js';

// Core game bootstrapper; keeps entrypoint slim while delegating to managers/scenes.
export const Game = {
    Systems,
    UI,
    Scenes: {},
    SceneManager: new SceneManager(),
    init() {
        // Link UI buttons to battle turn controls
        UI.bindTurnHandlers({
            onRequestTurn: () => Systems.Battle.requestPlayerTurn(),
            onResumeTurn: () => Systems.Battle.resumeAuto()
        });

        // Initial map generation and render setup
        Systems.Map.generateFloor();
        Systems.Explore.init();
        Systems.Battle3D.init();

        // Starting party
        populateActiveSlots(Data.party.initial);

        // Wire hooks for scene transitions originating from systems
        Systems.sceneHooks.onBattleStart = () => this.SceneManager.changeScene(this.Scenes.battle);
        Systems.sceneHooks.onBattleEnd = () => this.SceneManager.changeScene(this.Scenes.explore);

        // Render shell UI
        UI.renderParty();
        UI.updateHUD();
        Log.add('Welcome to Stillnight.');

        // Scenes and input
        this.Scenes.explore = new Scene_Explore(Systems, UI);
        this.Scenes.battle = new Scene_Battle(Systems, UI);
        this.SceneManager.changeScene(this.Scenes.explore);

        const input = new InputManager(this.SceneManager);
        input.boot();
    }
};

window.addEventListener('resize', () => {
    Systems.Explore.resize();
    Systems.Battle3D.resize();
});

window.addEventListener('load', () => {
    Game.init();
});

// Expose Game for inline handlers
window.Game = Game;
window.Game.Views = { UI };
