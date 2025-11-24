# UI Refactor Plan

- Introduce a reusable UI framework under `src/game/ui/` with `WindowBase` and `WindowSelectable` mirroring RPG Maker concepts. These manage window DOM structure, lifecycle, and keyboard handling.
- Provide generic CSS under `src/game/ui/styles.css` that defines window chrome (`sn-window`), headers, list styling, gauges, and sprite frames to preserve the existing CRT-inspired theme without menu-specific rules.
- Add window subclasses for the current menus: floor HUD, log, party status grid, party management modal, inventory modal, creature status modal, and event modal. Each window renders its own content via `refresh()` using generic classes.
- Add lightweight scene orchestration (`SceneManager`, `Scene_Explore`, `Scene_Battle`) to open/close relevant windows and mediate UI updates without systems poking DOM IDs.
- Replace ad-hoc UI functions in `systems.js` and `log.js` with calls into the new UI manager, keeping gameplay logic separate from presentation.
- Update `index.html` to rely on the new UI layer and generic classes while retaining the CRT overlay and background effects.
