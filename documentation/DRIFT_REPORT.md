# Drift Report
**Generated:** Audit 2024
**Scope:** Architectural and Design vs Implementation Drift

This document records identified discrepancies between the Design/Architecture documentation and the current codebase.

## 1. Missing Services
*   **AudioService:** Referenced in `ARCHITECTURE.md` and `Config.js` (implied volume settings), but the class file and registration in `ServiceLocator` (via `Game.init` in `main.js`) are missing. Audio implementation appears to be relying on legacy or ad-hoc methods not centralized in a service.

## 2. Battle System Divergence
### Turn Order
*   **Design:** Sort by Action Speed (`asp`) of the selected action.
*   **Code:** Sorts by Unit Speed (`speed`/`agi`). (`BattleManager.nextRound`)
*   **Status:** Legacy behavior. Tagged TODO in code.

### Summoner Placement
*   **Design:** Summoner acts at the *End of Round*.
*   **Code:** Summoner is placed at the *Start of Queue* (`queue[0]`).
*   **Status:** Legacy behavior.

## 3. Entity Parameters
*   **Design:** Core parameters include `mpd` (MP Drain), `mxa` (Max Actions), `mxp` (Max Passives), and `ele` (Element Alignment).
*   **Code:** `Game_BattlerBase` only implements standard parameters 0-7 (`mhp`..`luk`).
*   **Status:** Implementation Gap. TODOs exist in code for `mpd`, `mxa`, `mxp`.

## 4. Element System
*   **Design:** Flexible array-based alignment (e.g., `['Fire', 'Fire']`). Weakness takes 1.25x damage.
*   **Code:** Hardcoded cyclic relationship (Green > Blue > Red > Green, White <> Black).
*   **Status:** Implementation Gap / Hardcoded Prototype.

## 5. Damage Formula
*   **Design:** Formula string handles the full calculation logic.
*   **Code:** `Game_Action.evalDamageFormula` evaluates the string (base value) and *then* applies a hardcoded stat multiplier `(atk/def)` and element modifiers.
*   **Status:** Architectural Drift. The code imposes a specific formula structure that limits the freedom described in the design.

## 6. UI Contracts
*   **Window_Party:** Inherits `Window_Selectable` but fails to implement `setHelpText`, breaking the expected contract for help window updates.
