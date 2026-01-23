/**
 * Base class for all layout managers.
 * Handles the container element and child components.
 */
export class LayoutManager {
    /**
     * @param {HTMLElement} container - The container element to manage.
     */
    constructor(container) {
        this.container = container;
        this.components = [];
        this.initialize();
    }

    initialize() {
        // Base initialization
    }

    /**
     * Adds a component to the layout.
     * @param {Component|HTMLElement} component - The component to add.
     * @param {Object} [options] - Layout-specific options (e.g., x, y, flexGrow).
     */
    add(component, options = {}) {
        let el = component;
        if (component.element) {
            el = component.element;
            this.components.push(component);
        }

        this.applyStyle(el, options);
        this.container.appendChild(el);
    }

    /**
     * Applies layout-specific styles to an element.
     * Must be overridden by subclasses.
     * @param {HTMLElement} element
     * @param {Object} options
     */
    applyStyle(element, options) {
        // Abstract
    }

    /**
     * Adds a raw HTMLElement to the layout (alias for add with element).
     * @param {HTMLElement} element
     * @param {Object} [options]
     */
    addRaw(element, options = {}) {
        this.add(element, options);
    }

    /**
     * Clears all components from the layout.
     */
    clear() {
        this.container.innerHTML = '';
        this.components = [];
    }
}
