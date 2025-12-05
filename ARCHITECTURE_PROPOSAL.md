# Architecture Assessment & Proposal

## 1. Assessment of Current Architecture

The current engine utilizes a **Hybrid Compositional Model**, blending functional singletons with object-oriented game entities. While functional for the current scope, it exhibits structural fragility that hinders scalability and strict adherence to the design document.

### Integrity & Stability
The system works by manually wiring distinct systems (`Explore`, `Battle3D`) via a central `Game` object. This works for simple flows but breaks down under complex state management (e.g., preserving state between scene switches or handling complex nested UIs).

### Ranking of Flaws

#### 🔴 Structural (Critical)
1.  **Global Singleton UI Windows:** Windows like `Window_Shop` and `Window_Party` are instantiated once at boot (`Game.init`). They do not follow the lifecycle of the scene. This leads to "stale state" issues where windows hold references to old data or require manual, error-prone `refresh()` calls from unrelated systems.
2.  **Lack of Scene Hierarchy:** While `SceneManager` exists, scenes (`Scene_Explore`, `Scene_Battle`) are shallow wrappers. They do not own their UI layers or Sprite sets. This makes transitions (visually and logically) brittle.
3.  **Mixed Concerns in Managers:** `BattleManager` handles both high-level flow (Turn phases) and low-level data manipulation (creating `Game_Action` instances, modifying specific UI elements).

#### 🟡 Major
1.  **Incomplete Battler Model:** The `Game_BattlerBase` class implements standard RPG stats (`atk`, `def`) but lacks the specific design-required parameters: `mpd` (MP Drain), `mxa` (Max Actions), `mxp` (Max Passives), and `asp` (Action Speed) as a distinct derived stat.
2.  **Summoner Logic Gap:** The "Summoner" (Player Character) is treated effectively as a camera or a party container. The design document specifies the Summoner as a distinct entity with MP mechanics, "Instant" turn capability, and separate inventory/skill logic.
3.  **Hardcoded Battle Flow:** The current `BattleManager` uses a standard "Agility-based" queue. It does not support the Design's "Summoner acts instantly" rule or the specific "Action Speed (asp)" formula for turn order.

#### 🟢 Minor
1.  **Direct DOM Manipulation:** `Game_Interpreter` creates temporary DOM elements for messages (`interpreter-message-modal`) instead of utilizing the robust `Window` system.
2.  **Circular Dependencies:** The `Systems` aggregator import pattern causes potential circular dependency issues during initialization.

---

## 2. Comparison: Implementation vs. GameDesign.md

| Feature | Design Document | Current Implementation | Verdict |
| :--- | :--- | :--- | :--- |
| **Summoner** | Non-combatant, drains MP on move, instant actions in battle. | Does not exist as a class. Party moves freely. | **MISSING** |
| **Battler Stats** | `mpd`, `mxa`, `mxp`, `ele` (stackable). | `atk`, `def`, `mat`, `mdf`. Elements exists but implementation is basic. | **PARTIAL** |
| **Actions** | `asp` determines order. Flexible Effects. | `speed` determines order. Hardcoded Effect types. | **DIVERGENT** |
| **Traits** | Dynamic description generation. | Implemented (`traitObjects`), but no description generation. | **PARTIAL** |
| **Turns** | Summoner = Instant. Others = `asp`. | All units sorted by `speed` in one queue. | **DIVERGENT** |

---

## 3. Radical Rewrite Proposal: "Project MZ" Architecture

I propose a full rewrite of the game logic to align with a structured, Scene-based architecture similar to robust JRPG engines (like RPG Maker MZ), separating Data, Logic, and View.

### A. Core Architecture Changes

#### 1. Scene-Graph Lifecycle
*   **Old:** Windows created globally at start.
*   **New:** Windows and Spritesets are children of the current `Scene`.
    *   `Scene_Battle.create()` -> creates `Spriteset_Battle` and `Window_BattleLog`.
    *   When the scene terminates, all its children are destroyed. This eliminates stale state.

#### 2. The `Spriteset` Layer
*   Introduce `Spriteset_Base`, `Spriteset_Map`, and `Spriteset_Battle`.
*   These classes manage the 3D world (Three.js scenes, Effekseer contexts) and the 2D sprites.
*   The `Scene` renders the `Spriteset`, then renders the `WindowManager` layer on top.

### B. Game Logic Refactor

#### 1. `Game_Summoner` Class
A new singleton class `$gameSummoner` (distinct from `$gameParty`).
*   **Properties:** `mp`, `maxMp`, `level`, `inventory`.
*   **Mechanics:**
    *   **Exploration:** Decrements MP on step. Triggers "Exhaustion" state if MP=0.
    *   **Battle:** Does not enter the `queue`. Has a dedicated "Command Phase" at the start of every round (or interrupt) to use Items/Spells instantly.

#### 2. Expanded `Game_Battler`
Refactor `Game_BattlerBase` to implement the Design Document's "Trait/Effect" system faithfully.
*   **New Stats:** `mpd`, `mxa`, `mxp`.
*   **Trait Factory:** A system to generate dynamic descriptions (e.g., "Hit Rate +5%") based on active traits for UI display.

#### 3. `BattleManager` Overhaul
*   **Phase 1: Summoner Input:** Player selects Summoner action (Instant) or "Pass".
*   **Phase 2: Action Generation:** AI and Allies calculate their actions.
*   **Phase 3: Turn Sorting:** Actions are sorted by their `asp` (Action Speed) property (not just Battler Agility).
*   **Phase 4: Execution:** The queue resolves.

### C. Folder Structure Reorganization

```text
src/
  game/
    core/           # Low-level utilities (Input, Audio, Touch)
    managers/       # Static singletons (SceneManager, BattleManager, ImageManager)
    objects/        # Game Logic (Game_System, Game_Map, Game_Message, Game_Summoner)
    scenes/         # Scene classes (Scene_Boot, Scene_Title, Scene_Map, Scene_Battle)
    sprites/        # View Logic (Spriteset_Map, Sprite_Character, Sprite_Battler)
    windows/        # UI Logic (Window_Base, Window_Selectable, Window_Shop)
    main.js         # Entry point
```

### D. Step-by-Step Migration Plan

1.  **Foundation:** Define `Game_Summoner` and integrate it into `DataManager`.
2.  **Battler Refactor:** Update `Game_Battler` with new stats and `asp` logic.
3.  **Scene System:** Create `Scene_Base` and migrate `Scene_Battle` to own its windows.
4.  **Battle Loop:** Rewrite `BattleManager` to support the Summoner -> Queue flow.
5.  **Cleanup:** Remove global window references and legacy `Systems` object.
