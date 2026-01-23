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
        this.root.className = 'absolute inset-0 bg-black/90 p-4 z-50 hidden';

        const container = document.getElementById('game-container');
        if (container && !document.getElementById('window-shop')) {
            container.appendChild(this.root);
        }
    }

    defineLayout() {
        this.root.innerHTML = '';

        const content = document.createElement('div');
        content.className = 'w-full h-full';
        this.root.appendChild(content);

        this.layout = new FlexLayout(content, { direction: 'column', gap: '1rem', padding: '1rem' });
    }

    show(stock) {
        return new Promise(resolve => {
            this._resolve = resolve;
            this.items = stock || [];

            const container = document.getElementById('game-container');
            if (container && !this.root.parentElement) {
                container.appendChild(this.root);
            }

            if (!this.layout) this.defineLayout();

            this.refresh();
            this.select(0); // Select first item
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
        if (!this.layout) return;

        this.layout.clear();

        this.layout.add(new TextComponent('SHOP', 'text-2xl text-yellow-500 font-bold text-center border-b border-gray-700 pb-2'));

        this.listContainer = document.createElement('div');
        this.listContainer.className = 'flex-1 overflow-y-auto space-y-2';
        this.layout.addRaw(this.listContainer);

        // Help Text Footer
        this._helpTextComponent = new TextComponent('', 'bg-[#1a1a1a] border-t border-gray-700 p-2 text-xs text-gray-300 italic min-h-[3rem]');
        this.layout.add(this._helpTextComponent);

        this.items.forEach((item, index) => {
            if (item) {
                this.drawItem(index);
            }
        });

        const leaveBtn = new ButtonComponent('LEAVE (ESC)', () => this.hide(), 'mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600');
        this.layout.add(leaveBtn);
    }

    setHelpText(text) {
        if (this._helpTextComponent) {
            this._helpTextComponent.element.innerText = text || '';
        }
    }

    drawItem(index) {
        if (!this.listContainer) return;
        const stockItem = this._items[index];

        const isItem = stockItem.type === 'item';
        const data = isItem
            ? Services.get('ItemRegistry').get(stockItem.id)
            : Services.get('EquipmentRegistry').get(stockItem.id);

        if (!data) return;

        // Populate Help Info
        stockItem.description = data.description;
        stockItem.name = data.name;

        const row = document.createElement('div');
        let baseClasses = 'flex justify-between items-center bg-gray-900 p-2 border border-gray-700';
        if (this._index === index) {
            baseClasses = 'flex justify-between items-center bg-gray-800 p-2 border border-yellow-400';
        }
        row.className = baseClasses;

        const info = document.createElement('div');
        info.className = 'flex flex-col';
        // Removed inline description
        info.innerHTML = `
            <span class="text-yellow-100">${data.name}</span>
            <span class="text-xs text-gray-400">${data.cost} G</span>
        `;
        row.appendChild(info);

        const btn = document.createElement('button');
        btn.className = 'text-xs border border-gray-600 px-2 py-1 hover:bg-white hover:text-black transition-colors';
        btn.innerText = 'BUY';
        btn.onclick = (e) => {
            e.stopPropagation();
            this.select(index);
            this.processOk();
        };
        row.appendChild(btn);

        // Add click to select
        row.onclick = () => {
            this.select(index);
        };

        this.listContainer.appendChild(row);

        if (this._index === index) {
             row.scrollIntoView({ block: 'nearest' });
        }
    }

    processOk() {
        const index = this._index;
        const stockItem = this._items[index];
        if (!stockItem) return;

        const isItem = stockItem.type === 'item';
        const data = isItem
            ? Services.get('ItemRegistry').get(stockItem.id)
            : Services.get('EquipmentRegistry').get(stockItem.id);

        if (window.$gameParty.gold >= data.cost) {
            window.$gameParty.loseGold(data.cost);
            if (isItem) {
                window.$gameParty.gainItem(stockItem.id, 1);
            } else {
                window.$gameParty.gainEquipment(stockItem.id, 1);
            }
            Log.loot(`Bought ${data.name}.`);

            if (window.Game.Windows.HUD) window.Game.Windows.HUD.refresh();
        } else {
            alert('Not enough gold!');
        }
    }
}
