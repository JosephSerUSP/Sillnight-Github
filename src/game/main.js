import { Data } from '../assets/data/data.js';
import { Log } from './log.js';
import { Systems } from './systems.js';
import { SceneManager, InputManager, DataManager } from './managers.js';
import { Scene_Explore, Scene_Battle } from './scenes.js';
import { Window_HUD } from './window/hud.js';
import { Window_Party } from './window/party.js';
import { Window_CreatureModal, Window_Inventory, Window_PartyMenu } from './window/modals.js';
import { Window_BattleLog } from './window/battle_log.js';

// Core game bootstrapper; keeps entrypoint slim while delegating to managers/scenes.
export const Game = {
    ready: false,
    ui: {
        mode: 'EXPLORE',
        formationMode: false
    },
    Systems,
    data: Data,
    log: Log,
    Scenes: {},
    SceneManager: new SceneManager(),
    Windows: {},
    async init() {
        // Create windows
        this.Windows.HUD = new Window_HUD();
        this.Windows.Party = new Window_Party();
        this.Windows.CreatureModal = new Window_CreatureModal();
        this.Windows.Inventory = new Window_Inventory();
        this.Windows.PartyMenu = new Window_PartyMenu();
        this.Windows.BattleLog = new Window_BattleLog();

        // DataManager will handle the setup of game objects
        DataManager.setupNewGame();

        // Render shell UI
        this.Windows.Party.refresh();
        this.Windows.HUD.refresh();

        // Initial map generation and render setup
        Systems.Explore.init();
        Systems.Battle3D.init();
        await Systems.Effekseer.preload();

        // Wire hooks for scene transitions originating from systems
        Systems.sceneHooks.onBattleStart = () => this.SceneManager.changeScene(this.Scenes.battle);
        Systems.sceneHooks.onBattleEnd = () => this.SceneManager.changeScene(this.Scenes.explore);

        // Bind battle handlers
        this.Windows.BattleLog.togglePlayerTurn(false, {
            onRequest: () => Systems.Battle.requestPlayerTurn(),
            onResume: () => Systems.Battle.resumeAuto()
        });

        Log.add('Welcome to Stillnight.');

        // Scenes and input
        this.Scenes.explore = new Scene_Explore(Systems, this.Windows);
        this.Scenes.battle = new Scene_Battle(Systems, this.Windows);
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
