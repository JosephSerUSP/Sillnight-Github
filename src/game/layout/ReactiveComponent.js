import { Component } from './Component.js';

/**
 * A reactive UI component that subscribes to data sources.
 */
export class ReactiveComponent extends Component {
    constructor(tagName = 'div', className = '') {
        super(tagName, className);
        this._unsubscribeList = [];
    }

    /**
     * Subscribes to an event on a data source.
     * @param {Object} source - The data object (must have .on method).
     * @param {string} event - The event name.
     * @param {Function} callback - The callback function.
     */
    subscribe(source, event, callback) {
        if (source && typeof source.on === 'function') {
            const unsubscribe = source.on(event, callback);
            this._unsubscribeList.push(unsubscribe);
        }
    }

    /**
     * Unsubscribes from all data sources.
     * Call this when the component is destroyed or removed.
     */
    destroy() {
        this._unsubscribeList.forEach(unsubscribe => unsubscribe());
        this._unsubscribeList = [];
        if (this.element && this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
    }
}
