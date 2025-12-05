# Architectural Assessment & Radical Rewrite Proposal

## Executive Summary

The current engine architecture relies on a **Hybrid Compositional model** heavily influenced by RPG Maker's inheritance patterns (e.g., `Game_Battler` -> `Game_Actor`) and Singleton Managers. While functional for a prototype, it suffers from **rigid coupling**, **monolithic classes**, and **scalability issues** that hinder the implementation of novel gameplay mechanics.

This document identifies key structural flaws and proposes a **radical, ground-up rewrite** shifting towards a **Component-Based Architecture (CBA)**. This new approach prioritizes flexibility, decoupling, and data-driven design to meet the goal of a "leaner and more effective" engine.

---

## Part 1: Architectural Assessment

### 1. Structural Flaws (Critical)

*   **Inheritance Hell**: The core entity logic is locked in deep inheritance chains (`Game_BattlerBase` -> `Game_Battler` -> `Game_Actor`/`Game_Enemy`). Adding a feature shared by Actors and Enemies requires modifying the base class, risking regressions. Deviating behavior (e.g., an enemy that levels up like an actor) is difficult.
*   **Monolithic Systems**: `ExploreSystem.js` violates the Single Responsibility Principle. It manages:
    *   Three.js scene setup and rendering.
    *   Player movement logic and collision.
    *   Fog of War data simulation and texture generation.
    *   Particle systems.
    *   Event triggering.
    *   *Impact*: Maintenance is difficult; bugs in rendering can break game logic.
*   **Hardcoded Logic (The "Trait" Trap)**: The `Game_Battler.handleTrait` method uses a massive `switch` statement to implement specific game mechanics (`on_death_cast`, `evade_bonus`). This defeats the purpose of a flexible trait system. Implementing a new unique effect requires modifying core engine code rather than just data.
*   **Global Singleton Dependency**: The entire codebase is tightly coupled to the global `window.Game` object. Testing individual components (like `Game_Actor`) in isolation is nearly impossible without mocking the entire global state.

### 2. Integration Flaws (Major)

*   **UI/Logic Coupling**: Game systems directly manipulate UI components (e.g., `ExploreSystem` calling `window.Game.Windows.HUD.refresh()`). This makes it hard to change the UI without breaking game logic.
*   **Split Brain State**: Game state is scattered across `Game_Map` (logic), `ExploreSystem` (visuals), and `DataManager` (persistence). `ExploreSystem` maintains its own `fogValues` and `fogTarget` arrays which loosely sync with `Game_Map`'s visited state, creating potential for desynchronization.

### 3. Minor Flaws

*   **Data/Logic Bleed**: Data files (`creatures.js`) contain implied logic (e.g., `acts` array structure) that the engine must interpret defensively.
*   **Inconsistent Abstractions**: Some systems use `Managers` (static), others use `Systems` (instantiated), and others are direct global objects.

### 4. Comparison to `gameDesign.md`

The original design document implies a system capable of complex, emergent gameplay ("Novel Effects"). The current architecture's reliance on hardcoded trait handlers and rigid class structures actively works against this goal.

---

## Part 2: Radical Rewrite Proposal

To achieve a system that is leaner and more effective, we propose a transition to a **Component-Based Architecture (CBA)** with an **Event-Driven Core**.

### Core Philosophy
1.  **Composition over Inheritance**: Entities are defined by *what they have* (Components), not *what they inherit from*.
2.  **Systems over Managers**: Logic lives in small, focused Systems that process specific Components.
3.  **Events over Direct Calls**: UI and Systems communicate via a global Event Bus, decoupling the visual layer from the simulation.

### The New Architecture

#### 1. The Entity-Component Core (The "Data")
Instead of `Game_Actor`, we have an **Entity** (a simple ID) with attached **Components**:
*   `StatsComponent`: HP, MP, ATK, DEF.
*   `GridPositionComponent`: x, y, floor.
*   `SpriteComponent`: assetPath, animationState.
*   `InputComponent`: Defines who controls this entity (Player or AI).
*   `TraitComponent`: A list of active effect tags.

*Benefit*: To make a "Chest" that runs away, you just add an `AIComponent` and `StatsComponent` (speed) to a Chest entity. No new class needed.

#### 2. The Systems (The "Logic")
Logic is stripped from classes and moved to systems that run every frame or on events:
*   **MovementSystem**: Queries all entities with `GridPosition` + `Velocity`. Handles collision and updates coordinates.
*   **RenderSystem**: Queries `GridPosition` + `Sprite`. Updates the Three.js scene.
*   **BattleSystem**: Processes `ActionQueueComponent`. Calculates damage based on `Stats`.
*   **FogSystem**: Watches `GridPosition` of the player and updates the Fog texture.

*Benefit*: The `FogSystem` no longer knows or cares about the `RenderSystem`. It just updates data.

#### 3. The Event Bus (The "Glue")
Instead of `HUD.refresh()`, the game emits events:
*   `EventBus.emit('HP_CHANGED', { entityId: 1, newHp: 50 })`
*   The UI listens for `HP_CHANGED` and updates the relevant bar.

*Benefit*: You can rewrite the entire UI without touching a single line of game logic.

### Migration Roadmap

#### Phase 1: The Core (Lean Foundation)
1.  **Create `ECS` Library**: A tiny (<200 lines) generic implementation for `World`, `Entity`, `Component`, `System`.
2.  **Port Basic State**: Recreate `Game_Party` and `Game_Map` as collections of Entities.
3.  **Port Exploration**: Write `MovementSystem` and `RenderSystem` (Three.js) to replace `ExploreSystem`.

#### Phase 2: The Battle (Data-Driven Effects)
1.  **Effect Processor**: Replace hardcoded `handleTrait` with a pipeline.
    *   Effect: `{ trigger: 'ON_DEATH', action: 'CAST_SPELL', params: { skillId: 'fireball' } }`
    *   The `BattleSystem` reads this data and executes it generically.
2.  **Port Combat**: Re-implement turn logic using a `TurnOrderComponent`.

#### Phase 3: The UI (Decoupling)
1.  **Event Integration**: Refactor `Window_Base` to subscribe to the `EventBus` rather than polling globals.

### Why this is "Leaner"
*   **Less Code**: No more boilerplate getters/setters in massive classes. Components are just JSON-like objects.
*   **Less Debugging**: Bugs are isolated to specific systems. (e.g., Movement bug? Check `MovementSystem`, not `ExploreSystem` + `Game_Map` + `InputManager`).

### Why this is "More Effective"
*   **Modularity**: You can plug in a new `StealthSystem` that adds a `VisibilityComponent` without breaking existing code.
*   **Testing**: You can test the `MovementSystem` by feeding it a mock entity with a position, without needing to boot the entire graphics engine.

This proposal represents a shift from "making an RPG Maker clone" to "building a robust Game Engine".
