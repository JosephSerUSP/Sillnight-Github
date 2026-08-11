# Project Technology Principles

## Purpose

Technology choices in this repository should be judged by how well they serve the game, not by novelty, familiarity, sunk cost, or the desire to generalize the project into an engine.

The central rule is:

> **Own what makes the project distinctive. Outsource what merely makes software exist.**

A custom system is justified when it materially expresses the game's design, presentation, authoring model, or workflow. Generic infrastructure should usually be delegated to mature tools when doing so makes the project smaller, clearer, safer to iterate, and easier to verify.

These principles are intentionally reusable, but adopting them here does **not** silently make technology decisions for other projects or repositories. Each project must apply them against its own goals and constraints.

---

## Evaluation criteria

When choosing an engine, framework, renderer, editor, language, build system, data format, or other major technical dependency, evaluate it against the following criteria.

### 1. Project fit

Does the technology naturally support what this specific project wants to be?

Consider:

- the core player experience and game loop;
- the required visual and interaction model;
- the kinds of content the project actually authors;
- the scale and shape of the runtime;
- the project's real distribution requirements;
- whether the technology's abstractions make the distinctive parts of the game clearer or more awkward.

Do not preserve a platform, framework, or engine merely because the prototype began there.

Do not migrate merely because another tool is newer or more popular.

### 2. Agentic operability

The project should remain safe and productive for coding agents as well as humans.

A strong environment lets agents such as ChatGPT, Claude, Jules, or other repository workers:

- understand the relevant source without depending on hidden editor state;
- make bounded changes;
- run verification themselves;
- inspect failures;
- produce reviewable branches and pull requests;
- work from explicit repository instructions and invariants;
- avoid requiring the project owner to manually validate every mechanical change.

Agentic capability is not an afterthought. It is part of the development environment.

Technologies that require frequent opaque GUI-only mutation or undocumented local state carry a significant cost even when they are otherwise capable.

### 3. Git ergonomics

Authored project state should be as diffable, mergeable, recoverable, and reviewable as reasonably possible.

Prefer:

- text-based source and data;
- deterministic serialization;
- small compositional files over giant generated documents;
- stable file formats;
- changes whose semantic meaning is visible in a pull request;
- repository history as a reliable record of project evolution.

Avoid placing essential authored state in opaque caches, machine-local databases, or binary formats when a practical text representation exists.

Git should remain authoritative for the project even when an editor is involved.

### 4. Headless verification

Important changes should be verifiable without requiring a person to open an editor and click through the game.

The preferred direction is a repository-level validation contract that can be run by humans, CI, and agents alike.

Depending on the project, this may include:

- syntax and parse checks;
- deterministic domain tests;
- data/schema validation;
- representative scene or runtime smoke tests;
- import/load checks;
- build/export checks;
- screenshot or visual regression capture where presentation matters.

Manual inspection remains valuable for aesthetics and game feel, but it should not be the only way to discover basic breakage.

### 5. Visual deliberateness

Technology should help the project establish a clear visual and interaction grammar rather than merely provide enough primitives to place things on screen.

Deliberateness may come from custom systems or from constraints supplied by an engine/framework. Either is acceptable.

Useful questions include:

- Are layout, scale, resolution, spacing, hierarchy, navigation, and focus rules explicit?
- Can repeated interface structures remain consistent?
- Can unusual presentation choices still be authored intentionally?
- Does the tool encourage accidental one-off UI and scene behavior?
- Are the constraints understandable enough that both humans and agents can predict the result of a change?

A powerful tool that produces inconsistent authored results is not automatically a better fit than a smaller, more constrained one.

### 6. Infrastructure avoided

Count the generic systems the project no longer needs to own.

Examples include:

- rendering and platform abstraction;
- asset import and lifetime management;
- input/device support;
- audio plumbing;
- window/layout primitives;
- scene serialization;
- build/export machinery;
- editor infrastructure;
- dependency loading;
- debugging and profiling facilities.

Owning infrastructure has a permanent maintenance cost. Custom infrastructure should earn that cost by materially supporting the identity or workflow of the project.

The goal is not to minimize custom code at any price. The goal is to concentrate custom code where it creates distinctive value.

### 7. Constraint quality

When a technology limits the project, ask whether the limitation is creatively productive or merely obstructive.

Good constraints can:

- reduce accidental complexity;
- make authored outcomes more coherent;
- narrow the number of ways a system can fail;
- improve readability;
- force useful design decisions;
- make iteration faster.

Bad constraints force the project to fight its substrate in order to express requirements central to the game.

Designing around a productive constraint is legitimate. Repeatedly working around an unsuitable foundation is not.

---

## Derived engineering rules

### Keep game-specific semantics independent of generic presentation machinery

Distinctive rules should not become inseparable from rendering, UI, audio, animation timing, or editor state merely because the chosen engine makes those systems convenient to access.

Where practical, game-domain code should be independently testable and should communicate semantic results to presentation layers.

This matters both for architecture quality and for agentic verification.

### Prefer boring representations at boundaries

Data exchanged between major systems should favor explicit, inspectable structures over implicit editor state or clever runtime coupling.

Boring text, small data objects, stable schemas, explicit IDs, and deterministic transforms are assets for human understanding, Git history, tests, and agents.

### Do not generalize project-specific tools to justify their existence

A tool built for one game does not need to become a general engine, general editor, or reusable middleware product.

Generalization is justified only when a real project requirement demands it.

Avoid expanding scope merely because substantial effort has already been invested in a custom subsystem.

### Prefer migration by proof, not by enthusiasm

Major engine or framework changes should begin with representative spikes rather than full rewrites.

A useful spike should test the parts most likely to invalidate the candidate, including:

- a distinctive gameplay-system slice;
- representative rendering or UI;
- real authored data;
- repository setup from a clean checkout;
- headless verification;
- an agent-authored change and reviewable Git diff when agentic operability is important.

A migration should proceed only when evidence shows that the new foundation makes the project meaningfully clearer, smaller, safer, or more capable without sacrificing essential deliberateness.

### Treat agent instructions and verification as architecture

Files such as `AGENTS.md`, repository validation commands, deterministic tests, and explicit invariants are part of the technical design.

They determine how safely parallel humans and agents can work on the project.

When recurring or scheduled agents are used, their tasks should be narrow and bounded. Avoid open-ended instructions such as "find something to improve" that can generate speculative refactors or pull-request bloat without a product decision driving them.

---

## Decision record template

Major technology decisions should be explainable in terms of these principles.

A lightweight decision record can use the following structure:

```text
Decision:
Project need:

Project fit:
Agentic operability:
Git ergonomics:
Headless verification:
Visual deliberateness:
Infrastructure avoided:
Constraint quality:

Evidence / spike results:
Tradeoffs accepted:
Decision status: KEEP / EVOLVE / REPLACE / INVESTIGATE
```

The categories are not a numeric score by default. A single hard failure can outweigh several conveniences.

---

## Application to Sillnight

These principles establish the criteria for Sillnight's upcoming technology and architecture ratification; they do not predetermine its outcome.

In particular:

- Browser delivery is not automatically a product requirement merely because the current prototype is browser-based.
- The existing JavaScript/Three.js implementation must be evaluated against established engine alternatives rather than preserved through inertia.
- Any engine candidate must preserve or improve Git-first, agent-operable development.
- An engine migration is unacceptable if ordinary agents cannot clone the repository, make bounded gameplay changes, run meaningful verification, and produce understandable diffs without depending on opaque editor-only state.
- Sillnight should receive excellent tools for authoring **Sillnight**, not grow into a general-purpose engine or editor.
- Generic infrastructure should be outsourced where that materially improves compactness, readability, verification, and iteration.
- Distinctive systems—especially the game's rules, autonomous creature behavior, formation logic, expedition structure, and other project-specific semantics—remain the parts most worth owning directly.

The corresponding project-specific decisions should be made in a dedicated ratification issue after the relevant design goals and technical experiments are recorded.
