import { Window_Selectable } from '../windows.js';
import { Services } from '../ServiceLocator.js';
import { Log } from '../log.js';
import { FlexLayout } from '../layout/index.js';
import { WindowFrameComponent, TextComponent, ButtonComponent } from '../layout/components.js';
import { spriteMarkup, renderCreaturePanel } from './common.js';
import { Game_Actor } from '../classes/Game_Actor.js';

export class Window_Recruit extends Window_Selectable {
    initialize() {
        this._resolve = null;
        super.initialize();
        this.root.id = 'window-recruit';
        this.root.className = 'absolute inset-0 bg-black/80 flex items-center justify-center z-50 hidden backdrop-blur-sm';

        // Ensure in DOM
        const container = document.getElementById('game-container');
        if (container && !document.getElementById('window-recruit')) {
            container.appendChild(this.root);
        }
    }

    defineLayout() {
        this.root.innerHTML = ''; // Clear previous content

        // Window Frame
        this.frame = new WindowFrameComponent('w-3/4 max-w-2xl h-3/4 flex flex-col bg-[#0a0a0a]');
        this.root.appendChild(this.frame.element);

        this.layout = new FlexLayout(this.frame.element, { direction: 'column' });

        // Header
        const header = new TextComponent('RECRUIT', 'text-2xl text-green-500 font-bold text-center border-b border-gray-700 pb-2 mb-4');
        this.layout.add(header);

        // Content Area (Split)
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'flex flex-grow gap-4 overflow-hidden p-2';
        this.layout.addRaw(this.contentArea);

        // Action Area (Bottom)
        this.actionArea = document.createElement('div');
        this.actionArea.className = 'border-t border-gray-700 pt-4 mt-auto flex justify-between items-center';
        this.layout.addRaw(this.actionArea);
    }

    /**
     * Shows the recruit window.
     * @param {Object} offer - { speciesId, level, cost: {type, value, id?} }
     * @returns {Promise<boolean>} Resolves true if recruited, false if cancelled.
     */
    show(offer) {
        return new Promise(resolve => {
            this._resolve = resolve;
            this.offer = offer;

            // Create a temporary actor for display stats
            if (offer && offer.speciesId) {
                this.actor = new Game_Actor(offer.speciesId, offer.level);
            }

            this.refresh();
            super.show();
        });
    }

    hide(result = false) {
        super.hide();
        if (this._resolve) {
            this._resolve(result);
            this._resolve = null;
        }
        this.actor = null;
    }

    refresh() {
        this.defineLayout(); // Rebuild layout

        if (!this.offer || !this.actor) return;

        // --- Left Column: Visuals & Core Info ---
        const leftCol = document.createElement('div');
        leftCol.className = 'w-1/3 flex flex-col items-center gap-4 border-r border-gray-800 pr-4';

        // Sprite
        const spriteBox = document.createElement('div');
        spriteBox.className = 'w-32 h-32 border-2 border-dashed border-gray-700 flex items-center justify-center bg-black/60 relative';
        spriteBox.innerHTML = spriteMarkup(this.actor, 'h-24 w-24 object-contain', 'status-sprite');
        leftCol.appendChild(spriteBox);

        // Name & Race
        const nameEl = document.createElement('div');
        nameEl.className = 'text-center';
        // Use Registry
        const def = Services.get('CreatureRegistry').get(this.offer.speciesId);
        nameEl.innerHTML = `
            <div class="text-xl text-yellow-400 font-bold tracking-widest">${def.name}</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">Lv.${this.offer.level} ${def.race}</div>
            <div class="text-[10px] text-gray-600 italic mt-1">${def.temperament}</div>
        `;
        leftCol.appendChild(nameEl);

        // Lore
        const loreEl = document.createElement('div');
        loreEl.className = 'text-[10px] text-gray-400 italic text-center mt-2 leading-tight';
        loreEl.innerText = def.description;
        leftCol.appendChild(loreEl);

        this.contentArea.appendChild(leftCol);


        // --- Right Column: Stats & Abilities ---
        const rightCol = document.createElement('div');
        rightCol.className = 'w-2/3 flex flex-col gap-4 overflow-y-auto pr-2 no-scrollbar';

        // Stats Grid
        const statsGrid = document.createElement('div');
        statsGrid.className = 'grid grid-cols-2 gap-2 bg-gray-900/50 p-2 border border-gray-800';

        const statRow = (label, value, color='text-gray-300') => `
            <div class="flex justify-between text-xs">
                <span class="text-gray-500">${label}</span>
                <span class="${color} font-mono">${value}</span>
            </div>
        `;

        statsGrid.innerHTML = `
            ${statRow('HP', `${this.actor.mhp}`, 'text-green-400')}
            ${statRow('MP', `${this.actor.mmp}`, 'text-indigo-400')}
            ${statRow('ATK', this.actor.atk)}
            ${statRow('DEF', this.actor.def)}
            ${statRow('MAT', this.actor.mat)}
            ${statRow('MDF', this.actor.mdf)}
            ${statRow('SPD', this.actor.agi)}
            ${statRow('LUK', this.actor.luk)}
        `;
        rightCol.appendChild(statsGrid);

        // Passives
        if (def.passives && def.passives.length > 0) {
            const passHeader = document.createElement('div');
            passHeader.className = 'text-xs text-gray-500 uppercase border-b border-gray-800 pb-1 mt-2';
            passHeader.innerText = 'Passives';
            rightCol.appendChild(passHeader);

            def.passives.forEach(pid => {
                const p = Services.get('PassiveRegistry').get(pid);
                if (p) {
                    const el = document.createElement('div');
                    el.className = 'bg-black/40 border border-gray-800 p-2 text-xs';
                    el.innerHTML = `<span class="text-yellow-200">${p.name}</span> <span class="text-gray-500 text-[10px]">- ${p.description}</span>`;
                    rightCol.appendChild(el);
                }
            });
        }

        // Actions (Unique)
        const uniqueSkills = new Set();
        (def.acts || []).flat().forEach(id => {
            if (id !== 'wait' && id !== 'guard') uniqueSkills.add(id);
        });

        if (uniqueSkills.size > 0) {
            const actHeader = document.createElement('div');
            actHeader.className = 'text-xs text-gray-500 uppercase border-b border-gray-800 pb-1 mt-2';
            actHeader.innerText = 'Abilities';
            rightCol.appendChild(actHeader);

            const skillsGrid = document.createElement('div');
            skillsGrid.className = 'grid grid-cols-1 gap-1';

            uniqueSkills.forEach(sid => {
                const s = Services.get('SkillRegistry').get(sid);
                if (s) {
                    const el = document.createElement('div');
                    el.className = 'bg-black/40 border border-gray-800 p-1 px-2 text-xs flex justify-between';
                    el.innerHTML = `<span class="text-gray-300">${s.name}</span> <span class="text-gray-600 text-[10px]">${s.cost > 0 ? s.cost + ' MP' : ''}</span>`;
                    skillsGrid.appendChild(el);
                }
            });
            rightCol.appendChild(skillsGrid);
        }

        this.contentArea.appendChild(rightCol);

        // --- Bottom Area: Requirements & Buttons ---

        // Requirements Display
        const reqEl = document.createElement('div');
        reqEl.className = 'flex flex-col';

        let costText = '';
        let canAfford = true;
        let costColor = 'text-gray-400';

        if (this.offer.cost.type === 'FREE') {
            costText = 'Free to join';
            costColor = 'text-green-400';
        } else if (this.offer.cost.type === 'GOLD') {
            const gold = window.$gameParty.gold;
            const price = this.offer.cost.value;
            costText = `${price} Gold`;
            if (gold < price) {
                canAfford = false;
                costColor = 'text-red-500';
            } else {
                costColor = 'text-yellow-400';
            }
        } else if (this.offer.cost.type === 'ITEM') {
            const itemId = this.offer.cost.id;
            const count = window.$gameParty.countItem(itemId);
            const req = this.offer.cost.value;
            costText = `${req}x ${this.offer.cost.name}`;
            if (count < req) {
                canAfford = false;
                costColor = 'text-red-500';
            } else {
                costColor = 'text-blue-300';
            }
        }

        reqEl.innerHTML = `
            <div class="text-[10px] text-gray-500 uppercase">Requirement</div>
            <div class="text-lg ${costColor} font-bold">${costText}</div>
        `;
        this.actionArea.appendChild(reqEl);

        // Buttons
        const btnGroup = document.createElement('div');
        btnGroup.className = 'flex gap-4';

        const cancelBtn = new ButtonComponent('LEAVE', () => this.hide(false), 'px-6 py-2 border border-gray-600 hover:bg-gray-800 text-gray-300');

        const recruitBtn = new ButtonComponent('RECRUIT', () => this.onRecruit(), `px-6 py-2 border ${canAfford ? 'border-green-600 bg-green-900/20 hover:bg-green-800 hover:text-white text-green-400' : 'border-gray-800 text-gray-600 cursor-not-allowed'}`);
        if (!canAfford) recruitBtn.element.disabled = true;

        btnGroup.appendChild(cancelBtn.element);
        btnGroup.appendChild(recruitBtn.element);
        this.actionArea.appendChild(btnGroup);
    }

    onRecruit() {
        const cost = this.offer.cost;
        if (cost.type === 'GOLD') {
            window.$gameParty.loseGold(cost.value);
            Log.add(`Paid ${cost.value} Gold.`);
        } else if (cost.type === 'ITEM') {
            window.$gameParty.loseItem(cost.id, cost.value);
            Log.add(`Handed over ${cost.value}x ${cost.name}.`);
        }

        window.$gameParty.addActor(this.offer.speciesId, this.offer.level);
        if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();
        Log.add(`${this.actor.name} joined the party!`);

        this.hide(true);
    }
}
