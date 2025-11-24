# UI Refactor Plan

This refactor introduces a lightweight window framework similar to RPG Maker and migrates the existing menus onto it.

## Files to add
- `src/ui/base.js` – `WindowBase` and `WindowSelectable` classes that create the window DOM skeleton, manage visibility, and handle selection input.
- `src/ui/windows.js` – Generic concrete windows (HUD, log, party status, inventory, creature status, battle banner, modal shells, etc.).
- `src/ui/scenes.js` – Simple scene orchestrators for explore/battle that show/hide windows appropriately.
- `src/ui/ui-manager.js` – Central manager that wires windows to game state and systems.
- `src/assets/ui.css` – Generic `sn-*` styles for windows, lists, gauges, sprites, and layout primitives.

## Migration targets
- Replace inline Tailwind styling in `index.html` with the new generic `sn-*` classes and let JS compose windows instead of static HTML modals.
- Move the UI logic out of `systems.js` into the new UI manager; keep systems focused on data/state while delegating DOM updates to windows.
- Update `Log` utility to push entries into the new log window renderer instead of directly querying DOM IDs.

## Windows to implement first
- HUD + battle banner (top of screen)
- Party status grid + controls (bottom area)
- Party management, inventory, and creature status modals
- Event modal + generic center modal

Once these are in place, hook the rest of the systems to call the UI manager methods instead of manipulating DOM nodes directly.
