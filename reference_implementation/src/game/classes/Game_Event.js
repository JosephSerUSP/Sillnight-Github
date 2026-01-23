/**
 * Represents a dynamic event on the map (NPC, Chest, Door, etc.).
 */
export class Game_Event {
    /**
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {Object} [data={}] - Configuration data.
     */
    constructor(x, y, data = {}) {
        /** @type {number} */
        this._x = x;
        /** @type {number} */
        this._y = y;

        /** @type {string} Unique identifier for the event instance. */
        this._id = data.id || crypto.randomUUID();

        /** @type {string} Trigger type: 'ACTION', 'TOUCH', 'AUTO'. */
        this._trigger = data.trigger || 'ACTION';

        /** @type {Object} Conditions required for the event to be active/visible. */
        this._conditions = data.conditions || {};

        /** @type {Array<Object>} List of commands to execute. */
        this._commands = data.commands || [];

        /** @type {Object} Visual representation (sprite/mesh). */
        this._visual = data.visual || (data.graphic ? { graphic: data.graphic } : null);

        /** @type {boolean} Whether the event is currently erased/inactive. */
        this._erased = false;
    }

    get x() { return this._x; }
    get y() { return this._y; }
    get id() { return this._id; }
    get trigger() { return this._trigger; }
    get commands() { return this._commands; }
    get visual() { return this._visual; }
    get isErased() { return this._erased; }

    /**
     * Sets the event position.
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        this._x = x;
        this._y = y;
    }

    /**
     * Erases the event (temporarily, for the duration of the map).
     */
    erase() {
        this._erased = true;
    }
}
