
import { Window_Selectable, Window_Base } from '../src/game/windows.js';
import { Window_Help } from '../src/game/window/help.js';

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
    addEventListener: () => {}
};
global.document = {
    getElementById: () => mockElement,
    createElement: () => ({ ...mockElement, style: {} }),
    body: { appendChild: () => {} }
};
global.window = { Game: { SceneManager: { registerWindow: () => {}, unregisterWindow: () => {} } } };
global.HTMLElement = class {};

// Mock Window_Help
class MockHelp extends Window_Help {
    setItem(item) {
        this.lastItem = item;
    }
}

// Test Class
class TestWindow extends Window_Selectable {
    maxItems() { return 10; }
    maxCols() { return 2; }
    item() { return { name: 'Item ' + this._index }; }
}

async function run() {
    console.log("Starting Window Navigation Verification...");

    const help = new MockHelp();
    const win = new TestWindow();
    win.setHelpWindow(help);

    // Initial state
    if (win._index !== -1) throw new Error("Initial index should be -1");

    // Test Select
    win.select(0);
    if (win._index !== 0) throw new Error("Select(0) failed");
    if (help.lastItem.name !== 'Item 0') throw new Error("Help update failed on select(0)");

    // Test Cursor Right (0 -> 1)
    win.handleInput({ key: 'ArrowRight' });
    if (win._index !== 1) throw new Error(`CursorRight failed. Expected 1, got ${win._index}`);
    if (help.lastItem.name !== 'Item 1') throw new Error("Help update failed on cursorRight");

    // Test Cursor Down (1 -> 3) (MaxCols=2)
    win.handleInput({ key: 'ArrowDown' });
    if (win._index !== 3) throw new Error(`CursorDown failed. Expected 3, got ${win._index}`);

    // Test Cursor Up (3 -> 1)
    win.handleInput({ key: 'ArrowUp' });
    if (win._index !== 1) throw new Error(`CursorUp failed. Expected 1, got ${win._index}`);

    console.log("Verification Passed!");
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
