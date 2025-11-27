import { Window_Base } from '../windows.js';

/**
 * The window responsible for displaying battle logs, banners, and indicators.
 */
export class Window_BattleLog extends Window_Base {
    /**
     * Initializes the BattleLog window and gets references to its UI elements.
     */
    constructor() {
        super(document.getElementById('battle-log'));
        this._banner = document.getElementById('battle-banner');
        this._bannerText = document.getElementById('banner-text');
        this._turnIndicator = document.getElementById('turn-indicator');
        this._playerTurnButton = document.getElementById('btn-player-turn');
        this._centerModal = document.getElementById('center-modal');
    }

    /**
     * Displays a large banner text overlay (e.g., 'ENCOUNTER', 'VICTORY').
     * Automatically fades out after a delay.
     * @param {string} text - The text to display.
     */
    showBanner(text) {
        this._bannerText.innerText = text;
        this._banner.classList.remove('opacity-0');
        setTimeout(() => this._banner.classList.add('opacity-0'), 2500);
    }

    /**
     * Toggles the UI state for the player's turn input.
     * Updates the turn indicator and the action button.
     * @param {boolean} active - Whether it is the player's turn.
     * @param {Object} [handlers] - Event handlers for the button.
     * @param {Function} [handlers.onResume] - Callback for resuming auto-battle.
     * @param {Function} [handlers.onRequest] - Callback for requesting a pause.
     */
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

    /**
     * Displays a modal dialog in the center of the screen.
     * @param {string} html - The HTML content of the modal.
     */
    showModal(html) {
        this._centerModal.innerHTML = html;
        this._centerModal.classList.remove('hidden');
    }

    /**
     * Closes the center modal.
     */
    closeModal() {
        this._centerModal.classList.add('hidden');
    }
}
