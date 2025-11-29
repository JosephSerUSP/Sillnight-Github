// Window and shell UI layer (similar to rmmz_windows.js).
// All DOM-related code for the persistent PC-98 shell lives here. Add new window
// types by subclassing Window_Base and wiring them into the ShellUI container.

/**
 * Base class for all UI windows.
 * Manages the DOM element, visibility, and basic lifecycle.
 */
export class Window_Base {
    /**
     * @param {HTMLElement|string} rectOrId - The root DOM element, an ID string, or a rect (future use).
     */
    constructor(rectOrId) {
        if (typeof rectOrId === 'string') {
            this.root = document.getElementById(rectOrId);
        } else if (rectOrId instanceof HTMLElement) {
            this.root = rectOrId;
        } else {
            this.root = document.createElement('div');
            // Default styling for dynamic windows can go here
            this.root.className = 'absolute bg-black/80 border border-white';
        }

        if (!this.root) {
            console.error(`Window_Base: Could not find element with ID '${rectOrId}'`);
        }

        this._handlers = {};
        this.initialize();
    }

    initialize() {
        // To be overridden by subclasses
    }

    /**
     * Opens the window. If it's a dynamic window, appends to parent.
     * @param {HTMLElement} [parent] - The parent element. Defaults to document.body.
     */
    open(parent) {
        if (parent && !this.root.parentElement) {
            parent.appendChild(this.root);
        }
        this.show();
    }

    /**
     * Removes the window from the DOM (if dynamic) or hides it.
     */
    close() {
        this.hide();
        // If we want to support destroying dynamic windows:
        // this.root.remove();
    }

    /** Shows the window by removing the 'hidden' class. */
    show() {
        if (this.root) this.root.classList.remove('hidden');
    }

    /** Hides the window by adding the 'hidden' class. */
    hide() {
        if (this.root) this.root.classList.add('hidden');
    }

    /** Refreshes the window content. Intended to be overridden. */
    refresh() {}

    /**
     * Helper to clear all content from the window.
     */
    clear() {
        if (this.root) this.root.innerHTML = '';
    }

    /**
     * Helper to create and append a DOM element.
     * @param {string} tag - HTML tag (e.g., 'div').
     * @param {string} [className] - CSS classes.
     * @param {HTMLElement} [parent] - Parent to append to (default: this.root).
     * @returns {HTMLElement} The created element.
     */
    createEl(tag, className = '', parent = this.root) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (parent) parent.appendChild(el);
        return el;
    }
}

/**
 * A window that supports selecting items from a list or grid.
 */
export class Window_Selectable extends Window_Base {
    initialize() {
        super.initialize();
        this._index = -1;
        this._items = [];
        this._handlers = {};
    }

    set items(list) {
        this._items = list;
        this.refresh();
    }

    get items() {
        return this._items;
    }

    maxItems() {
        return this._items ? this._items.length : 0;
    }

    /**
     * Selects an item at the specified index.
     * @param {number} index - The index to select.
     */
    select(index) {
        this._index = index;
        this.refresh(); // Or just update classes to be more efficient
    }

    /**
     * Deselects the current item.
     */
    deselect() {
        this._index = -1;
        this.refresh();
    }

    /**
     * Refreshes the entire list.
     * Default implementation clears root and calls drawItem for each item.
     */
    refresh() {
        this.clear();
        const max = this.maxItems();
        for (let i = 0; i < max; i++) {
            this.drawItem(i);
        }
    }

    /**
     * Draws a single item. Must be overridden by subclasses.
     * @param {number} index - The index of the item.
     */
    drawItem(index) {
        // Abstract
    }

    /**
     * Adds an event handler to the window.
     * @param {string} handler - The event name (e.g., 'click').
     * @param {Function} callback - The callback function.
     */
    addHandler(handler, callback) {
        this._handlers[handler] = callback;
    }

    /**
     * Helper to call a handler.
     * @param {string} handler - The event name.
     * @param {any} args - Arguments to pass.
     */
    callHandler(handler, ...args) {
        if (this._handlers[handler]) {
            this._handlers[handler](...args);
        }
    }
}
