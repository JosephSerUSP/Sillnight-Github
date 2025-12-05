export class BattleObserver {
    /**
     * Fires an event to all units (allies and enemies), triggering any relevant traits.
     * @param {string} eventName - The name of the event (e.g., 'onBattleEnd').
     * @param {...any} args - Additional arguments to pass to the handler.
     */
    fire(eventName, ...args) {
        import('../managers.js').then(({ BattleManager }) => {
            // Collect all potential targets for traits
            const allies = BattleManager.allies || [];
            // Access enemies via $gameTroop if available, or BattleManager fallback
            const enemies = window.$gameTroop ? window.$gameTroop.members() : (BattleManager.enemies || []);

            const allUnits = [...allies, ...enemies];

            allUnits.forEach(unit => {
                if (unit.hp <= 0) return; // Dead units usually don't trigger traits, unless specific 'onDeath' traits?
                // Assuming active traits only for living units for now.
                if (typeof unit.triggerTraits === 'function') {
                    unit.triggerTraits(eventName, ...args);
                }
            });
        });
    }
}
