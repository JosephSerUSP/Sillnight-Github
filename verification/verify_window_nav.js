
import { Window_Selectable, Window_Base } from '../src/game/windows.js';

// Mock DOM
const mockElement = {
    style: {},
    classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
    },
    appendChild: () => {},
    innerHTML: '',
    addEventListener: () => {},
    innerText: ''
};
global.document = {
    getElementById: () => mockElement,
    createElement: () => ({ ...mockElement, style: {} }),
    body: { appendChild: () => {} }
};
global.window = { Game: { SceneManager: { registerWindow: () => {}, unregisterWindow: () => {} } } };
global.HTMLElement = class {};

// Test Class
class TestWindow extends Window_Selectable {
    constructor() {
        super('test');
        this.helpText = '';
    }
    maxItems() { return 10; }
    maxCols() { return 2; }
    item() { return { name: 'Item ' + this._index, description: 'Desc ' + this._index }; }

    setHelpText(text) {
        this.helpText = text;
    }
}

async function run() {
    console.log("Starting Window Navigation Verification...");

    const win = new TestWindow();

    // Initial state
    if (win._index !== -1) throw new Error("Initial index should be -1");

    // Test Select
    win.select(0);
    if (win._index !== 0) throw new Error("Select(0) failed");
    if (win.helpText !== 'Desc 0') throw new Error(`Help update failed on select(0). Got: ${win.helpText}`);

    // Test Cursor Right (0 -> 1)
    win.handleInput({ key: 'ArrowRight' });
    if (win._index !== 1) throw new Error(`CursorRight failed. Expected 1, got ${win._index}`);
    if (win.helpText !== 'Desc 1') throw new Error(`Help update failed on cursorRight. Got: ${win.helpText}`);

    console.log("Verification Passed!");
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
