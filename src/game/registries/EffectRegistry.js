import { Registry } from './Registry.js';
import { Services } from '../ServiceLocator.js';

/**
 * Registry for handling effect logic.
 * Maps effect codes to handler functions that resolve authoritative state changes.
 *
 * Resolution and presentation publication are deliberately separate:
 * - resolve() mutates authoritative battle state and returns presentation events;
 * - publish() emits those events at the presentation timing chosen by the caller;
 * - apply() preserves the legacy immediate resolve+publish behavior for callers
 *   that have not migrated to the explicit boundary yet.
 */
export class EffectRegistry extends Registry {
    constructor() {
        super();
        this._handlers = new Map();
        this._registerDefaultHandlers();
    }

    /**
     * Registers a handler for an effect code.
     * @param {string} code - The effect code (e.g., 'hp_damage').
     * @param {Function} handler - Function(effect, source, target, value, isCrit, queueEvent)
     */
    registerHandler(code, handler) {
        this._handlers.set(code, handler);
    }

    /**
     * Resolves an effect against authoritative battle state without publishing
     * presentation events yet.
     *
     * @param {Object} effect - The effect data object.
     * @param {Game_Battler} source - The source of the effect.
     * @param {Game_Battler} target - The target of the effect.
     * @param {number} value - The calculated value (damage/heal amount).
     * @param {boolean} isCrit - Whether it was a critical hit.
     * @param {boolean} isMiss - Whether it missed.
     * @returns {Array<{type: string, payload: any}>} Deferred presentation events.
     */
    resolve(effect, source, target, value, isCrit, isMiss) {
        const events = [];
        const queueEvent = (type, payload) => events.push({ type, payload });

        if (isMiss) {
            queueEvent('battle:action_missed', { target });
            return events;
        }

        const handler = this._handlers.get(effect.type);
        if (handler) {
            handler(effect, source, target, value, isCrit, queueEvent);
        } else {
            console.warn(`No handler for effect type: ${effect.type}`);
        }

        return events;
    }

    /**
     * Publishes presentation events produced by resolve().
     * @param {Array<{type: string, payload: any}>} events
     */
    publish(events = []) {
        events.forEach(({ type, payload }) => {
            Services.events.emit(type, payload);
        });
    }

    /**
     * Legacy compatibility path: resolve state and publish its presentation
     * events immediately.
     *
     * @returns {Array<{type: string, payload: any}>} Published events.
     */
    apply(effect, source, target, value, isCrit, isMiss) {
        const events = this.resolve(effect, source, target, value, isCrit, isMiss);
        this.publish(events);
        return events;
    }

    _registerDefaultHandlers() {
        // HP Damage
        this.registerHandler('hp_damage', (effect, source, target, value, isCrit, queueEvent) => {
            let dealtDamage = value;
            let newHp = target.hp - dealtDamage;

            // Check for survive KO trait
            const surviveChance = target.traitsSum('survive_ko');
            if (newHp <= 0 && Math.random() < surviveChance) {
                newHp = 1;
                dealtDamage = target.hp > 0 ? target.hp - 1 : 0;
                queueEvent('battle:log', `> ${target.name} survives with 1 HP!`);
            }

            target.hp = Math.max(0, newHp);
            if (dealtDamage > 0 || value === 0) {
                queueEvent('battle:damage_dealt', { source, target, value: dealtDamage, isCrit });
            }
            if (target.hp <= 0) {
                queueEvent('battle:unit_death', { unit: target });
                this._checkReviveOnKo(target, queueEvent);
            }
        });

        // HP Heal (Flat)
        this.registerHandler('hp_heal', (effect, source, target, value, isCrit, queueEvent) => {
            const healAmount = value;
            target.hp = Math.min(target.mhp, target.hp + healAmount);
            queueEvent('battle:heal_dealt', { source, target, value: healAmount });
        });

        // HP Heal (Ratio)
        this.registerHandler('hp_heal_ratio', (effect, source, target, value, isCrit, queueEvent) => {
            // Value is calculated in Game_Action, so we use it directly.
            const healAmount = value;
            target.hp = Math.min(target.mhp, target.hp + healAmount);
            queueEvent('battle:heal_dealt', { source, target, value: healAmount });
        });

        // Revive
        this.registerHandler('revive', (effect, source, target, value, isCrit, queueEvent) => {
            if (target.hp <= 0) {
                const revivedHp = value;
                target.hp = revivedHp;
                queueEvent('battle:log', `> ${target.name} was revived with ${revivedHp} HP.`);
                queueEvent('battle:unit_revived', { unit: target });
            } else {
                // Heal if target is alive.
                const healAmount = value;
                target.hp = Math.min(target.mhp, target.hp + healAmount);
                queueEvent('battle:heal_dealt', { source, target, value: healAmount });
            }
        });

        // Increase Max HP
        this.registerHandler('increase_max_hp', (effect, source, target, value, isCrit, queueEvent) => {
            const bonus = value;
            if (typeof target.maxHpBonus !== 'undefined') {
                target.maxHpBonus += bonus;
            }
            target.hp += bonus;
            queueEvent('battle:log', `> ${target.name}'s Max HP increased by ${bonus}.`);
        });

        // Add Status
        this.registerHandler('add_status', (effect, source, target, value, isCrit, queueEvent) => {
            if (Math.random() < (effect.chance || 1)) {
                if (typeof target.addState === 'function') {
                    target.addState(effect.status);
                } else {
                    if (!target.status) target.status = [];
                    if (!target.status.includes(effect.status)) {
                        target.status.push(effect.status);
                    }
                }
                queueEvent('battle:state_added', { target, state: effect.status });
            }
        });

        // Miss (Explicit effect)
        this.registerHandler('miss', (effect, source, target, value, isCrit, queueEvent) => {
            queueEvent('battle:action_missed', { target });
        });
    }

    _checkReviveOnKo(target, queueEvent) {
        const reviveChance = target.traitsSum('revive_on_ko_chance');
        if (Math.random() < reviveChance) {
            const revivePercent = target.traitsSum('revive_on_ko_percent') || 0.5;
            const revivedHp = Math.floor(target.mhp * revivePercent);
            target.hp = revivedHp;
            queueEvent('battle:log', `> ${target.name} was revived with ${revivedHp} HP!`);
            queueEvent('battle:unit_revived', { unit: target });
        }
    }
}
