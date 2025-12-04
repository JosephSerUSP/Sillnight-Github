# Refactor Phase 2: Decoupling & Configuration

**Goal:** Decouple systems from hardcoded constants (resolutions, magic numbers) and hardcoded input keys.
**Complexity:** Low
**Risk:** Low

## 1. Overview
The engine currently relies on magic numbers (e.g., `960`, `540`, `480`, `270`) scattered across multiple files. Input handling is also hardcoded to specific keys within Scene classes, making remapping impossible. This phase introduces central configuration and input abstraction.

## 2. Execution Steps

### Step 1: Centralize Configuration
1.  **Create `src/game/Config.js`:**
    *   Define constants:
        ```javascript
        export const Config = {
            Resolution: {
                LogicWidth: 960,
                LogicHeight: 540,
                RenderWidth: 480,
                RenderHeight: 270
            },
            Debug: {
                ShowHitboxes: false,
                GodMode: false
            },
            Battle: {
                TurnDelay: 400
            }
        };
        ```
2.  **Refactor `src/game/main.js`:**
    *   Import `Config`.
    *   Replace hardcoded resize logic with `Config.Resolution` values.
3.  **Refactor `BattleRenderSystem.js` & `ExploreSystem.js`:**
    *   Replace `480` / `270` with `Config.Resolution.RenderWidth` / `Height`.
    *   Replace `960` / `540` (in `toScreen`) with `Config.Resolution.LogicWidth` / `Height`.

### Step 2: Abstract Input Handling
1.  **Enhance `InputManager` (`src/game/managers.js`):**
    *   Add an internal state map: `this._currentState = { up: false, ok: false, ... }`.
    *   Add a key map:
        ```javascript
        this.keyMap = {
            'ArrowUp': 'up',
            'w': 'up',
            'ArrowDown': 'down',
            's': 'down',
            'Enter': 'ok',
            'Space': 'ok',
            'Escape': 'cancel'
        };
        ```
    *   Add `isPressed(action)` and `isTriggered(action)` methods.
    *   Update event listeners to update `_currentState` based on `keyMap`.
2.  **Refactor `Scene_Explore` (`src/game/scenes.js`):**
    *   Replace `e.key === 'ArrowUp'` with `Input.isPressed('up')`.
    *   Move input polling to the `update()` loop if necessary (for smooth movement), or keep in `handleInput` but use abstract actions.
3.  **Refactor `Scene_Battle` (`src/game/scenes.js`):**
    *   Replace `e.code === 'Space'` with `Input.isTriggered('ok')`.

## 3. Verification
*   **Resize Test:** Change `Config.Resolution` values, reload, and verify the game container and canvas scale correctly.
*   **Input Test:** Verify that both 'ArrowUp' and 'W' move the player. Verify 'Space' and 'Enter' both confirm actions.

## 4. Definition of Done
*   No magic resolution numbers exist in `src/game/`.
*   Scene classes reference abstract actions (`up`, `ok`), not raw keys.
