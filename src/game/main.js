import { Data } from '../assets/data/data.js';
import { DataManager } from './DataManager.js';
import { Log } from './log.js';
import { Systems } from './systems.js';
import { resolveAssetPath } from './core.js';
import { SceneManager, InputManager, BattleManager, RenderManager } from './managers.js';
import { Scene_Explore, Scene_Battle } from './scenes.js';
import { Window_HUD } from './window/hud.js';
import { Window_Party } from './window/party.js';
import { Window_CreatureModal, Window_Inventory, Window_PartyMenu } from './window/modals.js';
import { Window_BattleLog } from './window/battle_log.js';

/**
 * Core game bootstrapper; keeps entrypoint slim while delegating to managers/scenes.
 * This object serves as the central hub for the game application, initializing systems,
 * managing scenes, and exposing global access points.
 * @namespace Game
 */
export const Game = {
    /**
     * Indicates whether the game has fully finished initializing.
     * @type {boolean}
     */
    ready: false,
    Systems,
    data: Data,
    log: Log,
    resolveAssetPath,
    Scenes: {},
    SceneManager: new SceneManager(),
    BattleManager: BattleManager,
    RenderManager: new RenderManager(),
    Windows: {},
    ui: {
        mode: 'EXPLORE',
        formationMode: false
    },

    /**
     * Initializes the game.
     * Sets up data, creates UI windows, initializes systems (Explore, Battle3D, Effekseer),
     * wires scene transitions, binds input handlers, and starts the initial scene.
     * @async
     * @returns {Promise<void>} A promise that resolves when initialization is complete.
     */
    async init() {
        // Initialize Data (Create Party, Map, etc.)
        DataManager.setupNewGame();

        // Create windows
        this.Windows.HUD = new Window_HUD();
        this.Windows.Party = new Window_Party();
        this.Windows.CreatureModal = new Window_CreatureModal();
        this.Windows.Inventory = new Window_Inventory();
        this.Windows.PartyMenu = new Window_PartyMenu();
        this.Windows.BattleLog = new Window_BattleLog();

        // Initial map generation (already done in setupNewGame, but need to render)
        // Systems.Map.generateFloor(); // Moved to DataManager
        this.RenderManager.init();
        Systems.Explore.init();
        Systems.Battle3D.init();
        await Systems.Effekseer.preload();

        // Wire hooks for scene transitions originating from systems
        Systems.sceneHooks.onBattleStart = () => this.SceneManager.changeScene(this.Scenes.battle);
        // Systems.sceneHooks.onBattleEnd no longer automatically changes scene; handled by Victory UI

        // Bind battle handlers
        this.Windows.BattleLog.togglePlayerTurn(false, {
            onRequest: () => BattleManager.requestPlayerTurn(),
            onResume: () => BattleManager.resumeAuto()
        });

        // Render shell UI
        this.Windows.Party.refresh();
        this.Windows.HUD.refresh();
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

function scaleGameContainer() {
    const container = document.getElementById('game-container');
    if (!container) return;

    const targetWidth = 960;
    const targetHeight = 540;

    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY);

    container.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', () => {
    scaleGameContainer();
    Game.RenderManager.resize();
    // Systems.Explore.resize(); // Deprecated: RenderManager handles it
    // Systems.Battle3D.resize(); // Deprecated: RenderManager handles it
});

window.addEventListener('load', async () => {
    scaleGameContainer();
    await Game.init();
});

// Expose Game for inline handlers
window.Game = Game;
