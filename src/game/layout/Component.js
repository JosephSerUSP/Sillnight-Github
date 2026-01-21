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
        this._subscriptions = []; // Store unsubscribe functions
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
     * Subscribes to a global event via Services.events.
     * Automatically handles cleanup on destroy.
     * @param {string} event - Event name.
     * @param {Function} callback - Callback function.
     * @returns {Function} Unsubscribe function.
     */
    listen(event, callback) {
        const unsubscribe = Services.events.on(event, callback);
        this._subscriptions.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Sets the text content.
     * @param {string} text
     */
    setText(text) {
        if (this.element) this.element.textContent = text;
    }

    /**
     * Sets HTML content.
     * @param {string} html
     */
    setHtml(html) {
        if (this.element) this.element.innerHTML = html;
    }

    addClass(className) {
        if (this.element) this.element.classList.add(className);
    }

    removeClass(className) {
        if (this.element) this.element.classList.remove(className);
    }

    /**
     * Cleans up the component.
     * Removes all subscriptions and the element.
     */
    destroy() {
        this._subscriptions.forEach(unsub => unsub());
        this._subscriptions = [];
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
