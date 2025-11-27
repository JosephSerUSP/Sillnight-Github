export class Game_Battle {
    constructor() {
        this.clear();
    }

    clear() {
        this.allies = [];
        this.enemies = [];
        this.queue = [];
        this.turnIndex = 0;
        this.roundCount = 0;
        this.playerTurnRequested = false;
        this.phase = null;
        this.isEnding = false;
    }

    setup(allies, enemies) {
        this.allies = allies;
        this.enemies = enemies;
        this.allies.forEach((ally, i) => ally.slotIndex = i);
        this.enemies.forEach((enemy, i) => enemy.slotIndex = i);
        this.queue = [];
        this.turnIndex = 0;
        this.roundCount = 0;
        this.playerTurnRequested = false;
        this.phase = 'INIT';
        this.isEnding = false;
    }

    end() {
        this.clear();
    }
}
