import { Data } from '../../assets/data/data.js';
import * as Systems from '../systems.js';
import { Game_Enemy } from '../classes/Game_Enemy.js';
import { Game_Action } from '../classes/Game_Action.js';
import { Services } from '../ServiceLocator.js';
import { Config } from '../Config.js';

/**
 * Manages the flow and state of battle.
 * Handles encounter setup, turn processing, and victory/defeat conditions.
 * Decoupled from UI via EventBus.
 * @namespace BattleManager
 */
export const BattleManager = {
    /** @type {Array<Object>} List of ally battlers. */
    allies: [],
    /** @type {Array<Object>} List of enemy battlers. */
    enemies: [],
    /** @type {Array<Object>} Turn order queue. */
    queue: [],
    /** @type {number} Current turn index within the round. */
    turnIndex: 0,
    /** @type {number} Current round number. */
    roundCount: 0,
    /** @type {boolean} Flag indicating if the player has requested a manual turn. */
    playerTurnRequested: false,
    /** @type {string} Current battle phase (INIT, ROUND_START, PLAYER_INPUT, etc.). */
    phase: 'INIT',

    /**
     * Initializes the BattleManager.
     */
    init() {
        this.effectRegistry = Services.get('EffectRegistry');
    },

    /**
     * Sets up the battle state with specific units.
     * @param {Array<Object>} allies - The ally units.
     * @param {Array<Object>} enemies - The enemy units.
     */
    setup(allies, enemies) {
        this.allies = allies;
        this.enemies = enemies;
        this.queue = [];
        this.turnIndex = 0;
        this.roundCount = 0;
        this.playerTurnRequested = false;
        this.phase = 'INIT';
    },

    /**
     * Helper to start a fixed encounter by enemy IDs (e.g. for testing).
     * @param {Array<string>} enemyIds - List of enemy species IDs.
     */
    async startFixedEncounter(enemyIds) {
        const enemies = enemyIds.map((id, i) => {
             const e = new Game_Enemy(id, 0, 0, 1);
             e.slotIndex = i;
             return e;
        });
        await this._startEncounterWithEnemies(enemies);
    },

    /**
     * Internal method to start encounter with pre-generated enemies.
     * @param {Array<Game_Enemy>} enemies
     */
    async _startEncounterWithEnemies(enemies) {
        Systems.sceneHooks?.onBattleStart?.();
        if (window.Game && window.Game.ui) {
            window.Game.ui.mode = 'BATTLE';
        }

        // Wait for scene switch (handles DOM race conditions)
        await window.Game.Scenes.battle.switchScene(true);

        Systems.Battle3D.cameraState.angle = -Math.PI / 4;
        Systems.Battle3D.cameraState.targetAngle = -Math.PI / 4;
        Systems.Battle3D.setFocus('neutral');
        Systems.Battle3D.resize();

        const allies = window.$gameParty.activeSlots.filter(u => u !== null);

        this.setup(allies, enemies);

        Systems.Battle3D.setupScene(this.allies, this.enemies);

        // Emit battle start event
        Services.events.emit('battle:start', { enemies: this.enemies });

        // Brief delay before first round starts to allow player to see enemies
        setTimeout(() => this.nextRound(), 1000);
    },

    /**
     * Generates a random encounter based on the current floor and starts it.
     */
    async startEncounter() {
        const floor = window.$gameMap.floor;
        const dungeon = Data.dungeons.default;
        const enc = dungeon.encounters;
        const pool = enc.pools.find(p => floor >= p.floors[0] && floor <= p.floors[1]);
        const enemyTypes = pool ? pool.enemies : [];
        const enemyCount = Math.floor(Math.random() * (enc.count.max - enc.count.min + 1)) + enc.count.min;
        const enemies = [];

        for (let i = 0; i < enemyCount; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const mult = 1 + (floor * 0.1);

            const enemy = new Game_Enemy(type, 0, 0, mult);
            enemy.slotIndex = i;
            // Ensure full heal after scaling
            enemy.recoverAll();
            enemies.push(enemy);
        }

        await this._startEncounterWithEnemies(enemies);
    },

    /**
     * Proceeds to the next round of combat.
     * Re-calculates turn order and checks win/loss conditions.
     */
    nextRound() {
        this.roundCount++;
        this.phase = 'ROUND_START';

        Services.events.emit('battle:round_start', { round: this.roundCount });

        Systems.Battle3D.setFocus('neutral');
        if (this.allies.every(u => u.hp <= 0)) return this.end(false);
        if (this.enemies.every(u => u.hp <= 0)) return this.end(true);

        [...this.allies, ...this.enemies].forEach(u => {
             // Remove 'guarding' state
             if (typeof u.removeState === 'function') {
                 if (u.isStateAffected && u.isStateAffected('guarding')) {
                     u.removeState('guarding');
                 }
                 if (u.status) u.status = u.status.filter(s => s !== 'guarding');
             } else if (u.status) {
                 u.status = u.status.filter(s => s !== 'guarding');
             }
        });

        if (this.playerTurnRequested) {
            this.phase = 'PLAYER_INPUT';
            this.playerTurnRequested = false;

            // Emit player turn request event (false = cancel queue status, implied active)
            // Ideally we emit 'start_player_turn'
            Services.events.emit('battle:player_turn_request', false);
            Services.events.emit('battle:player_turn_start');
            Services.events.emit('battle:log', 'Waiting for orders...');
            return;
        }

        const allUnits = [...this.allies, ...this.enemies]
            .filter(u => u.hp > 0);

        const summoner = window.$gameParty?.summoner;
        const nonSummonerUnits = summoner
            ? allUnits.filter(u => u.uid !== summoner.uid)
            : allUnits;

        nonSummonerUnits.sort((a, b) => b.speed - a.speed || Math.random() - 0.5);
        this.queue = (summoner && summoner.hp > 0)
            ? [summoner, ...nonSummonerUnits]
            : nonSummonerUnits;
        this.turnIndex = 0;

        this.processNextTurn();
    },

    /**
     * Processes the next turn in the queue.
     * Executes AI actions or waits for animations.
     */
    processNextTurn() {
            // Replaces: window.Game.Windows.Party.refresh();
            // BattleObserver handles Party refresh on events usually,
            // but we might want to ensure sync here.

            if (this.turnIndex >= this.queue.length) {
                setTimeout(() => this.nextRound(), 1000);
                return;
            }
            const unit = this.queue[this.turnIndex++];

            if (unit.hp <= 0) {
                this.processNextTurn();
                return;
            }

            Services.events.emit('battle:turn_start', { unit });

            const isAlly = this.allies.some(a => a.uid === unit.uid);
            const enemies = isAlly ? this.enemies : this.allies;
            const friends = isAlly ? this.allies : this.enemies;
            const possibleActs = [...unit.acts[0], ...(unit.acts[1] || [])];
            let chosen = null;
            if (unit.temperament === 'kind') {
                const hurt = friends.filter(f => f.hp < f.mhp).sort((a, b) => a.hp - b.hp)[0];
                if (hurt && hurt.hp < hurt.mhp * 0.6) {
                    for (const a of possibleActs) {
                        const skill = Services.get('SkillRegistry').get(a) || Services.get('SkillRegistry').get(a.toLowerCase());
                        if (skill && skill.category === 'heal') { chosen = a; break; }
                    }
                }
            }
            if (!chosen) {
                chosen = possibleActs[Math.floor(Math.random() * possibleActs.length)];
            }

            let actionData = null;

            // Try explicit lookup in registries first
            const skillRegistry = Services.get('SkillRegistry');
            const itemRegistry = Services.get('ItemRegistry');

            // Note: chosen is usually an ID string (e.g. 'attack', 'cure')
            // Registries expect the exact ID.
            if (skillRegistry.get(chosen)) {
                actionData = skillRegistry.get(chosen);
            } else if (itemRegistry.get(chosen)) {
                actionData = itemRegistry.get(chosen);
            } else {
                // Fallback: Case-insensitive search (Legacy support)
                // This is expensive and should be deprecated, but kept for safety during migration
                const chosenLower = chosen.toLowerCase();
                const allSkillIds = skillRegistry.getAll().map(s => s.id);
                const skillKey = allSkillIds.find(k => k.toLowerCase() === chosenLower);

                if (skillKey) {
                    actionData = skillRegistry.get(skillKey);
                } else {
                    const allItemIds = itemRegistry.getAll().map(i => i.id);
                    const itemKey = allItemIds.find(k => k.toLowerCase() === chosenLower);
                    if (itemKey) {
                        actionData = itemRegistry.get(itemKey);
                    } else {
                        actionData = skillRegistry.get('attack');
                    }
                }
            }

            // Create Game_Action instance
            const action = new Game_Action(unit);
            action.setObject(actionData);

            if (isAlly) {
                window.$gameParty?.onAllyAction(unit);
            }

            let targets = [];
            let validEnemies = enemies.filter(u => u.hp > 0);
            const validFriends = friends.filter(u => u.hp > 0);
            if (actionData.target === 'self') targets = [unit];
            else if (actionData.target === 'ally-single') targets = [validFriends.sort((a, b) => a.hp - b.hp)[0]];
            else if (actionData.target === 'enemy-all') targets = validEnemies;
            else if (actionData.target === 'enemy-row') {
                const frontRow = validEnemies.filter(e => e.slotIndex < 3);
                const backRow = validEnemies.filter(e => e.slotIndex >= 3);
                targets = frontRow.length > 0 ? frontRow : backRow;
            } else {
                if (!isAlly && actionData.target !== 'enemy-all' && actionData.target !== 'enemy-row') {
                    const nonSummonerEnemies = validEnemies.filter(e => !e.isSummoner);
                    if (nonSummonerEnemies.length > 0) {
                        validEnemies = nonSummonerEnemies;
                    }
                }
                targets = [validEnemies[Math.floor(Math.random() * validEnemies.length)]];
            }
            if (targets.length === 0 || !targets[0]) {
                this.processNextTurn();
                return;
            }

            Services.events.emit('battle:action_used', { unit, action: actionData, targets });

            // Use Game_Action to apply effects
            const allResults = [];
            targets.forEach(t => {
                const res = action.apply(t);
                allResults.push(...res);
            });

            if (allResults.length === 0) {
                 // Log handled by observer
            }

            const script = Data.actionScripts[actionData.script] || Data.actionScripts.attack || [];

            // Apply effects via animation callback
            const applyResults = () => {
                allResults.forEach(({ target, value, effect, isCrit, isMiss }) => {
                    if (!target) return;
                    this.effectRegistry.apply(effect, unit, target, value, isCrit, isMiss);
                });
                // Party refresh handled by observer
                if (this.allies.every(u => u.hp <= 0) || this.enemies.every(u => u.hp <= 0)) {
                    this.turnIndex = 999; // End round early
                }
            };

            Systems.Battle3D.playAnim(unit.uid, script, {
                targets,
                onApply: applyResults,
                onComplete: () => setTimeout(() => this.processNextTurn(), 600)
            });
    },

    /**
     * Flags a request for manual player input at the next opportunity.
     */
    requestPlayerTurn() {
        if (window.Game && window.Game.ui && window.Game.ui.mode === 'BATTLE') {
            this.playerTurnRequested = true;
            Services.events.emit('battle:player_turn_request', true);
        }
    },

    /**
     * Resumes automatic battle processing.
     */
    resumeAuto() {
        this.playerTurnRequested = false;
        Services.events.emit('battle:player_turn_end'); // Signals UI to hide buttons
        Services.events.emit('battle:player_turn_request', false);
        this.processNextTurn();
    },

    /**
     * Ends the battle and displays the result.
     * @param {boolean} win - True if the player won.
     */
    async end(win) {
         document.getElementById('battle-ui-overlay').innerHTML = '';
            if (win) {
                // Replaces: window.Game.Windows.BattleLog.showBanner('VICTORY');
                Services.events.emit('battle:victory', { xp: 0, gold: 0, party: [] }); // Dummy event for now

                window.Game.Windows.BattleLog.showBanner('VICTORY'); // Keeping direct call for now as Victory UI is complex
                window.Game.ui.mode = 'BATTLE_WIN';
                Systems.sceneHooks?.onBattleEnd?.();
                if (Systems.Observer) Systems.Observer.fire('onBattleEnd', [...this.allies, ...this.enemies].filter(u => u && u.hp > 0));
                Systems.Battle3D.setFocus('victory');

                const gold = this.enemies.length * Config.baseGoldPerEnemy * window.$gameMap.floor;
                const baseXp = this.enemies.length * Config.baseXpPerEnemy * window.$gameMap.floor;

                window.$gameParty.gainGold(gold);
                window.Game.Windows.HUD.refresh();

                // 1. Capture snapshots and Apply XP
                const levelUps = [];
                const finalXpMap = new Map();

                this.allies.forEach(p => {
                    if (!p) return;

                    const pXp = Math.round(baseXp * (1 + p.xpRate));
                    finalXpMap.set(p.uid, pXp);

                    // Snapshot stats before XP
                    const snapshot = {
                        level: p.level,
                        mhp: p.mhp, mmp: p.mmp,
                        atk: p.atk, def: p.def,
                        mat: p.mat, mdf: p.mdf,
                        agi: p.agi, luk: p.luk
                    };

                    const oldLevel = p.level;
                    if (typeof p.gainExp === 'function') {
                        p.gainExp(pXp);
                    } else {
                        p.exp = (p.exp || 0) + pXp;
                    }

                    if (p.level > oldLevel) {
                         levelUps.push({
                             unit: p,
                             oldStats: snapshot,
                             newStats: {
                                level: p.level,
                                mhp: p.mhp, mmp: p.mmp,
                                atk: p.atk, def: p.def,
                                mat: p.mat, mdf: p.mdf,
                                agi: p.agi, luk: p.luk
                             }
                         });
                    }
                });

                // Post battle heal 25%
                 this.allies.forEach(p => {
                    if (p) {
                        const maxhp = p.mhp;
                        const heal = Math.floor(maxhp * 0.25);
                        p.hp = Math.min(maxhp, p.hp + heal);
                    }
                });

                // 2. Show Victory Window
                await window.Game.Windows.Victory.show({
                    xp: baseXp, // Show base, maybe note bonuses? Simplicity: base
                    gold: gold,
                    drops: [], // Todo: drops
                    party: this.allies.filter(Boolean)
                });

                // 3. Process Level Ups
                for (const ev of levelUps) {
                    // Focus Camera
                    Systems.Battle3D.setFocus('unit', ev.unit.uid);
                    Systems.Battle3D.dimOthers(ev.unit.uid);

                    // Show Window
                    await window.Game.Windows.LevelUp.show(ev);

                    // Wait a moment for effect
                    await new Promise(r => setTimeout(r, 500));
                }

                // Reset Camera
                Systems.Battle3D.resetVisuals();
                Systems.Battle3D.setFocus('victory'); // Or neutral? Victory keeps spinning.

                // Exit
                window.Game.SceneManager.changeScene(window.Game.Scenes.explore);

            } else {
                window.Game.ui.mode = 'EXPLORE';
                Services.events.emit('battle:defeat');
            }
    }
};
