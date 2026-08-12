# Godot substrate spike report

Status: experimental evidence for #312. This is not a Sillnight migration and is not approved as a replacement runtime.

## What was built

- Godot `4.7.1-stable` (`a13da4feb`, 14 July 2026 Windows build), pinned in `project.godot` and the setup scripts.
- A small authored 3D room under `scenes/room.tscn`: floor, four walls, four columns, camera, lights, and marker meshes for the fixture party/enemies.
- A deliberately low-resolution 3D presentation using `Viewport.scaling_3d_scale = 0.5`, with crisp Control-based UI rendered through a separate `CanvasLayer`.
- A custom spatial shader in `shaders/room_fog.gdshader` with camera-distance fog, height-based visibility, vertex displacement, and shader parameters exposed through text `.tres` materials.
- A complete, presentation-independent implementation of the immutable shared fixture at `../shared/battle_fixture.json`.
- A structured forecast UI built with `Control`, `Container`, `PanelContainer`, `Theme`, focusable `Button`, and scrolling primitives.
- Visual evidence in `evidence/`: `room.png`, `initial.png`, `formation.png`, `summoner.png`, and `resolved.png`.

The project deliberately uses primitive authored geometry rather than current Sillnight assets. The spike tests scene/resource ergonomics, depth, material ownership, and presentation relationships—not final art.

## Setup, run, and verify

From `experiments/substrate/godot/`:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\setup_godot.ps1
powershell -ExecutionPolicy Bypass -File .\tools\verify.ps1
```

The setup script downloads the official Godot `4.7.1-stable` Windows editor binary into the ignored repository-local `.tools/godot/4.7.1/` cache. Pass `-Godot <path>` to `verify.ps1` when Godot is already installed elsewhere.

The verification command performs:

1. headless project import/load through the editor binary;
2. typed GDScript/resource loading with the real Godot runtime;
3. exact initial, post-formation, and post-Summoner forecast assertions;
4. exact Small Potion result assertion;
5. exact locked-round semantic transcript assertion;
6. exact final-state assertion;
7. representative scene smoke checks for the room and UI nodes.

The local capture command is:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\capture.ps1
```

It uses `--headless --display-driver windows --rendering-method gl_compatibility --rendering-driver opengl3` so Godot can produce a real GPU-backed viewport image while remaining non-interactive. Plain `--headless` selects Godot's dummy renderer here and cannot provide a viewport image; that is documented evidence, not hidden by the script.

## Technical choices grounded in current Godot documentation

The experiment pins the latest stable 4.x release available when implementation began: Godot 4.7.1. Godot 4.7.2 was still an RC in the official release archive on 2026-08-11.

- Godot's resolution-scaling model supports lower-resolution 3D while 2D/UI remains at the normal presentation resolution. The spike sets the viewport 3D scale to `0.5` and keeps UI in a `CanvasLayer`.
- Godot spatial shaders expose `vertex()` and `fragment()` processors, so the representative effect is expressed directly rather than by patching built-in shader source.
- Godot's command-line interface supports `--headless`, `--path`, `--editor`, `--quit`, user arguments after `--`, and command-line export. The fixture and scene smoke path work without opening the editor.

Sources checked:

- [Godot 4.7.1 stable archive](https://godotengine.org/download/archive/4.7-stable/)
- [Godot command-line tutorial](https://docs.godotengine.org/en/latest/tutorials/editor/command_line_tutorial.html)
- [Godot resolution scaling](https://docs.godotengine.org/en/stable/tutorials/3d/resolution_scaling.html)
- [Godot multiple resolutions](https://docs.godotengine.org/en/latest/tutorials/rendering/multiple_resolutions.html)
- [Godot spatial shaders](https://docs.godotengine.org/en/latest/tutorials/shaders/shader_reference/spatial_shader.html)

## Domain / presentation boundary

```text
immutable shared fixture JSON
            |
            v
      FixtureBattle
            |
     forecast / transcript / final state
            |
            v
 Godot presentation: UI + room + shader + capture
```

`FixtureBattle` is a `RefCounted` domain object. Formation swaps, potion use, forecast target selection, locked forecast resolution, transcript creation, and final-state assertions occur there. The scene tree does not decide whether damage, healing, or state changes happened. Animation, tween completion, and rendering are not involved in semantic resolution.

The authoritative data remains the shared JSON. The intentionally boring fixture-facing behavior values are at `experiments/substrate/shared/battle_fixture.json`; changing Nurse's front/back behavior is a direct edit there, while the Godot implementation remains the interpreter and test boundary.

## Godot owns / Sillnight owns

Godot meaningfully owns in this spike:

- 3D node lifecycle, transforms, camera, depth, meshes, lights, and scene instancing;
- spatial shader compilation and material parameter resources;
- viewport scaling and the low-resolution 3D / crisp UI relationship;
- Control layout, containers, focusable buttons, scrolling, theme colors, and text rendering;
- project import/load, runtime lifecycle, and headless scene startup.

Sillnight still owns:

- fixture data and its synthetic semantics;
- behavior selection by formation row;
- target selectors and forecast ordering;
- Summoner Small Potion intervention;
- locked-round resolution, transcript, and final-state assertions;
- project-specific fog/displacement intent and authored material parameter choices;
- the small battle information grammar.

## Evaluation against the seven principles

### 1. Project fit

Strong for this representative slice. Godot expresses real 3D scene structure, a low-resolution world with independently crisp UI, and the unusual material experiment in direct project resources. It does not decide whether the final game should use a full engine.

### 2. Agentic operability

Promising with explicit discipline. A fresh checkout can locate the shared fixture, the typed domain class, the main scene, and the one verification command. The main risk is that an undisciplined Godot project could move battle truth into Inspector values or SceneTree callbacks. This spike avoids that failure mode deliberately.

### 3. Git ergonomics

Good. Scenes and materials are text, small, and compositional. The custom shader is a normal text resource. The fixture remains a separate immutable JSON contract. Generated `.godot/` state and local engine downloads are ignored. The PNG evidence is intentionally committed because visual inspection is part of this experiment.

### 4. Headless verification

Strong for semantic and structural correctness. The Godot editor/runtime loads the project, parses scripts, runs exact fixture assertions, instantiates the representative scene, and verifies key nodes. Plain dummy-renderer headless mode cannot capture visual pixels in this environment; the documented capture path uses a Windows display driver with OpenGL compatibility while remaining non-interactive. Export was not claimed: no export templates are bundled by setup, and installing them would add setup weight not needed to answer this spike's core question.

### 5. Visual deliberateness

Good evidence for a small grammar, not final art. The UI has named information roles: locked forecast, formation/behavior input, Summoner interventions, and domain/presentation boundary. Repeated actor and forecast rows use Containers and a shared Theme. The world is intentionally dark, low-resolution, and fog-shaped; the room remains primitive enough to keep the rendering/resource relationship legible.

### 6. Infrastructure avoided

Godot removes the need for this spike to own a renderer bootstrap, scene lifecycle, mesh/camera plumbing, input/window primitives, UI layout primitives, resource serialization, and editor-level scene authoring. The spike still owns a small domain interpreter and a project-specific shader, which are the unusual parts under test.

### 7. Constraint quality

Mostly productive. Text scenes/resources and normal Control composition constrain the experiment toward reviewable authored state. The SceneTree remains tempting as an accidental domain model, so the explicit `FixtureBattle` boundary is a necessary project convention. Godot's breadth is useful here but could become over-architecture for a larger port if not kept bounded.

## Footprint and friction

- Bespoke Godot source/resources: approximately 40 KB of typed GDScript, text scenes/resources, shader, and setup/verification scripts; 5 committed PNG evidence files are separate visual artifacts.
- Scene structure: two small text scenes with a separate room scene, one main scene, two material resources, and one shader. No giant embedded-resource scene was needed.
- Shader effort: one spatial shader, roughly 35 lines of effect logic, with two material resources exposing the parameters. Vertex displacement and fragment fog/color blending are straightforward; the main friction is deciding where project-specific visibility semantics stop and engine fog begins.
- UI effort: roughly 300 lines of typed GDScript to establish panels, repeated forecast cards, actor chips, theme overrides, focusable intervention buttons, and evidence labels. Godot's layout primitives are useful, but a deliberate Sillnight grammar still needs project-owned naming/style conventions.
- Editor dependence: not required for fixture or scene verification. The editor remains useful for visually inspecting normal authored scene/resource ergonomics, but no Inspector-only state is required for the spike.
- Setup friction: downloading Godot is the largest cost. In this managed Windows session, Godot's default AppData locations were not writable; self-contained mode plus process-local AppData paths allowed the engine to run. A normal clean checkout with writable user directories should not need that workaround.
- Git diff quality: gameplay meaning is visible in JSON/GDScript; scene diffs are understandable because the files are small. PNGs increase PR size but provide direct visual evidence.

## Shortcuts and unresolved questions

- The room uses primitive Godot meshes and marker figures, not production Sillnight art.
- The domain is synthetic fixture v1, not current Sillnight battle logic and not a final behavior model.
- The UI is intentionally a structured spike, not the final interface grammar.
- There is no audio, save system, dungeon generator, procedural map, asset import study, or export-template study in this spike.
- The fog material is representative rather than pixel-equivalent to the incumbent Three.js `onBeforeCompile()` path.
- The fresh-agent/Jules modification test is explicitly not performed here, per #312. It remains a follow-up gate for #310.
- No migration recommendation is made. The evidence supports reviewing Godot as a serious candidate; it does not declare Godot the winner.

## Evidence files

- [`evidence/room.png`](evidence/room.png) — room geometry, depth, low-resolution stepping, and shader fog/displacement.
- [`evidence/initial.png`](evidence/initial.png) — initial forecast.
- [`evidence/formation.png`](evidence/formation.png) — Nurse/Pixie swap and changed forecast/targeting.
- [`evidence/summoner.png`](evidence/summoner.png) — Small Potion and changed Nurse/Triage target.
- [`evidence/resolved.png`](evidence/resolved.png) — final locked forecast and semantic transcript status.

## Relationship to the investigation

This branch is the dedicated implementation requested by #312. It references #312, #310, #307, and uses #311's shared fixture. It remains isolated from `main`, does not rewrite production BattleManager code, does not alter the shared fixture, and does not close the parent investigations.
