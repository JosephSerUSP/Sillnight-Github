# Architectural Analysis: Stillnight Engine

## 1. Deep Architectural Analysis

The **Stillnight Engine** is currently in a transitional state, moving from a rapid prototype (vertical slice) to a structured, object-oriented game engine. The original architecture relied heavily on global state (`GameState`), monolithic systems (`Systems` in `systems.js`), and direct DOM manipulation. The target architecture, outlined in the `design.md`, aims for a Separation of Concerns model similar to RPG Maker, utilizing Managers, Scenes, Windows, and Game Objects.

### Current State vs. Target State

| Component | Current Implementation | Target Implementation | Gap |
| :--- | :--- | :--- | :--- |
| **Data Model** | Hybrid. `Game_Actor` and `Game_Enemy` exist but `BattleManager` still frequently treats them as raw objects, using `typeof` checks to maintain backward compatibility. `Game_Map` exists but is shadowed by `Systems.Map`. | Pure Object Model. All entities should be instances of `Game_Battler`, `Game_Map`, etc. | **High.** `BattleManager` and `Systems` duplicate logic found in classes (e.g., `getMaxHp` vs `paramBase`). |
| **Logic Layer** | `Systems.js` is a "God Object" containing logic for Battle, Map, Events, and Rendering. `BattleManager` handles flow but delegates calculation to `Systems.Battle`. | Managers (`BattleManager`, `MapManager`) handle logic. `Systems` should only contain low-level I/O (like `Battle3D` renderer). | **Critical.** `Systems.Battle` contains hardcoded damage formulas and element logic that belongs in `Game_Action` or `Game_Battler`. |
| **View Layer** | `Systems.Explore` and `Systems.Battle3D` handle rendering but are mixed with game logic (e.g., `checkTile` triggering events). UI is split between `Window` classes and raw DOM manipulation in `Systems.Events`. | `Spriteset` classes for 3D/2D rendering. `Window` classes for all UI. | **Medium.** `Battle3D` is mostly isolated but `Events` needs to use the Window system. |
| **State Management** | `GameState` acts as a proxy to `window.$gameParty`, etc. However, `BattleManager` maintains a local `GameState.battle` copy, leading to potential desyncs. | Global instances (`$gameParty`, `$gamePlayer`) accessed directly. No proxy objects. | **High.** The `GameState` proxy is a temporary crutch that confuses the ownership of data. |

## 2. Critique

### 2.1 "Frankenstein" Code
The most significant issue is the coexistence of two disparate architectures.
-   **Method Duplication:** `Game_Actor` implements `paramBase` (correct), but `Systems.Battle.getMaxHp` implements a parallel calculation for the same stat, checking `typeof unit.mhp === 'function'` to bridge the gap. This violates DRY (Don't Repeat Yourself) and makes balancing nightmare.
-   **Type Uncertainty:** Functions constantly check if an object is a class instance or a raw data object. This defensive coding adds noise and hides bugs where data might not be initialized correctly.

### 2.2 The "God Object": `Systems.js`
`src/game/systems.js` is over 600 lines and handles:
-   **Particle Effects:** `Effekseer` wrapper.
-   **Game Logic:** `Map.resolveTile` handles gold logic, event triggering, and floor progression.
-   **Rendering:** `Explore` and `Battle3D` manage Three.js scenes.
-   **UI:** `Events` creates HTML elements from strings.
-   **Battle Math:** `Battle` contains the damage formula `eval()`.

This coupling means changing the rendering engine could break game logic, and adding a new event type requires modifying the core system file.

### 2.3 Spaghetti Logic
-   **`BattleManager.processNextTurn`:** The callback `applyResults` contains a giant `switch` statement handling `hp_damage`, `revive`, `add_status`, etc. This logic belongs in `Game_Action` or `Game_Battler`.
-   **`Systems.Triggers`:** Trait handling uses a massive `switch` on event names (`onBattleEnd`, `onTurnStart`). This prevents easy addition of new traits without modifying the core engine. Traits should probably be objects with their own hook methods or handled via a robust Observer pattern.

### 2.4 Scalability Concerns
-   **Hardcoded Formulas:** Damage and stat calculations are hardcoded in `Systems.Battle`. Adding a new stat (e.g., "Dexterity") would require editing `Systems.Battle`, `Game_Actor`, `Game_Enemy`, and `Game_BattlerBase`.
-   **Event System:** Events are hardcoded methods in `Systems.Events` (`shop`, `recruit`). A data-driven event system (interpreting JSON instructions) is needed to allow non-coders to create content.

## 3. Strategic Plan

To stabilize the architecture and prepare for expansion, we must complete the refactor.

### Phase 1: Consolidate the Data Model (Immediate Priority)
**Goal:** Remove the "hybrid" state. All battle participants must be `Game_Actor` or `Game_Enemy` instances.
1.  **Refactor `Game_Enemy`:** Ensure it fully supports all properties used by `BattleManager` (stats, traits).
2.  **Purge `Systems.Battle`:** Move `getMaxHp`, `elementRate`, and `getUnitWithStats` logic into `Game_Battler`.
3.  **Update `BattleManager`:** Remove `typeof` checks. Assume all units are `Game_Battler` instances.

### Phase 2: Decouple Logic from Systems
**Goal:** Break `Systems.js` into focused modules.
1.  **Extract `Game_Action`:** Create a class to handle action execution, damage calculation (`eval`), and effect application. Move logic from `BattleManager.processNextTurn` and `Systems.Battle` here.
2.  **Create `Game_Map` (Logic):** Move `generateFloor`, `resolveTile`, and tile lookup logic from `Systems.Map` to the `Game_Map` class.
3.  **Create `Spriteset_Map` & `Spriteset_Battle`:** Rename/refactor `Systems.Explore` and `Systems.Battle3D` to purely handle visual synchronization, observing `Game_Map` and `BattleManager` respectively.

### Phase 3: Unify UI
**Goal:** Remove raw DOM manipulation.
1.  **Refactor Events:** Convert `Systems.Events` to use `Window` classes (e.g., `Window_Shop`, `Window_Message`) instead of `document.createElement`.
2.  **Standardize Input:** Ensure all UI interactions go through `InputManager` or strictly defined event handlers.

### Phase 4: Clean Up Global State
1.  **Remove `GameState` Proxy:** Refactor all code to access `window.$gameParty`, `window.$gameMap` directly (or via getters in a generic `Game` object).
2.  **Centralize Config:** Move magic numbers (crit multiplier, gold rates) to `Data.config`.

## 4. Execution Roadmap (Next Steps)

1.  **Refactor `Game_Battler` to absorb `Systems.Battle` logic.** (High Value, Low Risk)
    *   Implement `mhp`, `atk`, `def` getters that calculate traits internally.
    *   Move damage calculation to a new `Game_Action` class.
2.  **Refactor `BattleManager` to use `Game_Action`.**
    *   Simplify the turn processing loop.
3.  **Split `Systems.js`.**
    *   Move `Explore` to `src/game/sprites/Spriteset_Map.js`.
    *   Move `Battle3D` to `src/game/sprites/Spriteset_Battle.js`.
