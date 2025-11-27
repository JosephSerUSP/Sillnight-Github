import { Data } from '../assets/data/data.js';
import { Log } from './log.js';
import { Systems } from './systems.js';
import { UI } from './windows.js';
import { SceneManager, InputManager, DataManager } from './managers.js';
import { Scene_Explore, Scene_Battle } from './scenes.js';
import { $gameParty, $gameMap } from './globals.js';

// Core game bootstrapper; keeps entrypoint slim while delegating to managers/scenes.
export const Game = {
    ready: false,
    Systems,
    data: Data,
    log: Log,
    UI,
    Scenes: {},
    SceneManager: new SceneManager(),
    ui: {
        mode: 'EXPLORE',
        formationMode: false
    },
    async init() {
        // Link UI buttons to battle turn controls
        UI.bindTurnHandlers({
            onRequestTurn: () => Systems.Battle.requestPlayerTurn(),
            onResumeTurn: () => Systems.Battle.resumeAuto()
        });

        // Set up initial game state
        DataManager.setupNewGame();

        // Initial map generation and render setup
        Systems.Explore.init();
        Systems.Battle3D.init();
        await Systems.Effekseer.preload();

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

        this.ready = true;
    }
};

window.addEventListener('resize', () => {
    Systems.Explore.resize();
    Systems.Battle3D.resize();
});

window.addEventListener('load', async () => {
    await Game.init();
});

// Expose Game for inline handlers
window.Game = Game;
window.Game.Views = { UI };
