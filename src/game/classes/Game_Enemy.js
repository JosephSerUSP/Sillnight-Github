import { Game_Battler } from './Game_Battler.js';
import { Game_Action } from './Game_Action.js';
import { Services } from '../ServiceLocator.js';
import { Config } from '../Config.js';

/**
 * Represents an enemy in the game.
 * Extends Game_Battler to add enemy-specific logic like drop items and AI.
 */
export class Game_Enemy extends Game_Battler {
    /**
     * @param {string} speciesId - The species ID from Data.creatures.
     * @param {number} x - The X coordinate (unused in 3D battle).
     * @param {number} y - The Y coordinate (unused in 3D battle).
     * @param {number} [levelMultiplier=1] - Multiplier for stats to simulate higher levels.
     */
    constructor(speciesId, x, y, levelMultiplier = 1) {
        super();
        /** @type {string} */
        this._speciesId = speciesId;
        /** @type {number} */
        this._levelMultiplier = levelMultiplier;
        /** @type {string} */
        this._uid = `e_${speciesId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        /** @type {number} */
        this._level = 1; // Enemies nominally level 1, but stats scaled by multiplier

        this.setup(speciesId);
    }

    /** @returns {string} The unique ID. */
    get uid() { return this._uid; }
    /** @returns {string} The species ID. */
    get speciesId() { return this._speciesId; }

    /**
     * Sets up the enemy based on species data.
     * @param {string} speciesId - The species ID.
     */
    setup(speciesId) {
        // Use Registry instead of direct Data access
        const def = Services.get('CreatureRegistry').get(speciesId);
        if (!def) {
             console.error(`Enemy species not found in registry: ${speciesId}`);
             this._name = 'Unknown';
             return;
        }
        this._name = def.name;
        this.recoverAll(); // Sets HP/MP to max
    }

    /**
     * Generates actions for the current turn using AI logic.
     * @param {Array<Game_Battler>} friends - Allies of this unit.
     * @param {Array<Game_Battler>} opponents - Enemies of this unit.
     */
    makeActions(friends, opponents) {
        this._currentAction = null;
        // possibleActs logic copied from BattleManager
        const possibleActs = [...(this.acts[0] || []), ...(this.acts[1] || [])];
        if (possibleActs.length === 0) {
            super.makeActions(friends, opponents);
            return;
        }

        let chosen = null;
        if (this.temperament === 'kind' && friends) {
            const hurt = friends.filter(f => f.hp < f.mhp).sort((a, b) => a.hp - b.hp)[0];
            if (hurt && hurt.hp < hurt.mhp * 0.6) {
                const skillRegistry = Services.get('SkillRegistry');
                for (const a of possibleActs) {
                    const skill = skillRegistry.get(a) || skillRegistry.get(a.toLowerCase());
                    if (skill && skill.category === 'heal') {
                        // Don't pick revival skills if the target is alive
                        const isRevive = skill.effects && skill.effects.some(e => e.type === 'revive');
                        if (isRevive && hurt.hp > 0) continue;

                        chosen = a;
                        break;
                    }
                }
            }
        }

        if (!chosen) {
            chosen = possibleActs[Math.floor(Math.random() * possibleActs.length)];
        }

        // Create Game_Action
        const skillRegistry = Services.get('SkillRegistry');
        const itemRegistry = Services.get('ItemRegistry');

        let actionData = skillRegistry.get(chosen) || itemRegistry.get(chosen);

        // Legacy fallback for case-insensitivity
        if (!actionData) {
             const chosenLower = chosen.toLowerCase();
             const allSkillIds = skillRegistry.getAll().map(s => s.id);
             const skillKey = allSkillIds.find(k => k.toLowerCase() === chosenLower);
             if (skillKey) actionData = skillRegistry.get(skillKey);
             else {
                 const allItemIds = itemRegistry.getAll().map(i => i.id);
                 const itemKey = allItemIds.find(k => k.toLowerCase() === chosenLower);
                 if (itemKey) actionData = itemRegistry.get(itemKey);
             }
        }

        if (!actionData) actionData = skillRegistry.get('attack');

        const action = new Game_Action(this);
        action.setObject(actionData);
        this._currentAction = action;
    }

    /**
     * returns the objects that provide traits.
     * @returns {Array<Object>}
     */
    traitObjects() {
        const objects = super.traitObjects();
        const species = Services.get('CreatureRegistry').get(this._speciesId);
        if (species) {
            objects.push(species);
            if (species.passives) {
                species.passives.forEach(pId => {
                    const passive = Services.get('PassiveRegistry').get(pId);
                    if (passive) objects.push(passive);
                });
            }
        }
        return objects;
    }

    /**
     * Fully recovers HP and MP, and clears states.
     */
    recoverAll() {
        this._hp = this.mhp;
        this._mp = this.mmp;
        this._states = [];
    }

    /** @returns {string} The name of the enemy. */
    get name() { return this._name; }

    /** @returns {string} The sprite character. */
    get sprite() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.sprite : '?';
    }
    /** @returns {string|undefined} The sprite asset path. */
    get spriteAsset() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.spriteAsset : undefined;
    }

    /**
     * Calculates the base parameter value.
     * Scales MaxHP by the level multiplier.
     * @param {number} paramId - The parameter ID.
     * @returns {number} The base value.
     */
    paramBase(paramId) {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        if (!def) return 0;

        if (paramId === 0) { // mhp
             return Math.floor(def.baseHp * this._levelMultiplier);
        }
        // 2: atk, 3: def, 4: mat, 5: mdf, 6: agi, 7: luk
        if (paramId >= 2 && paramId <= 7) {
            const keys = [null, null, 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
            const key = keys[paramId];
            return def[key] !== undefined ? def[key] : 100;
        }
        return 0;
    }

    // Compatibility
    /** @returns {number} The nominal level. */
    get level() { return this._level; }
    /** @returns {Array} List of action patterns. */
    get acts() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.acts : [];
    }
    /** @returns {string} The temperament. */
    get temperament() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        return def ? def.temperament : 'free';
    }
    /** @returns {Array} Elemental affinities. */
    get elements() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        // Start with innate elements
        const innate = def ? (def.elements || []) : [];
        // Check for element overrides from traits
        const traitElements = this.elementTraits;
        return traitElements.length > 0 ? traitElements : innate;
    }

    /**
     * Calculates the XP value yielded by this enemy.
     * @returns {number}
     */
    xpValue() {
        const def = Services.get('CreatureRegistry').get(this._speciesId);
        const baseXp = def ? (def.baseXp || 0) : 0;
        const globalXp = Config.Rewards ? Config.Rewards.baseXpPerEnemy : 5;
        // Formula: (Species Base XP + Global Base XP) * Level Multiplier
        return Math.floor((baseXp + globalXp) * this._levelMultiplier);
    }

    /**
     * Calculates the Gold value yielded by this enemy.
     * @returns {number}
     */
    goldValue() {
        // Simple formula based on config
        const globalGold = Config.Rewards ? Config.Rewards.baseGoldPerEnemy : 20;
        return Math.floor(globalGold * this._levelMultiplier);
    }
}
