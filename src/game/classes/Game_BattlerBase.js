/**
 * @class Game_BattlerBase
 * @description The superclass for all battlers, handling core properties.
 */
export class Game_BattlerBase {
  constructor() {
    this.initMembers();
  }

  initMembers() {
    /** @type {number} */
    this._hp = 1;
    /** @type {number} */
    this._mp = 0;
    /** @type {number[]} */
    this._states = [];
    /** @type {number[]} */
    this._buffs = [];
  }
}
