# Refactor Phase 1: Structural Cleanup

**Goal:** Eliminate the "God Object" anti-pattern in `src/game/systems.js` and unify the Event handling architecture.
**Complexity:** Medium
**Risk:** Medium (Changes core wiring)

## 1. Overview
The current `systems.js` file is a confused mix of system exports (Explore, Battle3D) and legacy logic containers (`Events`, `Triggers`). This causes circular dependencies and splits UI logic between clean Windows and dirty DOM manipulation. This phase extracts the legacy logic into proper classes and standardizes the Event system.

## 2. Execution Steps

### Step 1: Migrate UI Logic to Window Classes
The `Window_Shop` and `Window_Recruit` classes already exist but are not fully utilized by the legacy `Systems.Events` calls.

1.  **Modify `Window_Shop` (`src/game/window/shop.js`):**
    *   Ensure it can handle "Buy" logic autonomously (it seems to do this already).
    *   Ensure it emits a signal or callback when closed, or returns a Promise (already implemented).
2.  **Modify `Window_Recruit` (`src/game/window/recruit.js`):**
    *   Ensure robust error handling if data is missing.
3.  **Delete Legacy UI Code:**
    *   Remove `Systems.Events.showShop` and `Systems.Events.showRecruit` from `src/game/systems.js`.
    *   Remove the generic `Systems.Events.show` modal logic if it's no longer used, or move it to a `Window_Message` class.

### Step 2: Unify Event Handling
Currently, `Game_Interpreter` calls `Systems.Events.shop()`, which wraps `Window_Shop`. We will cut out the middleman.

1.  **Refactor `EventSystem.js` (`src/game/systems/EventSystem.js`):**
    *   Import `Window_Shop` and `Window_Recruit` (via `Game.Windows` global to avoid circular deps).
    *   Move the `generateShopStock` and `generateRecruitOffers` logic from `Systems.Events` (in `systems.js`) to `EventSystem` class methods.
2.  **Update `Game_Interpreter.js`:**
    *   Update `command_SHOP`: Call `window.Game.Windows.Shop.show(stock)` directly.
    *   Update `command_RECRUIT`: Call `window.Game.Windows.Recruit.show(offers)` directly.
    *   Use `EventSystem` methods to generate data if missing.

### Step 3: Extract Triggers
`Systems.Triggers` is a global event bus used for "Passive Traits" (e.g., heal on turn start).

1.  **Create `BattleObserver` Class (`src/game/systems/BattleObserver.js`):**
    *   Move the `fire(eventName, ...args)` logic here.
    *   This class will iterate over `BattleManager.allies` and `$gameTroop.members()` to call `triggerTraits`.
2.  **Update `Game_Battler.js`:**
    *   Ensure `triggerTraits` is robust.
3.  **Update `systems.js`:**
    *   Replace `Triggers` object with an instance of `BattleObserver`.

### Step 4: Dismantle `systems.js`
1.  **Refactor `src/game/systems.js`:**
    *   Remove the `Systems` object literal.
    *   Change the file to strictly export instances:
        ```javascript
        export const Explore = new ExploreSystem();
        export const Battle3D = new BattleRenderSystem();
        export const Events = new EventSystem();
        export const Observer = new BattleObserver(); // or similar
        export const Effekseer = EffekseerSystem;
        ```
2.  **Update `src/game/main.js`:**
    *   Update imports to `import * as Systems from './systems.js'`.
    *   Ensure `Game.Systems` is populated correctly from this namespace object.

## 3. Verification
*   **Shop Test:** Trigger a shop event via console or map interaction. Verify the UI opens, items can be bought, and the window closes.
*   **Battle Test:** Trigger a battle. Verify that passive traits (if any exist) still fire.
*   **Map Test:** Ensure `ExploreSystem` still functions (fog, movement).

## 4. Definition of Done
*   `src/game/systems.js` contains NO logic, only exports.
*   `Systems.Events` (legacy object) no longer exists.
*   `Game_Interpreter` interacts directly with `Game.Windows`.
