# Sillnight — 2026 Runtime / Engine Substrate Evaluation

**Status:** Paper evaluation under #307  
**Purpose:** Decide which implementation spike is worth building. This document does **not** authorize an engine migration.  
**Decision framework:** [`PROJECT_TECHNOLOGY_PRINCIPLES.md`](PROJECT_TECHNOLOGY_PRINCIPLES.md)  
**Game requirements:** [`GAME_THESIS_2026.md`](GAME_THESIS_2026.md)

## Executive decision

**Build the first representative substrate spike in Godot.**

Keep the current JavaScript/Three.js implementation as the control until a replacement proves itself. Keep Defold as a serious lightweight challenger, but do not pay for a Defold implementation spike unless the Godot result is poor or ambiguous.

This is **not** a decision to migrate Sillnight to Godot.

The paper evaluation says only that Godot currently offers the strongest combination of:

- fit for Sillnight's low-resolution 3D + high-resolution UI presentation;
- mature generic infrastructure we can stop owning;
- explicit UI/layout/theme primitives;
- Git-friendly text project state;
- command-line/headless operation;
- sufficient shader flexibility for the current fog/material experiments;
- project-specific editor extensibility without requiring a custom editor;
- reasonable agent readability when the project is structured deliberately.

Defold is unusually strong on Git ergonomics, compactness, and explicit constraints, but its 3D path still asks the project to own more rendering-pipeline work than the current product intent appears to justify.

Modernized Three.js remains technically viable and maximally familiar to the existing repository, but preserving it means continuing to own a large amount of generic engine infrastructure that Sillnight no longer has a product reason to own.

---

## What is being evaluated

The candidates are:

1. **Current/custom JavaScript + Three.js**, modernized only as needed, as the control.
2. **Godot 4.x**, using typed GDScript and text scene/resource formats unless a concrete requirement proves otherwise.
3. **Defold**, using Lua and its normal text-based project/resource workflow.

The goal is not to identify the most capable engine in general.

The question is:

> Which substrate lets Sillnight own its unusual game rules while outsourcing the largest amount of generic machinery, without weakening Git/agent workflows or the deliberate low-resolution presentation?

The current thesis makes browser delivery non-essential and explicitly rejects turning Sillnight into a general engine project. That materially changes the value of the current Three.js ancestry.

---

## Current Three.js control: what it actually means

The current repository is not merely “a Three.js game.” It currently owns or directly composes much of the surrounding engine layer:

- Three.js is loaded from a CDN at **r128** rather than managed as a normal project dependency;
- Tailwind is also loaded from a CDN;
- the page owns scene layers, global UI composition, fixed-size layout, and direct `onclick` integration with the game object;
- `RenderManager` owns a fixed **480×270** WebGL renderer which is pixel-scaled into the higher-resolution presentation;
- custom fog behavior modifies Three built-in materials using `onBeforeCompile()` and injected GLSL.

The fixed low-resolution renderer is intentional in spirit and should be preserved by any candidate. The surrounding delivery/runtime ownership is not automatically intentional.

A fair Three.js control would eventually mean something closer to:

- package-managed current Three.js;
- a small build/dev layer rather than CDN runtime dependencies;
- retained `WebGLRenderer` initially;
- explicit domain/presentation separation;
- a deliberate UI grammar rather than ad-hoc DOM composition;
- the existing custom rendering path only where Sillnight benefits from owning it.

### Do not conflate modern Three.js with immediate WebGPU migration

Current Three.js `WebGPURenderer` is the project's next-generation renderer, but its own documentation still describes it as experimental and recommends `WebGLRenderer` for pure WebGL2 applications.

More importantly, `WebGPURenderer` does not support built-in-material customization through `onBeforeCompile()`. Sillnight's current fog material relies directly on that mechanism. A WebGPU move would therefore require a TSL/node-material rewrite rather than being a dependency bump.

If Three.js survives ratification, the sensible first modernization is **current Three.js + WebGLRenderer**, not “rewrite the renderer around WebGPU because it is newer.”

---

## Evaluation matrix

Ratings are qualitative on purpose. A single hard failure can outweigh several strengths.

| Criterion | Three.js control | Godot | Defold |
|---|---|---|---|
| **Project fit** | **Good / mixed** | **Strong** | **Good** |
| **Agentic operability** | **Strong** | **Strong with project discipline** | **Strong** |
| **Git ergonomics** | **Strong** | **Strong with text-resource discipline** | **Strong** |
| **Headless verification** | **Strong** | **Strong** | **Good–strong** |
| **Visual deliberateness** | **Mixed** | **Strong** | **Good–strong** |
| **Infrastructure avoided** | **Weak** | **Very strong** | **Strong** |
| **Constraint quality** | **Mixed / weak** | **Good** | **Strong, with 3D caveat** |
| **Paper status** | **CONTROL** | **FIRST SPIKE** | **CHALLENGER** |

---

# Candidate analysis

## 1. JavaScript + Three.js — CONTROL

### Project fit — Good / mixed

Three.js can obviously express the current game because it already does.

Its strongest Sillnight-specific advantages are:

- exact control over the deliberately low-resolution renderer;
- existing custom fog/material work;
- direct DOM composition for dense RPG information;
- no migration cost for current content/code;
- very transparent game state for coding agents.

The problem is not capability. It is **ownership scope**.

Three.js is a rendering library, not the larger game-production substrate Sillnight now says it wants. Retaining it means either continuing to own or deliberately selecting additional solutions for scene infrastructure, UI grammar, asset workflows, audio, input, exports/distribution, project-specific editing, runtime lifecycle, and other generic concerns.

Because browser delivery is not part of the product thesis, that cost no longer receives a compensating product benefit.

### Agentic operability — Strong

This is the control's clearest advantage.

The current project is ordinary text JavaScript/HTML/CSS/data. Agents can inspect and patch it easily, and browser automation already exists in the repository.

A refactored Three.js version could remain exceptionally agent-friendly.

### Git ergonomics — Strong

The authored project is text-first and repository-native.

### Headless verification — Strong

Node tooling plus browser automation can provide excellent deterministic/domain tests and Playwright-level runtime checks.

The current repository's problem is not that verification is impossible; #303 exists because verification has grown ad hoc rather than becoming one maintained contract.

### Visual deliberateness — Mixed

Three.js and DOM give nearly unlimited control, but they impose very few useful constraints.

The current UI demonstrates the downside: fixed HTML/Tailwind composition can make things appear quickly, but there is not yet a strong project-wide grammar for window roles, spacing, hierarchy, focus, navigation, and forecast presentation.

Unlimited control is not the same as deliberate authorship.

### Infrastructure avoided — Weak

This is the largest strike against the control.

Keeping Three.js means continuing to assemble a game substrate around a renderer library. That is justified only if owning that substrate is itself important to Sillnight.

The 2026 game thesis currently says the opposite: own autonomous combat, formation, Summoner intervention, run structure, memory/town progression, and strange presentation semantics; outsource generic machinery when possible.

### Constraint quality — Mixed / weak

Three.js rarely blocks an unusual rendering choice, which is valuable.

But it also rarely stops the project from inventing another manager, lifecycle convention, UI pattern, asset path, or bespoke editor surface. Sillnight's historical architecture drift is evidence that freedom itself has a cost here.

### Control decision

**Status: KEEP AS CONTROL / INVESTIGATE AS LONG-TERM SUBSTRATE.**

Do not discard the current game. Do not invest in broad modernization merely to make old architecture prettier before the engine spike proves that the substrate will survive.

---

## 2. Godot — FIRST SPIKE

### Project fit — Strong

Godot directly covers several requirements that matter unusually much to Sillnight:

- full 3D scene/rendering infrastructure;
- custom spatial shaders with vertex and fragment stages;
- asset import and scene workflows;
- built-in UI controls, containers, focus/navigation, and cascading themes;
- explicit support for rendering 3D at a lower resolution than 2D UI;
- audio, input, windowing, exports, debugging, profiling, and other generic systems;
- editor extension points if a small Sillnight-specific authoring tool becomes worthwhile.

The low-resolution world / higher-resolution UI distinction is particularly important: Godot explicitly supports independent 3D resolution scaling while UI remains at normal 2D resolution. This maps closely to the thesis's “HD remaster” relationship without requiring Sillnight to own the entire composition mechanism.

Godot's shader language is GLSL-like and supports direct vertex/fragment customization, so the current fog material's texture-driven alpha/displacement behavior has a plausible direct target for a spike. It must still be proved visually; this is not a claim of automatic equivalence.

### Agentic operability — Strong with project discipline

Godot's native `.tscn` format is text, mostly human-readable, and explicitly intended to work with version control. Godot 4.x scene UIDs are stored in the authored files rather than requiring a central hidden metadata database.

The CLI supports:

- `--headless`;
- running project scripts;
- parse/check-only operation for scripts;
- resource import;
- command-line export.

This is sufficient to design a repository where an agent can clone, import, validate, run domain tests, smoke-test representative scenes, and build/export without opening the GUI.

The risk is architectural rather than tool availability: a careless Godot project can bury important semantics in giant scene trees, Inspector-local state, animation resources, and node callbacks that are harder for agents to reason about.

Therefore **agent-friendly project structure is part of the Godot spike**, not an optional cleanup later.

### Git ergonomics — Strong with text-resource discipline

Use:

- `.tscn` rather than binary `.scn` for authored scenes;
- text `.tres` where Godot resources are useful;
- boring JSON or similarly explicit data where that is better for game definitions;
- small scenes rather than giant embedded-resource documents;
- the repository as authority;
- generated `.godot/` cache state outside version control.

A representative PR diff produced by an agent is itself an acceptance test.

### Headless verification — Strong

Godot has strong CLI primitives for headless execution, import, script parsing, and export.

It does **not** mean the project automatically receives a perfect game-level testing architecture. The spike should prove a small project-owned test runner or other maintained testing approach for pure domain code and representative scene smoke tests.

That is still a much smaller problem than requiring GUI operation for ordinary verification.

### Visual deliberateness — Strong

Godot's UI system provides Controls, layout Containers, keyboard/controller focus/navigation, and a cascading Theme system.

Those primitives do not automatically produce good Stillnight UI, but they give us a credible way to encode a deliberate UI grammar once rather than reproduce spacing/style/focus behavior ad hoc across screens.

A critical spike question is whether we can intentionally constrain Godot's flexible UI system into **Stillnight's** grammar rather than ending up with “generic Godot UI.”

### Infrastructure avoided — Very strong

This is Godot's largest advantage over Three.js.

A successful migration would let Sillnight stop owning large parts of:

- renderer/platform setup;
- scene and resource infrastructure;
- 3D import;
- input/device abstraction;
- audio plumbing;
- UI widget/layout primitives;
- build/export;
- editor basics;
- debugger/profiler basics.

The game can concentrate custom code around its actual identity.

### Constraint quality — Good

Godot supplies enough structure to prevent some accidental infrastructure growth while still leaving custom shaders, custom controls, Resources, and editor plugins available.

The main danger is overusing the SceneTree as the domain model. Sillnight should not become a battle simulation whose truth exists only as a hierarchy of live Nodes.

The engine should **present and host** the game, while battle/run/domain state remains explicit enough to test independently.

### Godot spike constraints

The first spike should intentionally use:

- **typed GDScript** unless evidence demands another language;
- text scenes/resources only for project-authored state;
- pure data/domain structures outside presentation nodes;
- no custom editor plugin unless the spike reveals a concrete authoring need;
- a pinned Godot version;
- one documented verification command;
- no attempt to port the whole game.

### Godot decision

**Status: INVESTIGATE — FIRST IMPLEMENTATION SPIKE.**

Godot has earned evidence-gathering work. It has not earned a migration yet.

---

## 3. Defold — CHALLENGER

### Project fit — Good

Defold deserves serious consideration because its philosophy aligns unusually well with the project technology principles:

- simple explicit architecture;
- message-oriented entities;
- code-driven rendering;
- small runtime;
- fast iteration;
- text project resources;
- strong Git orientation.

Its GUI system is independent of the world view and provides resolution/aspect-ratio-aware layout, which fits Sillnight's separation between world image and interface.

Its custom shader/material/render-target pipeline is capable enough to express unusual low-resolution presentation.

The caveat is **3D infrastructure**.

Defold supports glTF/model workflows and 3D has continued to improve, but its own model documentation still notes that the default render script is tailored for 2D and must be customized to render 3D models. Sillnight would therefore begin by owning more of the render pipeline than it would under Godot.

That is not necessarily bad. It simply collides with the current desire to outsource generic infrastructure.

### Agentic operability — Strong

Defold explicitly describes its project resource files as plain-text formats structured for Git merges and external processing. The editor's authored assets are text-based and merge-friendly.

Game logic is Lua, which is highly readable and easy for agents to edit.

`bob.jar` provides an official command-line build/bundle path outside the editor.

This is a genuinely excellent agentic foundation.

### Git ergonomics — Strong

This may be Defold's strongest category.

There is one caveat: although Defold says its assets are text-based and easy to script, it also notes that the internal asset-file formats are not formally published and may change. Agents should therefore prefer ordinary source/data files and stable editor APIs instead of inventing manual serializers for Defold resource files.

### Headless verification — Good–strong

Bob provides a strong headless build surface. Lua domain logic can also be tested outside or inside the game with a project-selected test approach.

Testing infrastructure is less obviously batteries-included than Godot's broader CLI/editor stack or the JavaScript ecosystem, so the spike burden would include proving the exact maintained test contract.

### Visual deliberateness — Good–strong

Defold's relative simplicity and explicit GUI/render systems could be creatively productive constraints. It is difficult to accidentally grow a huge general engine inside it without noticing.

Its UI tooling is capable, but editor-script UI customization is currently much narrower than Godot's editor extension surface; interactive editor-script UI is presently centered on dialogs.

That is acceptable for the current thesis because Sillnight does not need a large bespoke editor.

### Infrastructure avoided — Strong

Defold would eliminate a large amount of platform/build/input/audio/resource infrastructure.

It eliminates less **3D rendering ownership** than Godot, because special 3D presentation is more explicitly built around a project-controlled render script/material pipeline.

### Constraint quality — Strong, with 3D caveat

Defold's constraints are appealing for Sillnight:

- small explicit entities;
- static resource declaration;
- message passing;
- text assets;
- a compact code-driven renderer.

If those constraints make Sillnight more compact and readable, they are excellent.

If we discover that every desired 3D/fog/UI feature requires rebuilding facilities Godot already supplies, the same constraints become obstruction rather than design material.

### Defold decision

**Status: INVESTIGATE — SERIOUS CHALLENGER, NO SPIKE YET.**

Do not dismiss Defold. Do not pay for a second implementation spike before the first one teaches us what actually hurts.

If Godot fails because it feels too broad, scene-graph-heavy, opaque to agents, or difficult to constrain visually, Defold is the next candidate to test.

---

# Why other candidates are not shortlisted yet

The shortlist should stay small unless another candidate offers a materially different advantage.

- **Babylon.js / another JavaScript 3D engine:** may reduce some rendering work, but retains much of the web/JavaScript substrate whose product value has disappeared. It is not different enough from the Three.js control to justify a first spike.
- **PlayCanvas:** provides a stronger browser-native editor/engine workflow, but browser/cloud-native authoring solves a requirement Sillnight does not currently have.
- **LÖVE:** excellent for deliberate compact games, but Sillnight's real 3D requirements would push us back toward owning substantial custom 3D/render infrastructure.
- **Unity / Unreal:** much larger production environments with weaker fit for the “small, Git-legible, agent-first, game-specific” direction. They should only enter the shortlist if a concrete requirement appears that Godot/Defold cannot satisfy.

This is not a claim that these engines are inferior. They simply do not currently earn an additional investigation branch.

---

# Recommendation: pay for one Godot spike

## Spike question

> **Can Godot make Sillnight substantially smaller and more deliberate while preserving the Git-first agentic workflow and the game's low-resolution strangeness?**

## Representative scope

Build only enough to test the likely invalidators:

1. **Project skeleton**
   - pinned Godot version;
   - repository-friendly `.gitignore`;
   - typed GDScript;
   - clear domain/application/presentation/data boundaries;
   - one documented setup/verification command.

2. **Low-resolution world / normal-resolution UI**
   - one representative 3D dungeon room or tiny floor;
   - deliberately low-resolution/pixelated 3D output;
   - separately controlled crisp UI;
   - resizing/scaling behavior documented.

3. **Representative material effect**
   - port enough of the current fog texture / alpha / vertex-displacement idea to test whether Godot's shader path feels direct rather than adversarial;
   - visual comparison, not a production fog rewrite.

4. **Battle-domain proof**
   - multiple autonomous creatures;
   - deterministic/seeded state;
   - readable action selection;
   - formation-sensitive behavior;
   - targeting;
   - one Summoner intervention;
   - semantic transcript independent of animation.

5. **Battle forecast UI**
   - display expected action order, behavior, and targets;
   - change formation and visibly update the forecast;
   - use this to test Controls/Containers/Themes rather than merely skinning a mockup.

6. **Authored data**
   - one creature / skill / behavior definition in a boring agent-readable representation;
   - demonstrate that an agent can modify it without touching opaque editor state.

7. **Headless verification**
   - parse/import check;
   - deterministic battle test;
   - representative scene smoke test;
   - build/export check where practical.

8. **Agent-operability test**
   - give a real agent a bounded change from a clean checkout;
   - require the agent to run verification and produce a PR;
   - inspect whether the diff is understandable without opening Godot.

Jules is a particularly useful test subject because scheduled tasks are strategically valuable to this project when they are narrowly scoped.

## Explicit non-goals

The spike must **not**:

- port the entire game;
- reproduce all current windows/content;
- design the final creature gambit system;
- build a Sillnight editor;
- rewrite every shader;
- establish a final save format;
- delete or freeze the current Three.js implementation;
- create a migration branch that gradually becomes the new game by inertia.

The spike is disposable evidence until #307 ratifies it.

---

# Decision gate after the Godot spike

After the spike, record a second pass through all seven technology principles using measured evidence.

### Approve Godot migration only if

- agentic/Git workflows remain at least comparably safe;
- domain tests do not depend on scene/editor state;
- the low-res 3D + crisp UI relationship is easy to control deliberately;
- the representative fog/material requirement is practical;
- battle forecast UI becomes easier to structure, not harder;
- the project demonstrably stops owning meaningful generic infrastructure;
- the resulting project is smaller conceptually even if the engine itself is larger;
- a clean-checkout agent can make and verify a real change.

### Keep Three.js if

- Godot's node/resource/editor model creates more accidental complexity than it removes;
- distinctive presentation repeatedly fights the engine;
- headless/agent workflows become meaningfully worse;
- the infrastructure savings prove mostly theoretical;
- the current custom substrate becomes clearly easier once domain/UI boundaries are cleaned up.

### Spike Defold next if

- Godot's broad engine/editor model is the main problem rather than the idea of using an engine itself;
- we still want to outsource platform/build/resource concerns;
- a smaller, more explicit engine appears likely to fit better;
- we are willing to own a more deliberate custom render pipeline in exchange for compactness.

---

## Paper decision record

```text
Decision:
Run the first representative engine/substrate spike in Godot.

Project need:
Outsource generic game-engine infrastructure without sacrificing Sillnight's
low-resolution presentation, unusual domain rules, Git-first workflow, or
agentic verification.

Three.js:
KEEP AS CONTROL / INVESTIGATE.
Technically viable and highly agent-friendly, but requires Sillnight to keep
owning a large amount of generic engine infrastructure.

Godot:
INVESTIGATE — FIRST SPIKE.
Best paper fit across project features, infrastructure avoided, UI grammar,
headless operation, Git-friendly authored state, and shader flexibility.

Defold:
INVESTIGATE — CHALLENGER.
Excellent Git/agent/constraint story and compactness; potentially too much
project-owned 3D rendering work relative to current product intent.

Evidence still required:
Representative Godot spike + real agent-authored PR + headless verification.

Migration status:
NOT APPROVED.
```

---

## Sources checked for this evaluation

Primary documentation consulted during the August 2026 evaluation:

### Godot

- TSCN text scene format / version-control properties: https://docs.godotengine.org/en/4.6/engine_details/file_formats/tscn.html
- Command-line and headless tools: https://docs.godotengine.org/en/latest/tutorials/editor/command_line_tutorial.html
- Multiple resolutions / lower-resolution 3D than UI: https://docs.godotengine.org/en/4.6/tutorials/rendering/multiple_resolutions.html
- UI Controls / Containers / focus / themes: https://docs.godotengine.org/en/4.6/tutorials/ui/
- Spatial shaders: https://docs.godotengine.org/en/4.6/tutorials/shaders/shader_reference/spatial_shader.html
- Editor extension surface: https://docs.godotengine.org/en/4.6/classes/class_editorplugin.html

### Defold

- Engine design / plain-text Git-oriented resources: https://defold.com/manuals/design/
- Asset editing / text resource files: https://defold.com/manuals/importing-assets/
- `bob.jar` command-line builder: https://defold.com/manuals/bob/
- 3D model/render requirements: https://defold.com/manuals/model/
- Custom render pipeline: https://defold.com/manuals/render/
- GUI system: https://defold.com/manuals/gui/
- Editor scripts: https://defold.com/manuals/editor-scripts/

### Three.js

- WebGPURenderer migration/status: https://threejs.org/manual/en/webgpurenderer
- Current WebGLRenderer API: https://threejs.org/docs/pages/WebGLRenderer.html
- Migration guide: https://github.com/mrdoob/three.js/wiki/Migration-Guide

The spike should re-check versions and relevant limitations at implementation time rather than treating this paper snapshot as permanent engine documentation.
