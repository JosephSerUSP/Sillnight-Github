import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel } from './common.js';
import { GridLayout } from '../layout/GridLayout.js';
import { Component } from '../layout/Component.js';
import { PopupManager } from '../PopupManager.js';

// Custom component for a party slot
class PartySlotComponent extends Component {
    constructor(unit, index, onClick) {
        // Base styling for slot
        super('div', 'party-slot relative flex flex-col p-1 cursor-pointer hover:bg-white/10');
        this.unit = unit;
        this.index = index;

        if (unit?.isSummoner) {
            this.addClass('summoner-slot');
        }

        // Render content
        if (unit) {
            this.setHtml(renderCreaturePanel(unit));
        } else {
            this.setHtml('<span class="m-auto text-gray-800 text-xs">EMPTY</span>');
        }

        // Click handling
        if (onClick) {
            this.on('click', () => onClick(index));
        }
    }

    setSelected(selected) {
        if (selected) {
            this.addClass('selected');
            // Assuming 'selected' class does the styling, otherwise:
            this.addClass('border-yellow-500');
            this.addClass('border');
        } else {
            this.removeClass('selected');
            this.removeClass('border-yellow-500');
            this.removeClass('border');
        }
    }
}

/**
 * Window showing the active party in the main UI.
 */
export class Window_Party extends Window_Selectable {
    constructor() {
        super('party-grid');
    }

    initialize() {
        super.initialize();
        this.defineLayout();
        this.items = window.$gameParty.activeSlots;
        this.addHandler('click', this.onClick.bind(this));
    }

    defineLayout() {
        this.layout = new GridLayout(this.root, {
            columns: 'repeat(3, 1fr) 0.8fr',
            rows: 'repeat(2, minmax(0, 1fr))',
            gap: '4px'
            // rows defaults to null, relying on autoRows: 'minmax(0, 1fr)' for equal height
        });

        // Ensure root has standard window styles if not already set by Window_Base default
        // Window_Party usually lives in a container, but 'party-grid' is the ID.
        // It might be absolutely positioned by the main layout.
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
            if (ind) {
                ind.innerText = 'FORMATION MODE';
                ind.classList.remove('hidden');
            }
            if (btn) btn.classList.add('bg-yellow-900', 'text-white');
        } else {
            if (ind) ind.classList.add('hidden');
            if (btn) btn.classList.remove('bg-yellow-900', 'text-white');
            this.deselect();
        }
    }

    /**
     * Overrides refresh to use LayoutManager and Components.
     */
    refresh() {
        // Clear layout
        if (this.layout) {
            this.layout.clear();
        } else {
            // Fallback if layout not ready (should not happen if initialize called)
            this.defineLayout();
        }

        // Rebuild slots
        const max = this.maxItems();
        for (let i = 0; i < max; i++) {
            this.drawItem(i);
        }
    }

    /**
     * Draws a single party slot using PartySlotComponent.
     * @param {number} index
     */
    drawItem(index) {
        const u = this.items[index];
        const component = new PartySlotComponent(u, index, (idx) => this.callHandler('click', idx));

        if (u?.isSummoner) {
            component.addClass('border-indigo-400');
        }

        if (this._index === index) {
            component.setSelected(true);
        }

        const layoutOptions = this.slotLayoutPosition(index);
        this.layout.add(component, layoutOptions);
    }

    slotLayoutPosition(index) {
        const summonerIndex = window.$gameParty.summonerSlotIndex();
        if (index === summonerIndex) {
            return { col: 4, row: '1 / span 2' };
        }

        const col = (index % 3) + 1;
        const row = Math.floor(index / 3) + 1;
        return { col, row };
    }

    /**
     * Handles clicks on party slots.
     * Swaps units if in formation mode, or opens details otherwise.
     * @param {number} index - The clicked slot index.
     */
    onClick(index) {
        // Allow swapping only in formation mode
        if (window.Game.ui.formationMode) {
            if (window.$gameParty.isSummonerSlot(index)) {
                this.deselect();
                return;
            }
             const selectedIndex = this._index;
            if (selectedIndex !== -1 && selectedIndex !== index) {
                if (window.$gameParty.isSummonerSlot(selectedIndex)) {
                    this.deselect();
                    return;
                }
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

    /**
     * Shows a floating HP/Damage popup for a unit.
     * @param {Object} unit - The unit that changed HP.
     * @param {number} diff - The amount changed (positive = heal, negative = damage).
     */
    onUnitHpChange(unit, diff) {
        // Find the slot index
        const index = window.$gameParty.activeSlots.indexOf(unit);
        if (index === -1) return;

        // Find the DOM element
        const component = this.layout.components[index];
        if (!component || !component.element) return;

        // Calculate screen position of the slot
        const rect = component.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Spawn physics popup
        // Note: diff needs to be the text value.
        // The manager handles colors based on value if no color provided.
        // Or we can pass color.

        let displayVal = diff;
        if (diff > 0) displayVal = `+${diff}`;

        PopupManager.spawn(centerX, centerY, displayVal, false);
    }
}
