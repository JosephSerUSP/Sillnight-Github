# Documentation Audit Report

## Summary
This audit compares the codebase (as of the current commit) against `documentation/ARCHITECTURE.md` and `documentation/gameDesign.md`. While the high-level architecture is largely consistent, significant drift exists in specific game mechanics and the transitional state of the "Hybrid" system.

## Inconsistencies & Updates

### 1. Battle Manager & Hybrid State
*   **Drift:** `BattleManager` was documented as "separating logic and view," but the code retains legacy direct references to UI components (`window.Game.Windows.BattleLog`) and manages animation timing via callbacks.
*   **Resolution:** `ARCHITECTURE.md` has been updated to explicitly describe this "Hybrid" state, noting that while `EventBus` is used for major events, the Manager still orchestrates `BattleRenderSystem` directly.

### 2. Battle Entry Sequence
*   **Drift:** The documentation lacked detail on the complex transition sequence involving `TransitionManager`, Scene Switching, and Camera setup.
*   **Resolution:** `ARCHITECTURE.md` now details the `TransitionManager` (WebGL overlay) and the specific 4-step entry flow (Transition Out -> Scene Switch -> Intro Setup -> Transition In).

### 3. Summoner Turn Mechanics
*   **Drift:** `gameDesign.md` specifies the Summoner acts at the "End of Round." The code (`BattleManager.js`) currently sorts the Summoner into the standard turn queue based on Agility.
*   **Resolution:** Marked as an **Implementation Gap** in `gameDesign.md`.

### 4. Missing Parameters (`mpd`, `mxa`, `asp`)
*   **Drift:** `gameDesign.md` lists `mpd` (MP Drain), `mxa` (Max Actions), and `asp` (Action Speed) as core stats. These are missing from `Game_BattlerBase` and `Game_Action`.
*   **Resolution:** Confirmed these are already flagged as Implementation Gaps in `gameDesign.md`.

## Deprecations Flagged

The following deprecated systems or methods were found in the codebase and should be prioritized for removal in future refactors:

1.  **`BattleManager.processNextTurn` - Case-Insensitive Lookup Fallback**
    *   *Location:* `src/game/managers/BattleManager.js`
    *   *Description:* A fallback block exists to handle skill/item lookups if the case doesn't match exactly (e.g., 'attack' vs 'Attack').
    *   *Action:* Explicitly marked with `@deprecated` in code. Recommend removing once all data assets are normalized to strict IDs.

2.  **`ExploreSystem` - Legacy Texture Generation**
    *   *Location:* `src/game/systems/ExploreSystem.js`
    *   *Description:* References to "REMOVED: Legacy texture generation" exist in comments, confirming cleanup has occurred, but some logic remains for fallback materials if `visuals` are missing.

## Recommendations for Next Refactor Phase
1.  **Implement `asp` (Action Speed):** Move turn sorting from `BattleManager` (Unit Speed) to a new priority system based on selected Action Speed.
2.  **Decouple Battle UI:** Replace the remaining `window.Game.Windows.*` calls in `BattleManager` with `EventBus` events.
3.  **Implement Summoner Phase:** Remove the Summoner from the standard queue and implement the specific "End of Round" phase.
