# Stillnight_ThreeJS Plugin Specification

## 1. Overview
**Plugin Name:** Stillnight_ThreeJS
**Objective:** Replace the existing 2D Pixi.js rendering engine for Map and Battle scenes with a 3D rendering pipeline using Three.js.
**Goal:** Emulate the "Stillnight" aesthetic with extruded 3D maps and 2.5D billboard battles, providing a modern 3D foundation while retaining the retro pixel-art charm.

## 2. Architecture & Tech Stack
*   **Engine:** Three.js (r128+)
*   **VFX:** Effekseer (wasm) for particle effects.
*   **Integration:** The plugin will export two main systems: `ExploreSystem` (Maps) and `BattleRenderSystem` (Battles), which attach to the global `Game` object.

## 3. Features

### 3.1 Battle System (`BattleRenderSystem`)
The battle scene renders a 3D environment where 2D sprites (billboards) fight.

*   **Environment:**
    *   **Floor:** A textured plane utilizing the `Battleback1` asset. This serves as the ground on which battlers stand.
    *   **Battle Environment:** A backdrop or skybox utilizing the `Battleback2` asset to provide depth and context to the scene.
    *   **Lighting:** Standard 3-point lighting setup (Ambient + Directional) to illuminate sprites evenly while casting shadows.
*   **Units:**
    *   **Rendering:** Units are rendered as `THREE.Sprite` (Billboards) that always face the camera.
    *   **Shadows:** Simple semi-transparent circle meshes placed under units to ground them.
    *   **Positioning:** Units are placed based on a grid layout (Allies on right/front, Enemies on left/back, or vice-versa depending on camera angle).
*   **Camera:**
    *   **Perspective:** `THREE.PerspectiveCamera` with a fixed angle (~28-35 degrees).
    *   **Intro Sequence:** A "Spiral Rise" animation where the camera rotates and rises to its standard position at the start of battle.
    *   **Action Focus:** The camera dynamically pans and zooms to focus on the active unit or target during action execution.
*   **Visual Effects:**
    *   **Effekseer:** Full integration for playing complex 3D particle effects (`.efkefc`).
    *   **Feedback:** Screen Shake, Flash, and Dimming effects (Dimming background to highlight actors).
    *   **Damage Numbers:** Floating text elements (projected from 3D to 2D screen space).

### 3.2 Explore System (`ExploreSystem`)
The exploration scene renders the tilemap as a 3D world, converting 2D grid data into 3D geometry.

*   **Map Rendering:**
    *   **Extrusion:** 2D Tilemap data is extruded into 3D. Floors are flat planes, Walls are extruded cubes.
    *   **Optimization:** Utilization of `THREE.InstancedMesh` to render hundreds of identical tile blocks with a single draw call.
    *   **Textures:** Texture mapping derived from the tile ID (e.g., Tile ID 3 maps to `RuinedTile1.png`).
*   **Atmosphere:**
    *   **Fog of War:** A dynamic, texture-based fog system. A `DataTexture` is updated in real-time to track visited/visible tiles, creating a smooth "reveal" effect around the player.
    *   **Lighting:** The player character carries a `PointLight` that illuminates the immediate vicinity. A global `DirectionalLight` provides base visibility.
*   **Entities:**
    *   **Player:** Represented as a 3D Mesh (e.g., Sphere/Octahedron) or a Billboard Sprite.
    *   **Events:** Map events (NPCs, Chests, Enemies) are rendered as 3D primitives (Cubes, Cones) or Sprites, color-coded by type.
*   **Camera:**
    *   **Follow:** A smooth-damping camera that follows the player's movement.
    *   **Look-Ahead:** The camera slightly leads the player in the direction of movement.

## 4. API Specification

### 4.1 BattleRenderSystem
The `BattleRenderSystem` class manages the Three.js scene for combat.

```javascript
class BattleRenderSystem {
    /** Initializes the 3D scene, camera, and renderer. */
    init();

    /**
     * Sets up the battle scene with ally and enemy sprites.
     * @param {Array} allies - List of ally unit data.
     * @param {Array} enemies - List of enemy unit data.
     */
    setupScene(allies, enemies);

    /**
     * Sets the ground texture (Battleback1).
     * @param {string} path - Path to the image asset.
     */
    setGroundTexture(path);

    /**
     * Sets the environmental background (Battleback2).
     * @param {string} path - Path to the image asset.
     */
    setEnvironment(path);

    /**
     * Plays an animation sequence for a specific unit.
     * @param {string} uid - Unit Unique ID.
     * @param {Array} steps - List of animation steps (jump, effect, wait).
     * @param {Object} context - Callbacks and target info.
     */
    playAnim(uid, steps, context);

    /**
     * Controls camera focus.
     * @param {string} type - Focus type ('ally', 'enemy', 'unit', 'neutral').
     * @param {string} [targetUid] - Optional target UID.
     */
    setFocus(type, targetUid);
}
```

### 4.2 ExploreSystem
The `ExploreSystem` class manages the 3D map exploration.

```javascript
class ExploreSystem {
    /** Initializes the scene and attaches to the DOM. */
    init();

    /**
     * Rebuilds the 3D map geometry based on the global $gameMap data.
     * Handles instanced mesh generation and material assignment.
     */
    rebuildLevel();

    /**
     * Updates the player position and camera.
     * @param {number} dx - X delta.
     * @param {number} dy - Y delta.
     */
    move(dx, dy);

    /**
     * Updates the dynamic fog of war texture based on player position.
     */
    updateFogTarget();
}
```

## 5. Best Practices & Requirements

1.  **Global Scope:** The project assumes `THREE` is available globally. The plugin should check for `window.THREE`.
2.  **Asset Management:**
    *   Textures should be loaded asynchronously and cached.
    *   `Battleback1` refers to the floor texture.
    *   `Battleback2` refers to the background/skybox texture.
3.  **Performance:**
    *   Always use `InstancedMesh` for map tiles.
    *   Dispose of Geometries, Materials, and Textures when destroying scenes to prevent memory leaks.
    *   Limit the number of dynamic lights.
4.  **Responsiveness:** The renderer must listen to window resize events and update the Camera Aspect Ratio and Renderer Size accordingly.
5.  **Visual Consistency:**
    *   Use `THREE.NearestFilter` for all textures to maintain the pixel-art look.
    *   Avoid anti-aliasing if it blurs the pixel art excessively.
