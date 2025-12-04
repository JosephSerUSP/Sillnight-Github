
import { Window_Base } from '../windows.js';
import { FlexLayout } from '../layout/FlexLayout.js';
import { Component } from '../layout/Component.js';
import { TextComponent, ButtonComponent, WindowFrameComponent } from '../layout/components.js';
import { renderCreaturePanel, spriteMarkup } from './common.js';

export class Window_Victory extends Window_Base {
    constructor() {
        super();
        this.root.id = 'victory-window';
        this.root.className = 'hidden absolute inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto backdrop-blur-sm';

        const container = document.getElementById('game-container');
        if (container) container.appendChild(this.root);

        this._resolve = null;
    }

    initialize() {
        super.initialize();
        this.createLayout();
    }

    createLayout() {
        this.root.innerHTML = '';
        this.frame = new WindowFrameComponent('w-2/3 max-w-2xl bg-black border border-yellow-600 flex flex-col p-0 shadow-2xl');
        this.root.appendChild(this.frame.element);

        // Header
        const header = new Component('div', 'bg-yellow-900/50 p-4 border-b border-yellow-600 flex justify-center items-center');
        header.element.innerHTML = '<h1 class="text-4xl text-yellow-400 font-bold tracking-[0.2em] drop-shadow-md">VICTORY</h1>';
        this.frame.element.appendChild(header.element);

        // Content Body
        const body = new Component('div', 'p-6 flex flex-col gap-6');
        this.frame.element.appendChild(body.element);

        // Loot Section
        this._lootContainer = new Component('div', 'flex justify-between items-start gap-8');
        body.element.appendChild(this._lootContainer.element);

        // Left: Rewards
        const rewardsCol = new Component('div', 'flex-1 space-y-4');
        this._lootContainer.element.appendChild(rewardsCol.element);

        this._xpDisplay = new Component('div', 'text-2xl text-blue-300 font-mono');
        rewardsCol.element.appendChild(this._xpDisplay.element);

        this._goldDisplay = new Component('div', 'text-xl text-yellow-200 font-mono');
        rewardsCol.element.appendChild(this._goldDisplay.element);

        this._dropsDisplay = new Component('div', 'text-sm text-gray-400 italic');
        rewardsCol.element.appendChild(this._dropsDisplay.element);

        // Right: Party Summary (Small icons/status)
        this._partyContainer = new Component('div', 'flex-1 grid grid-cols-2 gap-2');
        this._lootContainer.element.appendChild(this._partyContainer.element);

        // Footer / Button
        const footer = new Component('div', 'mt-4 flex justify-center');
        body.element.appendChild(footer.element);

        this._btnContinue = new ButtonComponent('CONTINUE', () => this.onContinue(), 'px-8 py-2 bg-yellow-900/40 border-yellow-600 text-yellow-200 hover:bg-yellow-800 text-lg');
        footer.element.appendChild(this._btnContinue.element);
    }

    /**
     * Shows the victory window with the results.
     * @param {Object} results - { xp, gold, drops, party }
     * @returns {Promise} Resolves when user clicks Continue.
     */
    show(results) {
        return new Promise(resolve => {
            this._resolve = resolve;

            // Populate Data
            this._xpDisplay.element.innerText = `+${results.xp} XP`;
            this._goldDisplay.element.innerText = `+${results.gold} Gold`;

            if (results.drops && results.drops.length > 0) {
                this._dropsDisplay.element.innerText = `Found: ${results.drops.map(d => d.name).join(', ')}`;
            } else {
                this._dropsDisplay.element.innerText = '';
            }

            // Party Summary
            this._partyContainer.element.innerHTML = '';
            results.party.forEach(unit => {
                const slot = new Component('div', 'bg-gray-900 border border-gray-700 p-1 flex items-center gap-2');
                slot.element.innerHTML = `
                    <div class="w-8 h-8 shrink-0 border border-gray-600 flex items-center justify-center bg-black overflow-hidden relative status-sprite-frame">
                        ${spriteMarkup(unit, 'object-contain', 'status-sprite')}
                    </div>
                    <div class="flex flex-col leading-none">
                        <span class="text-xs text-gray-200">${typeof unit.name === 'function' ? unit.name() : unit.name}</span>
                        <span class="text-[10px] text-gray-500">Lv.${unit.level}</span>
                    </div>
                `;
                this._partyContainer.element.appendChild(slot.element);
            });

            super.show();
        });
    }

    onContinue() {
        this.hide();
        if (this._resolve) {
            this._resolve();
            this._resolve = null;
        }
    }
}


export class Window_LevelUp extends Window_Base {
    constructor() {
        super();
        this.root.id = 'levelup-window';
        // Placed on side or overlaying but smaller? User said "Level Up window for each of them".
        // Let's make it a nice overlay card.
        this.root.className = 'hidden absolute right-10 top-1/4 w-80 bg-black/90 border-2 border-yellow-400 shadow-2xl z-50 pointer-events-auto flex flex-col animate-in fade-in slide-in-from-right-10 duration-500';

        const container = document.getElementById('game-container');
        if (container) container.appendChild(this.root);

        this._resolve = null;
    }

    initialize() {
        super.initialize();
        this.createLayout();

        // Advance on click anywhere on this window
        this.root.onclick = () => this.onContinue();
    }

    createLayout() {
        this.root.innerHTML = '';

        // Header
        const header = new Component('div', 'bg-yellow-500 text-black font-bold text-center py-1 tracking-widest text-lg');
        header.element.innerText = 'LEVEL UP!';
        this.root.appendChild(header.element);

        // Content
        const content = new Component('div', 'p-4 flex flex-col gap-4');
        this.root.appendChild(content.element);

        // Identity
        this._identityBox = new Component('div', 'flex items-center gap-4 border-b border-gray-700 pb-2');
        content.element.appendChild(this._identityBox.element);

        // Stats Grid
        this._statsGrid = new Component('div', 'grid grid-cols-2 gap-x-4 gap-y-1 text-sm');
        content.element.appendChild(this._statsGrid.element);

        // Footer hint
        const hint = new Component('div', 'text-[10px] text-gray-500 text-center mt-2 animate-pulse');
        hint.element.innerText = 'Click to continue...';
        content.element.appendChild(hint.element);
    }

    /**
     * Shows the level up info for a unit.
     * @param {Object} data - { unit, oldStats, newStats }
     * @returns {Promise} Resolves after user interaction or timeout.
     */
    show(data) {
        return new Promise(resolve => {
            this._resolve = resolve;

            const u = data.unit;
            const old = data.oldStats;
            const cur = data.newStats;

            // Identity Render
            this._identityBox.element.innerHTML = `
                <div class="w-12 h-12 border border-gray-600 bg-black flex items-center justify-center overflow-hidden status-sprite-frame">
                     ${spriteMarkup(u, 'object-contain', 'status-sprite')}
                </div>
                <div>
                    <div class="text-xl text-yellow-200 font-bold">${typeof u.name === 'function' ? u.name() : u.name}</div>
                    <div class="text-gray-400 text-sm">Lv. ${old.level} <span class="text-yellow-500">➜ ${cur.level}</span></div>
                </div>
            `;

            // Stats Render
            this._statsGrid.element.innerHTML = '';

            const addStat = (label, key) => {
                const diff = cur[key] - old[key];
                if (diff === 0 && key !== 'mhp') return; // Skip unchanged stats unless mhp

                const row = document.createElement('div');
                row.className = 'contents';
                row.innerHTML = `
                    <div class="text-gray-400">${label}</div>
                    <div class="text-right">
                        <span class="text-white">${old[key]}</span>
                        <span class="text-gray-600">➜</span>
                        <span class="text-green-400 font-bold">${cur[key]}</span>
                        <span class="text-[10px] text-green-600 ml-1">(+${diff})</span>
                    </div>
                `;
                this._statsGrid.element.appendChild(row);
            };

            addStat('Max HP', 'mhp');
            addStat('Max MP', 'mmp');
            addStat('ATK', 'atk');
            addStat('DEF', 'def');
            addStat('MAT', 'mat');
            addStat('MDF', 'mdf');
            addStat('AGI', 'agi');
            addStat('LUK', 'luk');

            super.show();
        });
    }

    onContinue() {
        this.hide();
        if (this._resolve) {
            this._resolve();
            this._resolve = null;
        }
    }
}
