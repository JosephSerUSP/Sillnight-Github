import { Window_Selectable } from '../windows.js';
import { Data } from '../../assets/data/data.js';
import { Log } from '../log.js';
import { FlexLayout } from '../layout/index.js';
import { TextComponent, ButtonComponent } from '../layout/components.js';
import { spriteMarkup } from './common.js';
import { resolveAssetPath } from '../core.js';

export class Window_Recruit extends Window_Selectable {
    initialize() {
        this._resolve = null;
        super.initialize();
        this.root.id = 'window-recruit';
        this.root.className = 'absolute inset-0 bg-black/90 p-4 z-50 flex flex-col hidden';
    }

    defineLayout() {
        this.layout = new FlexLayout(this.root, { direction: 'column', gap: '1rem', padding: '1rem' });
    }

    /**
     * Shows the recruit window.
     * @param {Array<Object>} offers - List of creature definitions.
     * @returns {Promise<void>} Resolves when closed.
     */
    show(offers) {
        return new Promise(resolve => {
            this._resolve = resolve;
            this.items = offers || [];

            const container = document.getElementById('game-container');
            if (container && !this.root.parentElement) {
                container.appendChild(this.root);
            }

            super.show();
        });
    }

    hide() {
        super.hide();
        if (this._resolve) {
            this._resolve();
            this._resolve = null;
        }
    }

    refresh() {
        this.layout.clear();

        // Title
        this.layout.add(new TextComponent('RECRUIT', 'text-2xl text-green-500 font-bold text-center border-b border-gray-700 pb-2'));

        // List Container
        const listContainer = document.createElement('div');
        listContainer.className = 'flex-1 overflow-y-auto space-y-2';
        this.layout.addRaw(listContainer);

        // Populate items
        this.items.forEach((def, index) => {
            const el = this.createOfferElement(def, index);
            listContainer.appendChild(el);
        });

        // Leave Button
        const leaveBtn = new ButtonComponent('LEAVE', () => this.hide(), 'mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600');
        this.layout.add(leaveBtn);
    }

    createOfferElement(def, index) {
        if (!def) return document.createElement('div');

        const row = document.createElement('div');
        row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';

        const info = document.createElement('div');
        info.className = 'flex items-center gap-2';
        info.innerHTML = `
            ${spriteMarkup(def, 'h-10 w-10 object-contain')}
            <div>
                <div class="text-yellow-100">${def.name || 'Unknown'}</div>
                <div class="text-xs text-gray-500">HP ${def.baseHp || '???'}</div>
            </div>
        `;
        row.appendChild(info);

        const btn = document.createElement('button');
        btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black transition-colors';
        btn.innerText = 'RECRUIT';
        btn.onclick = () => {
            const floor = window.$gameMap ? window.$gameMap.floor : 1;
            window.$gameParty.addActor(def.id, floor);
            if (window.Game.Windows.Party) window.Game.Windows.Party.refresh();

            btn.disabled = true;
            btn.innerText = 'TAKEN';
            btn.className = 'text-xs border border-gray-800 px-2 py-1 text-gray-500 cursor-not-allowed';
        };
        row.appendChild(btn);

        return row;
    }
}
