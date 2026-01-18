# Documentation Audit Report

## Summary

This audit compares the existing documentation (`ARCHITECTURE.md`, `gameDesign.md`) against the current codebase (`src/`).

**Key Findings:**
1.  **Architecture Status**: The "Hybrid" state described in `ARCHITECTURE.md` is accurate. `BattleManager` still drives `BattleRenderSystem` directly, confirming the engine is in a transitional phase (Phase 1 Refactor partially complete).
2.  **Implementation Gaps**: `gameDesign.md` specifies parameters (`mpd`, `mxa`, `mxp`) and mechanics (Turn Order via `asp`) that are **not** implemented. The codebase uses standard RPG stats (`agi`) for turn order and lacks the Summoner MP drain mechanics.
3.  **Action Pipeline**: The damage formula logic in `Game_Action` differs slightly from the simplified view in `ARCHITECTURE.md`. It uses a rigorous pipeline of `Formula -> Stat Ratio -> Element Mod -> Crit`.
4.  **UI System**: `Window_Base` is located in `src/game/windows.js`, and the "Reactive UI" goal (Phase 4) remains unimplemented, relying on manual refresh hooks.
5.  **Element Logic**: `Game_Action` uses a hardcoded element cycle rather than a fully data-driven registry approach for effectiveness.

---

## 1. Updates for `documentation/ARCHITECTURE.md`

**Section 3.3 Battle System**:
*   *Clarification*: Explicitly state that `BattleManager` currently calls `Systems.Battle3D` methods directly, verifying the "Hybrid" note.
*   *Correction*: Remove implication that `BattleManager` is *only* emitting events.

**Section 4.1 Action Pipeline**:
*   *Correction*: Update formula description to match `Game_Action.evalDamageFormula`. The code scales the formula result by `(atk / def)`, rather than assuming the formula contains the stat logic itself.

**Section 5 Future Direction**:
*   *Status Update*: Phase 3 (World) is Done. Phase 1 (EventBus) is Partial (Battle logic still coupled).

### Diffs

```diff
<<<<<<< SEARCH
    *   **Application:** `action.apply(target)` is called for each target.
    *   **Formula Eval:** `Game_Action.evalDamageFormula()` parses the math (e.g., `a.mat * 4 - b.mdf * 2`).
    *   **Element Mod:** Checks `target.elements` vs `action.element` for multipliers.
    *   **Variance/Crit:** Applies RNG.
=======
    *   **Application:** `action.apply(target)` is called for each target.
    *   **Formula Eval:** `Game_Action.evalDamageFormula()` parses the math (e.g., `a.mat * 4`) and scales it by the user/target stat ratio (`atk/def`).
    *   **Element Mod:** Checks `target.elements` vs `action.element` for multipliers (1.25x for Weakness/STAB, 0.75x for Resist).
    *   **Variance/Crit:** Applies RNG.
>>>>>>> REPLACE
```

```diff
<<<<<<< SEARCH
### Phase 3: The World (Done)
1.  Refactor `Game_Map` to use `MapGenerator` strategies (Done: `BSPGenerator` linked).
2.  Implement `EventInterpreter` for complex interactions (Done).
    - Expand `Game_Interpreter` to support conditional logic (`IF/ELSE`, `CHECK_VAR`) (Done).
    - Implement `Game_Variables` and `Game_Switches` (Done).

### Phase 4: Polish (Next Priority)
1.  Reactive UI components.
2.  Audio system integration.
=======
### Phase 3: The World (Done)
1.  Refactor `Game_Map` to use `MapGenerator` strategies (Done: `BSPGenerator` linked).
2.  Implement `EventInterpreter` for complex interactions (Done).
    - Expand `Game_Interpreter` to support conditional logic (`IF/ELSE`, `CHECK_VAR`) (Done).
    - Implement `Game_Variables` and `Game_Switches` (Done).

### Phase 4: Polish (Next Priority)
1.  **Reactive UI:** Implement a binding system to remove manual `refresh()` calls in Windows.
2.  **Audio System:** Complete integration of `AudioManager`.
3.  **Battle Decoupling:** Complete the separation of `BattleManager` from `BattleRenderSystem` (remove direct `playAnim` calls).
>>>>>>> REPLACE
```

---

## 2. Updates for `documentation/gameDesign.md`

**Section 1.1 The Summoner**:
*   *Flag*: The "MP Drain" (`mpd`) mechanics are not implemented in `Game_Battler`.

**Section 1.2 Battlers**:
*   *Flag*: `mxa` and `mxp` are not implemented.
*   *Flag*: Turn order is determined by `agi` (Speed), not `asp` (Action Speed).

### Diffs

```diff
<<<<<<< SEARCH
> **Implementation Gap:** Current codebase uses standard RPG stats (`agi`, `luk`) and lacks `mpd`/`mxa`/`mxp`. `Game_BattlerBase` needs refactoring to support these design-specific parameters.
=======
> **Implementation Gap:** Current codebase uses standard RPG stats (`agi`, `luk`). `mpd`, `mxa`, and `mxp` are **NOT** implemented. `Game_BattlerBase` only supports the standard 8 parameters. Refactoring is required to add these fields to the schema.
>>>>>>> REPLACE
```

```diff
<<<<<<< SEARCH
> **Implementation Gap:** Current `BattleManager` sorts by Unit Speed (`agi`). It needs to be refactored to sort by the selected Action's `asp` (with unit speed as a tiebreaker or secondary modifier).
=======
> **Implementation Gap:** Current `BattleManager` sorts turn order primarily by Unit Speed (`agi`). The `asp` (Action Speed) parameter is not yet used in sorting logic.
>>>>>>> REPLACE
```

---

## 3. Deprecations & Removals

*   **Legacy ID Lookup**: `BattleManager` contains a deprecated fallback for case-insensitive skill/item ID lookups.
    *   *Recommendation*: Ensure all data files (`creatures.js`, `skills.js`) use exact case IDs matching the registry keys.
*   **Legacy UI Calls**: Direct calls like `window.Game.Windows.BattleLog.showBanner` in `BattleManager` should be marked for replacement with EventBus events (`battle:victory`).

## 4. Codebase Notes

*   `src/game/windows.js`: Contains `Window_Base` and `Window_Selectable`.
*   `src/game/classes/Game_Action.js`: Implements hardcoded element relationships (G>B>R>G, W<>K) inside `calcElementRate`. This logic should eventually move to `TraitRegistry` or `Config` for true data-driven design.
