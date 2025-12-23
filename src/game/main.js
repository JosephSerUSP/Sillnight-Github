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
import { Config } from './Config.js';
import { Services } from './ServiceLocator.js';
import { TraitRegistry } from './registries/TraitRegistry.js';
import { EffectRegistry } from './registries/EffectRegistry.js';

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
    config: Config,
    Services: Services,
    Scenes: {},
    SceneManager: new SceneManager(),
    BattleManager: BattleManager,
    RenderManager: new RenderManager(),
    Windows: {},
    ui: {
        mode: 'EXPLORE',
        formationMode: false
    },
    Input: null, // InputManager instance

    /**
     * Initializes the game.
     * Sets up data, creates UI windows, initializes systems (Explore, Battle3D, Effekseer),
     * wires scene transitions, binds input handlers, and starts the initial scene.
     * @async
     * @returns {Promise<void>} A promise that resolves when initialization is complete.
     */
    async init() {
        // Register Core Services
        Services.register('TraitRegistry', new TraitRegistry());
        Services.register('EffectRegistry', new EffectRegistry());

        // Initialize Data (Create Party, Map, etc.)
        DataManager.setupNewGame();

        // Initialize Observer (connects EventBus to UI/Systems)
        this.observer = Systems.Observer;

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

        this.RenderManager.init();
        Systems.Explore.init();
        Systems.Battle3D.init();
        await Systems.Effekseer.preload();

        // Wire hooks for scene transitions originating from systems
        Systems.sceneHooks.onBattleStart = () => this.SceneManager.changeScene(this.Scenes.battle);

        // Initialize BattleManager events
        BattleManager.init();

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

        this.Input = new InputManager(this.SceneManager);
        this.Input.boot();

        this.ready = true;
    }
};

function scaleGameContainer() {
    const container = document.getElementById('game-container');
    if (!container) return;

    const targetWidth = Config.Resolution.LogicWidth;
    const targetHeight = Config.Resolution.LogicHeight;

    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY);

    container.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', () => {
    scaleGameContainer();
    Game.RenderManager.resize();
});

window.addEventListener('load', async () => {
    scaleGameContainer();
    await Game.init();
});

// Expose Game for inline handlers
window.Game = Game;
