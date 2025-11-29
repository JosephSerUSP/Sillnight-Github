// Window and shell UI layer (similar to rmmz_windows.js).
// All DOM-related code for the persistent PC-98 shell lives here. Add new window
// types by subclassing Window_Base and wiring them into the ShellUI container.

/**
 * Base class for all UI windows.
 * Manages the DOM element, visibility, and basic lifecycle.
 */
export class Window_Base {
    /**
     * @param {HTMLElement} [root] - The root DOM element for the window. If not provided, a div is created.
     */
    constructor(root) {
        this.root = root || document.createElement('div');
        // Define standard UI scaling: reduced font size and tighter line height for better information density.
        this.root.style.fontSize = '14px';
        this.root.style.lineHeight = '1.2';
    }
    /**
     * Opens the window and appends it to a parent element.
     * @param {HTMLElement} [parent] - The parent element. Defaults to document.body.
     */
    open(parent) {
        (parent || document.body).appendChild(this.root);
        this.show();
    }
    /**
     * Removes the window from the DOM.
     */
    close() {
        this.root.remove();
    }
    /** Shows the window by removing the 'hidden' class. */
    show() { this.root.classList.remove('hidden'); }
    /** Hides the window by adding the 'hidden' class. */
    hide() { this.root.classList.add('hidden'); }
    /** Refreshes the window content. Intended to be overridden. */
    refresh() {}
}

/**
 * A window that supports selecting items from a list.
 */
export class Window_Selectable extends Window_Base {
    /**
     * @param {HTMLElement} [root] - The root DOM element.
     */
    constructor(root) {
        super(root);
        /** @type {Array} The list of items. */
        this.items = [];
        /** @type {number} The index of the currently selected item. */
        this.index = -1;
    }

    /**
     * Selects an item at the specified index.
     * @param {number} index - The index to select.
     */
    select(index) {
        this.index = Math.max(0, Math.min(this.items.length - 1, index));
        this.refresh();
    }

    /**
     * Deselects the current item.
     */
    deselect() {
        this.index = -1;
        this.refresh();
    }

    /**
     * Adds an event handler to the window.
     * @param {string} handler - The event name (e.g., 'click').
     * @param {Function} callback - The callback function. Receives the index of the clicked item.
     */
    addHandler(handler, callback) {
        // This is a simple event handler for now, it can be expanded later
        this.root.addEventListener(handler, (e) => {
            // Find the index of the clicked element
            const index = Array.from(this.root.children).indexOf(e.target.closest('.party-slot'));
            if (index !== -1) {
                callback(index);
            }
        });
    }
}
