--- START OF FILE documentation/design.md ---

# Stillnight Engine Architecture & Refactoring Design Document

**Version:** 1.2
**Author:** Senior Game Engine Architect
**Date:** 2025-11-26
**Reference:** RPG Maker MZ Architecture (RMMZ)

---

## 1. Executive Summary

The current `Stillnight` codebase is a functional "vertical slice" prototype. It successfully demonstrates the core gameplay loop (Exploration -> Battle -> Reward), integration of 3D assets (Three.js), and particle effects (Effekseer).

However, the current architecture relies on "God Objects" (`Systems`, `ShellUI`) and direct global state manipulation (`GameState`), which creates high coupling. This makes adding new features (e.g., new stats, complex turn logic, custom windows) exponentially more difficult.

**The Refactoring Goal:** Transition from a specific *game script* to a data-driven *game engine*. This involves adopting a strict Separation of Concerns (MVC-like pattern):
1.  **Model:** `Game_Objects` (Data & Logic)
2.  **View:** `Windows` (UI) and `Sprites` (Visuals)
3.  **Controller:** `Scenes` and `Managers` (Flow)

---

## 2. Architecture Analysis

### 2.1 Inheritance & Class Hierarchy

#### Current State
The project currently relies on functional composition and singleton objects. Inheritance is minimal.
*   **Scenes:** `Scene_Base` exists but is thin.
*   **UI:** `ShellUI` (in `windows.js`) is a monolithic class handling HUD, Party, Inventory, and Modals.
*   **Logic:** `Systems` (in `systems.js`) is a static object containing `Battle`, `Map`, `Explore`, etc.

#### Target Hierarchy (Refactor Target)
We will move to a strict class-based hierarchy to ensure modularity.

**1. Managers (Static Classes)**
*   `SceneManager`: Controls the game loop and scene stack.
*   `BattleManager`: (New) Handles turn phases, action resolution, and victory conditions (extracted from `Systems.Battle`).
*   `DataManager`: (New) Handles loading JSONs and instantiating game objects.
*   `SoundManager`: (New) Central audio handling.

**2. Game Objects (The "Model")**
*   `Game_Temp`: Transient data (common events, immediate flags).
*   `Game_System`: System data (save counts, settings).
*   `Game_Map`: Map data, scroll position, events.
*   `Game_Party`: Inventory, gold, steps, collection of `Game_Actor`.
*   `Game_Battler` (Base) -> `Game_Actor` (Player) / `Game_Enemy` (Foe).
    *   *Responsibility:* Stats, Buffs, HP/MP logic, Trait evaluation.

**3. Scenes (The "Controller")**
*   `Scene_Base`
    *   `Scene_Boot`: Asset loading.
    *   `Scene_Title`: Main menu.
    *   `Scene_Map`: Exploration logic.
    *   `Scene_Battle`: Battle flow.
    *   `Scene_Menu`: Base for UI screens.

**4. Windows (The "View" - UI)**
*   `Window_Base`: Canvas/DOM context, open/close animations.
    *   `Window_Selectable`: Cursor logic, scrolling, input handling.
        *   `Window_Command`: Generic list of execute commands.
        *   `Window_ItemList`: Inventory display.
        *   `Window_Status`: Character details.
        *   `Window_BattleLog`: Text scrolling during combat.

**5. Sprites (The "View" - Visuals)**
*   `Spriteset_Base`: Container for visual layers.
    *   `Spriteset_Map`
    *   `Spriteset_Battle` (Wraps the Three.js Logic).

### 2.2 Coupling Analysis

| Component | Current Coupling | Severity | Solution |
| :--- | :--- | :--- | :--- |
| **ShellUI** | Directly accesses `GameState.party`, `GameState.inventory`. Calls `Systems.Battle` functions directly. Hardcoded HTML strings. | **Critical** | decouple via `Window` classes. UI should observe `Game_Objects`, not read raw JSON. Use a Window Layer. |
| **Systems.Battle** | Directly modifies DOM (`Log.battle`), directly calls `UI.renderParty`. Hardcoded damage formulas inside `calculateEffectValue`. | **Critical** | Move logic to `BattleManager`. Move damage math to `Game_Action`. UI updates via Event listeners or update loop. |
| **Systems.Map** | Generates map data and renders canvas in one object. | **High** | Split into `Game_Map` (Data) and `Spriteset_Map` (Rendering). |
| **Events** | Hardcoded HTML construction in `Systems.Events`. | **Medium** | Use `Window_Message` or `Window_Shop` to generate UI based on data. |

### 2.3 Hardcoding vs. Modularity

**Problem Area: Effect Evaluation (`Systems.Battle`)**
Currently, `calculateEffectValue` contains `eval(effect.formula)`.
*   *Issue:* It relies on implicit variable names (`a`, `b`) defined in the scope of `Systems.Battle`.
*   *Target:* Move this to `Game_Action.prototype.evalDamageFormula(target)`.

**Problem Area: Trait Handling (`Systems.Triggers`)**
Traits are handled via a `switch` statement inside `handleTrait`.
*   *Issue:* Adding a new trait (e.g., "Counter Attack") requires modifying the core engine code.
*   *Target:* `Game_Battler.prototype.traitObjects()` should aggregate traits. Specific getter methods (e.g., `hitRate()`, `evasive()`) should iterate over traits to calculate the final value.

---

## 3. Scalability Assessment

*   **Adding Stats:** Currently requires editing `objects.js` (creation), `windows.js` (rendering), and `systems.js` (battle logic).
    *   *Score:* 2/10.
*   **Adding Windows:** Requires adding methods to `ShellUI` and manually managing `innerHTML` and event listeners.
    *   *Score:* 3/10.
*   **Adding Equipment Slots:** Hardcoded to one slot in `objects.js` logic and UI.
    *   *Score:* 1/10.

---

## 4. Phased Refactoring Roadmap

### Phase 1: The Object Model (Foundation) - Complete
*Goal: Encapsulate `GameState` raw JSON into functional Classes.*

1.  **Create `Game_BattlerBase`, `Game_Battler`, `Game_Actor`, `Game_Enemy`.**
    *   Move `getMaxHp`, `applyHealing` from `objects.js` into these classes.
    *   Implement `addState`, `removeState`, `isStateAffected`.
2.  **Create `Game_Party`.**
    *   Encapsulate `activeSlots`, `inventory`, and `gold`.
    *   Add methods: `gainGold()`, `gainItem()`, `swapOrder()`.
3.  **Create `Game_Map`.**
    *   Encapsulate tile data and player XY coordinates.
    *   Move "Generate Floor" logic here.
4.  **Replace `GameState`:** The global object should instanciate these classes: `window.$gameParty = new Game_Party();`.

### Phase 2: The Manager Layer (Logic Decoupling) - Not Started
*Goal: Remove `Systems` god-object.*

1.  **Implement `BattleManager`.**
    *   Move `startEncounter`, `nextRound`, `processNextTurn` here.
    *   Instead of calling `UI.renderParty`, it should emit events or set phase flags that the Scene reads.
2.  **Implement `SceneManager` (Robust).**
    *   Implement a proper `.update()` loop that calls `currentScene.update()`.
    *   Handle scene transitions with a "busy" state to prevent input bleed.

### Phase 3: The Window System (UI Abstraction) - In Progress
*Goal: Remove `ShellUI` and DOM string building.*

1.  **Create `Window_Base`.**
    *   Handles creation of a generic `<div>` (or Canvas layer).
    *   Standardizes `show()`, `hide()`, `refresh()`.
2.  **Create `Window_Party`.**
    *   Subclass `Window_Selectable`.
    *   Reads `$gameParty`. Draws items based on data.
3.  **Refactor `Scene_Explore`.**
    *   Instead of calling `Systems.Explore.render`, it should contain a `Spriteset_Map` and a `Window_HUD`.
**Note:** The initial refactor is complete, but interactivity is still being restored to the modals.

### Phase 4: Battle System Integration
1.  **Create `Spriteset_Battle`.**
    *   Move the Three.js and Effekseer logic here.
    *   This class observes `$gameTroop` (Enemies) and `$gameParty` (Actors).
2.  **Connect `Scene_Battle`.**
    *   `Scene_Battle` owns `BattleManager`, `Spriteset_Battle`, and `Window_BattleLog`.
    *   Input flows: Input -> Scene -> Window_Command -> BattleManager.

---

## 5. Coding Standards & JSDoc Strategy

To ensure maintainability, all new classes must use JSDoc. This allows IDEs (VS Code) to provide Intellisense.

**Example: Refactoring `objects.js` / `getMaxHp` into `Game_Battler`**

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

    /**
     * Gets the base parameter value from the a source.
     * @param {number} paramId - The ID of the parameter.
     * @returns {number}
     */
    paramBase(paramId) {
        return 0; // Override in subclass
    }
}
