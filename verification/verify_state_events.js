import { Game_Variables } from '../src/game/classes/Game_Variables.js';
import { Game_Switches } from '../src/game/classes/Game_Switches.js';
import { Services } from '../src/game/ServiceLocator.js';

async function run() {
    console.log("Starting State Events Verification...");

    const variables = new Game_Variables();
    const switches = new Game_Switches();

    // Clear existing listeners just in case
    Services.events.clear();

    let variableEventReceived = null;
    let switchEventReceived = null;

    Services.events.on('variable:change', (payload) => {
        console.log("Received variable:change", payload);
        variableEventReceived = payload;
    });

    Services.events.on('switch:change', (payload) => {
        console.log("Received switch:change", payload);
        switchEventReceived = payload;
    });

    // Test Variables
    console.log("Setting variable 1 to 100...");
    variables.setValue(1, 100);

    // Test Switches
    console.log("Setting switch 1 to true...");
    switches.setValue(1, true);

    // Give a small tick for events if they are async (EventBus seems synchronous though)
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!variableEventReceived) {
        throw new Error("Failed: variable:change event not received.");
    }
    if (variableEventReceived.id !== 1 || variableEventReceived.value !== 100) {
        throw new Error(`Failed: variable:change payload incorrect. Got ${JSON.stringify(variableEventReceived)}`);
    }

    if (!switchEventReceived) {
        throw new Error("Failed: switch:change event not received.");
    }
    if (switchEventReceived.id !== 1 || switchEventReceived.value !== true) {
        throw new Error(`Failed: switch:change payload incorrect. Got ${JSON.stringify(switchEventReceived)}`);
    }

    console.log("Verification Passed!");
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
