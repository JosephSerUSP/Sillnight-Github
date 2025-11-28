import { Data } from '../../assets/data/data.js';
import { GameState } from '../state.js';
import { Log } from '../log.js';
import { Systems } from '../systems.js';
import { Game_Enemy } from '../classes/Game_Enemy.js';

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

        // Keep GameState.battle in sync for now
        GameState.battle = {
            allies: this.allies,
            enemies: this.enemies,
            queue: this.queue,
            turnIndex: this.turnIndex,
            roundCount: this.roundCount,
            playerTurnRequested: this.playerTurnRequested,
            phase: this.phase
        };
    },

    /**
     * Generates a random encounter based on the current floor and starts it.
     */
    startEncounter() {
        const floor = GameState.run.floor;
        const dungeon = Data.dungeons.default;
        const enc = dungeon.encounters;
        const pool = enc.pools.find(p => floor >= p.floors[0] && floor <= p.floors[1]);
        const enemyTypes = pool ? pool.enemies : [];
        const enemyCount = Math.floor(Math.random() * (enc.count.max - enc.count.min + 1)) + enc.count.min;
        const enemyIds = [];
        for (let i = 0; i < enemyCount; i++) {
             enemyIds.push(enemyTypes[Math.floor(Math.random() * enemyTypes.length)]);
        }
        this.startFixedEncounter(enemyIds);
    },

    /**
     * Starts a battle with a specific set of enemies.
     * @param {Array<string>} enemyIds - List of enemy IDs to spawn.
     * @returns {Promise<boolean>} Resolves to true if player won, false if lost.
     */
    startFixedEncounter(enemyIds) {
        return new Promise((resolve) => {
            const swipe = document.getElementById('swipe-overlay');
            swipe.className = 'swipe-down';

            // Store the resolver in the manager so we can call it in end()
            this._battleResolver = resolve;

            setTimeout(() => {
                Systems.sceneHooks?.onBattleStart?.();
                GameState.ui.mode = 'BATTLE';
                window.Game.Scenes.battle.switchScene(true);
                Systems.Battle3D.cameraState.angle = -Math.PI / 4;
                Systems.Battle3D.cameraState.targetAngle = -Math.PI / 4;
                Systems.Battle3D.setFocus('neutral');
                Systems.Battle3D.resize();

                const allies = GameState.party.activeSlots.filter(u => u !== null);
                const floor = GameState.run.floor;
                const enemies = [];

                enemyIds.forEach((type, i) => {
                    const mult = 1 + (floor * 0.1);
                    const enemy = new Game_Enemy(type, 0, 0, mult);
                    enemy.slotIndex = i;
                    enemy.recoverAll();
                    enemies.push(enemy);
                });

                this.setup(allies, enemies);

                Systems.Battle3D.setupScene(this.allies, this.enemies);
                const enemyNames = enemies.map(e => e.name).join(', ');
                Log.battle(`Enemies: ${enemyNames}`);
                window.Game.Windows.BattleLog.showBanner('ENCOUNTER');
                swipe.className = 'swipe-clear';
                setTimeout(() => {
                    swipe.className = 'swipe-reset';
                    setTimeout(() => this.nextRound(), 1500);
                }, 600);
            }, 600);
        });
    },

    /**
     * Proceeds to the next round of combat.
     * Re-calculates turn order and checks win/loss conditions.
     */
    nextRound() {
        this.roundCount++;
        this.phase = 'ROUND_START';

        // Update GameState mirror
        GameState.battle.roundCount = this.roundCount;
        GameState.battle.phase = this.phase;

        Systems.Battle3D.setFocus('neutral');
        if (this.allies.every(u => u.hp <= 0)) return this.end(false);
        if (this.enemies.every(u => u.hp <= 0)) return this.end(true);

        [...this.allies, ...this.enemies].forEach(u => {
            if (u.status && Array.isArray(u.status)) { // Check if status exists (raw obj fallback) or use class method
                 if (typeof u.removeState === 'function') {
                     // TODO: Implement proper state removal for guarding state ID
                 } else {
                    u.status = u.status.filter(s => s !== 'guarding');
                 }
            }
        });

        Log.battle(`--- Round ${this.roundCount} ---`);
        if (this.playerTurnRequested) {
            this.phase = 'PLAYER_INPUT';
            GameState.battle.phase = this.phase;
            this.playerTurnRequested = false;
            window.Game.Windows.BattleLog.togglePlayerTurn(true);
            Log.battle('Waiting for orders...');
            return;
        }

        const allUnits = [...this.allies, ...this.enemies]
            .filter(u => u.hp > 0)
            .map(u => {
                const unitWithStats = Systems.Battle.getUnitWithStats(u);
                u.speed = unitWithStats.speed_bonus;
                return u;
            });

        allUnits.sort((a, b) => b.speed - a.speed || Math.random() - 0.5);
        this.queue = allUnits;
        GameState.battle.queue = this.queue;
        this.turnIndex = 0;
        GameState.battle.turnIndex = 0;

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
            GameState.battle.turnIndex = this.turnIndex;

            if (unit.hp <= 0) {
                this.processNextTurn();
                return;
            }
            Systems.Triggers.fire('onTurnStart', unit);
            const isAlly = this.allies.some(a => a.uid === unit.uid);
            Systems.Battle3D.setFocus(isAlly ? 'ally' : 'enemy');
            const enemies = isAlly ? this.enemies : this.allies;
            const friends = isAlly ? this.allies : this.enemies;
            const possibleActs = [...unit.acts[0], ...(unit.acts[1] || [])];
            let chosen = null;
            if (unit.temperament === 'kind') {
                const hurt = friends.filter(f => f.hp < f.maxhp).sort((a, b) => a.hp - b.hp)[0];
                if (hurt && hurt.hp < hurt.maxhp * 0.6) {
                    for (const a of possibleActs) {
                        const skill = Data.skills[a.toLowerCase()];
                        if (skill && skill.category === 'heal') { chosen = a; break; }
                    }
                }
            }
            if (!chosen) {
                chosen = possibleActs[Math.floor(Math.random() * possibleActs.length)];
            }

            let action = null;
            const chosenLower = chosen.toLowerCase();
            const skillKey = Object.keys(Data.skills).find(k => k.toLowerCase() === chosenLower);
            const itemKey = Object.keys(Data.items).find(k => k.toLowerCase() === chosenLower);

            if (skillKey) action = Data.skills[skillKey];
            else if (itemKey) action = Data.items[itemKey];
            else action = Data.skills['attack'];

            let targets = [];
            const validEnemies = enemies.filter(u => u.hp > 0);
            const validFriends = friends.filter(u => u.hp > 0);
            if (action.target === 'self') targets = [unit];
            else if (action.target === 'ally-single') targets = [validFriends.sort((a, b) => a.hp - b.hp)[0]];
            else if (action.target === 'enemy-all') targets = validEnemies;
            else if (action.target === 'enemy-row') {
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
            window.Game.Windows.BattleLog.showBanner(`${unit.name} used ${action.name}!`);
            const results = Systems.Battle.applyEffects(action, unit, targets);

            if (results.length === 0) {
                Log.battle(`> ${unit.name} used ${action.name}!`);
            }

            const script = Data.actionScripts[action.script] || Data.actionScripts.attack || [];
            const applyResults = () => {
                results.forEach(({ target, value, effect }) => {
                    if (!target) return;

                    switch (effect.type) {
                        case 'hp_damage':
                            let dealtDamage = value;
                            let newHp = target.hp - dealtDamage;
                            const defenderWithStats = Systems.Battle.getUnitWithStats(target);
                            if (newHp <= 0) {
                                if (Math.random() < (defenderWithStats.survive_ko_chance || 0)) {
                                    newHp = 1;
                                    dealtDamage = target.hp > 0 ? target.hp - 1 : 0;
                                    Log.battle(`> ${target.name} survives with 1 HP!`);
                                }
                            }
                            target.hp = Math.max(0, newHp);
                            if (dealtDamage > 0) {
                                Log.battle(`> ${unit.name} hits ${target.name} for ${dealtDamage}.`);
                                Systems.Battle3D.showDamageNumber(target.uid, -dealtDamage);
                                Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', shake: 0.8, opacity: 0.7, color: 0xffffff}]);
                            }
                            if (target.hp <= 0) {
                                Log.battle(`> ${target.name} was defeated!`);
                                Systems.Battle3D.playDeathFade(target.uid);
                                Systems.Triggers.fire('onUnitDeath', target);
                                if (Math.random() < (defenderWithStats.revive_on_ko_chance || 0)) {
                                    const revivePercent = defenderWithStats.revive_on_ko_percent || 0.5;
                                    const revivedHp = Math.floor(Systems.Battle.getMaxHp(target) * revivePercent);
                                    target.hp = revivedHp;
                                    Log.battle(`> ${target.name} was revived with ${revivedHp} HP!`);
                                    const revivedTs = Systems.Battle3D.sprites[target.uid];
                                    if (revivedTs) revivedTs.visible = true;
                                }
                            }
                            break;
                        case 'hp_heal':
                            const maxhp = Systems.Battle.getMaxHp(target);
                            target.hp = Math.min(maxhp, target.hp + value);
                            Log.battle(`> ${target.name} healed for ${value}.`);
                            Systems.Battle3D.showDamageNumber(target.uid, value);
                            Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', opacity: 0.5, color: 0x00ff00}]);
                            break;
                        case 'hp_heal_ratio':
                            const maxHpRatio = Systems.Battle.getMaxHp(target);
                            const healAmount = Math.floor(maxHpRatio * parseFloat(effect.formula));
                            target.hp = Math.min(maxHpRatio, target.hp + healAmount);
                            Log.battle(`> ${target.name} healed for ${healAmount}.`);
                            Systems.Battle3D.showDamageNumber(target.uid, healAmount);
                            break;
                        case 'revive':
                            if (target.hp <= 0) {
                                const revivedHp = Math.floor(Systems.Battle.getMaxHp(target) * parseFloat(effect.formula));
                                target.hp = revivedHp;
                                Log.battle(`> ${target.name} was revived with ${revivedHp} HP.`);
                                const ts = Systems.Battle3D.sprites[target.uid];
                                if (ts) ts.visible = true;
                            }
                            break;
                        case 'increase_max_hp':
                            const bonus = parseInt(effect.formula);
                            // Handling for class vs raw object
                            if (typeof target.addMaxHpBonus === 'function') {
                                // TODO implement addMaxHpBonus in Battler
                                // For now, direct prop access fallback
                                target.maxHpBonus = (target.maxHpBonus || 0) + bonus;
                            } else {
                                target.maxHpBonus = (target.maxHpBonus || 0) + bonus;
                            }
                            target.hp += bonus;
                            Log.battle(`> ${target.name}'s Max HP increased by ${bonus}.`);
                            break;
                        case 'add_status':
                            if (Math.random() < (effect.chance || 1)) {
                                if (typeof target.addStatus === 'function') {
                                    // TODO
                                } else {
                                    if (!target.status) target.status = [];
                                    if (!target.status.includes(effect.status)) {
                                        target.status.push(effect.status);
                                    }
                                }
                                Log.battle(`> ${target.name} is now ${effect.status}.`);
                            }
                            break;
                    }
                });
                window.Game.Windows.Party.refresh();
                if (this.allies.every(u => u.hp <= 0) || this.enemies.every(u => u.hp <= 0)) {
                    this.turnIndex = 999;
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
         if (GameState.ui.mode === 'BATTLE') {
            this.playerTurnRequested = true;
            GameState.battle.playerTurnRequested = true;
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
        GameState.battle.playerTurnRequested = false;
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
    end(win) {
        if (this._battleResolver) {
            this._battleResolver(win);
            this._battleResolver = null;
        }
         document.getElementById('battle-ui-overlay').innerHTML = '';
            if (win) {
                window.Game.Windows.BattleLog.showBanner('VICTORY');
                GameState.ui.mode = 'BATTLE_WIN';
                Systems.sceneHooks?.onBattleEnd?.();
                Systems.Triggers.fire('onBattleEnd', [...this.allies, ...this.enemies].filter(u => u && u.hp > 0));
                Systems.Battle3D.setFocus('victory');
                const gold = this.enemies.length * Data.config.baseGoldPerEnemy * GameState.run.floor;
                const baseXp = this.enemies.length * Data.config.baseXpPerEnemy * GameState.run.floor;
                GameState.run.gold += gold;
                let finalXp = baseXp;

                this.allies.forEach(p => {
                    if (p) {
                        const unitWithStats = Systems.Battle.getUnitWithStats(p);
                        finalXp = Math.round(baseXp * (1 + (unitWithStats.xp_bonus_percent || 0)));

                        // Game_Actor method or direct prop
                        if (typeof p.gainExp === 'function') {
                             p.gainExp(finalXp);
                        } else {
                            // Fallback
                            p.exp = (p.exp || 0) + finalXp;
                            const def = Data.creatures[p.speciesId];
                            let levelCost = def.xpCurve * p.level;
                            let levelUpOccurred = false;
                            while (p.exp >= levelCost) {
                                p.exp -= levelCost;
                                p.level++;
                                const newMax = Math.round(def.baseHp * (1 + def.hpGrowth * (p.level - 1)));
                                p.maxhp = newMax;
                                p.hp = newMax;
                                levelCost = def.xpCurve * p.level;
                                levelUpOccurred = true;
                            }
                            if (levelUpOccurred) Log.add(`${p.name} Lv UP -> ${p.level}!`);
                        }
                    }
                });

                // Post battle heal 25%
                 this.allies.forEach(p => {
                    if (p) {
                        const maxhp = Systems.Battle.getMaxHp(p);
                        const heal = Math.floor(maxhp * 0.25);
                        p.hp = Math.min(maxhp, p.hp + heal);
                    }
                });

                window.Game.Windows.HUD.refresh();
                window.Game.Windows.BattleLog.showModal(`
                    <div class="text-yellow-500 text-2xl mb-4">VICTORY</div>
                    <div class="text-white">Found ${gold} Gold</div>
                    <div class="text-white">Party +${finalXp} XP</div>
                    <button class="mt-4 border border-white px-4 py-2 hover:bg-gray-800" onclick="Game.Windows.BattleLog.closeModal(); Game.Scenes.battle.switchScene(false);">CONTINUE</button>
                `);
            } else {
                GameState.ui.mode = 'EXPLORE';
                Systems.Battle3D.setFocus('neutral');
                window.Game.Windows.BattleLog.showModal(`
                    <div class="text-red-600 text-4xl mb-4">DEFEATED</div>
                    <button class="mt-4 border border-red-800 text-red-500 px-4 py-2 hover:bg-red-900/20" onclick="location.reload()">RESTART</button>
                `);
            }
    }
};
