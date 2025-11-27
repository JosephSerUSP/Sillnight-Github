# Stillnight

A dungeon crawler game built with JavaScript and Three.js.

## Overview

Stillnight is a web-based role-playing game featuring dungeon exploration, turn-based combat, and party management. It uses a custom game engine inspired by RPG Maker's architecture but modernized for ES modules and 3D rendering.

## Setup

1.  **Install dependencies:**
    This project primarily uses vanilla JavaScript, but Playwright is included for testing.
    ```bash
    npm install
    ```

2.  **Run the game:**
    Since this is a static web application, you need to serve the files using a local web server to avoid CORS issues with module loading.
    ```bash
    python3 -m http.server 8000
    ```
    Then open `http://localhost:8000` in your browser.

## Project Structure

*   `src/game/`: Core game logic and engine code.
    *   `classes/`: Game objects (Actor, Enemy, Map, Party).
    *   `managers/`: Logic managers (BattleManager, etc.).
    *   `window/`: UI window components.
    *   `systems.js`: Subsystems for Explore, Battle3D, and Events.
    *   `main.js`: Entry point.
*   `src/assets/`: Game assets (images, data).
    *   `data/`: JSON-like data modules for items, skills, etc.

## Architecture

The game follows a component-based architecture:
*   **Game**: The central global object that bootstraps the application.
*   **Scenes**: Handle the high-level flow (Explore vs. Battle).
*   **Systems**: Manage specific domains like 3D rendering (`Battle3D`) or dungeon logic (`Explore`).
*   **Managers**: Handle complex logic flows (e.g., `BattleManager`).
*   **Windows**: Manage the UI elements.

## Documentation

The codebase is fully documented with JSDoc.
See `documentation/engineArchitectureDesignDocument.md` for a deeper dive into the architectural decisions.
