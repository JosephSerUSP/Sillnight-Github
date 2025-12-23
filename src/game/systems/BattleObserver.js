import { Services } from '../ServiceLocator.js';
import { Log } from '../log.js';
import * as Systems from '../systems.js';

/**
 * Observer class that bridges EventBus events to the UI and specific Systems.
 * Decouples the BattleManager from direct Window/System calls.
 */
export class BattleObserver {
    constructor() {
        this.bus = Services.events;
        this.setupListeners();
    }

    setupListeners() {
        // --- Battle Flow ---
        this.bus.on('battle:start', (data) => this.onBattleStart(data));
        this.bus.on('battle:round_start', (data) => this.onRoundStart(data));
        this.bus.on('battle:turn_start', (data) => this.onTurnStart(data));
        this.bus.on('battle:action_used', (data) => this.onActionUsed(data));
        this.bus.on('battle:action_missed', (data) => this.onActionMissed(data));
        this.bus.on('battle:damage_dealt', (data) => this.onDamageDealt(data));
        this.bus.on('battle:heal_dealt', (data) => this.onHealDealt(data));
        this.bus.on('battle:state_added', (data) => this.onStateAdded(data));
        this.bus.on('battle:unit_death', (data) => this.onUnitDeath(data));
        this.bus.on('battle:victory', (data) => this.onVictory(data));
        this.bus.on('battle:defeat', () => this.onDefeat());
        this.bus.on('battle:log', (msg) => this.onLog(msg));
        this.bus.on('battle:player_turn_request', (active) => this.onPlayerTurnRequest(active));
    }

    // --- Handlers ---

    onBattleStart({ enemies }) {
        const enemyNames = enemies.map(e => e.name).join(', ');
        Log.battle(`Enemies: ${enemyNames}`);
        if (window.Game.Windows.BattleLog) {
            window.Game.Windows.BattleLog.showBanner('ENCOUNTER');
        }
    }

    onRoundStart({ round }) {
        Log.battle(`--- Round ${round} ---`);
    }

    onTurnStart({ unit }) {
        // Focus camera
        const isAlly = unit.uid.startsWith('actor'); // Simple check, or pass isAlly
        // For now, rely on System logic or pass isAlly in event
        const isAllyLogic = window.Game.BattleManager.allies.some(a => a.uid === unit.uid);

        Systems.Battle3D.setFocus(isAllyLogic ? 'ally' : 'enemy');
        window.Game.Windows.Party.refresh();

        // Broadcast for traits
        if (Systems.Observer) Systems.Observer.fire('onTurnStart', unit);
    }

    onActionUsed({ unit, action, targets }) {
        window.Game.Windows.BattleLog.showBanner(`${unit.name} used ${action.name}!`);
        // Log handled by specific effects usually, or we can log here
    }

    onActionMissed({ target }) {
        Log.battle(`> Missed ${target.name}!`);
    }

    onDamageDealt({ source, target, value, isCrit }) {
        Log.battle(`> ${source.name} hits ${target.name} for ${value}.`);
        Systems.Battle3D.showDamageNumber(target.uid, -value, isCrit);
        Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', shake: 0.8, opacity: 0.7, color: 0xffffff}]);
        window.Game.Windows.Party.refresh();
    }

    onHealDealt({ source, target, value }) {
        Log.battle(`> ${target.name} healed for ${value}.`);
        Systems.Battle3D.showDamageNumber(target.uid, value);
        Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', opacity: 0.5, color: 0x00ff00}]);
        window.Game.Windows.Party.refresh();
    }

    onStateAdded({ target, state }) {
        Log.battle(`> ${target.name} is now ${state}.`);
    }

    onUnitDeath({ unit }) {
        Log.battle(`> ${unit.name} was defeated!`);
        Systems.Battle3D.playDeathFade(unit.uid);
        if (Systems.Observer) Systems.Observer.fire('onUnitDeath', unit);
    }

    onVictory({ xp, gold, party }) {
        // Handled by Victory Window in BattleManager logic currently,
        // but can be moved here eventually.
        // For now, BattleManager calls Window_Victory directly because of the async await flow.
        // We will keep the complex Victory/End sequence in Manager for Phase 1,
        // or we need to make the Observer async-aware which is tricky for events.
        // This handler is just for side effects.
    }

    onDefeat() {
        window.Game.Windows.BattleLog.showModal(`
            <div class="text-red-600 text-4xl mb-4">DEFEATED</div>
            <button class="mt-4 border border-red-800 text-red-500 px-4 py-2 hover:bg-red-900/20" onclick="location.reload()">RESTART</button>
        `);
    }

    onLog(msg) {
        Log.battle(msg);
    }

    onPlayerTurnRequest(active) {
        const btn = document.getElementById('btn-player-turn');
        if (btn) {
            if (active) {
                btn.classList.add('border-green-500', 'text-green-500');
                btn.innerText = 'QUEUED';
                Log.add('Interrupt queued.');
            } else {
                btn.classList.remove('border-green-500', 'text-green-500');
                btn.innerText = 'STOP ROUND (SPACE)';
            }
        }
    }

    /**
     * Fires a trait trigger via the TraitRegistry.
     * @param {string} triggerName
     * @param {Object|Array} subject
     * @param  {...any} args
     */
    fire(triggerName, subject, ...args) {
        const registry = Services.get('TraitRegistry');
        if (registry) {
            registry.trigger(triggerName, subject, ...args);
        }
    }
}
