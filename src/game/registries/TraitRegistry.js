import { Log } from '../log.js';
import { Data } from '../../assets/data/data.js';

export const TraitRegistry = {
    handlers: {},

    /**
     * Registers a handler for a specific trait trigger or code.
     * @param {string} trigger - The event trigger (e.g., 'onTurnStart', 'onBattleEnd').
     * @param {string} code - The specific trait code (e.g., 'post_battle_heal').
     * @param {Function} handler - Function(unit, trait, ...args).
     */
    register(trigger, code, handler) {
        if (!this.handlers[trigger]) this.handlers[trigger] = {};
        this.handlers[trigger][code] = handler;
    },

    /**
     * Executes logic for a specific trait.
     * @param {string} trigger - The event trigger.
     * @param {Object} unit - The unit possessing the trait.
     * @param {Object} trait - The trait object.
     * @param {...any} args - Additional arguments passed from the event.
     */
    handle(trigger, unit, trait, ...args) {
        const triggerGroup = this.handlers[trigger];
        if (!triggerGroup) return;

        const handler = triggerGroup[trait.type];
        if (handler) {
            handler(unit, trait, ...args);
        }
    }
};

// --- Default Handlers (Migrated from Game_Battler) ---

TraitRegistry.register('onBattleEnd', 'post_battle_heal', (unit, trait) => {
    let amount = 0;
    if (trait.formula === 'level') amount = Math.floor(Math.pow(Math.random(), 2) * unit.level) + 1;
    else amount = parseInt(trait.formula) || 0;

    unit.hp = Math.min(unit.mhp, unit.hp + amount);
    Log.add(`${unit.name} was healed by Soothing Breeze.`);
});

TraitRegistry.register('onBattleEnd', 'post_battle_leech', (unit, trait, party) => {
    if (party) {
        const adjacent = unit.getAdjacentUnits(party);
        let totalDamage = 0;
        adjacent.forEach(target => {
            const damage = parseInt(trait.formula) || 0;
            target.hp = Math.max(0, target.hp - damage);
            totalDamage += damage;
            Log.add(`${unit.name} leeched ${damage} HP from ${target.name}.`);
        });
        const leechHeal = Math.floor(totalDamage / 2);
        unit.hp = Math.min(unit.mhp, unit.hp + leechHeal);
        Log.add(`${unit.name} recovered ${leechHeal} HP.`);
    }
});

TraitRegistry.register('onTurnStart', 'turn_heal', (unit, trait) => {
    const healAmount = parseInt(trait.formula) || 0;
    unit.hp = Math.min(unit.mhp, unit.hp + healAmount);
});

TraitRegistry.register('onUnitDeath', 'on_death_cast', (unit, trait, deadUnit) => {
    if (deadUnit.uid === unit.uid) {
        const skill = Data.skills[trait.skill.toLowerCase()];
        if (skill) {
            // Dynamically load dependencies to avoid circular imports during registry setup
            import('../classes/Game_Action.js').then(({ Game_Action }) => {
                if (window.Game && window.Game.BattleManager) {
                    const enemies = window.Game.BattleManager.enemies.filter(e => e.hp > 0);
                    const action = new Game_Action(unit);
                    action.setObject(skill);
                    enemies.forEach(target => {
                        action.apply(target);
                    });
                    Log.battle(`${unit.name} casts ${skill.name} upon death!`);
                }
            });
        }
    }
});

TraitRegistry.register('onUnitEvade', 'evade_bonus', (unit, trait, evadingUnit) => {
    if (evadingUnit.uid === unit.uid) {
        const maxBonus = Math.floor(unit.level / 2);
        if(!unit.evadeBonus) unit.evadeBonus = 0;
        if(unit.evadeBonus < maxBonus){
            unit.evadeBonus += 1;
            Log.battle(`${unit.name} gained +1 bonus from evading!`);
        }
    }
});
