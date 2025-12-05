import { Data } from '../assets/data/data.js';
import { DataManager } from './DataManager.js';
import { Log } from './log.js';
import * as Systems from './systems.js';
import { SceneManager, InputManager, BattleManager, RenderManager } from './managers.js';
import { Scene_Explore, Scene_Battle } from './scenes.js';
import { Window_HUD } from './window/hud.js';
import { Window_Party } from './window/party.js';
import { Window_CreatureModal, Window_Inventory, Window_PartyMenu } from './window/modals.js';
import { Window_BattleLog } from './window/battle_log.js';
import { Window_Victory, Window_LevelUp } from './window/victory.js';
import { Window_Shop } from './window/shop.js';
import { Window_Recruit } from './window/recruit.js';

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
        this.Windows.Victory = new Window_Victory();
        this.Windows.LevelUp = new Window_LevelUp();
        this.Windows.Shop = new Window_Shop();
        this.Windows.Recruit = new Window_Recruit();

        // Initial map generation (already done in setupNewGame, but need to render)
        // Systems.Map.generateFloor(); // Moved to DataManager
        this.RenderManager.init();
        Systems.Explore.init();
        Systems.Battle3D.init();
        await Systems.Effekseer.preload();

        // Wire hooks for scene transitions originating from systems
        // Systems.sceneHooks is no longer available as a property of Systems since it is a namespace now.
        // We need to check if any systems need manual hooking or if they are self-contained.
        // The previous Systems.sceneHooks was used by ExploreSystem to trigger battle.
        // ExploreSystem now needs a way to request scene change.
        // Currently ExploreSystem calls window.Game.SceneManager.changeScene which is fine.
        // But let's check if ExploreSystem relies on Systems.sceneHooks.

        // Wait, I see Systems.Explore is an instance.
        // If ExploreSystem used Systems.sceneHooks, it might be broken now if I removed it from systems.js.
        // I should check ExploreSystem.js.

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
