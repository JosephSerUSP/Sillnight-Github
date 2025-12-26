import { Window_Selectable } from '../windows.js';
import { Services } from '../ServiceLocator.js';
import { Log } from '../log.js';
import { FlexLayout } from '../layout/index.js';
import { TextComponent, ButtonComponent } from '../layout/components.js';

export class Window_Shop extends Window_Selectable {
    initialize() {
        this._resolve = null;
        super.initialize();
        this.root.id = 'window-shop';
        // Base window styling (overlay) - removed flex from here so it doesn't conflict with hidden
        this.root.className = 'absolute inset-0 bg-black/90 p-4 z-50 hidden';

        // Ensure in DOM (consistent with recruit)
        const container = document.getElementById('game-container');
        if (container && !document.getElementById('window-shop')) {
            container.appendChild(this.root);
        }
    }

    defineLayout() {
        // Create an internal container for layout to avoid setting styles on root
        this.root.innerHTML = ''; // Clear previous

        const content = document.createElement('div');
        content.className = 'w-full h-full';
        this.root.appendChild(content);

        // Main container layout applies to the inner content div
        this.layout = new FlexLayout(content, { direction: 'column', gap: '1rem', padding: '1rem' });
    }

    /**
     * Shows the shop window with the given stock.
     * @param {Array<Object>} stock - The stock to display.
     * @returns {Promise<void>} Resolves when the shop is closed.
     */
    show(stock) {
        return new Promise(resolve => {
            this._resolve = resolve;
            this.items = stock || [];

            // Re-check DOM insertion if needed (though init does it)
            const container = document.getElementById('game-container');
            if (container && !this.root.parentElement) {
                container.appendChild(this.root);
            }

            // Ensure layout is built
            if (!this.layout) this.defineLayout();

            this.refresh(); // Trigger population
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
        // Since we rebuild layout in defineLayout? No, just clear and add
        // But defineLayout creates a new FlexLayout instance on the inner div
        // If defineLayout was called in initialize, this.layout is ready.
        // But if show() called defineLayout again (like in recruit), we might need to be careful.
        // Window_Selectable calls refresh() on items set.

        if (!this.layout) return;

        this.layout.clear();

        // Title
        this.layout.add(new TextComponent('SHOP', 'text-2xl text-yellow-500 font-bold text-center border-b border-gray-700 pb-2'));

        // Item List Container
        const listContainer = document.createElement('div');
        listContainer.className = 'flex-1 overflow-y-auto space-y-2';
        this.layout.addRaw(listContainer);

        // Populate items
        this.items.forEach((item, index) => {
            if (item) {
                const el = this.createItemElement(item, index);
                listContainer.appendChild(el);
            }
        });

        // Leave Button
        const leaveBtn = new ButtonComponent('LEAVE', () => this.hide(), 'mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600');
        this.layout.add(leaveBtn);
    }

    createItemElement(stockItem, index) {
        const isItem = stockItem.type === 'item';
        // Use Registry instead of direct Data access
        const data = isItem
            ? Services.get('ItemRegistry').get(stockItem.id)
            : Services.get('EquipmentRegistry').get(stockItem.id);

        if (!data) return document.createElement('div');

        const row = document.createElement('div');
        row.className = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';

        const info = document.createElement('div');
        info.className = 'flex flex-col';
        info.innerHTML = `
            <span class="text-yellow-100">${data.name}</span>
            <span class="text-xs text-gray-500">${data.description || ''}</span>
            <span class="text-xs text-gray-400">${data.cost} G</span>
        `;
        row.appendChild(info);

        const btn = document.createElement('button');
        btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black transition-colors';
        btn.innerText = 'BUY';
        btn.onclick = () => {
            if (window.$gameParty.gold >= data.cost) {
                window.$gameParty.loseGold(data.cost);
                window.$gameParty.gainItem(stockItem.id, 1);
                Log.loot(`Bought ${data.name}.`);

                // Refresh HUD if it exists
                if (window.Game.Windows.HUD) window.Game.Windows.HUD.refresh();

                btn.disabled = true;
                btn.innerText = 'SOLD';
                btn.className = 'text-xs border border-gray-800 px-2 py-1 text-gray-500 cursor-not-allowed';
            } else {
                // Flash red or alert
                alert('Not enough gold!');
            }
        };
        row.appendChild(btn);

        return row;
    }
}
