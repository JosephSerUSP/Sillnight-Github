import { Services } from '../ServiceLocator.js';

/**
 * Base class for UI components.
 * Components are "dumb" views managed by a Window/Controller.
 */
export class Component {
    constructor(tagName = 'div', className = '') {
        this.element = document.createElement(tagName);
        if (className) this.element.className = className;
        this._handlers = {};
        this._listeners = [];
        this.initialize();
    }

    initialize() {
        // Override for setup
    }

    /**
     * Subscribes to a global event via Services.events.
     * Automatically managed by destroy().
     * @param {string} event
     * @param {Function} callback
     */
    listen(event, callback) {
        const unsub = Services.events.on(event, callback);
        this._listeners.push(unsub);
    }

    /**
     * Cleans up the component.
     * Removes element from DOM and unsubscribes from events.
     */
    destroy() {
        this._listeners.forEach(unsub => unsub());
        this._listeners = [];
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
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
