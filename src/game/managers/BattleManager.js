import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';
import * as Systems from '../systems.js';
import { Game_Enemy } from '../classes/Game_Enemy.js';
import { Game_Action } from '../classes/Game_Action.js';

/**
 * Manages the flow and state of battle.
 * Handles encounter setup, turn processing, and victory/defeat conditions.
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
        // Any static init if needed
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
     * Generates a random encounter based on the current floor and starts it.
     */
    async startEncounter() {
        Systems.sceneHooks?.onBattleStart?.();
        window.Game.ui.mode = 'BATTLE';
        // Wait for scene switch (handles DOM race conditions)
        await window.Game.Scenes.battle.switchScene(true);

        Systems.Battle3D.cameraState.angle = -Math.PI / 4;
        Systems.Battle3D.cameraState.targetAngle = -Math.PI / 4;
        Systems.Battle3D.setFocus('neutral');
        Systems.Battle3D.resize();

        const allies = window.$gameParty.activeSlots.filter(u => u !== null);

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

        this.setup(allies, enemies);

        Systems.Battle3D.setupScene(this.allies, this.enemies);
        const enemyNames = enemies.map(e => e.name).join(', ');
        Log.battle(`Enemies: ${enemyNames}`);
        window.Game.Windows.BattleLog.showBanner('ENCOUNTER');

        // Brief delay before first round starts to allow player to see enemies
        setTimeout(() => this.nextRound(), 1000);
    },

    /**
     * Proceeds to the next round of combat.
     * Re-calculates turn order and checks win/loss conditions.
     */
    nextRound() {
        this.roundCount++;
        this.phase = 'ROUND_START';

        Systems.Battle3D.setFocus('neutral');
        if (this.allies.every(u => u.hp <= 0)) return this.end(false);
        if (this.enemies.every(u => u.hp <= 0)) return this.end(true);

        [...this.allies, ...this.enemies].forEach(u => {
             // Remove 'guarding' state
             if (typeof u.removeState === 'function') {
                 // We don't have a fixed ID for guarding yet, using string 'guarding' in _states
                 // Game_Action logic checks for 'guarding' string in _states.
                 // So we filter it out.
                 if (u.isStateAffected && u.isStateAffected('guarding')) {
                     u.removeState('guarding');
                 }
                 // Legacy fallback
                 if (u.status) u.status = u.status.filter(s => s !== 'guarding');
             } else if (u.status) {
                 u.status = u.status.filter(s => s !== 'guarding');
             }
        });

        Log.battle(`--- Round ${this.roundCount} ---`);
        if (this.playerTurnRequested) {
            this.phase = 'PLAYER_INPUT';
            this.playerTurnRequested = false;
            window.Game.Windows.BattleLog.togglePlayerTurn(true);
            Log.battle('Waiting for orders...');
            return;
        }

        const allUnits = [...this.allies, ...this.enemies]
            .filter(u => u.hp > 0);

        allUnits.sort((a, b) => b.speed - a.speed || Math.random() - 0.5);
        this.queue = allUnits;
        this.turnIndex = 0;

        this.processNextTurn();
    },

    /**
     * Processes the next turn in the queue.
     * Executes AI actions or waits for animations.
     */
    processNextTurn() {
         window.Game.Windows.Party.refresh();
            if (this.turnIndex >= this.queue.length) {
                setTimeout(() => this.nextRound(), 1000);
                return;
            }
            const unit = this.queue[this.turnIndex++];

            if (unit.hp <= 0) {
                this.processNextTurn();
                return;
            }
            if (Systems.Observer) Systems.Observer.fire('onTurnStart', unit);
            const isAlly = this.allies.some(a => a.uid === unit.uid);
            Systems.Battle3D.setFocus(isAlly ? 'ally' : 'enemy');
            const enemies = isAlly ? this.enemies : this.allies;
            const friends = isAlly ? this.allies : this.enemies;
            const possibleActs = [...unit.acts[0], ...(unit.acts[1] || [])];
            let chosen = null;
            if (unit.temperament === 'kind') {
                const hurt = friends.filter(f => f.hp < f.mhp).sort((a, b) => a.hp - b.hp)[0];
                if (hurt && hurt.hp < hurt.mhp * 0.6) {
                    for (const a of possibleActs) {
                        const skill = Data.skills[a.toLowerCase()];
                        if (skill && skill.category === 'heal') { chosen = a; break; }
                    }
                }
            }
            if (!chosen) {
                chosen = possibleActs[Math.floor(Math.random() * possibleActs.length)];
            }

            let actionData = null;
            const chosenLower = chosen.toLowerCase();
            const skillKey = Object.keys(Data.skills).find(k => k.toLowerCase() === chosenLower);
            const itemKey = Object.keys(Data.items).find(k => k.toLowerCase() === chosenLower);

            if (skillKey) actionData = Data.skills[skillKey];
            else if (itemKey) actionData = Data.items[itemKey];
            else actionData = Data.skills['attack'];

            // Create Game_Action instance
            const action = new Game_Action(unit, window.$gameParty, window.$gameTroop);
            action.setObject(actionData);

            let targets = [];
            const validEnemies = enemies.filter(u => u.hp > 0);
            const validFriends = friends.filter(u => u.hp > 0);
            if (actionData.target === 'self') targets = [unit];
            else if (actionData.target === 'ally-single') targets = [validFriends.sort((a, b) => a.hp - b.hp)[0]];
            else if (actionData.target === 'enemy-all') targets = validEnemies;
            else if (actionData.target === 'enemy-row') {
                const frontRow = validEnemies.filter(e => e.slotIndex < 3);
                const backRow = validEnemies.filter(e => e.slotIndex >= 3);
                targets = frontRow.length > 0 ? frontRow : backRow;
            } else {
                targets = [validEnemies[Math.floor(Math.random() * validEnemies.length)]];
            }
            if (targets.length === 0 || !targets[0]) {
                this.processNextTurn();
                return;
            }
            window.Game.Windows.BattleLog.showBanner(`${unit.name} used ${actionData.name}!`);

            // Use Game_Action to apply effects
            const allResults = [];
            targets.forEach(t => {
                const res = action.apply(t);
                allResults.push(...res);
            });

            if (allResults.length === 0) {
                Log.battle(`> ${unit.name} used ${actionData.name}!`);
            }

            const script = Data.actionScripts[actionData.script] || Data.actionScripts.attack || [];

            // Apply effects via animation callback
            const applyResults = () => {
                allResults.forEach(({ target, value, effect, isCrit, isMiss }) => {
                    if (!target) return;

                    if (isMiss) {
                        Log.battle(`> Missed ${target.name}!`);
                        return;
                    }

                    switch (effect.type) {
                        case 'hp_damage':
                            let dealtDamage = value;
                            let newHp = target.hp - dealtDamage;

                            // Check for survive KO trait
                            const surviveChance = target.traitsSum('survive_ko');
                            if (newHp <= 0 && Math.random() < surviveChance) {
                                newHp = 1;
                                dealtDamage = target.hp > 0 ? target.hp - 1 : 0;
                                Log.battle(`> ${target.name} survives with 1 HP!`);
                            }

                            target.hp = Math.max(0, newHp);
                            if (dealtDamage > 0 || value === 0) {
                                Log.battle(`> ${unit.name} hits ${target.name} for ${dealtDamage}.`);
                                Systems.Battle3D.showDamageNumber(target.uid, -dealtDamage, isCrit);
                                Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', shake: 0.8, opacity: 0.7, color: 0xffffff}]);
                            }
                            if (target.hp <= 0) {
                                Log.battle(`> ${target.name} was defeated!`);
                                Systems.Battle3D.playDeathFade(target.uid);
                                if (Systems.Observer) Systems.Observer.fire('onUnitDeath', target);

                                // Revive check
                                const reviveChance = target.traitsSum('revive_on_ko_chance');
                                if (Math.random() < reviveChance) {
                                    const revivePercent = target.traitsSum('revive_on_ko_percent') || 0.5;
                                    const revivedHp = Math.floor(target.mhp * revivePercent);
                                    target.hp = revivedHp;
                                    Log.battle(`> ${target.name} was revived with ${revivedHp} HP!`);
                                    const revivedTs = Systems.Battle3D.sprites[target.uid];
                                    if (revivedTs) revivedTs.visible = true;
                                }
                            }
                            break;
                        case 'hp_heal':
                        case 'hp_heal_ratio':
                            // Value is already calculated in Game_Action.apply
                            const healAmount = value;
                            target.hp = Math.min(target.mhp, target.hp + healAmount);
                            Log.battle(`> ${target.name} healed for ${healAmount}.`);
                            Systems.Battle3D.showDamageNumber(target.uid, healAmount);
                            Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', opacity: 0.5, color: 0x00ff00}]);
                            break;
                        case 'revive':
                            if (target.hp <= 0) {
                                // Value calculated in apply (based on target mhp)
                                const revivedHp = value;
                                target.hp = revivedHp;
                                Log.battle(`> ${target.name} was revived with ${revivedHp} HP.`);
                                const ts = Systems.Battle3D.sprites[target.uid];
                                if (ts) ts.visible = true;
                            }
                            break;
                        case 'increase_max_hp':
                            const bonus = parseInt(effect.formula);
                            if (typeof target.maxHpBonus !== 'undefined') {
                                target.maxHpBonus += bonus;
                            }
                            target.hp += bonus;
                            Log.battle(`> ${target.name}'s Max HP increased by ${bonus}.`);
                            break;
                        case 'add_status':
                            if (Math.random() < (effect.chance || 1)) {
                                if (typeof target.addState === 'function') {
                                    // Using string ID for now as per data
                                    target.addState(effect.status);
                                } else {
                                    // Fallback
                                    if (!target.status) target.status = [];
                                    if (!target.status.includes(effect.status)) {
                                        target.status.push(effect.status);
                                    }
                                }
                                Log.battle(`> ${target.name} is now ${effect.status}.`);
                            }
                            break;
                        case 'miss':
                             Log.battle(`> Missed ${target.name}!`);
                             break;
                    }
                });
                window.Game.Windows.Party.refresh();
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
         if (window.Game.ui.mode === 'BATTLE') {
            this.playerTurnRequested = true;
            Log.add('Interrupt queued.');
            const btn = document.getElementById('btn-player-turn');
            if (btn) {
                btn.classList.add('border-green-500', 'text-green-500');
                btn.innerText = 'QUEUED';
            }
        }
    },

    /**
     * Resumes automatic battle processing.
     */
    resumeAuto() {
        window.Game.Windows.BattleLog.togglePlayerTurn(false);
        this.playerTurnRequested = false;
        const btn = document.getElementById('btn-player-turn');
        if (btn) {
            btn.classList.remove('border-green-500', 'text-green-500');
            btn.innerText = 'STOP ROUND (SPACE)';
        }
        this.processNextTurn();
    },

    /**
     * Ends the battle and displays the result.
     * @param {boolean} win - True if the player won.
     */
    async end(win) {
         document.getElementById('battle-ui-overlay').innerHTML = '';
            if (win) {
                window.Game.Windows.BattleLog.showBanner('VICTORY');
                window.Game.ui.mode = 'BATTLE_WIN';
                Systems.sceneHooks?.onBattleEnd?.();
                if (Systems.Observer) Systems.Observer.fire('onBattleEnd', [...this.allies, ...this.enemies].filter(u => u && u.hp > 0));
                Systems.Battle3D.setFocus('victory');

                const gold = this.enemies.length * Data.config.baseGoldPerEnemy * window.$gameMap.floor;
                const baseXp = this.enemies.length * Data.config.baseXpPerEnemy * window.$gameMap.floor;

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
                Systems.Battle3D.setFocus('neutral');
                window.Game.Windows.BattleLog.showModal(`
                    <div class="text-red-600 text-4xl mb-4">DEFEATED</div>
                    <button class="mt-4 border border-red-800 text-red-500 px-4 py-2 hover:bg-red-900/20" onclick="location.reload()">RESTART</button>
                `);
            }
    }
};
