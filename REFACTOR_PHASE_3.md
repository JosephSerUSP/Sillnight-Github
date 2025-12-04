# Refactor Phase 3: Modernization & Security

**Goal:** Remove unsafe `eval()` usage, improve performance, and implement Dependency Injection for better testability.
**Complexity:** High
**Risk:** High (Affects damage calculation math)

## 1. Overview
The use of `eval()` for damage formulas is a security risk and performance bottleneck. Additionally, the heavy reliance on global state (`window.$gameParty`) makes the engine fragile and untestable. This phase implements a proper formula parser and begins the shift toward Dependency Injection.

## 2. Execution Steps

### Step 1: Replace `eval()` with a Formula Parser
1.  **Create `MathParser.js` (`src/game/utils/MathParser.js`):**
    *   Implement a safe expression evaluator. Libraries like `mathjs` are too heavy; a simple recursive descent parser or a Function constructor with strict keys is preferred.
    *   Alternatively, support a restricted subset: `(a.atk * 4 - b.def * 2)`.
    *   *Simpler Approach:* Use a Regex replacer to convert `a.atk` -> `subject.atk` and use `new Function('a', 'b', 'return ...')`. While still essentially eval, it's scoped.
    *   *Safest Approach:* Define formulas as structured objects in Data, e.g., `{ base: 4, scalings: [{ stat: 'atk', factor: 2 }] }`.
    *   **Decision:** Implement a `DamageCalculator` class that accepts a formula string and uses a safe parsing method (replacing `a.` and `b.` with internal variable references) or switch Data to use structured scaling factors.
2.  **Refactor `Game_Action.js`:**
    *   Remove `eval(effect.formula)`.
    *   Inject `DamageCalculator` dependency.
    *   Pass `subject` (a) and `target` (b) to the calculator.

### Step 2: Implement Dependency Injection (DI)
1.  **Refactor `DataManager`:**
    *   Instead of `window.$gameParty = new Game_Party()`, `DataManager` should hold the reference.
    *   Create a `ServiceLocator` or `GameContext` object that is passed to Systems.
2.  **Refactor Classes:**
    *   `Game_Battler`: Remove `Data` import if possible (pass data in constructor).
    *   `Game_Action`: Accept `itemData` in constructor/setter rather than looking it up globally.
3.  **Refactor Systems:**
    *   `ExploreSystem` should accept `$gameMap` in its constructor, rather than reading `window.$gameMap`.
    *   `EventSystem` should accept `$gameParty` to manipulate gold/inventory.

## 3. Verification
*   **Formula Test:** Create a Unit Test for `DamageCalculator`. Verify `4 + 2 * a.level` evaluates correctly given mock subject/target.
*   **Regression Test:** Play a full battle. Verify damage numbers match expected values (approximate).
*   **Load Test:** Ensure game loads without `window.$gameParty` being globally available (if fully implemented), or at least verify components execute via injected dependencies.

## 4. Definition of Done
*   `eval()` is completely removed from the codebase.
*   Core systems (Explore, Battle) accept their data dependencies via constructor or init methods.
