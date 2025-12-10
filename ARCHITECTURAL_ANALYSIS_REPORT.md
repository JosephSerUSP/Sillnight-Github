# Stillnight Engine - Architectural Analysis Report

**Date:** October 26, 2023
**Scope:** Full Codebase Audit
**Author:** Jules (AI Software Engineer)

## 1. Executive Summary

The "Stillnight" engine utilizes a hybrid architecture that blends modern Object-Oriented Programming (OOP) with legacy "Manager/Singleton" patterns typical of RPG Maker engines. The codebase has made significant strides in decoupling data from presentation, evidenced by the clean separation in the `src/game/classes/` layer and the `ExploreSystem`.

However, the architecture suffers from a central structural flaw: the persistence of a legacy "God Object" (`src/game/systems.js`) that creates a confused namespace and prevents full modularity. Additionally, the Event system is currently split between two conflicting implementations, leading to code duplication and UI inconsistency.

While the core game loop and data models are healthy, the Service/System layer requires significant refactoring to ensure long-term maintainability and scalability.

---

## 2. Critical Structural Flaws

### 2.1 The `systems.js` God Object
**Location:** `src/game/systems.js`
**Severity:** **Critical**

The file `src/game/systems.js` acts as a service locator that mixes class instances and raw object literals. This creates an inconsistent API and makes dependency injection impossible.

*   **Inconsistency:**
    *   `Systems.Explore` is an instance of a class (`ExploreSystem`).
    *   `Systems.Battle3D` is an instance of a class (`BattleRenderSystem`).
    *   `Systems.Events` is a raw object literal containing business logic, UI manipulation, and data generation.
    *   `Systems.Triggers` is a raw object literal acting as a global event bus.
*   **Impact:** New features are forced to follow this anti-pattern to fit in. It creates circular dependencies (Systems imports Managers, Managers import Systems) that are only resolved by the leniency of ES modules.

### 2.2 Dual Event Handling Architectures
**Location:** `src/game/systems/EventSystem.js` vs. `src/game/systems.js (Systems.Events)`
**Severity:** **High**

There are two competing ways to handle game events, creating confusion and race conditions.

1.  **The "New" Way:** `EventSystem.js` wraps `Game_Interpreter`, which executes a list of commands (e.g., `SHOP`, `BATTLE`). This is the correct, data-driven approach.
2.  **The "Old" Way:** `Systems.Events` in `systems.js` contains hardcoded functions (`shop()`, `recruit()`) that directly manipulate the DOM and game state.

**Flaw:** The `Game_Interpreter` (New) is currently forced to call the methods in `Systems.Events` (Old) to display UI (e.g., `command_SHOP` calls `Systems.Events.showShop`). This creates a "Glue Code" dependency where the clean interpreter is polluted by the legacy UI handler.

### 2.3 UI Bypass & DOM Coupling
**Location:** `src/game/systems.js (Systems.Events.show)`
**Severity:** **High**

While the project has a robust `Window_Base` system for UI, `Systems.Events` bypasses it to manually create DOM elements using `document.getElementById` and `innerHTML`.

*   **Violation:** This violates the "Single Source of Truth" for UI rendering.
*   **Consequence:** Events displayed via this system do not share the styling, lifecycle, or input handling of the rest of the application (e.g., they might not pause the game loop correctly or handle window resizing).

---

## 3. Major Maintenance Concerns

### 3.1 BattleRenderSystem View Logic Coupling
**Location:** `src/game/systems/BattleRenderSystem.js`
**Severity:** **Medium**

The `BattleRenderSystem` class handles both the low-level Three.js scene management and high-level gameplay logic.

*   **Hardcoded Logic:** The method `toScreen(obj)` hardcodes the logical resolution `960x540`. If the game's resolution changes in `main.js`, this file will break silently.
*   **Gameplay Bleed:** The renderer knows about "Victory" states and specific camera angles for gameplay moments. Ideally, the camera controller should be separate from the renderer.

### 3.2 Unsafe Data Evaluation
**Location:** `src/game/classes/Game_Action.js` -> `evalDamageFormula`
**Severity:** **Medium**

The engine uses `eval()` to calculate damage formulas stored as strings in data files (e.g., `"4 + 2 * a.level"`).
*   **Risk:** While acceptable for a static, offline game, this is a security risk if modding support is ever added, and it is a performance bottleneck compared to compiled functions or a math parser.

### 3.3 Global State Reliance
**Location:** Everywhere (`window.$gameParty`, `window.Game`)
**Severity:** **Medium**

The entire codebase relies on global variables attached to `window`.
*   **Testing:** It is impossible to write isolated unit tests for `Game_Battler` without mocking the entire `window.Game` object.
*   **Race Conditions:** `Game.init` relies on strict ordering. If a System tries to access `$gameParty` before `DataManager.setupNewGame` runs, the game crashes.

---

## 4. Minor Polish & Hygiene

*   **Hardcoded Input:** `Scene_Explore` and `Scene_Battle` handle raw key codes (e.g., `ArrowUp`) directly. There is no central `Input` definition file to allow for remapping keys.
*   **Lazy Element Lookup:** `Window_Base` attempts to find its root element by ID. If the HTML structure in `index.html` changes, the JS code will fail. Windows should generate their own DOM structure entirely.
*   **Magic Numbers:** `src/game/main.js` and `BattleRenderSystem.js` both contain the magic numbers `960`, `540`, `480`, `270`. These should be in a central `Config` object.

---

## 5. Recommendations

### Phase 1: Structural Cleanup (Immediate)
1.  **Dissolve `Systems.Events`:** Move the UI logic (Shop/Recruit modals) into dedicated `Window_Shop` and `Window_Recruit` classes (which seem to partially exist but are underused).
2.  **Standardize `EventSystem`:** Make `EventSystem` the *only* entry point for events. The Interpreter should call `Window_Shop.show()` directly, not `Systems.Events.shop()`.
3.  **Refactor `systems.js`:** Convert the file into a pure export barrel (`export * from ...`) and move `Triggers` logic into `Game_Battler` or a `BattleObserver` class.

### Phase 2: Decoupling (Short Term)
1.  **Centralize Config:** Create a `Config.js` to hold resolution settings (`LogicWidth`, `RenderWidth`) and import them in `main.js` and `BattleRenderSystem`.
2.  **Input Map:** Create an `InputMap` object in `InputManager` to translate keys to actions (e.g., `'ArrowUp': 'up'`), allowing scenes to check `Input.isTriggered('up')`.

### Phase 3: Modernization (Long Term)
1.  **Remove `eval()`:** Replace the damage formula strings with a lightweight parser or pre-compiled lambda functions in the data files.
2.  **Dependency Injection:** Slowly refactor classes to accept dependencies in their constructors rather than reaching out to `window`.
