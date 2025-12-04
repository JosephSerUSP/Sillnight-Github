# Stillnight Architecture Analysis & Audit

## Executive Summary
This document provides a deep architectural analysis of the *Stillnight* codebase. The project currently operates on a hybrid architecture that borrows heavily from RPG Maker (Service Locator pattern, Global State) while attempting to modernize with Component-based UI and 3D rendering.

While the "Model" layer (`Game_Battler`, `Game_Action`) is relatively sound and object-oriented, the "Controller" and "View" layers suffer from significant tight coupling and reliance on global mutable state. This structure facilitates rapid prototyping but will severely hinder scalability, testing, and maintainability as the project grows.

## 1. Critical Structural Flaws
*Issues that threaten the stability, testability, or fundamental logic of the application.*

### 1.1 Global Mutable State (The "God Object")
The entire application state hangs off `window.Game`, `window.$gameParty`, and `window.$gameMap`.
- **Evidence:** `main.js` exposes `window.Game`. `DataManager.js` assigns `window.$gameParty`. `BattleManager.js` accesses `window.$gameParty` directly.
- **Consequence:**
    - **Untestable Code:** You cannot unit test `BattleManager` without mocking the entire `window` object and its dependencies.
    - **Race Conditions:** Any system can mutate `window.$gameParty` at any time, leading to unpredictable bugs.
    - **Save/Load Complexity:** Serialization requires scraping globals rather than calling `serialize()` on a root state object.

### 1.2 Logic/View Coupling in Managers
`BattleManager` (Logic) directly controls `Systems.Battle3D` (Rendering) and `Windows` (UI).
- **Evidence:** `BattleManager.js`:
  ```javascript
  Systems.Battle3D.playAnim(target.uid, ...);
  window.Game.Windows.BattleLog.showBanner(...);
  ```
- **Consequence:** The game logic cannot run without the renderer. This makes "headless" server-side logic (for multiplayer or validation) impossible and ties the gameplay strictly to the current implementation of Three.js.
- **Principle Violation:** Separation of Concerns (SoC). The Logic should emit events (e.g., `ACTION_PERFORMED`), and the View should listen and render.

### 1.3 Time-Based Race Conditions
The game loop relies on `setTimeout` for flow control instead of frame-based or state-based timing.
- **Evidence:** `BattleManager.js`:
  ```javascript
  setTimeout(() => this.nextRound(), 1000);
  ```
- **Consequence:** If the browser lags or the tab is backgrounded, `setTimeout` execution may desync from the `requestAnimationFrame` render loop (`Battle3D.animate`), leading to visual glitches or logic running before animations finish.

## 2. Major Architectural Flaws
*Issues that impede development velocity and code quality.*

### 2.1 Inconsistent UI "Hybrid" Architecture
The UI system claims to be compositional but relies on fragile DOM assumptions.
- **Evidence:** `Window_Base` in `windows.js` attempts to find an element by ID, and if it fails, it creates a disconnected `div` and logs a warning. However, `main.js` assumes these windows are created successfully.
- **Consequence:** Adding a new window requires modifying HTML, `main.js`, and the Window class. The "Hybrid" approach creates two sources of truth: the DOM structure and the JS class structure.

### 2.2 Magic Strings and Numbers
The codebase relies heavily on hardcoded string identifiers and integer codes.
- **Evidence:**
    - `Game_Map.js`: Tile IDs `0, 1, 3` are hardcoded.
    - `ExploreSystem.js`: Events are accessed via `${x},${y}` string keys.
    - `BattleManager.js`: References to `guarding` state are string-based, falling back to legacy `.status` arrays if `removeState` is missing.

### 2.3 "Manager" Class Ambiguity
The `Manager` classes are static singletons (mostly), but `SceneManager` is instantiated in `main.js`.
- **Evidence:** `BattleManager` is an object literal export. `SceneManager` is a class instantiated as `new SceneManager()`.
- **Consequence:** Inconsistent instantiation patterns make it unclear which systems hold state and which are pure utility.

## 3. Points of Concern & Minor Flaws

### 3.1 Error Handling
Errors are often swallowed or logged to console without recovery mechanisms.
- **Example:** `Game_Action.evalDamageFormula` catches eval errors and returns 0, masking potential data bugs.

### 3.2 View-Dependent Logic in ExploreSystem
`ExploreSystem` mixes logic (movement validation) with rendering (lerping).
- **Evidence:** `ExploreSystem.move()` updates `$gameMap` (Logic) and `playerMesh` (View) simultaneously.
- **Recommendation:** Movement logic should reside solely in `Game_Map` or a `MovementSystem`, which updates coordinates. `ExploreSystem` should purely verify "Player X != Mesh X" and interpolate to match.

### 3.3 Heavy use of `eval()`
`Game_Action` uses `eval()` for damage formulas. While standard in RPG Maker, it presents a security risk if modding is ever supported and makes debugging formulas difficult.

## 4. Recommendations

1.  **Event Bus Pattern:** Decouple `BattleManager` from `Battle3D`.
    *   *Current:* `BattleManager` calls `Battle3D.showDamage()`.
    *   *Proposed:* `BattleManager` emits `BattleEvent.DAMAGE`, `Battle3D` listens and renders.
2.  **Dependency Injection:** Remove global `window.Game` access. Pass `party` and `map` instances into the Managers/Systems that need them.
3.  **State Machine for Battle:** Replace `setTimeout` with a proper State Machine (`BattleState.WAITING_ANIMATION`) updated by the game loop.
4.  **Standardize Constants:** Move tile IDs and Event Triggers to a shared `Constants.js` file.
