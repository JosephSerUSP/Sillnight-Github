# Architecture Documentation

## 1. Introduction & Philosophy

The architecture of **Stillnight** is built on a "Hybrid" foundation, designed to merge the tactical depth of a classic dungeon crawler with the visual flair of a modern 3D engine. It explicitly rejects the monolithic "God Object" patterns common in older RPG engines in favor of a modular, event-driven, and data-centric approach.

### Core Philosophies

1.  **Separation of Concerns (Logic vs. View):**
    *   **Game Logic** (Damage calculation, turn order, inventory) is deterministic and runs independently of the display.
    *   **View Layer** (Three.js rendering, DOM UI, audio) simply *observes* the logic and renders the state.
    *   *Goal:* We should be able to run a full battle simulation in a headless node environment without loading a single texture.

2.  **Data-Driven Design:**
    *   Behavior is defined in data files (`src/assets/data/`), not hardcoded in classes.
    *   We use a **Registry Pattern** to load and manage these definitions (Creatures, Items, Skills).
    *   *Goal:* A designer should be able to add a new status effect or damage formula by editing a JSON/JS file, without touching the engine code.

3.  **Hybrid Rendering:**
    *   **3D World:** Handled by `Three.js` (WebGL) for the dungeon and battles, enabling dynamic lighting, particles, and shaders.
    *   **2D UI:** Handled by standard **HTML/DOM** elements (styled with Tailwind CSS) for crisp text, flexible layouts, and accessibility.
    *   *Goal:* Leverage the best tool for the job. HTML is superior for text layout; WebGL is superior for visual effects.

4.  **Composition over Inheritance:**
    *   While we use inheritance for core prototypes (`Game_Battler` -> `Game_Actor`), the behavior of entities is increasingly defined by composed **Traits** and **Effects** rather than deep class hierarchies.

---

## 2. High-Level Architecture

The application is structured as a single-page application (SPA) where the `Game` namespace acts as the central hub, bootstrapping the `Managers` and `Systems`.

```mermaid
graph TD
    User[User Input] --> Input[InputManager]
    Input --> Scene[SceneManager]
    Scene -->|Update Loop| ActiveScene{Active Scene}

    subgraph "Core Systems"
        Game[Game (Global Hub)]
        Bus[EventBus (Observer)]
        Service[ServiceLocator]
    end

    subgraph "Logic Layer (Model)"
        BM[BattleManager]
        Party[Game_Party]
        Map[Game_Map]
        Registry[Trait/Effect Registry]
    end

    subgraph "View Layer (View)"
        UI[DOM Window System]
        Render[RenderManager (Three.js)]
        ExploreSys[ExploreSystem (3D)]
        BattleSys[BattleRenderSystem (3D)]
    end

    ActiveScene -->|Updates| BM
    ActiveScene -->|Updates| ExploreSys

    BM -->|Emits Events| Bus
    BM -->|Orchestrates| BattleSys
    Bus -->|Notifies| UI
    Bus -->|Notifies| BattleSys
```

### Key Components

*   **`Game` (Bootstrapper):** The entry point (`src/game/main.js`). It initializes the `DataManager`, `ServiceLocator`, and core `Systems` before handing control to the `SceneManager`.
*   **`ServiceLocator`:** A registry for global services (like `Input`, `Audio`, `Persistence`), allowing modules to access dependencies without tight coupling.
*   **`SceneManager`:** Manages the high-level state of the application (`Scene_Explore`, `Scene_Battle`). It handles the main loop and transitions.
*   **`EventBus` (`Observer`):** The critical bridge between Logic and View. Logic emits events (`battle:damage_dealt`), and Views listen to them to update the UI or play animations.

---

## 3. Core Systems (Mid-Level)

### 3.1. The "Hybrid" Window System
Unlike traditional engines that render UI to a Canvas, Stillnight uses the DOM.

*   **`Window_Base`:** The root class for all UI elements. It manages a DOM node (usually a `div`), visibility, and lifecycle.
*   **`LayoutManager`:** A composition system (`FlexLayout`, `GridLayout`) attached to windows to manage the positioning of children components.
*   **`Window_Selectable`:** Extends `Window_Base` to handle list navigation (cursor movement, selection), essential for RPG menus.

**Flow:** `Window_Party` updates via manual `refresh()` or direct hooks from Logic classes (e.g., `Game_BattlerBase` -> `window.Game.Windows.Party`).

### 3.2. Exploration System (`ExploreSystem`)
Handles the dungeon crawling experience.

*   **Rendering:** Uses `Three.js` `InstancedMesh` for high-performance rendering of thousands of floor/wall tiles.
*   **Fog of War:** Implemented via a custom `ShaderMaterial`. A `DataTexture` tracks visibility states (Hidden, Visited, Visible), which is fed into the vertex shader to vertically displace (hide) or reveal geometry.
*   **Interaction:** Uses raycasting or grid-based collision to trigger `Game_Event` objects (Shops, Enemies, Chests).

### 3.3. Battle System (`BattleManager` vs `BattleRenderSystem`)
Strictly separates the "Brain" from the "Eyes".

*   **`BattleManager` (The Brain):** Logic & Orchestration.
    *   Calculates turn order (`queue`).
    *   Executes actions (`Game_Action`).
    *   Determines results (Hit/Miss/Crit).
    *   *Note:* Currently operates in a **Hybrid** state, orchestrating `BattleRenderSystem` (e.g. `playAnim`) and waiting for completion callbacks. Visual feedback is a mix of `EventBus` events (logs) and direct UI window calls (Victory, LevelUp).
*   **`BattleRenderSystem` (The Eyes):** Visualization.
    *   Listens to `BattleManager` events via `Observer`.
    *   Manages 3D sprites (`Spriteset_Battle`).
    *   Controls the Camera (Zoom, Pan).
    *   Plays Effekseer particles.

---

## 4. Low-Level Implementation & Data Flow

### 4.1. The Action Pipeline
How a skill is executed.

1.  **Initiation:** `BattleManager.processNextTurn()` selects a unit and an action (e.g., "Fireball").
2.  **Instantiation:** A `Game_Action` is created with the subject and the skill data.
3.  **Targeting:** `Game_Action` determines valid targets (e.g., "All Enemies").
4.  **Application:** `action.apply(target)` is called for each target.
    *   **Formula Eval:** `Game_Action.evalDamageFormula()` parses the math (e.g., `a.mat * 4 - b.mdf * 2`).
    *   **Element Mod:** Checks `target.elements` vs `action.element` for multipliers.
    *   **Variance/Crit:** Applies RNG.
5.  **Event Emission:** The result is passed to `EffectRegistry` via `BattleManager` callbacks. Events are fired:
    *   `battle:action_used` (Starts animation)
    *   `battle:damage_dealt` (Shows number, reduces HP)
    *   `battle:state_added` (Shows icon)

### 4.2. Entity Class Hierarchy
The game entities follow a prototype chain but rely heavily on "Traits" for stats.

*   **`Game_BattlerBase`:** Handles HP, MP, and the `traits` array.
    *   *Traits:* Instead of hardcoding `hit_rate = 95%`, we delegate to `TraitRegistry` which iterates traits: `registry.getParamValue(this, id)`. This allows equipment, passives, and buffs to all modify stats uniformly.
*   **`Game_Battler`:** Adds `actions`, `speed`, and turn lifecycle (`onTurnStart`).
*   **`Game_Actor`:** Adds `level`, `exp`, `equipment`.
*   **`Game_Enemy`:** Adds `dropItems`, `ai_pattern`.

### 4.3. Data & Registry System
The game is data-driven, using a Registry pattern for logic execution and a Data Loader for definitions.

*   **Data Files (`src/assets/data/`):** Define creatures, skills, items, and config.
    *   `creatures.js`: Base stats, growth curves, sprites.
    *   `skills.js`: Effects, costs, animations.
    *   **Loader:** `DataManager` hydrates this raw JSON into the global `Data` object.
*   **Registries (`src/game/registries/`):** Handle logic execution for data-driven behaviors.
    *   **`TraitRegistry`:** Calculates final parameter values (`getParamValue`) by aggregating traits (Passives, Equipment) found on a battler. It handles event triggers like `onTurnStart`.
    *   **`EffectRegistry`:** Handles the application of action effects (`apply`), executing logic for damage, healing, state addition, etc.

---

## 5. Future Direction (Refactor Goals)

The codebase is currently in a transitional state (Phase 1 of Refactor). The ultimate goals are:

WHEN IMPLEMENTING THE REFACTOR, UPDATE THE DOCUMENT ACCORDINGLY.

1.  **Full Decoupling:** Complete the migration of *all* UI logic to the `EventBus`. Currently, some legacy calls (like `window.Game.Windows.BattleLog`) still exist within Logic classes.
2.  **Logic Separation:** Fully detach `BattleManager` from `BattleRenderSystem` methods (like `playAnim`). The Manager should emit an event (e.g., `battle:perform_action`) and wait for a `battle:animation_complete` event, rather than passing callbacks.
3.  **Registry Expansion:** Move from raw object lookups (`Data.skills['fire']`) to a robust `SkillRegistry` that handles data loading and inheritance (e.g., "Fire II" inherits "Fire I").
4.  **Reactive UI:** Implement a lightweight binding system so Windows update automatically when data changes, removing manual `refresh()` calls.
