import { Window_Base } from '../windows.js';

export class Window_BattleLog extends Window_Base {
    constructor() {
        super(document.getElementById('battle-log'));
        this._banner = document.getElementById('battle-banner');
        this._bannerText = document.getElementById('banner-text');
        this._turnIndicator = document.getElementById('turn-indicator');
        this._playerTurnButton = document.getElementById('btn-player-turn');
        this._centerModal = document.getElementById('center-modal');
    }

    showBanner(text) {
        this._bannerText.innerText = text;
        this._banner.classList.remove('opacity-0');
        setTimeout(() => this._banner.classList.add('opacity-0'), 2500);
    }

    togglePlayerTurn(active, handlers) {
        if (active) {
            this._turnIndicator.innerText = 'PLAYER INPUT PHASE';
            this._turnIndicator.classList.remove('hidden');
            this._playerTurnButton.innerText = 'RESUME (SPACE)';
            this._playerTurnButton.classList.add('bg-yellow-900', 'text-white');
            this._playerTurnButton.onclick = handlers.onResume;
        } else {
            this._turnIndicator.classList.add('hidden');
            this._playerTurnButton.classList.remove('bg-yellow-900', 'text-white');
            this._playerTurnButton.innerText = 'STOP ROUND (SPACE)';
            this._playerTurnButton.onclick = handlers.onRequest;
        }
    }

    showModal(html) {
        this._centerModal.innerHTML = html;
        this._centerModal.classList.remove('hidden');
    }

    closeModal() {
        this._centerModal.classList.add('hidden');
    }
}
