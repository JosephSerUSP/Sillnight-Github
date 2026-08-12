# Sillnight — Substrate Spike Synthesis (2026)

**Status:** decision synthesis for #310 and #307  
**Evidence:** Godot spike #315 / #312, Three.js control #316 / #313, Defold learning track #314  
**Decision state:** Three.js ratified as the production substrate for the current architecture cycle

## Executive conclusion

The substrate spikes produced useful evidence, but they did **not** justify replacing Sillnight's current JavaScript/Three.js runtime.

The ratified direction for the current architecture cycle is:

> **Keep JavaScript/Three.js as Sillnight's production substrate, harvest the portable architectural wins demonstrated by the spikes, and suspend engine-migration work unless a concrete future limitation makes reopening the decision worthwhile.**

This is a real decision, not merely a temporary ranking. Production work should proceed assuming Three.js unless a later project need supplies new evidence strong enough to reopen the substrate question.

Godot demonstrated real engine-level advantages in scene/resource lifecycle, 3D primitives, UI layout/focus primitives, shader authoring, and headless project loading. It remains useful experimental evidence and a possible future reference point, but it is **suspended as a migration path** rather than kept as an active competing implementation.

The Three.js control demonstrated that the most important architectural improvements under discussion — presentation-independent battle semantics, command-to-snapshot presentation, boring data, deterministic tests, one-command verification, and explicit renderer/UI boundaries — do **not** require an engine migration.

Defold is not promoted. The learning experiment was cut short after crashes and repeated firewall-permission prompts created a poor human-author experience. Because human author experience was an explicit acceptance dimension of #310/#314, this is valid negative evidence rather than an irrelevant environmental inconvenience.

## Methodology correction

The first substrate contract over-weighted structural capability and under-tested preservation of Sillnight's existing identity.

Both completed spikes deliberately substituted primitive geometry for current Sillnight assets:

- the Godot report states that the room uses primitive authored geometry and markers rather than production Sillnight art;
- the Three control likewise uses primitive meshes and does not import production assets.

That was useful for isolating architecture, but insufficient for a migration decision.

The missing question was:

> **Can the candidate substrate preserve Sillnight's current visual identity, interface density, existing assets, material behavior, dungeon presentation, and interaction feel while still producing a materially better architecture?**

Any future attempt to reopen engine migration must treat this as a first-class gate under **visual deliberateness** and **project fit**.

A candidate does not earn migration merely by producing a cleaner primitive demo.

## What Godot actually proved

PR #315 demonstrated that Godot can express the representative slice with a disciplined architecture:

```text
shared/boring authored data
          |
          v
 presentation-independent domain object
          |
   forecast / semantic transcript
          |
          v
 Godot scenes + UI + shader presentation
```

Useful engine advantages demonstrated by the spike include:

- 3D scene lifecycle, transforms, camera, depth, meshes, lights, and instancing supplied by the engine;
- low-resolution 3D rendering with separately crisp UI as an engine-supported relationship;
- spatial shader vertex/fragment logic without patching built-in shader strings;
- text scene/material resources that remain reviewable when kept small;
- Control/Container/Theme/focus primitives for structured UI;
- headless project import/load, script parsing, semantic assertions, and scene smoke checks;
- an editor that can author normal scene/resource state without requiring that gameplay truth live in the scene tree.

These are real advantages and should remain documented as reference material.

### Why Godot is suspended rather than selected

The spike did **not** demonstrate:

- importing and preserving the current Sillnight asset set;
- equivalent existing dungeon presentation;
- equivalent current interface composition and density;
- actual current fog/material fidelity;
- current VFX/effect integration;
- production audio behavior;
- save/load and progression integration;
- procedural dungeon integration;
- distribution/export implications;
- a fresh-agent/Jules modification on the resulting Godot project;
- the project owner's sustained human author experience inside a real Sillnight-shaped Godot project.

The report also confirms that deliberate UI grammar remains project-owned even with Godot primitives. The engine improves the primitives; it does not decide Sillnight's interface system for us.

Most importantly, the Three control demonstrated that the architectural corrections motivating the migration study are available without giving up the existing game. Paying migration debt is therefore not justified by the evidence gathered.

**Godot status: `SUSPENDED THOUGHT EXPERIMENT`.** Preserve #315 as evidence; do not spend additional migration effort unless a concrete limitation of the evolved Three.js production path reopens the case.

## What the Three.js control actually proved

PR #316 is more consequential to the incumbent than its primitive visuals suggest.

It demonstrated the full fixture using this boundary:

```text
shared/boring authored data
          |
          v
 plain JavaScript battle domain
          |
   forecast / semantic transcript
          |
          v
 Three.js + DOM presentation
```

No DOM event, animation callback, render loop, timeout, or VFX completion owns semantic battle resolution.

That is the central architectural correction Sillnight needs, and it can be implemented inside the production stack.

The control also demonstrated:

- package-managed current Three.js rather than CDN-pinned r128;
- a normal modern JS build surface;
- pure Node semantic assertions;
- Playwright/WebGL runtime smoke;
- deterministic fixture verification;
- screenshot/evidence capture;
- explicit low-resolution world / crisp DOM presentation;
- ordinary Git-readable data and rules;
- a small deliberate DOM forecast grammar;
- explicit accounting of renderer/material maintenance rather than hiding it.

### Portable wins to harvest into production

The following are **PORT BACK** work, not disposable experiment findings:

1. **Pure battle-domain authority**
   - Battle state and semantic resolution must stop depending on Battle3D animation callbacks or UI timing.
   - Presentation should receive semantic steps/snapshots and replay them.

2. **Command-to-snapshot / semantic-step boundary**
   - Application/presentation code issues explicit commands to the domain.
   - Domain returns state/forecast/semantic results.
   - Renderer, DOM, audio, and animation observe those results.

3. **Deterministic fixture-first verification**
   - Domain behavior should be testable without browser rendering wherever practical.
   - Seeded/deterministic behavior should become an architectural capability, not an afterthought.

4. **One documented verification entrypoint**
   - Combine fast semantic/data checks with targeted browser/runtime smoke.
   - Stop accumulating unrelated one-off verification scripts without a maintained entrypoint.

5. **Package-managed modern Three.js**
   - Production should no longer preserve Three r128/CDN loading merely because it is old.
   - Any upgrade should remain on `WebGLRenderer` first unless a separate WebGPU/TSL decision is justified.

6. **Explicit custom-material boundary**
   - `onBeforeCompile()`-style customizations should be isolated, documented, smoke-tested, and treated as upgrade-sensitive adapters.

7. **Explicit UI grammar and ownership**
   - DOM itself is not the current UI problem.
   - The missing piece is a coherent project-owned grammar for layout units, hierarchy, focus/navigation, update ownership, default/cancel semantics, forecast roles, and repeated window patterns.

8. **Small application lifecycle rather than manager sprawl**
   - Three.js does not prescribe this boundary, so Sillnight must.
   - The owned substrate should remain deliberately small and game-specific.

## Portable architecture versus engine infrastructure

A useful distinction after the spikes is:

### Portable architecture — improve current Sillnight now

- pure deterministic battle/domain layer;
- forecast/semantic-step API;
- explicit dependency boundaries;
- command-to-snapshot presentation;
- one-command verification;
- boring authored data;
- modern package management;
- browser smoke/capture;
- UI grammar and update contracts;
- renderer/material adapter boundaries;
- small lifecycle conventions.

None of these requires Godot.

### Godot-specific or engine-level advantages — preserved as reference evidence

- built-in editor scene/resource authoring;
- engine-owned scene lifecycle;
- engine-owned mesh/camera/light/resource plumbing;
- first-class UI Containers/Theme/focus system;
- direct spatial shader model rather than built-in-material string injection;
- engine-level import/resource pipeline;
- engine-level export/build ecosystem;
- fewer categories of generic runtime infrastructure for a game to own.

These are not dismissed. They simply do not currently outweigh migration debt and loss of continuity with an already-working Sillnight presentation.

## Future migration burden of proof

The substrate question is closed for ordinary production planning, but it is not metaphysically permanent.

If a concrete future limitation reopens it, a replacement substrate must demonstrate at minimum:

- actual current Sillnight textures/models/sprites/effects rather than primitive stand-ins;
- representative current dungeon scene fidelity;
- representative current battle presentation fidelity;
- interface that preserves or deliberately improves the existing visual language rather than substituting generic engine UI;
- current low-resolution world / higher-resolution UI relationship;
- representative fog/material fidelity;
- asset-import ergonomics for the real repository;
- no hidden loss of agent/Git/headless operability;
- credible migration sequencing that does not require a long period where the game regresses visually/functionally;
- a concrete blocker or leverage gain large enough to justify reopening the decision in the first place.

Until then, no second generic Godot spike is warranted.

## Defold decision

**Decision: `KEEP AS LEARNING RESULT / DO NOT PROMOTE`.**

The track is stopped before full parity.

Reasons:

- the project owner encountered crashes during the hands-on learning experience;
- repeated firewall-permission prompts materially damaged confidence and willingness to work in the environment;
- the initial value proposition was partly human learning/comfort, so a poor hands-on experience is directly relevant evidence;
- Defold already had the weakest 3D/infrastructure-avoidance case in the paper evaluation relative to Godot;
- there is no reason to pay for forced parity simply because the experiment was planned.

No claim is made that Defold is generally unstable or unsuitable for other projects. This is a Sillnight-specific decision from the experiment actually experienced.

## Ratified evolved-Three.js path

The production substrate should now be understood as:

> **Current Sillnight visual/content identity + selectively harvested architecture from the experiments + a modernized Three.js/tooling boundary.**

The desired direction is:

```text
current Sillnight assets / presentation
              |
              v
     modern package/tool boundary
              |
              v
   pure game/domain semantics
              |
      semantic steps/snapshots
              |
     +--------+--------+
     |        |        |
   Three     DOM     Audio
     |
 explicit renderer/material adapters
              |
              v
 one maintained verification command
```

This is **incremental architecture replacement**, not a rewrite.

Every production change should preserve working game identity unless the change itself is an explicit design improvement.

## Downstream issue direction

### #290 — battle architecture

Use the spike-proven domain/presentation boundary as the starting point.

Converge on a presentation-independent battle session/engine that produces deterministic semantic results before presentation replay.

The first production slice should preserve current battle visuals while moving one bounded semantic path out of animation/render callbacks.

Do not rewrite battle presentation merely to prove the architecture.

### #293 — party/UI ownership

Reframe the problem away from "DOM versus another UI technology."

The key decision is Sillnight's UI grammar and ownership contract:

- logical/presentation resolution relationship;
- layout units and repeated window roles;
- fixed/responsive policy where actually needed;
- focus and navigation;
- default/cancel semantics;
- party-update ownership;
- gauges/selection updates;
- forecast-information roles;
- verification of initialization/reinitialization/navigation.

Preserve current visual language as the baseline. Technology changes require a concrete benefit.

### #303 — verification harness

Use the control spike as a concrete architectural reference:

- fast pure-domain/data checks first;
- targeted browser smoke second;
- optional visual evidence/capture where valuable;
- one documented clean-checkout command;
- stable fixtures and actionable diagnostics.

Do not merge the experimental harness wholesale. Port the pattern into current production systems.

### #304 — Three.js renderer boundary

Reframe from a speculative plugin boundary toward a **small explicit renderer adapter/lifecycle boundary** grounded in current production needs.

Near-term questions:

- package-managed current Three.js + Vite/build path;
- retain `WebGLRenderer` first;
- isolate upgrade-sensitive `onBeforeCompile()` material adapters;
- define renderer ownership/lifecycle/resizing;
- define what scene/application code may access directly;
- add browser smoke for representative current visuals;
- avoid a general plugin framework unless repeated concrete consumers justify it.

## Current execution order

The substrate decision no longer blocks production architecture work.

Preferred order:

1. **#290** — move one real battle semantic path out of presentation timing while preserving visuals;
2. **#303** — make extracted semantics first-class verification inputs and establish the maintained verification entrypoint;
3. **#304** — modernize/package/isolate the Three.js renderer boundary against real Sillnight visuals;
4. **#293** — ratify the DOM UI grammar and ownership model as production screens are touched.

These can overlap where dependencies are clear, but they should land as small production PRs rather than a second rewrite campaign.

## Decision status

- **Current Sillnight / JavaScript + Three.js:** `KEEP + EVOLVE` — ratified production substrate for the current architecture cycle.
- **Godot:** `SUSPENDED THOUGHT EXPERIMENT` — preserve #315 as evidence; no active migration work.
- **Defold:** `KEEP AS LEARNING RESULT / DO NOT PROMOTE`.
- **Engine migration:** `REJECT / NOT APPROVED`; reopen only for a concrete future blocker or leverage gain.
- **Portable spike architecture:** `PORT BACK` selectively through focused production issues/PRs.

## Stop condition

The substrate investigation is complete for the current architecture cycle when:

- #315/#316 remain preserved as experimental evidence rather than production branches;
- #310 records the Three.js decision and closes;
- the portable wins are routed into production issues;
- normal development proceeds without repeatedly reopening the engine question absent new evidence.
