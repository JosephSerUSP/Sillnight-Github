import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel } from './common.js';

/**
 * Window showing the active party in the main UI.
 */
export class Window_Party extends Window_Selectable {
    constructor() {
        super('party-grid');
    }

    initialize() {
        super.initialize();
        this.items = window.$gameParty.activeSlots;
        this.addHandler('click', this.onClick.bind(this));
    }

    /**
     * Toggles formation editing mode.
     */
    toggleFormationMode() {
        if (window.Game.ui.mode === 'BATTLE') return;
        window.Game.ui.formationMode = !window.Game.ui.formationMode;
        const ind = document.getElementById('turn-indicator');
        const btn = document.getElementById('btn-formation');
        if (window.Game.ui.formationMode) {
            ind.innerText = 'FORMATION MODE';
            ind.classList.remove('hidden');
            btn.classList.add('bg-yellow-900', 'text-white');
        } else {
            ind.classList.add('hidden');
            btn.classList.remove('bg-yellow-900', 'text-white');
            this.deselect();
        }
    }

    /**
     * Draws a single party slot.
     * @param {number} index
     */
    drawItem(index) {
        const u = this.items[index];
        const div = this.createEl('div', 'party-slot relative flex flex-col p-1');

        if (this._index === index) {
            div.classList.add('selected');
        }

        if (u) {
            div.innerHTML = renderCreaturePanel(u);
        } else {
            div.innerHTML = '<span class="m-auto text-gray-800 text-xs">EMPTY</span>';
        }

        div.onclick = () => this.callHandler('click', index);
    }

    /**
     * Handles clicks on party slots.
     * Swaps units if in formation mode, or opens details otherwise.
     * @param {number} index - The clicked slot index.
     */
    /**
     * Generates HTML markup for a creature's sprite.
     * @param {object} def - The creature definition.
     * @param {string} [className] - Additional CSS classes.
     * @returns {string} The HTML string.
     */
    spriteMarkup(def, className = '') {
        if (!def) return `<div class="w-8 h-8 ${className}"></div>`;
        const sprite = def.sprite || '?';
        const asset = def.spriteAsset;
        if (asset) {
            const path = window.Game.resolveAssetPath(asset);
            return `<img src="${path}" class="${className}" alt="${def.name}">`;
        }
        return `<div class="flex items-center justify-center text-4xl ${className}">${sprite}</div>`;
    }

    onClick(index) {
        // Allow swapping only in formation mode
        if (window.Game.ui.formationMode) {
             const selectedIndex = this._index;
            if (selectedIndex !== -1 && selectedIndex !== index) {
                window.$gameParty.swapOrder(selectedIndex, index);
                this.deselect();
            } else {
                this.select(index);
            }
        } else {
            // Otherwise, show creature details
            const unit = window.$gameParty.activeSlots[index];
            if (unit) {
                window.Game.Windows.CreatureModal.setUnit(unit);
                window.Game.Windows.CreatureModal.show();
            }
        }
    }
}
