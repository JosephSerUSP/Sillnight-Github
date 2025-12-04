# Architectural Analysis & Health Report

**Date:** 2024-05-22
**Scope:** Core Game Engine (`src/game/`)
**Status:** Transitional (Late Stage Refactor)

## 1. Executive Summary

The "Stillnight" engine has successfully migrated from a prototype architecture to a structured, Object-Oriented design similar to RPG Maker MZ. The core "Model" layer (`Game_Actor`, `Game_Map`, `Game_Action`) is robust and well-encapsulated. The "View" layer has transitioned to a flexible Window-based component system.

However, a **structural bottleneck** remains in the "System" layer. The file `src/game/systems.js` acts as a legacy "God Object," containing disjointed sub-systems (`Battle3D`, `Events`, `Triggers`) that have not yet been migrated to the new class-based standard. This creates inconsistency: while the Map system uses a clean `ExploreSystem` class, the Battle renderer and Event logic remain as static object literals with high coupling.

## 2. Structural Analysis

### 2.1 The "God Object" Problem (`systems.js`)
*   **Severity:** **Major**
*   **Location:** `src/game/systems.js`
*   **Issue:** This file exports a single `Systems` object that contains `Explore` (a class instance), `Battle3D` (a raw object), `Events` (a raw object), and `Triggers` (a raw object).
*   **Impact:**
    *   **Inconsistency:** New code uses `new System()`, old code uses `Systems.Module.method()`.
    *   **Testability:** Static singletons in `systems.js` are hard to mock or reset between tests.
    *   **Maintenance:** The file mixes rendering logic (`Battle3D`), game mechanics (`Triggers`), and UI logic (`Events`) in one place.

### 2.2 UI Architecture Fragmentation
*   **Severity:** **Major**
*   **Location:** `src/game/systems.js` (Events) vs `src/game/window/`
*   **Issue:** The project features a robust Window system (`Window_Base`, `Window_Party`) for standard UI. However, `Systems.Events` (Shop, Recruit) creates DOM elements manually (e.g., `document.createElement('div')`) and appends them directly.
*   **Impact:**
    *   **Visual Inconsistency:** Hardcoded styles in `Systems.Events` may drift from the global UI theme managed by `Window_Base`.
    *   **Code Duplication:** Button handling, layout, and scaling logic are duplicated outside the standard Window components.

### 2.3 Battle Logic Dispersion
*   **Severity:** **Major**
*   **Location:** `src/game/systems.js` (`Triggers`) vs `src/game/classes/Game_Battler.js`
*   **Issue:** Battle mechanics are split. Core stats and state are in `Game_Battler`. Action execution is in `Game_Action`. However, reactive logic (e.g., "Cast spell on death", "Heal on turn start") resides in `Systems.Triggers`.
*   **Impact:** Logic is fragmented. To understand how a unit behaves, one must check the Actor class, the Action class, *and* the global Triggers system. This violates the principle of Encapsulation.

### 2.4 Render Pipeline Consistency
*   **Severity:** **Moderate**
*   **Location:** `src/game/systems/ExploreSystem.js` vs `src/game/systems.js` (`Battle3D`)
*   **Issue:** `ExploreSystem` correctly uses the new `RenderManager`. `Battle3D` is still an object literal that manages its own scene graph in a less structured way.
*   **Impact:** Future improvements to the rendering pipeline (e.g., post-processing, resolution scaling) must be applied in two different places using different architectural patterns.

## 3. Detailed Component Analysis

### 3.1 Data Model (Green)
The `src/game/classes/` directory is the healthiest part of the codebase.
*   **`Game_Actor` / `Game_Battler`:** Correctly implements the Trait pattern for flexible stat calculation.
*   **`Game_Action`:** Encapsulates the complex damage formula and targeting logic, removing it from the UI or Manager layers.
*   **`Game_Map`:** separating data (`Game_Map`) from view (`ExploreSystem`) is a strong architectural choice.

### 3.2 The Event System (Yellow)
There is confusion between `src/game/systems/EventSystem.js` (a wrapper for `Game_Interpreter`) and `Systems.Events` (a collection of hardcoded interaction functions).
*   **Flaw:** The game logic relies on `Systems.Events.shop()` which is hardcoded, rather than using the `Game_Interpreter` to script these interactions. This limits the ability for designers to create custom events without writing code.

### 3.3 The Window System (Green/Yellow)
The `src/game/window/` architecture is excellent. It uses composition and inheritance effectively.
*   **Flaw:** It is under-utilized. High-impact UI like the Shop and Recruit screens are bypassing this system entirely.

## 4. Code Hygiene & Principles

*   **Single Responsibility Principle (SRP):**
    *   *Violation:* `Systems.Events` handles Data Generation (Loot tables), Logic (Deducting Gold), and View (DOM creation).
    *   *Adherence:* `Game_Action` handles *only* the mechanics of an action, leaving the visual representation to `BattleLog` or `Battle3D`.
*   **Open/Closed Principle:**
    *   *Violation:* Adding a new "Trigger" type requires modifying the switch statement in `Systems.Triggers`.
    *   *Adherence:* Adding a new Item type works automatically via the data-driven `Game_Action` system.
*   **Dependency Injection:**
    *   Most systems still rely on global access (`window.$gameParty`), which is typical for this genre (RPG Maker style) but makes unit testing isolated components difficult.

## 5. Recommendations for Refactoring

While not a direct plan, the following architectural corrections are necessary to stabilize the engine:

1.  **Eliminate `src/game/systems.js`:**
    *   Migrate `Battle3D` object -> `BattleRenderSystem` class (similar to `ExploreSystem`).
    *   Migrate `Systems.Events` UI logic -> `Window_Shop`, `Window_Recruit` classes.
    *   Migrate `Systems.Triggers` logic -> Methods on `Game_Battler` or a `BattleObserver` class.

2.  **Unify Event Handling:**
    *   Deprecate hardcoded methods in `Systems.Events`.
    *   Route all interactions through `EventSystem` / `Game_Interpreter` using standardized commands (e.g., `OPEN_SHOP`, `OPEN_RECRUIT`).

3.  **Standardize Rendering:**
    *   Ensure `BattleRenderSystem` inherits or shares a base `RenderSystem` class with `ExploreSystem` to standardize camera handling, resizing, and `RenderManager` usage.
