import { BattleManager } from '../managers.js';
// Note: We avoid importing Game directly if possible to avoid circular deps,
// but we might need access to $gameTroop.
// However, since BattleManager and $gameTroop are globals, we can access them dynamically.

export class BattleObserver {
    constructor() {
        // No state needed for now
    }

    /**
     * Fires an event to all units, triggering any relevant traits.
     * @param {string} eventName - The name of the event (e.g., 'onBattleEnd').
     * @param {...any} args - Additional arguments to pass to the handler.
     */
    fire(eventName, ...args) {
        // Use globals to find units.
        // BattleManager.allies is an array of Game_Actor
        // window.$gameTroop.members() returns array of Game_Enemy

        const allies = BattleManager.allies || [];
        const enemies = (window.$gameTroop && window.$gameTroop.members()) || [];
        const allUnits = [...allies, ...enemies];

        allUnits.forEach(unit => {
            if (unit.hp <= 0) return;
            if (typeof unit.triggerTraits === 'function') {
                unit.triggerTraits(eventName, ...args);
            }
        });
    }
}
