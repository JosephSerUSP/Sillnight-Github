--- START OF FILE documentation/design.md ---

# Stillnight Engine Architecture & Refactoring Design Document

**Version:** 1.3
**Author:** Senior Game Engine Architect
**Date:** 2025-11-26
**Reference:** RPG Maker MZ Architecture (RMMZ)

---

## 1. Executive Summary

The `Stillnight` codebase has been refactored from a "vertical slice" prototype to a data-driven, modular game engine. The architecture now follows a strict Separation of Concerns (MVC-like pattern), replacing previous "God Objects" with specialized classes.

**Architecture Overview:**
1.  **Model:** `Game_Objects` (Data & Logic) - Encapsulated in `src/game/classes/`.
2.  **View:** `Windows` (UI) - Managed by `src/game/window/` classes. `Sprites` (Visuals) - Managed by `Battle3D` and `Systems.Explore`.
3.  **Controller:** `Scenes` and `Managers` (Flow) - Managed by `SceneManager`, `BattleManager`, and `DataManager`.

---

## 2. Architecture Analysis

### 2.1 Inheritance & Class Hierarchy

#### Current State (Refactored)
The project now uses a robust class hierarchy.

**1. Managers (Static Classes)**
*   `SceneManager`: Controls the game loop and scene stack.
*   `BattleManager`: Handles turn phases, action resolution, and victory conditions.
*   `DataManager`: Handles setup of new games and object instantiation.
*   `InputManager`: Maps keyboard inputs to game commands.

**2. Game Objects (The "Model")**
*   `Game_Temp`: Transient data.
*   `Game_System`: System data.
*   `Game_Map`: Map data, scroll position, events.
*   `Game_Party`: Inventory, gold, steps, collection of `Game_Actor`.
*   `Game_BattlerBase` -> `Game_Battler` -> `Game_Actor` (Player) / `Game_Enemy` (Foe).
    *   *Responsibility:* Stats, Buffs, HP/MP logic, Trait evaluation.
*   `Game_Action`: Encapsulates action execution, target selection, and effect application.

**3. Scenes (The "Controller")**
*   `Scene_Base`
    *   `Scene_Explore`: Exploration logic.
    *   `Scene_Battle`: Battle flow.

**4. Windows (The "View" - UI)**
*   `Window_Base`: Base UI class.
    *   `Window_Selectable`: Cursor logic.
        *   `Window_Party`: Active party display.
        *   `Window_Inventory`: Item management.
        *   `Window_HUD`: Heads-up display.
        *   `Window_BattleLog`: Battle text feed.
        *   `Window_CreatureModal`: Detailed status view.

**5. Visual Systems**
*   `Systems.Explore`: Handles 3D map rendering (Three.js).
*   `Systems.Battle3D`: Handles 3D battle scene rendering (Three.js + Effekseer).
    *   *Note:* `Battle3D` sets textures to `NearestFilter` for a pixelated aesthetic.

### 2.2 Coupling Analysis (Improvements)

| Component | Status | Solution Implemented |
| :--- | :--- | :--- |
| **ShellUI** | **Removed** | Replaced by `Window_` classes in `src/game/window/`. |
| **Systems.Battle** | **Removed** | Logic moved to `BattleManager`, `Game_Action`, and `Game_Battler`. |
| **GameState** | **Legacy Proxy** | Retained for backward compatibility, proxies requests to global `window.$gameParty` etc. |
| **Systems.Triggers** | **Legacy** | Still handles some event hooks, but logic is gradually moving to `Game_Battler` traits. |

### 2.3 Hardcoding vs. Modularity

**Effect Evaluation**
*   Logic moved to `Game_Action` and `BattleManager`.
*   Formulas are evaluated within `Game_Action` context.

**Trait Handling**
*   `Game_Battler` now implements `traitObjects()` to aggregate traits from Actor/Enemy data, Equipment, and Passives.
*   Derived stats (`cri`, `eva`, `hit`, `speed`) use `traitsSum()` to calculate values dynamically.

---

## 3. Scalability Assessment

*   **Adding Stats:** Requires editing `Game_BattlerBase` and data files. (Significantly improved).
*   **Adding Windows:** Create a new `Window_` subclass and instantiate in `Game.init`. (Modular).
*   **Adding Equipment:** Defined in data, logic handled by `Game_Actor`.

---

## 4. Completed Refactoring Phases

### Phase 1: The Object Model (Foundation) - Complete
*   `Game_BattlerBase`, `Game_Battler`, `Game_Actor`, `Game_Enemy` are implemented.
*   `Game_Party` and `Game_Map` manage state.
*   `Game_Action` handles battle mechanics.

### Phase 2: The Manager Layer (Logic Decoupling) - Complete
*   `BattleManager` controls the battle flow.
*   `SceneManager` handles scene switching.
*   `Systems.Battle` has been deprecated and removed.

### Phase 3: The Window System (UI Abstraction) - Complete
*   `ShellUI` is gone.
*   UI is composed of independent `Window` classes.

### Phase 4: Battle System Integration - Functional
*   `Battle3D` (in `systems.js`) handles 3D rendering.
*   `Scene_Battle` orchestrates the battle loop using `BattleManager`.

---

## 5. Coding Standards & JSDoc Strategy

All new classes use JSDoc. This allows IDEs (VS Code) to provide Intellisense.

**Example: `Game_Battler`**

```javascript
/**
 * The superclass for Game_Actor and Game_Enemy.
 * Handles parameters, traits, and battle logic.
 */
class Game_Battler {
    constructor() {
        this._hp = 0;
        this._mp = 0;
        this._states = [];
        this._buffs = [];
    }

    /**
     * Calculates the maximum Hit Points (HP) based on base stats,
     * equipment, and traits.
     * @returns {number} The calculated Max HP.
     */
    mhp() {
        // Base value + Percent bonuses + Flat bonuses
        let val = this.paramBase(0); // 0 = MaxHP
        val *= this.paramRate(0);
        val += this.paramPlus(0);
        return Math.round(val);
    }
}
