import { Game_Actor } from './Game_Actor.js';

/**
 * The player-controlled summoner. Fixed to the dedicated party slot
 * and responsible for sustaining allies via an MP gauge.
 */
export class Game_Summoner extends Game_Actor {
    constructor(level = 1) {
        super('summoner', level);
        /** @type {boolean} Flag for summoner-specific behaviors. */
        this.isSummoner = true;
    }
}

