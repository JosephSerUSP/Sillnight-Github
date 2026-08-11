# Sillnight — 2026 Game Thesis

**Status:** Current product/design North Star  
**Scope:** Defines what game Sillnight is trying to become. It does not prescribe a particular engine or implementation.  
**Ratification:** Created from the 2026 repository archaeology and design discussion tracked by #307.

---

## One-sentence thesis

**Sillnight is a dark, strange persistent RPG built around roguelike dungeon expeditions, where the player assembles a six-creature autonomous party, understands and predicts its behavior, and intervenes as a Summoner while recovering the memories of an empty town.**

The project's identity lives primarily in this relationship between **expedition, autonomous creatures, legibility, formation, intervention, and persistent discovery**.

---

## 1. The dungeon is a run

Procedural expedition structure is not temporary prototype scaffolding. It is fundamental to Sillnight.

A dungeon visit is a run with pressure, risk, discovery, and an eventual decision or requirement to leave. The player should not expect every floor to be a fixed authored map, but the dungeon must also not feel like meaningless procedural noise.

Players should learn and recognize:

- strata with distinct identities;
- recurring or conditional events;
- quests and meaningful encounters;
- unusual discoveries;
- story flags and memory fragments;
- thresholds, bosses, or other milestones;
- patterns that let experience matter across runs.

The intended texture is systemic and replayable while still capable of strange, memorable, authored moments.

A useful reference is the feeling of discovering something specific and uncanny in a recombined space rather than merely consuming randomly generated rooms.

---

## 2. The game around the runs is a persistent RPG

Sillnight is not primarily a reset-heavy roguelite.

A successful expedition can simply mean going meaningfully deep and returning safely with lasting gains. Depending on the run, those gains may include:

- creature levels or other character growth;
- a newly recruited creature;
- equipment or items;
- discoveries and knowledge;
- story flags;
- recovered memories;
- changes to the town;
- access to new events, strata, or possibilities.

The player should feel that repeated expeditions build a long-form RPG state.

### The town

The town begins substantially empty.

Exploration restores or reveals its memories. Those memories may take several forms rather than one standardized collectible:

- people returning or being remembered;
- scenes and fragments of history;
- restored functions or services;
- environmental changes;
- quests and relationships;
- strange discoveries whose meaning is not immediately explained.

Recovering the town gives the procedural descent a long-term narrative direction.

---

## 3. The party is an autonomous menagerie

Creatures are the acting body of the party.

They are **not** intended to behave like six conventional JRPG characters waiting for the player to select six commands every round.

The player instead authors a party through:

- creature choice;
- skill/behavior configuration;
- formation;
- temperament or other creature-specific behavioral rules;
- equipment and traits where appropriate;
- understanding how those pieces interact.

The fantasy is not generic fantasy classes multiplied across a roster. The party should read immediately as a strange menagerie of distinct beings moving through an equally strange place.

Creatures are persistent individuals. They can be recruited or discovered through multiple means and may die permanently.

Creature care is not currently the central fantasy. **Understanding, assembling, and shepherding an uncanny autonomous party is.**

---

## 4. Legibility is a core combat mechanic

Creature autonomy should create **prediction and planning**, not opacity.

The player should normally be able to understand:

- which creature is expected to act next;
- what it is expected to do;
- why it selected that behavior;
- what it is targeting;
- what enemies are targeting;
- how changing formation will alter likely behavior;
- how an intervention changes the projected exchange.

The goal is not sophisticated AI for its own sake.

A creature whose decision process is simple but expressive and clearly communicated is preferable to a clever creature whose behavior the player cannot reason about.

### Historical behavior model

The original behavior concept was deliberately explicit: action choice depended heavily on **front/back row × odd/even turn**. That model remains valuable because a six-creature party can be mentally simulated by the player.

A constrained FFXII-inspired **mini-gambit** system is a promising alternative/evolution. If adopted, it should preserve the same fundamental readability rather than becoming a large general-purpose programming interface.

For example, the interesting design space is closer to a short ordered behavior vocabulary:

```text
Ally HP < threshold  -> heal
Enemy preparing X    -> interrupt
Front row             -> attack A
Otherwise             -> attack B
```

than to unrestricted scripting.

The exact behavior model remains to be tested under #307, but **legibility itself is ratified**.

---

## 5. Formation is behavioral, not merely statistical

Formation matters because it changes how the party behaves.

Moving a creature between positions should be capable of changing:

- which actions it prefers or is allowed to use;
- who it protects or exposes;
- likely targeting;
- interaction with other creatures' behavior;
- the projected outcome of the next exchange.

This makes repositioning a form of tactical reprogramming rather than a passive bonus screen.

The battle UI should therefore make the consequences of formation changes unusually clear.

---

## 6. The Summoner intervenes rather than taking a normal seventh turn

The Summoner is the party's anchor and tactical supervisor.

Creatures perform the ordinary combat actions. The Summoner changes the conditions under which that autonomous party operates.

Likely intervention vocabulary includes:

- repositioning / changing formation;
- using consumables;
- casting a limited set of Summoner spells;
- retreating or extracting;
- other high-level interventions that prove necessary during playtesting.

A promising direction is for the Summoner's available spell vocabulary to depend partly on party composition, making creature selection affect both autonomous behavior and the player's direct intervention tools.

Ogre Battle's relationship between automated combat and player intervention is a useful reference.

The exact timing/cost of interventions is not yet sacred. Their **role** is.

---

## 7. Runs need pressure

An expedition needs a reason not to become indefinite, consequence-free wandering.

The historical **Summoner MP as oxygen** / creature `mpd` concept attempted to solve this through an SMT-like upkeep resource. The exact formula is not ratified, but the design problem is.

The eventual pressure system should:

- make depth and extraction decisions meaningful;
- connect party strength to expedition cost where useful;
- create tension without demanding constant busywork;
- support the persistent-RPG loop of risking gains and returning stronger;
- avoid turning ordinary exploration into arbitrary punishment.

MP/upkeep remains a strong candidate, but it must earn its final form through playtesting rather than historical inertia.

---

## 8. Defeat should serve persistence and risk

Current intent leaves the exact game-over model unresolved.

Creature permanence and expedition loss already provide meaningful stakes, so traditional total game-over handling should not be retained merely because RPGs usually have one.

Questions to resolve include:

- Does Summoner defeat end the run but return the player to the persistent game?
- Which items, creatures, experience, discoveries, or story state survive failed extraction?
- How does permanent creature death interact with party defeat?
- Can failure itself produce meaningful town/story state?
- Does a traditional reload/game-over screen add anything that those consequences do not?

The answer should preserve real risk without undermining the long-form RPG.

---

## 9. Presentation should serve readability and strangeness

Sillnight should remain dark, weird, and immediately distinct from generic fantasy RPG presentation.

The existing idea of rendering the 3D world at a deliberately lower internal resolution while presenting UI at a separately controlled resolution is intentional in spirit: an **HD-remaster relationship** between world image and interface rather than one undifferentiated resolution target.

The precise renderer and UI technology are not part of the game thesis.

Whatever substrate is chosen must support a deliberate interface grammar. Battle presentation in particular should prioritize forecast information over spectacle when the two conflict.

Animation, effects, and atmosphere may obscure the world aesthetically; they should not obscure the underlying tactical rules unintentionally.

---

## 10. Product boundaries

Sillnight is a game, not a general engine project.

Build or customize tools when they make **Sillnight** substantially better to author. Do not expand those tools into general-purpose engine/editor infrastructure without a concrete game requirement.

Browser delivery is not a design pillar. The current browser implementation is prototype ancestry and should be evaluated like any other technical choice under `PROJECT_TECHNOLOGY_PRINCIPLES.md`.

Likewise, no specific engine is ratified by this document.

---

## Core loop

At a high level:

```text
prepare party / configure behavior / choose formation
                    |
                    v
             enter expedition
                    |
                    v
 explore -> discover -> fight -> make risk decisions
                    |
              Summoner intervenes
                    |
                    v
       go deeper or extract / be defeated
                    |
                    v
 creatures + items + growth + memories + town state
                    |
                    v
             prepare next run
```

The loop should increasingly ask the player:

> **Do I understand the strange party I built well enough to trust it deeper into this place?**

---

## Design invariants

Future work should preserve these unless a deliberate design decision replaces them:

1. **Runs matter.** Procedural expedition structure is part of the game, not a placeholder for authored maps.
2. **Persistence matters.** Runs feed a long-form RPG and the recovery of the town.
3. **Creatures act autonomously.** Six manually commanded JRPG units are not the target interaction model.
4. **Autonomy must be legible.** Predictability and forecastability are tactical features.
5. **Formation changes behavior.** Positioning should alter the party's decision structure, not only statistics.
6. **The Summoner intervenes.** The player supervises and redirects rather than simply taking an equivalent seventh turn.
7. **Runs need pressure and stakes.** The exact economy can change; consequence-free wandering is not the target.
8. **The creature roster should be strange and distinct.** Avoid converging on generic fantasy job taxonomy.
9. **Technology serves the game.** Browser, Three.js, DOM UI, or any replacement engine are means rather than identity.
10. **Do not build a general engine to justify project-specific tooling.**

---

## Explicitly unresolved

The following are important but should not be silently decided by implementation work:

- row/parity behavior versus a constrained mini-gambit model;
- exact temperament semantics;
- exact expedition-pressure resource/economy;
- defeat, extraction, and game-over consequences;
- precise Summoner intervention timing and costs;
- exact progression pacing and campaign/strata structure;
- final UI grammar;
- final runtime/engine substrate.

These are bounded design/technology decisions under #307 and its child issues.

---

## Relationship to older design documentation

`gameDesign.md` remains valuable as a detailed mechanics reference and record of prior intended systems. It contains historical formulas and implementation-gap notes that should not automatically override this thesis.

When the two disagree:

1. this 2026 thesis governs **game identity and product intent**;
2. an explicit newer decision/issue governs a specific mechanic when one exists;
3. `gameDesign.md` should be updated once that mechanic is ratified rather than treated as immutable historical law.

This hierarchy lets the project preserve useful design archaeology without forcing every old implementation assumption into the future game.
