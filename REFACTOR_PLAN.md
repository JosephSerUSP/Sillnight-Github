# Deep Refactor Plan: "Foundations & Futures"

## Executive Summary
This plan aims to transition the current prototype architecture into a robust, scalable engine capable of supporting a complex, data-driven dungeon crawler with procedural storytelling. The core philosophy is **Separation of Concerns** (Logic vs. View) and **Data-Driven Design** (behavior defined in data, not hardcoded).

THIS DOCUMENT MUST ALWAYS BE UPDATED AS THE REFACTOR IS EXECUTED.

---

## 1. Core Architecture: The Bedrock

### 1.1. The Registry System
**Goal:** Centralized, efficient access to game data (Items, Creatures, Skills) with support for "Inheritance" and "Mixins" in data.
*   **Problem:** Currently, data is imported directly as raw JSON/JS objects. Modding or dynamic patching is hard.
*   **Current Status (Phase 1):** `TraitRegistry` and `EffectRegistry` exist to handle *logic execution*, but data loading is still direct via `Data` object.
*   **Solution:** `Registry` classes.
    *   `CreatureRegistry`: Loads creature definitions, resolves inheritance (e.g., "Goblin Archer" inherits "Goblin").
    *   `ItemRegistry`, `SkillRegistry`.
    *   **Feature:** *Dynamic Tooltips*. The registry generates descriptions based on the actual effects (e.g., "Deals 50 Fire DMG") rather than static strings.

### 1.2. The Event Bus (Pub/Sub)
**Goal:** Decouple Game Logic from UI and Rendering.
*   **Problem:** `BattleManager` directly calls `Window_BattleLog.add()`. If we change the UI, we break the battle logic.
*   **Current Status (Phase 1):** Partially implemented. `Services.events` is active. `BattleObserver` handles logs and damage numbers. However, `BattleManager` still drives `BattleRenderSystem` (animations) and some UI (Victory Window) directly.
*   **Solution:** Global `EventBus`.
    *   `BattleManager` emits `battle:damage_dealt` { target, amount }.
    *   `BattleLog` listens to `battle:damage_dealt` and renders text.
    *   `BattleRenderSystem` listens to `battle:damage_dealt` and spawns floating numbers.
    *   `AudioManager` listens and plays a hit sound.

### 1.3. Service Locator Pattern
**Goal:** Manage dependencies cleanly without global spaghetti.
*   **Solution:** `Game.Services`.
    *   Registers `InputService`, `AudioService`, `PersistenceService`.
    *   Allows for easy mocking in tests.
*   **Status:** Implemented (`src/game/ServiceLocator.js`).

---

## 2. The Battle System: "Tactical Depth"

### 2.1. Separation of Model and View
*   **BattleModel:** Pure JS classes (`BattleState`, `BattleUnit`). logic only. No DOM, no Three.js. Deterministic.
*   **BattleView:** Handles visual representation (Sprites, UI windows, Animations).
*   **Benefit:** Allows running battles instantly for simulation/testing without rendering.

### 2.2. The Effect & Trait Engine (per `gameDesign.md`)
**Goal:** A highly flexible system where functionality is composed, not hardcoded.
*   **Traits:** Static modifiers residing on Actors, Classes, Equipment, and States.
    *   Example: `Trait({ code: 'PARAM_PLUS', id: 'atk', value: 10 })`
    *   Example: `Trait({ code: 'ELEMENT_RATE', id: 'fire', value: 0.5 })`
*   **Effects:** Dynamic actions performed by Skills/Items.
    *   Example: `Effect({ code: 'DAMAGE_HP', formula: 'a.atk * 4 - b.def * 2' })`
    *   Example: `Effect({ code: 'ADD_STATE', id: 'poison', chance: 0.5 })`
*   **Pipeline:**
    1.  **Action Declaration:** Unit chooses skill.
    2.  **Cost Check:** MP/TP verification.
    3.  **Targeting:** Scope resolution.
    4.  **Execution:** `Action.apply(target)` -> Iterates Effects.
    5.  **Result:** Returns a `Result` object (hit, damage, flags) to the Event Bus.

---

## 3. Procedural Generation: "Infinite Worlds"

### 3.1. Strategy Pattern for Generators
**Goal:** Support different dungeon types (Caves, Rooms, Mazes).
*   `MapGenerator` interface.
    *   `BSPGenerator`: Room-based.
    *   `CellularAutomataGenerator`: Cave-like.
    *   `WFCGenerator`: Wave Function Collapse for structure.

### 3.2. Dynamic Populators
**Goal:** Smart placement of content.
*   `EncounterPopulator`: Places enemies based on "Threat Density" maps.
*   `LootPopulator`: Places treasure based on "Risk/Reward" analysis.

---

## 4. The Storytelling Engine: "Emergent Narrative"

### 4.1. Event Command Pattern
**Goal:** A scripted sequence engine (like RPG Maker) but robust.
*   **Commands:** `ShowMessage`, `MoveCamera`, `Wait`, `Battle`, `Choice`.
*   **Interpreter:** Executes these commands async.
*   **Data-Driven:** Events are JSON arrays of commands, loaded from `events.js` or generated procedurally.

### 4.2. Variable Store & Quest System
*   `Game_Variables` / `Game_Switches`: Persistent state tracking.
*   `QuestManager`: Tracks objective states (`ACTIVE`, `COMPLETED`, `FAILED`).

---

## 5. UI/UX: "Responsive & Modular"

### 5.1. Window System Refactor
*   **Composition over Inheritance:** Windows are containers of *Components* (Text, Grid, List, Gauge).
*   **Reactive Data Binding:** Windows subscribe to data changes. `HPGauge` listens to `actor.hp` changes directly.

---

## Roadmap

### Phase 1: Core Foundation (In Progress / Partial)
1.  Implement **EventBus** (Done: `BattleObserver`).
2.  Implement **Registry** logic handlers (Done: `TraitRegistry`, `EffectRegistry`).
3.  Refactor `BattleManager` to use EventBus (Partial: Logging/Numbers decoupled, Animations/Flow still coupled).

### Phase 2: The Data Engine (Next Priority)
1.  Implement **Registry** data loaders (Move off direct `Data` object access).
2.  Migrate `creatures.js` and `skills.js` to a schema that supports inheritance.
3.  Refactor `Game_Battler` to load stats via Registry lookups.

### Phase 3: The World
1.  Refactor `Game_Map` to use `MapGenerator` strategies.
2.  Implement `EventInterpreter` for complex interactions.

### Phase 4: Polish
1.  Reactive UI components.
2.  Audio system integration.
