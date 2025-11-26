// src/game/Game_System.js

export class Game_System {
    constructor() {
        this.ui = { mode: 'EXPLORE', formationMode: false };
        this.battle = null;
        this.run = { floor: 1 };
    }
}
