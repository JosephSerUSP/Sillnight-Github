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

## Documentation

- [`REFACTOR_PLAN.md`](REFACTOR_PLAN.md) describes current architecture status and remaining gaps.
- [`documentation/ARCHITECTURE.md`](documentation/ARCHITECTURE.md) describes the implemented architecture.
- [`documentation/gameDesign.md`](documentation/gameDesign.md) records design intent and implementation gaps.

## Contribution expectations

Keep changes focused, update the relevant documentation when behavior changes, and include targeted verification details in pull requests. Competing architecture or presentation alternatives should be discussed in an Issue before implementation.
