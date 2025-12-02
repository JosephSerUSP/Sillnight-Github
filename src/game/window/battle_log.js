
import { Window_Base } from '../windows.js';
import { FlexLayout } from '../layout/FlexLayout.js';
import { Component } from '../layout/Component.js';
import { TextComponent, ButtonComponent } from '../layout/components.js';

/**
 * The window responsible for displaying battle logs, banners, and indicators.
 */
export class Window_BattleLog extends Window_Base {
    constructor() {
        super('battle-log-window'); // Attaches to existing container for layout positioning
    }

    initialize() {
        super.initialize();
        this.createLayout();

        // References to external/global UI elements
        // In a full refactor, these should be their own Windows/Managers, but for now we manage them here.
        // We look for them, and if not found (because index.html changed), we might need to create them.
        // For the plan "Execute Window Refactoring", we focus on the window internal structure.

        this._banner = document.getElementById('battle-banner');
        this._bannerText = document.getElementById('banner-text');
        this._turnIndicator = document.getElementById('turn-indicator');
        this._playerTurnButton = document.getElementById('btn-player-turn');
        this._centerModal = document.getElementById('center-modal');

        // If we removed them from index.html (we haven't yet for these specific ones), we'd create them here.
    }

    createLayout() {
        // Clear existing static HTML in #battle-log-window
        this.clear();

        // Use FlexLayout
        this.layout = new FlexLayout(this.root, { direction: 'column' });

        // Header
        const header = new Component('div', 'rpg-header text-[10px] text-gray-400');
        header.element.innerText = 'LOG';
        this.layout.add(header);

        // Log Content Container
        this._logContainer = new Component('div', 'p-2 overflow-y-auto font-mono leading-tight space-y-1 no-scrollbar text-gray-300 flex-grow');
        // We set ID 'game-log' because other systems (like Log class) might write to it directly?
        // Checking src/game/log.js would be wise.
        this._logContainer.element.id = 'game-log';
        this.layout.add(this._logContainer, { grow: 1 });
    }

    /**
     * Displays a large banner text overlay (e.g., 'ENCOUNTER', 'VICTORY').
     * Automatically fades out after a delay.
     * @param {string} text - The text to display.
     */
    showBanner(text) {
        if (!this._bannerText || !this._banner) return;
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
        if (!this._turnIndicator || !this._playerTurnButton) return;

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
        if (!this._centerModal) return;
        this._centerModal.innerHTML = html;
        this._centerModal.classList.remove('hidden');
    }

    /**
     * Closes the center modal.
     */
    closeModal() {
        if (!this._centerModal) return;
        this._centerModal.classList.add('hidden');
    }
}
