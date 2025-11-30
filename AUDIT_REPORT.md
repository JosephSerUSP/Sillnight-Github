# Comprehensive Code Audit Report

## 1. Executive Summary

The codebase is a web-based RPG engine mimicking a retro aesthetic (PS1/PC-98). It employs a hybrid architecture combining static singleton "Systems" (characteristic of ECS or simple game engines) with an Object-Oriented class hierarchy for game entities (`Game_Battler`, `Game_Actor`).

**Overall Health:** Moderate. The project is functional and exhibits some good separation of concerns (e.g., `Battle3D` vs. `BattleManager`), but suffers from significant technical debt, including heavy reliance on global state, inconsistent patterns (mix of classes and plain objects), and potential security/performance risks (`eval`). The codebase is in a transitional state between a legacy procedural approach and a structured object-oriented design.

## 2. Severity-Based Issue List

### 🔴 Critical (Immediate Action Required)

1.  **Usage of `eval()` in Damage Formulas**:
    *   **File:** `src/game/classes/Game_Action.js`
    *   **Issue:** The method `evalDamageFormula` uses `eval(effect.formula)` to calculate damage.
    *   **Risk:** High security vulnerability (code injection if data is untrusted) and poor performance (cannot be optimized by JS engines).
    *   **Remediation:** Replace with a math expression parser or a predefined set of functions.

2.  **Global State Dependency**:
    *   **Files:** Throughout (`main.js`, `state.js`, `BattleManager.js`, etc.)
    *   **Issue:** Heavy reliance on `window.$gameParty`, `window.$gameMap`, and `window.Game`.
    *   **Risk:** Makes unit testing nearly impossible, causes hidden side effects, and creates race conditions during initialization.
    *   **Remediation:** Inject dependencies into classes/systems instead of accessing globals.

3.  **Inconsistent Type Safety & Error Handling**:
    *   **Files:** `BattleManager.js`, `Systems.js`
    *   **Issue:** Lack of null checks for critical objects (e.g., `unit.acts`). Use of `console.warn` vs silent failures.
    *   **Risk:** Runtime crashes if data is malformed.

### 🟠 Major (Refactoring Recommended)

1.  **Violation of Single Responsibility Principle (SRP)**:
    *   **File:** `src/game/systems.js` (`Systems.Explore`)
    *   **Issue:** `Systems.Explore` handles rendering (Three.js), input logic, collision detection, and game loop management.
    *   **Remediation:** Split into `ExploreRenderer`, `ExploreController`, and `MapPhysics`.

2.  **Transitional Architecture ("Proxy State")**:
    *   **File:** `src/game/state.js`
    *   **Issue:** `GameState` acts as a backward-compatible proxy to `$gameParty`.
    *   **Risk:** Increases complexity and confusion about the "source of truth".
    *   **Remediation:** Complete the refactor to use `Game_Party` directly and remove the proxy.

3.  **Magic Strings & Numbers**:
    *   **Files:** Data files, `Game_Action.js`
    *   **Issue:** Hardcoded strings for elements ('R', 'G'), stats, and event names. Hardcoded resolution (480x270).
    *   **Remediation:** Use constant enums (e.g., `Elements.FIRE`, `Resolution.WIDTH`).

### 🟡 Minor (Code Hygiene)

1.  **Direct DOM Manipulation in Logic Classes**:
    *   **Files:** `BattleManager.js`
    *   **Issue:** `BattleManager` (logic) directly manipulates DOM elements (swipes, buttons) instead of emitting events to the UI layer.
    *   **Remediation:** Use an Event Bus or Observer pattern to notify UI of state changes.

2.  **Mixed Paradigms**:
    *   The code mixes OOP (Classes) and Functional/Procedural (Static Objects in `Systems`) arbitrarily.

## 3. Actionable Refactoring Suggestions

### A. Removing `eval()` (Critical)

Replace the dangerous `eval` with a safe function constructor or a math parser.

**Current:**
```javascript
// src/game/classes/Game_Action.js
evalDamageFormula(target, effect) {
    // ...
    value = Math.max(0, eval(effect.formula));
    // ...
}
```

**Refactored:**
```javascript
// Create a safe context for formula evaluation
const makeFormula = (formulaStr) => {
    // Allow only specific variables: 'a' (attacker), 'b' (target), 'v' (variable)
    // simplistic approach; for production use a library like 'mathjs' or a custom parser.
    return new Function('a', 'b', 'v', `return ${formulaStr};`);
};

evalDamageFormula(target, effect) {
    if (!effect.formula) return 0;
    try {
        const formulaFunc = makeFormula(effect.formula);
        // Pass context: a = subject, b = target, v = game variables
        const value = Math.max(0, formulaFunc(this._subject, target, window.$gameVariables));
        // ...
    } catch (e) {
        console.error("Formula Error", e);
        return 0;
    }
}
```

### B. Decoupling Global State (Critical)

Pass dependencies explicitly to Managers and Systems.

**Current:**
```javascript
// src/game/managers/BattleManager.js
startEncounter() {
   const allies = GameState.party.activeSlots... // Accesses global
}
```

**Refactored:**
```javascript
// src/game/managers/BattleManager.js
startEncounter(party, dungeonData) {
   const allies = party.activeSlots...
}

// Caller (Game.js)
BattleManager.startEncounter(window.$gameParty, Data.dungeons.default);
```

### C. Standardizing Constants (Major)

Define a `constants.js` to eliminate magic strings.

```javascript
// src/game/constants.js
export const ELEMENTS = {
    FIRE: 'R',
    ICE: 'B',
    // ...
};

export const EVENTS = {
    BATTLE_START: 'onBattleStart',
    TURN_START: 'onTurnStart',
    // ...
};
```

## 4. Paradigm Consistency Analysis

The repository aims for an Object-Oriented approach (`Game_Battler`, `Game_Map`) similar to RPG Maker's architecture (MV/MZ), but retains legacy procedural code in `Systems.js`.

*   **OOP:** The `src/game/classes/` directory follows SOLID principles reasonably well. `Game_Actor` extends `Game_Battler`, correctly using polymorphism for `traitObjects`.
*   **Procedural:** `Systems.js` is a collection of singletons. This effectively acts as a Service Locator pattern but is implemented as hard-coded global modules.
*   **Recommendation:** Move `Systems.Explore` logic into a `Scene_Explore` class (or similar) to encapsulate state per-scene rather than globally.

## 5. Performance & Security

*   **Render Loops:** `Battle3D` and `Explore` have independent render loops. Ensure they are mutually exclusive (paused when not active) to save battery/CPU. Currently, they check `GameState.ui.mode`, which is good.
*   **Asset Loading:** Assets are loaded on demand or preloaded via `Effekseer`. Texture caching in `Battle3D` is implemented, which is good (O(1) access for repeated sprites).
*   **Security:** As noted, `eval()` is the primary risk. The rest of the app is client-side, so traditional server-side injection risks are low, but `eval` remains a bad practice.
