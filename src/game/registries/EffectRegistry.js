import { Registry } from './Registry.js';
import { Log } from '../log.js';
import { Services } from '../ServiceLocator.js';
import * as Systems from '../systems.js';
import { Data } from '../../assets/data/data.js';

/**
 * Registry for handling effect logic.
 * Maps effect codes to handler functions that apply the effect.
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
     * @param {Function} handler - Function(effect, source, target, result)
     */
    registerHandler(code, handler) {
        this._handlers.set(code, handler);
    }

    /**
     * Applies an effect result to a target.
     * @param {Object} effect - The effect data object.
     * @param {Game_Battler} source - The source of the effect.
     * @param {Game_Battler} target - The target of the effect.
     * @param {number} value - The calculated value (damage/heal amount).
     * @param {boolean} isCrit - Whether it was a critical hit.
     * @param {boolean} isMiss - Whether it missed.
     */
    apply(effect, source, target, value, isCrit, isMiss) {
        if (isMiss) {
            Services.events.emit('battle:action_missed', { target });
            return;
        }

        const handler = this._handlers.get(effect.type);
        if (handler) {
            handler(effect, source, target, value, isCrit);
        } else {
            console.warn(`No handler for effect type: ${effect.type}`);
        }
    }

    _registerDefaultHandlers() {
        // HP Damage
        this.registerHandler('hp_damage', (effect, source, target, value, isCrit) => {
            let dealtDamage = value;
            let newHp = target.hp - dealtDamage;

            // Check for survive KO trait
            const surviveChance = target.traitsSum('survive_ko');
            if (newHp <= 0 && Math.random() < surviveChance) {
                newHp = 1;
                dealtDamage = target.hp > 0 ? target.hp - 1 : 0;
                Services.events.emit('battle:log', `> ${target.name} survives with 1 HP!`);
            }

            target.hp = Math.max(0, newHp);
            if (dealtDamage > 0 || value === 0) {
                Services.events.emit('battle:damage_dealt', { source, target, value: dealtDamage, isCrit });
            }
            if (target.hp <= 0) {
                Services.events.emit('battle:unit_death', { unit: target });
                this._checkReviveOnKo(target);
            }
        });

        // HP Heal (Flat)
        this.registerHandler('hp_heal', (effect, source, target, value) => {
            const healAmount = value;
            target.hp = Math.min(target.mhp, target.hp + healAmount);
            Services.events.emit('battle:heal_dealt', { source, target, value: healAmount });
        });

        // HP Heal (Ratio)
        this.registerHandler('hp_heal_ratio', (effect, source, target, value) => {
            // Value is calculated in Game_Action, so we use it directly
            const healAmount = value;
            target.hp = Math.min(target.mhp, target.hp + healAmount);
            Services.events.emit('battle:heal_dealt', { source, target, value: healAmount });
        });

        // Revive
        this.registerHandler('revive', (effect, source, target, value) => {
            if (target.hp <= 0) {
                const revivedHp = value;
                target.hp = revivedHp;
                Services.events.emit('battle:log', `> ${target.name} was revived with ${revivedHp} HP.`);
                const ts = Systems.Battle3D.sprites[target.uid];
                if (ts) ts.visible = true;
            }
        });

        // Increase Max HP
        this.registerHandler('increase_max_hp', (effect, source, target, value) => {
            // value passed from Game_Action logic might need re-evaluation if it's formula based
            // But here we might just re-parse formula if needed, or rely on Game_Action passing correct 'value'
            // Game_Action.evalDamageFormula handles formula.
            const bonus = value;
            if (typeof target.maxHpBonus !== 'undefined') {
                target.maxHpBonus += bonus;
            }
            target.hp += bonus;
            Services.events.emit('battle:log', `> ${target.name}'s Max HP increased by ${bonus}.`);
        });

        // Add Status
        this.registerHandler('add_status', (effect, source, target, value) => {
            if (Math.random() < (effect.chance || 1)) {
                if (typeof target.addState === 'function') {
                    target.addState(effect.status);
                } else {
                    if (!target.status) target.status = [];
                    if (!target.status.includes(effect.status)) {
                        target.status.push(effect.status);
                    }
                }
                Services.events.emit('battle:state_added', { target, state: effect.status });
            }
        });

        // Miss (Explicit effect)
        this.registerHandler('miss', (effect, source, target, value) => {
            Services.events.emit('battle:action_missed', { target });
        });
    }

    _checkReviveOnKo(target) {
        // Revive check
        const reviveChance = target.traitsSum('revive_on_ko_chance');
        if (Math.random() < reviveChance) {
            const revivePercent = target.traitsSum('revive_on_ko_percent') || 0.5;
            const revivedHp = Math.floor(target.mhp * revivePercent);
            target.hp = revivedHp;
            Services.events.emit('battle:log', `> ${target.name} was revived with ${revivedHp} HP!`);
            const revivedTs = Systems.Battle3D.sprites[target.uid];
            if (revivedTs) revivedTs.visible = true;
        }
    }
}
