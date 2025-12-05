# Radical Rewrite Proposal: "Project MZ"

## 1. Architectural Assessment

### Current Architecture: "Hybrid Compositional"
The current engine uses a hybrid approach:
- **UI**: DOM-based, managed by `Window_Base` and subclasses. Heavily relies on global singletons (`Game.Windows`).
- **Rendering**: Three.js for 3D (managed by `RenderManager` and `Systems`), DOM for UI.
- **Logic**: Split between `Game_` objects (OOP) and `Systems` (Functional/ECS-lite). `ExploreSystem` handles map logic, `BattleManager` handles battle flow.
- **State**: Global state objects (`$gameParty`) mixed with System-internal state.

### Integrity & Flaws

**Structural Flaws (Major):**
1.  **Singleton UI Windows:** Windows are instantiated once at startup (`Game.init`). This leads to "stale state" issues where windows must be manually reset/refreshed every time they are opened. In a robust system (like MZ), windows are created by the Scene and destroyed with it, ensuring a fresh state.
2.  **Logic/View Coupling in Systems:** `ExploreSystem` handles both the logical movement of the player (grid data) and the visual updates (Three.js camera/mesh). This violates separation of concerns. Logic should be in `Game_Player`/`Game_Map`, and visuals in `Spriteset_Map`.
3.  **Fragmented Input Handling:** Input is handled in `Scene` classes but often delegates to Systems which then check global `InputManager`. This circular dependency makes it hard to trace who "owns" the input.
4.  **Three.js "Bolted On":** The 3D renderer is a global service rather than a scene-specific view layer.

**Minor Flaws:**
1.  **Inconsistent File Structure:** Some managers are in `managers.js`, others in `managers/`.
2.  **CSS Dependency:** The game relies heavily on Tailwind classes injected via JS. While flexible, it makes the "View" logic dependent on external CSS definitions, harder to port or skin programmatically.

### Comparison to `gameDesign.md`
The design document calls for a highly flexible "Effects & Traits" system. The current codebase supports this via `Game_Action`, `EffectRegistry`, and `TraitRegistry`. However, the *application* of these effects is often buried in `BattleManager` or `Systems` rather than being a pure interaction between `Game_Battler` objects.
The rewrite must **preserve** the data-driven flexibility (Effects/Traits) while replacing the structural scaffolding.

---

## 2. Proposal: "Project MZ" Architecture

The goal is to align with the proven **RPG Maker MZ** architecture. This utilizes a standard **Model-View-Controller (MVC)** pattern adapted for games:
- **Model**: `Game_` objects (Data & Logic).
- **View**: `Scene_`, `Window_`, `Spriteset_` (Rendering & UI).
- **Controller**: `Manager` classes (State flow).

### Key Pillars

1.  **Scene-Based Lifecycle**: The `SceneManager` is the heart. It runs the active Scene. The Scene creates its own Windows and Spritesets. When the scene changes, everything is destroyed and rebuilt.
2.  **Strict Logic/View Separation**: `Game_Actor` knows *nothing* about sprites or windows. It only holds stats and executes logic. `Sprite_Actor` observes `Game_Actor` to update the visual.
3.  **Three.js as a Spriteset**: Instead of a global `BattleRenderSystem`, we implement `Spriteset_Battle` which owns the Three.js Scene. This encapsulates 3D logic strictly within the View layer.

### Directory Structure

```
src/
  game/
    main.js             # Entry point
    managers/           # Static global managers
      DataManager.js    # Save/Load, Database
      SceneManager.js   # Scene stack & loop
      ImageManager.js   # Asset loading
      SoundManager.js
    objects/            # The "Model" (Logic)
      Game_Temp.js
      Game_System.js
      Game_Screen.js
      Game_Map.js
      Game_Character.js
      Game_Player.js
      Game_Battler.js
      Game_Party.js
    scenes/             # The "Controller/View" container
      Scene_Base.js
      Scene_Boot.js
      Scene_Title.js
      Scene_Map.js
      Scene_Battle.js
    sprites/            # The "View" (Visuals/Three.js)
      Spriteset_Base.js
      Spriteset_Map.js
      Spriteset_Battle.js
      Sprite_Character.js
      Sprite_Battler.js
    windows/            # The "View" (UI)
      Window_Base.js
      Window_Selectable.js
      Window_Command.js
      Window_Menu.js
```

### Core Classes Breakdown

#### 1. Managers
- **`SceneManager`**: Runs the requestAnimationFrame loop. Handles `goto(Scene_Class)` and `push(Scene_Class)`.
- **`DataManager`**: Loads JSON data into global `$data...` arrays. Creates global `$game...` objects.

#### 2. Objects (The Model)
- **`Game_Map`**: Holds grid data, events, and logic. *No Three.js code.*
- **`Game_Party`**: Holds `Game_Actor` instances.
- **`Game_Player`**: Handles movement logic (x, y, direction).

#### 3. Sprites (The Visuals)
- **`Spriteset_Map`**: Created by `Scene_Map`. Initializes the Three.js scene, camera, and creates `Sprite_Character` instances for every event/player.
- **`Sprite_Character`**: specific Three.js Mesh wrapper that updates its position based on the `Game_Character` it tracks.

#### 4. Scenes (The Glue)
- **`Scene_Map`**:
    - `create()`: Creates `Spriteset_Map`, `Window_MapHUD`.
    - `update()`: Calls `super.update()`, updates children.
- **`Scene_Battle`**:
    - `create()`: Creates `Spriteset_Battle`, `Window_BattleLog`, `Window_Command`.

### Migration Strategy

1.  **Phase 1: Foundation**: Create `SceneManager` and the basic `Scene_Base`.
2.  **Phase 2: The Model**: Port `Game_Battler`, `Game_Actor`, `Game_Party` to the new structure, stripping out any rendering dependencies.
3.  **Phase 3: The View**: Create `Spriteset` classes to wrap the existing Three.js code. Move UI code into proper `Window_` classes that are instantiated by Scenes.
4.  **Phase 4: Integration**: Wire up `Scene_Explore` (using `Spriteset_Map`) and `Scene_Battle`.

### Benefits
- **Leaner**: Removing singletons reduces memory leaks and state bugs.
- **Effective**: Clear separation of concerns makes adding features (like a new vehicle or battle system) safer.
- **Familiar**: Developers familiar with RPG Maker (or general game dev patterns) will immediately understand the architecture.
