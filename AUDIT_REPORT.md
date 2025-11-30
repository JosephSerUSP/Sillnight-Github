# Comprehensive Code Audit Report

## 1. Executive Summary

The codebase is a web-based RPG engine mimicking a retro aesthetic (PS1/PC-98). It employs a hybrid architecture combining static singleton "Systems" (characteristic of ECS or simple game engines) with an Object-Oriented class hierarchy for game entities (`Game_Battler`, `Game_Actor`).

**Overall Health:** Moderate. The project is functional and follows strict design philosophies (PS1 aesthetic, MZ-style formulas). However, a critical architectural conflict exists: the split WebGL contexts prevent the "Effekseer on Map" goal. Addressing this is the primary prerequisite for future development.

## 2. Severity-Based Issue List

### 🔴 Critical (Architectural Blockers)

1.  **Split WebGL Contexts blocking Unified Effekseer Usage**:
    *   **Files:** `src/game/systems.js` (`Explore`, `Battle3D`, `Effekseer`)
    *   **Issue:** `Systems.Explore` and `Systems.Battle3D` each instantiate their own `THREE.WebGLRenderer`. This creates two separate WebGL contexts. The singleton `Systems.Effekseer` initializes its context bound to the `Battle3D` renderer.
    *   **Risk:** It is technically impossible to render Effekseer effects (which live in Context A) inside the Exploration view (Context B) without re-initialization or context loss. This directly blocks the feature goal of "Effekseer effects on the map".

2.  **Global State Dependency**:
    *   **Files:** Throughout (`main.js`, `state.js`, `BattleManager.js`)
    *   **Issue:** Heavy reliance on `window.$gameParty` and `window.$gameMap` makes unit testing difficult and creates race conditions during initialization.

### 🟠 Major (Refactoring Recommended)

1.  **Violation of Single Responsibility Principle (SRP)**:
    *   **File:** `src/game/systems.js` (`Systems.Explore`)
    *   **Issue:** `Systems.Explore` handles rendering, input logic, collision detection, and game loop management.
    *   **Remediation:** Split into dedicated controllers and renderers.

2.  **Transitional Architecture ("Proxy State")**:
    *   **File:** `src/game/state.js`
    *   **Issue:** `GameState` acts as a backward-compatible proxy to `$gameParty`.
    *   **Remediation:** Complete the refactor to use `Game_Party` directly.

### 🟡 Minor / Design Choices

1.  **Usage of `eval()` in Damage Formulas**:
    *   **Status:** **Intentional Design Choice**.
    *   **Note:** The engine mirrors RPG Maker MZ's formula system. Since data is trusted, the security risk is negated.

2.  **Direct DOM Manipulation in Logic Classes**:
    *   **Files:** `BattleManager.js`
    *   **Issue:** Logic classes directly manipulate DOM elements.
    *   **Remediation:** Use an Event Bus to notify UI of state changes.

## 3. Path Forward: Actionable Phases

To address the findings and enable the "Effekseer on Map" goal, the following phased approach is recommended:

### Phase 1: The "One Renderer" Refactor (Immediate Priority)
**Goal:** Unify WebGL contexts to support global effects.
1.  **Create `RenderManager`**: Implement a new singleton manager responsible for initializing and holding the single `THREE.WebGLRenderer` instance.
2.  **Refactor Systems**: Update `Systems.Explore` and `Systems.Battle3D` to request the renderer from `RenderManager` instead of creating their own.
3.  **Global Effekseer Init**: Initialize `Systems.Effekseer` once against the shared renderer in `RenderManager`.
4.  **Scene Management**: Ensure `RenderManager` or `SceneManager` handles clearing the screen and switching the active Three.js `Scene` (Explore vs Battle) correctly to avoid ghosting artifacts.

### Phase 2: State Hygiene & Stabilization
**Goal:** Remove fragile dependencies and complete the OOP transition.
1.  **Deprecate `GameState`**: Refactor all code accessing `GameState.party` or `GameState.exploration` to use `window.$gameParty` and `window.$gameMap` directly (or via injected dependencies).
2.  **Remove Proxy**: Delete `src/game/state.js` once all references are resolved.
3.  **Dependency Injection**: Modify `BattleManager.setup()` to accept `party` and `map` instances explicitly, making it testable in isolation.

### Phase 3: Component Separation
**Goal:** Improve maintainability of the large `Systems` file.
1.  **Extract `Systems.Explore`**: Move logic into `src/game/systems/ExploreSystem.js`.
2.  **Isolate Physics**: Extract grid collision logic (`tileAt`, `resolveTile`) into a `MapPhysics` helper or method on `Game_Map`.
3.  **Extract Input**: Ensure `InputManager` drives the systems via events/calls, rather than systems polling input directly (if applicable).

### Phase 4: Event-Driven UI
**Goal:** Decouple Game Logic from DOM updates.
1.  **Event Bus**: Implement a simple `EventBus` (or use `SimpleEventEmitter` from `core.js`).
2.  **Emit Events**: Instead of `BattleManager` calling `swipe.className = ...`, emit `EventBus.emit('BATTLE_START')`.
3.  **UI Listeners**: Have UI components (e.g., a `TransitionLayer` class) listen for these events and handle the visual transitions.

## 4. Paradigm Consistency Analysis

*   **OOP:** The `src/game/classes/` directory follows SOLID principles reasonably well. `Game_Actor` extends `Game_Battler`, correctly using polymorphism for `traitObjects`.
*   **Procedural:** `Systems.js` is a collection of singletons, acting as a Service Locator.
*   **Recommendation:** The singleton pattern is acceptable for Systems, but the resource management (Renderer) must be centralized to avoid conflicts.

## 5. Performance & Security

*   **Render Loops:** `Battle3D` and `Explore` have independent render loops. Ensure they are mutually exclusive (paused when not active) to save battery/CPU.
*   **Security:** `eval()` is noted as intentional and safe within the context of trusted data.
*   **Memory:** The "Split Renderer" approach currently doubles the memory overhead for swap chains and contexts. Unifying them in Phase 1 will reduce VRAM usage.
