# Documentation Drift Report

**Date:** October 26, 2023
**Status:** Audit Findings
**Description:** This document records identified discrepancies between the prescriptive design documents (`gameDesign.md`, `ARCHITECTURE.md`) and the actual codebase logic.

## 1. Battle System & Turn Order

*   **Summoner Turn Order:**
    *   *Design:* `gameDesign.md` specifies the Summoner acts at the **End of Round** (Section 1.1).
    *   *Code:* `BattleManager.nextRound()` places the Summoner at the **Start** of the turn queue (`this.queue = (summoner...) ? [summoner, ...others] : ...`).
*   **Turn Sort Logic:**
    *   *Design:* `gameDesign.md` specifies turn order is primarily determined by **Action Speed (`asp`)** (Section 3.1).
    *   *Code:* `BattleManager.nextRound()` sorts by **Unit Speed (`speed`/`agi`)** (`nonSummonerUnits.sort((a, b) => b.speed - a.speed ...)`). A TODO exists in the code to refactor this.

## 2. Stats & Parameters

*   **Core Parameters:**
    *   *Design:* `gameDesign.md` lists `mpd` (MP Drain), `mxa` (Max Actions), `mxp` (Max Passives) as core stats.
    *   *Code:* `Game_BattlerBase.js` implements standard RPG stats `agi` (Agility) and `luk` (Luck) instead. The design-specific parameters are marked as TODOs.
*   **Parameter Implementation:**
    *   *Code:* `Game_BattlerBase.param(id)` handles IDs 0-7. IDs 8-10 (reserved for new stats) are not implemented.

## 3. Elemental System

*   **Mechanic:**
    *   *Design:* `gameDesign.md` describes a flexible system where Battlers have an array of aligned elements (e.g., `['Fire', 'Fire']`) and multipliers are derived from matching these against the incoming action's element.
    *   *Code:* `Game_Action.calcElementRate()` implements a hardcoded cyclic relationship: `G > B > R > G` and `W <> K`. It checks `target.elements` but uses this legacy logic for the multiplier.

## 4. Architecture & Coupling

*   **BattleRenderSystem Coupling:**
    *   *Design:* `ARCHITECTURE.md` aims for "Full Decoupling" where the View observes the Logic via `EventBus`.
    *   *Code:* `BattleManager.processNextTurn()` makes direct calls to `Systems.Battle3D.playAnim()`, passing callbacks (`onApply`, `onComplete`).
*   **Victory Event Data:**
    *   *Design:* `ARCHITECTURE.md` implies events carry the necessary data for the UI.
    *   *Code:* `BattleManager.end()` emits `battle:victory` with dummy data (`{ xp: 0, gold: 0, party: [] }`) before calculating the actual rewards. The rewards are calculated later for the direct `window.Game.Windows.Victory.show()` call.
*   **Legacy UI Calls:**
    *   *Code:* `BattleManager` still contains direct calls to `window.Game.Windows.BattleLog` and `window.Game.Windows.HUD`, which are marked as "Legacy/Hybrid" in the architecture but are active dependencies.

## 5. Deprecations

*   **Case-Insensitive ID Lookup:**
    *   *Code:* `BattleManager.processNextTurn()` contains a fallback block for case-insensitive skill/item ID lookups. This is marked as deprecated in comments but remains active code.
