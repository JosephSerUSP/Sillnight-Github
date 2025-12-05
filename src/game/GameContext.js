/**
 * Holds global game context and dependencies.
 * Used for dependency injection.
 */
export class GameContext {
    constructor() {
        /** @type {Object} */
        this.party = null;
        /** @type {Object} */
        this.map = null;
        /** @type {Object} */
        this.troop = null;
    }
}
