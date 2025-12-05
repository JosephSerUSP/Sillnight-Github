import { Log } from '../log.js';
import { Data } from '../../assets/data/data.js';

/**
 * Registry for handling trait triggers and logic.
 * Decouples trait implementation from Game_Battler.
 */
export const TraitRegistry = {
    _handlers: {},

    /**
     * Registers a handler for a specific trait event/type.
     * @param {string} eventName - The event name (e.g., 'onBattleEnd').
     * @param {string} traitType - The specific trait type (e.g., 'post_battle_heal').
     * @param {Function} handler - The function to execute (battler, trait, ...args).
     */
    register(eventName, traitType, handler) {
        if (!this._handlers[eventName]) {
            this._handlers[eventName] = {};
        }
        this._handlers[eventName][traitType] = handler;
    },

    /**
     * Executes the logic for a triggered trait.
     * @param {string} eventName - The event name.
     * @param {Object} battler - The battler owning the trait.
     * @param {Object} trait - The trait object.
     * @param {...any} args - Additional arguments passed from the event.
     */
    execute(eventName, battler, trait, ...args) {
        const eventHandlers = this._handlers[eventName];
        if (!eventHandlers) return;

        const handler = eventHandlers[trait.type];
        if (handler) {
            handler(battler, trait, ...args);
        }
    },

    /**
     * Initializes the default trait handlers.
     */
    init() {
        // onBattleEnd Handlers
        this.register('onBattleEnd', 'post_battle_heal', (battler, trait) => {
            let amount = 0;
            if (trait.formula === 'level') {
                amount = Math.floor(Math.pow(Math.random(), 2) * battler.level) + 1;
            } else {
                amount = parseInt(trait.formula) || 0;
            }
            battler.hp = Math.min(battler.mhp, battler.hp + amount);
            Log.add(`${battler.name} was healed by Soothing Breeze.`);
        });

        this.register('onBattleEnd', 'post_battle_leech', (battler, trait, party) => {
            if (party) {
                const adjacent = battler.getAdjacentUnits(party);
                let totalDamage = 0;
                adjacent.forEach(target => {
                    const damage = parseInt(trait.formula) || 0;
                    target.hp = Math.max(0, target.hp - damage);
                    totalDamage += damage;
                    Log.add(`${battler.name} leeched ${damage} HP from ${target.name}.`);
                });
                const leechHeal = Math.floor(totalDamage / 2);
                battler.hp = Math.min(battler.mhp, battler.hp + leechHeal);
                Log.add(`${battler.name} recovered ${leechHeal} HP.`);
            }
        });

        // onTurnStart Handlers
        this.register('onTurnStart', 'turn_heal', (battler, trait) => {
            const healAmount = parseInt(trait.formula) || 0;
            battler.hp = Math.min(battler.mhp, battler.hp + healAmount);
        });

        // onUnitDeath Handlers
        this.register('onUnitDeath', 'on_death_cast', (battler, trait, deadUnit) => {
            if (deadUnit.uid === battler.uid) {
                const skill = Data.skills[trait.skill.toLowerCase()];
                if (skill) {
                    // We need to access Game_Action dynamically or pass it in.
                    // To keep Registry clean, we assume Game_Action is globally available or imported when needed.
                    // Ideally, the system calling this provides context, but for now we follow the pattern.
                    import('../classes/Game_Action.js').then(({ Game_Action }) => {
                        if (window.Game && window.Game.BattleManager) {
                            const enemies = window.Game.BattleManager.enemies.filter(e => e.hp > 0);
                            const action = new Game_Action(battler);
                            action.setObject(skill);
                            enemies.forEach(target => {
                                action.apply(target);
                            });
                            Log.battle(`${battler.name} casts ${skill.name} upon death!`);
                        }
                    });
                }
            }
        });

        // onUnitEvade Handlers
        this.register('onUnitEvade', 'evade_bonus', (battler, trait, evadingUnit) => {
            if (evadingUnit.uid === battler.uid) {
                const maxBonus = Math.floor(battler.level / 2);
                if (!battler.evadeBonus) battler.evadeBonus = 0;
                if (battler.evadeBonus < maxBonus) {
                    battler.evadeBonus += 1;
                    Log.battle(`${battler.name} gained +1 bonus from evading!`);
                }
            }
        });
    }
};

// Initialize default handlers immediately
TraitRegistry.init();
