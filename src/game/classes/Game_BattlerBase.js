/**
 * The base class for all battlers.
 */
export class Game_BattlerBase {
    constructor() {
        this.initMembers();
    }

    initMembers() {
        this._hp = 1;
        this._mp = 0;
        this._states = [];
        this._buffs = [];
    }

    get hp() {
        return this._hp;
    }

    set hp(hp) {
        this._hp = Math.max(0, hp);
    }

    get mp() {
        return this._mp;
    }

    set mp(mp) {
        this._mp = Math.max(0, mp);
    }

    isDead() {
        return this.hp === 0;
    }
}
