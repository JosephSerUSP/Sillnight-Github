import { Game_BattlerBase } from './Game_BattlerBase.js';
import { Log } from '../log.js';
import { Services } from '../ServiceLocator.js';
import { Config } from '../Config.js';

/**
 * Superclass for actors and enemies.
 * Adds battle-specific functionality like actions, speed, and turn handling.
 */
export class Game_Battler extends Game_BattlerBase {
    constructor() {
        super();
        /** @type {Array} The actions the battler will perform. */
        this._actions = [];
        /** @type {number} The speed of the battler for turn order. */
        this._speed = 0;
        /** @type {Object|null} The result of the last action. */
        this._result = null;
        /** @type {boolean} Whether the battler is currently selected. */
        this._selected = false;
        /** @type {number} The battler's index in the party/troop. */
        this._slotIndex = -1;
    }

    /** @returns {number} The slot index. */
    get slotIndex() { return this._slotIndex; }
    /** @param {number} val - The new slot index. */
    set slotIndex(val) { this._slotIndex = val; }

    /**
     * @returns {string} Name of the battler. To be overridden.
     */
    get name() { return ''; }

    /**
     * @returns {number} Current speed (for turn order).
     * Calculates base speed bonus from traits plus the transient speed value.
     */
    get speed() {
        return this._speed + this.traitsSum('speed_bonus');
    }

    /** @param {number} value - The new speed value. */
    set speed(value) { this._speed = value; }

    // --- Derived Stats (Traits) ---

    /** @returns {number} Critical Hit Rate (0-1). Base 5% + traits. */
    get cri() {
        return (Config.baseCritChance || 0.05) + this.traitsSum('crit_bonus_percent');
    }

    /** @returns {number} Evasion Rate (0-1). */
    get eva() {
        return this.traitsSum('evade_chance'); // Assuming 'evade_chance' trait type exists or will exist
    }

    /** @returns {number} Hit Rate (0-1). */
    get hit() {
        return 1.0 + this.traitsSum('hit_bonus');
    }

    /** @returns {number} Attack Power Bonus (Additive). */
    get power() {
        return this.traitsSum('power_bonus');
    }

    /** @returns {number} XP Bonus Percent. */
    get xpRate() {
        return this.traitsSum('xp_bonus_percent');
    }

    /** @returns {Array<string>} List of element changes/affinities. */
    get elementTraits() {
        return this.traitsSet('element_change').map(t => t.element);
    }

    /**
     * Called at the start of a turn.
     * Use to regenerate HP/MP or update states.
     */
    onTurnStart() {
        // Regenerate HP/MP, update states/buffs
        this.triggerTraits('onTurnStart');
    }

    /**
     * Called at the end of a turn.
     * Use to update state durations.
     */
    onTurnEnd() {
        // Update states/buffs turns
    }

    /**
     * Called when a battle starts.
     */
    onBattleStart() {
        this.onTurnStart();
    }

    /**
     * Called when a battle ends.
     * Clears results and temporary states.
     */
    onBattleEnd(party) {
        this._result = null;
        this.removeBattleStates();
        this.triggerTraits('onBattleEnd', party);
    }

    /**
     * Removes states that expire at the end of battle.
     */
    removeBattleStates() {
        // Remove states that should expire at battle end
    }

    // Actions
    /**
     * Generates actions for the current turn.
     * (Placeholder for AI or input handling).
     */
    makeActions() {
        this._actions = [];
        // Logic to decide actions (AI or Input placeholder)
    }

    /**
     * Triggers traits for a specific event.
     * @param {string} eventName - The name of the event.
     * @param {...any} args - Additional arguments.
     */
    triggerTraits(eventName, ...args) {
        const traits = this.traits();
        traits.forEach(trait => {
            this.handleTrait(eventName, trait, ...args);
        });
    }

    /**
     * Handles a specific trait trigger.
     * @param {string} eventName - The event name.
     * @param {Object} trait - The trait object.
     * @param {...any} args - Additional arguments.
     */
    handleTrait(eventName, trait, ...args) {
        switch (eventName) {
            case 'onBattleEnd':
                if (this.evadeBonus) this.evadeBonus = 0;
                if (trait.type === 'post_battle_heal') {
                    let amount = 0;
                    if (trait.formula === 'level') amount = Math.floor(Math.pow(Math.random(), 2) * this.level) + 1;
                    else amount = parseInt(trait.formula) || 0;

                    this.hp = Math.min(this.mhp, this.hp + amount);
                    Log.add(`${this.name} was healed by Soothing Breeze.`);
                } else if (trait.type === 'post_battle_leech') {
                    const party = args[0];
                    if (party) {
                        const adjacent = this.getAdjacentUnits(party);
                        let totalDamage = 0;
                        adjacent.forEach(target => {
                            const damage = parseInt(trait.formula) || 0;
                            target.hp = Math.max(0, target.hp - damage);
                            totalDamage += damage;
                            Log.add(`${this.name} leeched ${damage} HP from ${target.name}.`);
                        });
                        const leechHeal = Math.floor(totalDamage / 2);
                        this.hp = Math.min(this.mhp, this.hp + leechHeal);
                        Log.add(`${this.name} recovered ${leechHeal} HP.`);
                    }
                }
                break;
            case 'onTurnStart':
                if (trait.type === 'turn_heal') {
                    const healAmount = parseInt(trait.formula) || 0;
                    this.hp = Math.min(this.mhp, this.hp + healAmount);
                }
                break;
            case 'onUnitDeath':
                if (trait.type === 'on_death_cast') {
                    const [deadUnit] = args;
                    if (deadUnit.uid === this.uid) {
                        const skillId = trait.skill.toLowerCase();
                        // Use Registry to find skill, ensuring it exists
                        const skill = Services.get('SkillRegistry').get(skillId);
                        if (skill) {
                            // Dynamically load dependencies to avoid circles
                            import('../classes/Game_Action.js').then(({ Game_Action }) => {
                                if (window.Game && window.Game.BattleManager) {
                                    const enemies = window.Game.BattleManager.enemies.filter(e => e.hp > 0);
                                    const action = new Game_Action(this);
                                    action.setObject(skill);
                                    enemies.forEach(target => {
                                        action.apply(target);
                                    });
                                    Log.battle(`${this.name} casts ${skill.name} upon death!`);
                                }
                            });
                        }
                    }
                }
                break;
            case 'onUnitEvade':
                 if (trait.type === 'evade_bonus') {
                    const [evadingUnit] = args;
                    if (evadingUnit.uid === this.uid) {
                        const maxBonus = Math.floor(this.level / 2);
                        if(!this.evadeBonus) this.evadeBonus = 0;
                        if(this.evadeBonus < maxBonus){
                            this.evadeBonus += 1;
                            Log.battle(`${this.name} gained +1 bonus from evading!`);
                        }
                    }
                }
                break;
        }
    }
}
