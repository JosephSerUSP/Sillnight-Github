# Refactor plan (RMMZ-inspired)

- `core.js`: shared helpers like asset path resolution and random/utility functions.
- `managers.js`: SceneManager to swap scenes and InputManager to map keyboard input to actions.
- `objects.js`: domain helpers (create units, compute max HP, map roster/party helpers) used by systems and windows.
- `windows.js`: window classes and the persistent ShellUI. Hosts HUD, log, party grid, modals, and reuses existing DOM.
- `scenes.js`: scene controllers (base/explore/battle) that orchestrate Systems and ShellUI without rebuilding DOM each time.
- `systems.js`: retains game logic (map, explore, battle, events, battle3D) but delegates UI calls to ShellUI.
- `main.js`: bootstraps ShellUI, managers, and initial scene startup using the new separation.
