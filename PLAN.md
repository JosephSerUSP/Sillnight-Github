# Refactor plan

- Introduce RMMZ-style modules in `src/game/`: `core.js`, `managers.js`, `objects.js`, `scenes.js`, and `windows.js`.
- Move shared helpers (asset resolution, RNG, event emitter) into `core.js`.
- Centralize game rule helpers (HP growth, roster creation) in `objects.js`.
- Implement UI shell/windows in `windows.js`, replacing the legacy `Systems.UI` DOM logic with reusable window classes and a persistent shell.
- Add scene/input management in `managers.js` and scene controllers in `scenes.js` to coordinate exploration/battle modes.
- Update `systems.js` to depend on the new UI shell and scene manager, and update `main.js` to bootstrap the new architecture.
