# Refactor Phase 1: Structural Cleanup

**Status: COMPLETED**

**Goal:** Eliminate the "God Object" anti-pattern in `src/game/systems.js` and unify the Event handling architecture.
**Complexity:** Medium
**Risk:** Medium (Changes core wiring)

## 1. Overview
The current `systems.js` file is a confused mix of system exports (Explore, Battle3D) and legacy logic containers (`Events`, `Triggers`). This causes circular dependencies and splits UI logic between clean Windows and dirty DOM manipulation. This phase extracts the legacy logic into proper classes and standardizes the Event system.

## 2. Execution Steps

### Step 1: Migrate UI Logic to Window Classes
The `Window_Shop` and `Window_Recruit` classes already exist but are not fully utilized by the legacy `Systems.Events` calls.

1.  **Modify `Window_Shop` (`src/game/window/shop.js`):**
    *   [x] Ensure it can handle "Buy" logic autonomously.
    *   [x] Ensure it emits a signal or callback when closed, or returns a Promise.
2.  **Modify `Window_Recruit` (`src/game/window/recruit.js`):**
    *   [x] Ensure robust error handling if data is missing.
3.  **Delete Legacy UI Code:**
    *   [x] Remove `Systems.Events.showShop` and `Systems.Events.showRecruit` from `src/game/systems.js`.
    *   [x] Remove the generic `Systems.Events.show` modal logic.

### Step 2: Unify Event Handling
Currently, `Game_Interpreter` calls `Systems.Events.shop()`, which wraps `Window_Shop`. We will cut out the middleman.

1.  **Refactor `EventSystem.js` (`src/game/systems/EventSystem.js`):**
    *   [x] Import `Window_Shop` and `Window_Recruit` (via `Game.Windows` global).
    *   [x] Move the `generateShopStock` and `generateRecruitOffers` logic from `Systems.Events` to `EventSystem`.
2.  **Update `Game_Interpreter.js`:**
    *   [x] Update `command_SHOP`: Call `window.Game.Windows.Shop.show(stock)` directly.
    *   [x] Update `command_RECRUIT`: Call `window.Game.Windows.Recruit.show(offers)` directly.
    *   [x] Use `EventSystem` methods to generate data if missing.

### Step 3: Extract Triggers
`Systems.Triggers` is a global event bus used for "Passive Traits" (e.g., heal on turn start).

1.  **Create `BattleObserver` Class (`src/game/systems/BattleObserver.js`):**
    *   [x] Move the `fire(eventName, ...args)` logic here.
2.  **Update `Game_Battler.js`:**
    *   [x] Ensure `triggerTraits` is robust.
3.  **Update `systems.js`:**
    *   [x] Replace `Triggers` object with an instance of `BattleObserver`.

### Step 4: Dismantle `systems.js`
1.  **Refactor `src/game/systems.js`:**
    *   [x] Remove the `Systems` object literal.
    *   [x] Change the file to strictly export instances.
2.  **Update `src/game/main.js`:**
    *   [x] Update imports to `import * as Systems from './systems.js'`.
    *   [x] Ensure `Game.Systems` is populated correctly.

## 3. Verification
*   [x] **Shop Test:** Shop UI opens, items can be bought, window closes.
*   [x] **Battle Test:** Passive traits fire correctly.
*   [x] **Map Test:** `ExploreSystem` functions correctly.

## 4. Definition of Done
*   [x] `src/game/systems.js` contains NO logic, only exports.
*   [x] `Systems.Events` (legacy object) no longer exists.
*   [x] `Game_Interpreter` interacts directly with `Game.Windows`.
