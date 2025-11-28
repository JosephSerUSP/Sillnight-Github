import { Data } from '../../assets/data/data.js';
import { GameState } from '../state.js';
import { Systems } from '../systems.js';
import { Log } from '../log.js';
import { DialogueManager } from './DialogueManager.js';

export class CampaignManager {
    constructor() {
        this.dialogue = new DialogueManager();
    }

    /**
     * Initializes the campaign system.
     */
    init() {
        this.dialogue.init();
        // Hook into map generation to check for scripted events
    }

    /**
     * Checks if there's a scripted event for the current floor or state.
     * @param {string} trigger - 'startFloor', 'endFloor', 'enterZone', etc.
     */
    async checkTrigger(trigger) {
        const floor = GameState.run.floor;
        // Find campaign data for this floor
        const campaign = Data.campaign; // Assuming we add this
        if (!campaign) return;

        const levelData = campaign.levels.find(l => l.floor === floor);

        if (trigger === 'startFloor' && levelData && levelData.introEvent) {
             await this.runEvent(levelData.introEvent);
        } else if (trigger === 'endFloor' && levelData && levelData.outroEvent) {
             await this.runEvent(levelData.outroEvent);
        }
    }

    /**
     * Runs a scripted event by ID.
     * @param {string} eventId
     */
    async runEvent(eventId) {
        const eventDef = Data.campaign.events[eventId];
        if (!eventDef) return;

        Log.add(`System: Executing event ${eventId}`);

        for (const step of eventDef.script) {
            if (step.type === 'dialogue') {
                await this.dialogue.show(step.lines);
            } else if (step.type === 'battle') {
                const enemies = step.enemies || [];
                if (enemies.length > 0) {
                    Log.add('Boss Encounter!');
                    await BattleManager.startFixedEncounter(enemies);
                    // Battle ended. The promise resolves when battle is over (win or lose).
                    // If lost, game over handles it. If won, we continue.
                }
            } else if (step.type === 'give_item') {
                const item = step.itemId;
                GameState.inventory.items[item] = (GameState.inventory.items[item] || 0) + 1;
                Log.loot(`Received ${item}`);
            }
        }
    }
}
