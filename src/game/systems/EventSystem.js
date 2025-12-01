import { Game_Interpreter } from '../classes/Game_Interpreter.js';

export class EventSystem {
    constructor() {
        this._interpreter = new Game_Interpreter();
    }

    get interpreter() {
        return this._interpreter;
    }

    /**
     * Executes a list of commands.
     * @param {Array<Object>} commands
     * @param {string|number} eventId
     */
    run(commands, eventId) {
        this._interpreter.setup(commands, eventId);
    }
}
