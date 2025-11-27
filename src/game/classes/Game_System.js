/**
 * The class for the system data.
 */
export class Game_System {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        this._ui = {
            mode: 'EXPLORE',
            formationMode: false,
            floor: 1
        };
        this._battle = null;
    }

    get ui() {
        return this._ui;
    }

    get battle() {
        return this._battle;
    }

    set battle(battle) {
        this._battle = battle;
    }
}
