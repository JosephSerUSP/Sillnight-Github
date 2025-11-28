import { Data } from '../../assets/data/data.js';
import { GameState } from '../state.js';
import { Log } from '../log.js';
import { Systems } from '../systems.js';
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
         const swipe = document.getElementById('swipe-overlay');
            swipe.className = 'swipe-down';
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
                swipe.className = 'swipe-clear';
                setTimeout(() => {
                    swipe.className = 'swipe-reset';
                    setTimeout(() => this.nextRound(), 1500);
                }, 600);
            }, 600);
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
            if (u.removeState) u.removeState('guarding'); // Using proper method now
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
            .filter(u => u.hp > 0);

        // Sorting by AGI (Speed)
        allUnits.sort((a, b) => b.agi - a.agi || Math.random() - 0.5);
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

            const action = new Game_Action(unit);

            // --- AI Logic (Moved from old spaghetti, still messy but better placed) ---
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

            const chosenLower = chosen.toLowerCase();
            const skillKey = Object.keys(Data.skills).find(k => k.toLowerCase() === chosenLower);
            const itemKey = Object.keys(Data.items).find(k => k.toLowerCase() === chosenLower);
            let itemData = null;
            if (skillKey) itemData = Data.skills[skillKey];
            else if (itemKey) itemData = Data.items[itemKey];
            else itemData = Data.skills['attack'];

            action.setItemObject(itemData);
            // -------------------------------------------------------------------

            const targets = action.makeTargets();
            if (targets.length === 0) {
                this.processNextTurn();
                return;
            }

            window.Game.Windows.BattleLog.showBanner(`${unit.name} used ${itemData.name}!`);

            // Execute Action
            const results = [];
            targets.forEach(target => {
                 const res = action.apply(target);
                 results.push(...res);
            });

            if (results.length === 0) {
                Log.battle(`> ${unit.name} used ${itemData.name}!`);
            }

            const script = Data.actionScripts[itemData.script] || Data.actionScripts.attack || [];

            const applyResults = () => {
                results.forEach(({ target, value, effect }) => {
                    if (!target) return;
                    // Result processing for logs and animations
                    // The damage was already applied in action.apply -> evalDamageFormula
                    // Wait, evalDamageFormula in Game_Action currently RETURNS the value, it doesn't apply it yet?
                    // Ah, right. Game_Action.apply calls executeEffect calls evalDamageFormula.
                    // But in my previous step Game_Action.executeEffect returned { target, value, effect } and did NOT modify HP.
                    // I need to actually modify HP here or in Game_Action.
                    // Let's modify HP here to keep the "Animation -> Effect" flow visual sync.

                    const result = target.result(); // We can use the result object for state

                    switch (effect.type) {
                        case 'hp_damage':
                            let dealtDamage = value; // Value from formula
                            let newHp = target.hp - dealtDamage;

                            // Ko Survival Check (should probably be in Game_Action/Game_Battler)
                            const surviveChance = target.traitsSum('survive_ko');
                             if (newHp <= 0 && Math.random() < surviveChance) {
                                newHp = 1;
                                dealtDamage = target.hp > 0 ? target.hp - 1 : 0;
                                Log.battle(`> ${target.name} survives with 1 HP!`);
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

                                const reviveChance = target.traitsSum('revive_on_ko'); // Sum of chances
                                const revivePercent = target.traitsSum('revive_on_ko_percent') || 0.5; // Sum of percents

                                if (Math.random() < reviveChance) {
                                    const revivedHp = Math.floor(target.mhp * revivePercent);
                                    target.hp = revivedHp;
                                    Log.battle(`> ${target.name} was revived with ${revivedHp} HP!`);
                                    const revivedTs = Systems.Battle3D.sprites[target.uid];
                                    if (revivedTs) revivedTs.visible = true;
                                }
                            }
                            break;
                        case 'hp_heal':
                            const healVal = value;
                            target.hp = Math.min(target.mhp, target.hp + healVal);
                            Log.battle(`> ${target.name} healed for ${healVal}.`);
                            Systems.Battle3D.showDamageNumber(target.uid, healVal);
                            Systems.Battle3D.playAnim(target.uid, [{type: 'feedback', bind: 'self', opacity: 0.5, color: 0x00ff00}]);
                            break;
                        case 'hp_heal_ratio':
                            const healAmount = value; // Already calculated in formula
                            target.hp = Math.min(target.mhp, target.hp + healAmount);
                            Log.battle(`> ${target.name} healed for ${healAmount}.`);
                            Systems.Battle3D.showDamageNumber(target.uid, healAmount);
                            break;
                        case 'revive':
                            if (target.hp <= 0) {
                                // Formula usually returns percent like 0.5
                                const revivedHp = Math.floor(target.mhp * parseFloat(effect.formula));
                                target.hp = revivedHp;
                                Log.battle(`> ${target.name} was revived with ${revivedHp} HP.`);
                                const ts = Systems.Battle3D.sprites[target.uid];
                                if (ts) ts.visible = true;
                            }
                            break;
                        case 'increase_max_hp':
                             const bonus = parseInt(effect.formula);
                             // Now using the proper property on Game_Actor which is hooked into paramPlus
                             if (target._maxHpBonus !== undefined) {
                                 target._maxHpBonus += bonus;
                             } else {
                                 target._maxHpBonus = bonus;
                             }
                             target.hp += bonus;
                             Log.battle(`> ${target.name}'s Max HP increased by ${bonus}.`);
                            break;
                        case 'add_status':
                            if (Math.random() < (effect.chance || 1)) {
                                target.addState(effect.status);
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
                         // Game_Actor gainExp
                         // xp_bonus_percent is now a trait "xp_bonus_percent"
                         const bonus = p.traitsSum('xp_bonus_percent');
                         finalXp = Math.round(baseXp * (1 + bonus));
                         p.gainExp(finalXp);
                         // Note: levelUp log is inside gainExp -> levelUp? No, gainExp doesn't log.
                         // We should log it here or inside Game_Actor.
                         // For now let's just log XP.
                    }
                });

                // Post battle heal 25%
                 this.allies.forEach(p => {
                    if (p) {
                        const heal = Math.floor(p.mhp * 0.25);
                        p.hp = Math.min(p.mhp, p.hp + heal);
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
