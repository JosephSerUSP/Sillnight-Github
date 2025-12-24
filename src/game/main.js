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
import { CreatureRegistry } from './registries/CreatureRegistry.js';
import { SkillRegistry } from './registries/SkillRegistry.js';
import { PassiveRegistry } from './registries/PassiveRegistry.js';
import { EquipmentRegistry } from './registries/EquipmentRegistry.js';
import { ItemRegistry } from './registries/ItemRegistry.js';
import { DungeonRegistry } from './registries/DungeonRegistry.js';
import { EventDataRegistry } from './registries/EventDataRegistry.js';
import { Game_Actor } from './classes/Game_Actor.js';
import { Game_Enemy } from './classes/Game_Enemy.js';
import { Game_Variables } from './classes/Game_Variables.js';
import { Game_Switches } from './classes/Game_Switches.js';

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
    Classes: {
        Game_Actor,
        Game_Enemy
    },
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
        console.log("Game.init: Starting initialization...");

        // Register Core Services
        Services.register('TraitRegistry', new TraitRegistry());
        Services.register('EffectRegistry', new EffectRegistry());
        Services.register('CreatureRegistry', new CreatureRegistry());
        Services.register('SkillRegistry', new SkillRegistry());
        Services.register('PassiveRegistry', new PassiveRegistry());
        Services.register('EquipmentRegistry', new EquipmentRegistry());
        Services.register('ItemRegistry', new ItemRegistry());
        Services.register('DungeonRegistry', new DungeonRegistry());
        Services.register('EventDataRegistry', new EventDataRegistry());
        Services.register('GameVariables', new Game_Variables());
        Services.register('GameSwitches', new Game_Switches());
        console.log("Game.init: Services registered.");

        // Load Data into Registries
        // Note: CreatureRegistry loads lazily via get(), but others might need explicit load.
        // For safety, we load them if they have a load method.
        await Services.get('DungeonRegistry').load();
        await Services.get('EventDataRegistry').load();

        // Ensure other registries that might need it are loaded
        if (Services.get('CreatureRegistry').load) Services.get('CreatureRegistry').load();
        if (Services.get('SkillRegistry').load) Services.get('SkillRegistry').load();
        if (Services.get('ItemRegistry').load) Services.get('ItemRegistry').load();
        if (Services.get('EquipmentRegistry').load) Services.get('EquipmentRegistry').load();
        if (Services.get('PassiveRegistry').load) Services.get('PassiveRegistry').load();
        if (Services.get('TraitRegistry').load) Services.get('TraitRegistry').load();
        if (Services.get('EffectRegistry').load) Services.get('EffectRegistry').load();

        console.log("Game.init: Registries loaded.");

        // Initialize Data (Create Party, Map, etc.)
        DataManager.setupNewGame();
        console.log("Game.init: DataManager setup complete.");

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
        console.log("Game.init: Windows created.");

        this.RenderManager.init();
        Systems.Explore.init();
        Systems.Battle3D.init();
        await Systems.Effekseer.preload();
        console.log("Game.init: Systems initialized.");

        // Wire hooks for scene transitions originating from systems
        Systems.sceneHooks.onBattleStart = () => this.SceneManager.changeScene(this.Scenes.battle);

        // Initialize BattleManager events
        BattleManager.init();

        // Bind battle handlers via EventBus
        Services.events.on('battle:player_turn_start', () => {
             this.Windows.BattleLog.togglePlayerTurn(true, {
                 onRequest: () => BattleManager.requestPlayerTurn(),
                 onResume: () => BattleManager.resumeAuto()
             });
        });
        Services.events.on('battle:player_turn_end', () => {
             this.Windows.BattleLog.togglePlayerTurn(false);
        });
        // Set initial state
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
        console.log("Game.init: Initialization complete. Game.ready = true.");
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
