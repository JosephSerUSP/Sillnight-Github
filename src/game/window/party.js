import { $gameParty, $gameBattle } from '../globals.js';
import { Game } from '../main.js';
import { Window_Selectable } from '../windows.js';
import { renderCreaturePanel, spriteMarkup } from './common.js';

export class Window_Party extends Window_Selectable {
    constructor() {
        super(document.getElementById('party-grid'));
        this.items = [];
        this.addHandler('click', this.onClick.bind(this));
    }

    spriteMarkup(unit, sizeClasses = 'h-10 w-10 object-contain', extraClasses = '', textClass = 'text-2xl') {
        return spriteMarkup(unit, sizeClasses, extraClasses, textClass);
    }

    toggleFormationMode() {
        if (Game.ui.mode === 'BATTLE') return;
        Game.ui.formationMode = !Game.ui.formationMode;
        const ind = document.getElementById('turn-indicator');
        const btn = document.getElementById('btn-formation');
        if (Game.ui.formationMode) {
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
        if (($gameBattle && $gameBattle.phase === 'PLAYER_INPUT') || Game.ui.formationMode) {
            const selectedIndex = this.index;
            if (selectedIndex !== -1 && selectedIndex !== index) {
                const actors = $gameParty.actors();
                const u1 = actors[selectedIndex];
                const u2 = actors[index];
                actors[selectedIndex] = u2;
                actors[index] = u1;
                this.refresh();
                this.deselect();
            } else {
                this.select(index);
            }
        } else {
            const unit = $gameParty.actors()[index];
            if (unit) {
                window.Game.Windows.CreatureModal.setUnit(unit);
                window.Game.Windows.CreatureModal.show();
            }
        }
    }

    refresh() {
        if (!$gameParty) {
            console.log("Window_Party.refresh() called before $gameParty is initialized");
            return;
        }
        this.items = $gameParty.actors();
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
