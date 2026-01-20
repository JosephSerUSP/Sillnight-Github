/**
 * Mixin to add EventEmitter capabilities to any class.
 * @param {Class} Base - The class to extend.
 * @returns {Class} The extended class.
 */
export const EventEmitterMixin = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this._listeners = new Map();
    }

    /**
     * Subscribe to an event.
     * @param {string} event - The event name.
     * @param {Function} callback - The function to call when the event is emitted.
     * @returns {Function} A function to unsubscribe.
     */
    on(event, callback) {
        if (!this._listeners) this._listeners = new Map();
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - The event name.
     * @param {Function} callback - The callback to remove.
     */
    off(event, callback) {
        if (!this._listeners) return;
        if (this._listeners.has(event)) {
            this._listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event.
     * @param {string} event - The event name.
     * @param {*} [payload] - Data to pass to listeners.
     */
    emit(event, payload) {
        if (!this._listeners) return;
        if (this._listeners.has(event)) {
            this._listeners.get(event).forEach(cb => {
                try {
                    cb(payload);
                } catch (e) {
                    console.error(`Error in EventEmitter listener for "${event}":`, e);
                }
            });
        }
    }
};
