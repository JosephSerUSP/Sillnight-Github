/**
 * Base class for UI components.
 * Components are "dumb" views managed by a Window/Controller.
 */
export class Component {
    constructor(tagName = 'div', className = '') {
        this.element = document.createElement(tagName);
        if (className) this.element.className = className;
        this._handlers = {};
        this.initialize();
    }

    initialize() {
        // Override for setup
    }

    /**
     * Adds an event listener.
     * @param {string} event
     * @param {Function} callback
     */
    on(event, callback) {
        this.element.addEventListener(event, callback);
        this._handlers[event] = callback; // Track if needed
    }

    /**
     * Sets the text content.
     * @param {string} text
     */
    setText(text) {
        this.element.textContent = text;
    }

    /**
     * Sets HTML content.
     * @param {string} html
     */
    setHtml(html) {
        this.element.innerHTML = html;
    }

    addClass(className) {
        this.element.classList.add(className);
    }

    removeClass(className) {
        this.element.classList.remove(className);
    }
}
