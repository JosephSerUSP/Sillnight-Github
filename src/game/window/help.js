
import { Window_Base } from '../windows.js';
import { Component } from '../layout/Component.js';

/**
 * Window for displaying help information (descriptions of selected items/units).
 */
export class Window_Help extends Window_Base {
    constructor() {
        super('help-window');
        this.root.className = 'absolute top-0 left-0 right-0 h-16 bg-black/90 border-b border-white z-50 flex items-center px-4 hidden';

        // Ensure it's in the DOM
        const container = document.getElementById('game-container');
        if (container && !document.getElementById('help-window')) {
            container.appendChild(this.root);
        }
    }

    initialize() {
        super.initialize();
        this._text = '';
        this.createLayout();
    }

    createLayout() {
        this.root.innerHTML = '';
        this._textElement = new Component('div', 'text-yellow-100 text-sm tracking-wide').element;
        this.root.appendChild(this._textElement);
    }

    // Override show/hide to avoid registering with SceneManager (passive window)
    show() {
        if (this.root) this.root.classList.remove('hidden');
    }

    hide() {
        if (this.root) this.root.classList.add('hidden');
    }

    /**
     * Sets the text to display.
     * @param {string} text
     */
    setText(text) {
        if (this._text !== text) {
            this._text = text;
            this._textElement.innerText = text;
            if (text) {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    /**
     * Extracts description from an item and displays it.
     * @param {Object} item
     */
    setItem(item) {
        if (item) {
            // Handle different item types
            let text = item.description || '';
            this.setText(text);
        } else {
            this.setText('');
        }
    }

    clear() {
        this.setText('');
    }
}
