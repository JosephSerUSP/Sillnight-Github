# Three.js disciplined control substrate spike

Issue #313 · parent investigations #310 and #307 · shared fixture #311

This is an isolated incumbent/control experiment. It does not alter the
production `index.html`, `RenderManager`, `FogMaterial`, or `BattleManager`.
The shared fixture at
[`../shared/battle_fixture.json`](../shared/battle_fixture.json) is imported
directly and is not copied or modified.

## Result in one sentence

Three.js can satisfy the full representative contract with a small, very
readable JavaScript/DOM slice, but the smallest credible control still makes
Sillnight own the application lifecycle, world/UI composition convention,
custom material adaptation, deliberate forecast grammar, input commands,
asset/data conventions, and browser/build/verification harness around the
renderer library.

This is evidence for **KEEP AS CONTROL / INVESTIGATE AS LONG-TERM SUBSTRATE**,
not a recommendation to migrate or to declare Three.js the winner.

## Exact setup

- Node.js: `>=20.19` (the local run used Node `v24.18.0`).
- Three.js: `0.185.1` / `THREE.REVISION === "185"`, package-managed in this
  nested experiment.
- Renderer: `THREE.WebGLRenderer`, deliberately not WebGPU.
- Build/dev: Vite `8.1.5`.
- Browser verification: Playwright `1.57.0` with Chromium.
- Headless WebGL smoke flags: ANGLE + SwiftShader (`--use-gl=angle`,
  `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`, and
  `--enable-webgl`) so the capture uses a stable software WebGL path in the
  verification environment.
- UI: plain HTML/CSS/DOM. No React, Vue, Svelte, Tailwind, or other UI
  framework.
- World logical resolution: `320 × 180`, rendered at pixel ratio 1 and
  stretched with `image-rendering: pixelated` into a responsive surface.
- UI resolution: normal browser DOM layout, independently controlled from the
  world canvas.
- World scene: one small room with floor, walls, pillars, altar, lights,
  camera depth, six party meshes, and two enemy meshes.

Three.js `0.185.1` was chosen because it was the current stable package
baseline checked for this spike. The experiment deliberately keeps
`WebGLRenderer` because the existing fog approach is built around built-in
material shader injection; WebGPU/TSL would be a separate renderer/material
migration, not a fair control modernization.

## Clean-checkout run

From the repository root:

```powershell
npm.cmd install --prefix experiments/substrate/three
npx.cmd --prefix experiments/substrate/three playwright install chromium
npm.cmd --prefix experiments/substrate/three run verify
```

The one verification command after setup is:

```powershell
npm.cmd --prefix experiments/substrate/three run verify
```

`verify` runs, in order:

1. pure Node fixture validation and deterministic assertions;
2. Vite production build;
3. headless Chromium smoke, including WebGL boot, DOM state transitions,
   custom-material evidence, final transcript/final-state assertions, and
   screenshot capture.

The screenshots are written to `experiments/substrate/three/evidence/`.

## Fixture implementation and authority boundary

The domain path is:

```text
shared battle_fixture.json
          |
          v
src/domain/battle-fixture.js
  forecast / swap / potion / resolve
          |
          v
src/app.js + room.js + DOM
```

`src/domain/battle-fixture.js` contains only plain-object operations. It
implements the complete fixture sequence:

- initial forecast;
- Nurse/Pixie swap;
- post-formation forecast;
- Small Potion on Nurse;
- post-Summoner forecast;
- locked round resolution;
- exact eight-event transcript;
- exact final state.

No DOM event, animation callback, render loop, timeout, or VFX completion
decides a semantic change. The buttons call synchronous domain commands; the
view redraws the returned state. The render loop only draws the current room
and updates a fog uniform.

The Node test asserts all three forecasts, the potion boundary, the exact
transcript, the exact final state, and non-mutation of earlier snapshots.

## Authored-data test

The authoritative creature/action definitions remain visible in the shared
JSON. A reader can find Nurse's front/back behavior at the `party` entry with
`id: "nurse"`, including `injection` and `triage`. Action selection is the
small `actionFor(unit)` function in
[`src/domain/battle-fixture.js`](src/domain/battle-fixture.js). Expected outputs
remain beside the fixture steps under `steps[].expected`; the assertions are
in [`test/fixture.test.js`](test/fixture.test.js).

This is intentionally more boring than importing the production registries or
AI. The shared fixture is synthetic and explicitly says not to import current
Sillnight formulas or behavior.

## Renderer/material effort

Three provides the scene graph, camera, geometry, built-in materials, WebGL
renderer, lights, and render loop hook. The control still owns:

- the 320×180 logical render target convention;
- pixel scaling and responsive surface CSS;
- room composition and slot-to-world placement;
- renderer creation, lifecycle, and first-paint behavior;
- custom fog parameter defaults and update plumbing;
- the material adaptation itself.

The fog implementation in [`src/presentation/room.js`](src/presentation/room.js)
uses `MeshStandardMaterial.onBeforeCompile()`. It injects a varying in the
vertex shader, four uniforms, a depth-based `smoothstep`, a small time pulse,
and fragment-color mixing. It also defines a custom program cache key and
stores the generated uniforms through `material.userData`.

That is a compact implementation, but it is coupled to Three's built-in
shader chunk names and material internals. A Three upgrade can invalidate the
replacement anchors or change shader expectations. The agent-readable part is
good; the maintenance boundary is not self-describing to the library.

The control also renders the first semantic snapshot synchronously and calls
the WebGL context's `finish()` before evidence capture. That small detail was
needed to make headless screenshots inspect the actual room instead of a
transparent canvas while the browser compositor was still flushing software
WebGL. It is part of the honest renderer/lifecycle cost of this control.

The renderer is intentionally kept at `WebGLRenderer`. Moving to WebGPU would
not be a version bump: the current `onBeforeCompile` path would need a TSL/node
material rewrite and a new verification surface.

## UI effort

DOM is the incumbent's clearest advantage. The experiment needed no widget
framework to create a deliberate, crisp grammar:

- world surface;
- formation rows with HP and changed-state emphasis;
- ordered forecast rows with actor/action/target/speed columns;
- explicit formation and Summoner controls;
- semantic-boundary status text;
- stage badges for initial, formation, potion, and resolved states.

The cost is that the grammar is project-owned CSS/HTML convention. Focus,
keyboard navigation, responsive edge cases, accessibility semantics, and
future screens remain application work. This spike uses native buttons and
semantic sections but does not pretend to solve the production UI system.

## Cost accounting

The experiment adds 11 tracked non-generated files (including the report,
ignore file, and lockfile), 2,281 non-generated lines, 5 screenshots, and
roughly 374 KB of screenshot evidence. The source/configuration portion
excluding the report, ignore file, and lockfile is 1,008 lines across 8 files.
`node_modules/`, `dist/`, and `debug.log` are ignored.

The line count is not a claim that every line is permanent production code.
It includes the deliberate test, browser smoke, HTML/CSS grammar, package
metadata, and renderer/domain boundary that the control must own to make the
comparison credible.

### Reusable production infrastructure introduced here

- a pure battle-domain boundary shape;
- a small command-to-snapshot presentation contract;
- a low-resolution WebGL surface convention;
- a minimal fixture/browser verification pattern;
- a documented custom-material maintenance boundary.

These are patterns worth carrying forward if Three stays, not a production
migration. The room meshes and fixture-specific UI are spike-only.

### Newly introduced generic infrastructure that must be counted

- nested package manifest and lockfile;
- package installation and Node-version convention;
- Vite dev/build layer;
- Playwright/Chromium smoke harness and screenshot output;
- renderer lifecycle and responsive canvas composition;
- custom material uniform/cache-key plumbing;
- explicit UI grammar and command-state wiring.

### Browser/platform supplies

- DOM, CSS layout, native buttons, accessibility primitives, and browser event
  dispatch;
- WebGL2 context, canvas presentation, browser scheduling, and input APIs;
- Chromium/Playwright as a headless runtime for smoke and screenshot evidence;
- Node/npm as the package execution environment.

### Three supplies

- scene graph and object transforms;
- `WebGLRenderer` and WebGL2 resource submission;
- perspective camera, geometry, materials, lights, color handling, and the
  shader compilation pipeline;
- renderer draw submission.

### Sillnight must still own or choose

- application bootstrap and lifecycle;
- domain state, forecast rules, transcript, save/serialization boundary, and
  fixture or gameplay data semantics;
- world/UI composition and logical-resolution convention;
- scene/room construction and slot-to-world mapping;
- renderer configuration and resize policy;
- browser `requestAnimationFrame` render-loop convention and first-paint flush
  behavior;
- shader injection/material conventions and upgrade maintenance;
- input/focus/navigation grammar beyond native browser controls;
- UI hierarchy, forecast presentation, and accessibility decisions;
- asset import/format/build conventions if real assets replace primitives;
- audio service architecture;
- scene transitions and presentation pacing;
- browser/platform/distribution setup;
- headless testing, browser smoke, screenshot capture, and CI contract.

The spike does not claim ownership of audio, full asset tooling, editor
tooling, or production save serialization because it did not need those to
answer the representative question. That is a scope boundary, not a hidden
claim that Three provides them.

## Evaluation against the seven principles

### 1. Project fit — Good / mixed

Three expresses the room, low-resolution world, DOM forecast, custom fog, and
synthetic autonomous-battle rules directly. The fit is strongest where
Sillnight wants exact presentation control. It is mixed because browser
delivery is not a product requirement and the renderer library does not cover
the rest of a game-production substrate.

### 2. Agentic operability — Strong

The relevant data, rule selection, DOM grammar, renderer setup, and tests are
ordinary text. The full fixture resolves in Node, and the browser smoke is one
command after setup. A bounded future agent can find Nurse's data, change
`actionFor` or a behavior, update one fixture expectation, and verify without
opening an editor.

### 3. Git ergonomics — Strong

The control is isolated under one path. The JSON fixture is reused rather than
forked. Package metadata, source, HTML, CSS, and tests are readable diffs.
Screenshots are explicit review artifacts. The cost is a nested lockfile and
generated browser evidence that should stay out of unrelated production diffs.

### 4. Headless verification — Strong

The domain proof is independent of the browser. The smoke proves the actual
WebGLRenderer boot, 320×180 canvas, custom material metadata, DOM-driven
formation/potion/resolution sequence, exact transcript length, and a final
state value. The remaining limitation is that screenshots are evidence, not a
pixel-diff regression policy.

### 5. Visual deliberateness — Good / mixed

DOM composition makes dense forecast information crisp and easy to structure;
the experiment demonstrates a coherent small grammar instead of inheriting the
production page composition. Three supplies freedom for the pixel room and
material. That freedom also requires project-owned conventions for scene
layout, responsive behavior, visual hierarchy, and future UI consistency.

### 6. Infrastructure avoided — Weak / mixed

Compared with building directly against WebGL, Three avoids raw buffer and
shader boilerplate, camera math, geometry assembly primitives, and material
resource submission. Compared with a mature engine, it does not avoid the
application substrate around those facilities: lifecycle, assets, audio,
input/focus, scene transitions, UI grammar, packaging, and verification remain
ours. This is the control's largest cost.

### 7. Constraint quality — Mixed

Plain JavaScript/DOM/data and a small nested package are productive
constraints. They keep the domain legible and the diff small. Three itself
does not constrain scene composition or UI architecture, so the same freedom
can recreate manager sprawl, one-off layout, and renderer coupling if the
project does not keep the boundary explicit.

## What the spike clarified

### Productive freedoms

- exact low-resolution world / crisp UI relationship;
- direct DOM information density;
- ordinary JavaScript data and tests;
- explicit presentation-independent battle semantics;
- custom shader behavior without an editor or renderer migration.

### Freedoms that invite accidental complexity

- no prescribed application lifecycle or scene convention;
- no prescribed UI grammar, focus model, or layout system;
- no prescribed asset/import/audio/distribution path;
- built-in material shader chunks available for convenient but upgrade-sensitive
  string injection;
- direct access to render and DOM state that can tempt domain/presentation
  coupling.

## Browser-specific advantages that genuinely matter

- DOM is exceptionally efficient for readable forecast-heavy RPG information.
- Node plus Playwright gives a natural headless semantic/browser verification
  path.
- Text-first JS/data is easy for agents and humans to inspect.
- Responsive deployment and a low-resolution canvas are easy to prototype.

These matter for authoring and verification even though shipping in a browser
is not itself a ratified product requirement.

## Browser-specific baggage that does not earn product value here

- CDN/runtime dependency drift (avoided in this nested control, but present in
  production r128 setup);
- choosing a web delivery/distribution stack when browser delivery is not
  required;
- owning browser-specific resize, device-pixel-ratio, focus, input, and
  lifecycle edges around the renderer;
- custom shader coupling to built-in material internals;
- maintaining a web build and browser automation surface alongside the game.

## Shortcuts and non-goals

- No production `BattleManager` migration.
- No production package migration.
- No WebGPU or TSL experiment.
- No React or UI framework.
- No dungeon generator or imported production assets.
- Primitive meshes stand in for authored creature/room assets.
- No audio, save format, editor tooling, controller navigation, or full
  accessibility pass.
- Screenshots are captured for inspection but not committed as a visual
  regression baseline beyond this evidence set.
- The browser smoke explicitly performs the fixed fixture sequence; it is not a
  general gameplay automation framework.

## Visual evidence

- [Initial forecast](evidence/initial-forecast.png)
- [Formation reforecast](evidence/post-formation-forecast.png)
- [Summoner reforecast](evidence/post-summoner-forecast.png)
- [Resolved transcript/final state](evidence/resolved-transcript.png)
- [Room and custom fog/material](evidence/room-fog-material.png)

The fresh-agent modification test is intentionally not performed here. The
separate comparative agent should receive the bounded task from #311 after
this control is reviewed.
