# Documentation Drift Report

**Date:** October 26, 2023
**Author:** Technical Writer / Senior Engine Developer
**Status:** Review Pending

## Executive Summary

This audit compared the project's documentation (`gameDesign.md`, `ARCHITECTURE.md`) and inline code documentation against the actual codebase implementation. While the `ARCHITECTURE.md` file remains largely accurate regarding the high-level "Hybrid" system, significant drift was found in `gameDesign.md` regarding specific mechanics that are either unimplemented or implemented differently. Inline documentation was generally accurate but missed key context about these divergences.

## Identified Discrepancies

### 1. Game_BattlerBase & Stats
*   **Documentation:** `gameDesign.md` lists `mpd` (MP Drain), `mxa` (Max Actions), and `mxp` (Max Passives) as Core Parameters.
*   **Code:** These parameters are completely missing from `Game_BattlerBase.js` (marked only by TODO comments in some places).
*   **Documentation:** `gameDesign.md` describes `ele` (Elements) as an "Array of aligned elements".
*   **Code:** `Game_BattlerBase.js` has no `elements` property, yet `Game_Action.js` attempts to access `target.elements` and `subject.elements`. This indicates a missing implementation gap that causes potential undefined behavior.

### 2. BattleManager & Turn Order
*   **Documentation:** `gameDesign.md` states the Summoner acts at the "End of Round".
*   **Code:** `BattleManager.nextRound` places the Summoner at the **start** of the queue (`[summoner, ...others]`).
*   **Documentation:** `gameDesign.md` states turn order is determined by Action Speed (`asp`).
*   **Code:** `BattleManager.nextRound` sorts strictly by Unit Speed (`speed`).

### 3. Game_Action & Elements
*   **Documentation:** `gameDesign.md` implies a flexible element system where alignment provides generic bonuses/resistances.
*   **Code:** `Game_Action.calcElementRate` implements a hardcoded, undocumented element cycle:
    *   Green > Blue > Red > Green
    *   White <> Black (Mutually effective)

## Proposed Updates

### 1. Update `documentation/gameDesign.md`
*   Add explicit "Implementation Gap" notes for the Elemental System to match the Summoner/Stats gaps.

### 2. Update Inline Documentation
*   **`Game_BattlerBase.js`:** explicitly mark the missing properties (`mpd`, `mxa`, `mxp`, `elements`) in the class JSDoc to warn developers of the gap.
*   **`BattleManager.js`:** Update `nextRound` docs to clarify the current Unit Speed sorting vs the intended Action Speed sorting. Update `setup` to clarify current Summoner placement.
*   **`Game_Action.js`:** Document the hardcoded element cycle in `calcElementRate` so the logic is visible without reading the code body.

## Deprecations Flagged

*   **`BattleManager.js`:** The case-insensitive lookup in `processNextTurn` is marked as `@deprecated` and slated for removal.
