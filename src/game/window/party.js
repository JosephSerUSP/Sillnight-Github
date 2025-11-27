import { $gameParty } from '../globals.js';
import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel, spriteMarkup } from './common.js';

export class Window_Party extends Window_Selectable {
    constructor() {
        super(document.getElementById('party-grid'));
        this.items = $gameParty.actors;
        this.addHandler('click', this.onClick.bind(this));
    }

    spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
        return spriteMarkup(unit, sizeClasses, extraClasses, textClass);
    }

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

    onClick(index) {
        if (window.Game.battle && window.Game.battle.phase === 'PLAYER_INPUT' || window.Game.ui.formationMode) {
            const selectedIndex = this.index;
            if (selectedIndex !== -1 && selectedIndex !== index) {
                const u1 = $gameParty.actors[selectedIndex];
                const u2 = $gameParty.actors[index];
                $gameParty.actors[selectedIndex] = u2;
                $gameParty.actors[index] = u1;
                if ($gameParty.actors[selectedIndex]) $gameParty.actors[selectedIndex].slotIndex = selectedIndex;
                if ($gameParty.actors[index]) $gameParty.actors[index].slotIndex = index;
                this.refresh();
                this.deselect();
            } else {
                this.select(index);
            }
        } else {
            const unit = $gameParty.actors[index];
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
