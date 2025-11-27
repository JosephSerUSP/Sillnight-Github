import { GameState } from '../state.js';
import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel, spriteMarkup } from './common.js';

export class Window_Party extends Window_Selectable {
    constructor() {
        super(document.getElementById('party-grid'));
        this.items = GameState.party.activeSlots;
        this.addHandler('click', this.onClick.bind(this));
    }

    spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
        return spriteMarkup(unit, sizeClasses, extraClasses, textClass);
    }

    toggleFormationMode() {
        if (GameState.ui.mode === 'BATTLE') return;
        GameState.ui.formationMode = !GameState.ui.formationMode;
        const ind = document.getElementById('turn-indicator');
        const btn = document.getElementById('btn-formation');
        if (GameState.ui.formationMode) {
            ind.innerText = 'FORMATION MODE';
            ind.classList.remove('hidden');
            btn.classList.add('bg-yellow-900', 'text-white');
        } else {
            ind.classList.add('hidden');
            btn.classList.remove('bg-yellow-900', 'text-white');
            this.deselect();
        }
    }

    onClick(index) {
        if (GameState.battle && GameState.battle.phase === 'PLAYER_INPUT' || GameState.ui.formationMode) {
            const selectedIndex = this.index;
            if (selectedIndex !== -1 && selectedIndex !== index) {
                const u1 = GameState.party.activeSlots[selectedIndex];
                const u2 = GameState.party.activeSlots[index];
                GameState.party.activeSlots[selectedIndex] = u2;
                GameState.party.activeSlots[index] = u1;
                if (GameState.party.activeSlots[selectedIndex]) GameState.party.activeSlots[selectedIndex].slotIndex = selectedIndex;
                if (GameState.party.activeSlots[index]) GameState.party.activeSlots[index].slotIndex = index;
                this.refresh();
                this.deselect();
            } else {
                this.select(index);
            }
        } else {
            const unit = GameState.party.activeSlots[index];
            if (unit) {
                window.Game.Windows.CreatureModal.setUnit(unit);
                window.Game.Windows.CreatureModal.show();
            }
        }
    }

    refresh() {
        this.root.innerHTML = '';
        this.items.forEach((u, i) => {
            const div = document.createElement('div');
            div.className = 'party-slot relative flex flex-col p-1';
            if (this.index === i) {
                div.classList.add('selected');
            }
            if (u) {
                div.innerHTML = renderCreaturePanel(u);
            } else {
                div.innerHTML = '<span class="m-auto text-gray-800 text-xs">EMPTY</span>';
            }
            div.onclick = () => this.onClick(i);
            this.root.appendChild(div);
        });
        super.refresh();
    }
}
