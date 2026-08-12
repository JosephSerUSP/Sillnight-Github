# Sillnight

Sillnight is a browser-based 3D dungeon-crawler prototype built with JavaScript, Three.js, and RPG Maker-inspired game systems.

## Current implementation

- Registry-backed creatures, skills, items, traits, and effects.
- EventBus-driven battle observers and reactive variable/switch notifications.
- Action-speed turn ordering with unit-speed tie breaking.
- Centralized `AudioService` for UI and battle sound events.
- Procedural dungeon generation through the BSP generator.

## Development

The game is served as a browser application from `index.html`. The repository currently has targeted verification scripts under `verification/`; run the relevant script after changing game systems. Browser automation is available through the Playwright development dependency.

JavaScript + Three.js is the ratified production substrate for the current architecture cycle. The 2026 substrate experiments are preserved as evidence; current work should evolve the existing runtime rather than pursue an engine migration unless a concrete future limitation reopens that decision.

## Documentation

- [`documentation/GAME_THESIS_2026.md`](documentation/GAME_THESIS_2026.md) defines the current game/product North Star.
- [`documentation/SUBSTRATE_EVALUATION_2026.md`](documentation/SUBSTRATE_EVALUATION_2026.md) records the original Three.js/Godot/Defold paper evaluation and the evidence gate used for the experiments.
- [`documentation/SUBSTRATE_SPIKE_SYNTHESIS_2026.md`](documentation/SUBSTRATE_SPIKE_SYNTHESIS_2026.md) synthesizes the implemented experiments, ratifies the evolved Three.js production path, and records Godot/Defold as suspended learning evidence.
- [`REFACTOR_PLAN.md`](REFACTOR_PLAN.md) describes current architecture status and remaining gaps.
- [`documentation/ARCHITECTURE.md`](documentation/ARCHITECTURE.md) describes the implemented architecture.
- [`documentation/gameDesign.md`](documentation/gameDesign.md) preserves detailed mechanics intent and historical implementation gaps subordinate to the current thesis and newer ratified decisions.
- [`documentation/PROJECT_TECHNOLOGY_PRINCIPLES.md`](documentation/PROJECT_TECHNOLOGY_PRINCIPLES.md) defines the criteria used to judge major technology, engine, tooling, and infrastructure choices.

## Contribution expectations

Keep changes focused, update the relevant documentation when behavior changes, and include targeted verification details in pull requests. Competing architecture or presentation alternatives should be discussed in an Issue before implementation.
