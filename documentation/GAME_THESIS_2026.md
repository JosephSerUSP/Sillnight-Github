# Sillnight — 2026 Game Thesis

**Status:** Current product/design North Star  
**Scope:** Defines what game Sillnight is trying to become. It does not prescribe an engine or implementation.  
**Ratification:** Derived from the 2026 repository archaeology and design discussion tracked by #307.

---

## Thesis

**Sillnight is a dark, strange persistent RPG built around roguelike dungeon expeditions, where the player assembles a six-creature autonomous party, understands and predicts its behavior, and intervenes as a Summoner while recovering the memories of an empty town.**

Its identity lives primarily in the relationship between **expedition, autonomous creatures, legibility, formation, intervention, and persistent discovery**.

The central player question is:

> **Do I understand the strange party I built well enough to trust it deeper into this place?**

---

## Core loop

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

A successful run can simply mean going meaningfully deep and returning safely with lasting gains.

---

## 1. Runs are foundational

The dungeon is fundamentally a **run**, not a procedural substitute for authored level design.

Runs should combine systemic recombination with memorable authored material. Players should learn and recognize strata, recurring or conditional events, quests, discoveries, story flags, thresholds, bosses, and other patterns whose meaning persists across expeditions.

The dungeon should feel replayable without becoming meaningless procedural noise.

Runs also need pressure. Exploration should eventually force a meaningful decision about depth, risk, and extraction rather than permitting consequence-free wandering forever.

The historical **Summoner MP as oxygen** / creature `mpd` system is one possible solution. The need for expedition pressure is ratified; the exact historical formula is not.

---

## 2. The game around the runs is a persistent RPG

Sillnight is not primarily a reset-heavy roguelite.

Runs feed persistent state such as:

- creature growth;
- recruited creatures;
- equipment and items;
- discoveries and knowledge;
- story flags;
- recovered memories;
- town state;
- access to new strata, events, or possibilities.

The town begins substantially empty. Delving deeper restores or reveals its memories through people, scenes, functions, environmental changes, quests, history, and stranger discoveries whose meaning the player may need to piece together.

Recovering the town gives the procedural descent a long-term narrative direction.

---

## 3. The party is an autonomous menagerie

Creatures are the acting body of the party.

They are **not** six conventional JRPG characters waiting for six manually selected commands every round.

The player authors the party through creature choice, skills/behavior, formation, temperament or other behavioral rules, equipment/traits where useful, and an understanding of how those pieces interact.

Creatures should read as a strange menagerie of distinct beings rather than permutations of familiar fantasy jobs. They are persistent individuals, can be recruited or discovered through multiple means, and may die permanently.

Creature care is not currently the central fantasy. **Understanding, assembling, and shepherding an uncanny autonomous party is.**

---

## 4. Legibility is a combat pillar

Creature autonomy should create **prediction and planning, not opacity**.

The player should normally be able to understand:

- who is expected to act next;
- what each creature is expected to do and why;
- what it is targeting;
- what enemies are targeting;
- how formation changes likely behavior;
- how a Summoner intervention changes the projected exchange.

Simple but expressive decision rules are preferable to sophisticated AI that the player cannot reason about.

The historical **front/back row × odd/even turn** model remains valuable because a six-creature party can be mentally simulated. A constrained FFXII-inspired **mini-gambit** model is a promising evolution if it preserves the same readability rather than becoming unrestricted scripting.

The exact behavior model remains unresolved. **Legibility itself is not.**

---

## 5. Formation changes behavior

Formation is not merely a stat modifier.

Moving a creature should be capable of changing what it does, who it exposes or protects, how it is targeted, how its behavior interacts with other creatures, and therefore the projected outcome of the next exchange.

Repositioning is a form of tactical reprogramming.

The battle UI should make those consequences unusually clear.

---

## 6. The Summoner intervenes

The Summoner is the party's anchor and tactical supervisor, not a conventional seventh battler taking an equivalent turn.

Creatures perform ordinary combat actions. The Summoner changes the conditions under which that autonomous party operates.

Likely interventions include:

- repositioning / changing formation;
- consumable use;
- a limited Summoner spell pool, potentially influenced by party composition;
- retreat / extraction;
- other high-level interventions that prove useful in playtesting.

Ogre Battle's relationship between automated combat and player intervention is a useful reference.

The exact timing and cost of intervention remain unresolved. Its **role** is ratified.

---

## 7. Risk and defeat must serve the long-form RPG

The game needs meaningful expedition stakes, but the exact game-over model is unresolved.

Creature permanence and expedition loss already create potential consequences, so a traditional reload/game-over screen should not survive merely through genre convention.

The eventual design must answer what is lost or preserved on defeat, how permanent creature death interacts with failed runs, and whether Summoner defeat returns the player to the persistent game or produces another consequence.

Failure should create real risk without undermining the long-form RPG.

---

## 8. Presentation serves readability and strangeness

Sillnight should remain dark, weird, and visibly distinct from generic fantasy RPG presentation.

The idea of rendering the 3D world at a deliberately lower internal resolution while presenting UI at a separately controlled resolution is intentional in spirit: an **HD-remaster relationship** between world image and interface.

The precise renderer and UI technology are not part of the thesis.

Whatever substrate is chosen must support a deliberate interface grammar. Battle presentation should prioritize forecast information over spectacle when the two conflict. Atmosphere may obscure the world aesthetically; it should not accidentally obscure the tactical rules.

---

## Product boundary

Sillnight is a game, not a general engine project.

Build or customize tools when they make **Sillnight** substantially better to author. Do not generalize them into broad engine/editor infrastructure without a concrete game requirement.

Browser delivery is not a design pillar. The current browser/JavaScript/Three.js implementation is prototype ancestry and should be judged like any other substrate under `PROJECT_TECHNOLOGY_PRINCIPLES.md`.

No engine is ratified by this thesis.

---

## Design invariants

Future work should preserve these unless a deliberate design decision replaces them:

1. **Runs matter.** Procedural expedition structure is part of the game.
2. **Persistence matters.** Runs feed a long-form RPG and the recovery of the town.
3. **Creatures act autonomously.** Six manually commanded JRPG units are not the target interaction model.
4. **Autonomy must be legible.** Predictability and forecastability are tactical features.
5. **Formation changes behavior.** Positioning alters the party's decision structure, not only statistics.
6. **The Summoner intervenes.** The player supervises and redirects rather than taking an equivalent seventh turn.
7. **Runs need pressure and stakes.** The exact economy may change; indefinite consequence-free wandering is not the target.
8. **The creature roster should be strange and distinct.** Avoid generic fantasy-job taxonomy as the primary organizing language.
9. **Technology serves the game.** Browser, Three.js, DOM UI, or any replacement engine are means rather than identity.
10. **Do not build a general engine to justify Sillnight-specific tooling.**

---

## Explicitly unresolved

These questions should not be silently decided by implementation work:

- row/parity behavior versus a constrained mini-gambit model;
- exact temperament semantics;
- exact expedition-pressure economy;
- defeat, extraction, and game-over consequences;
- precise Summoner intervention timing and costs;
- exact progression pacing and campaign/strata structure;
- final UI grammar;
- final runtime/engine substrate.

They belong to #307 and its focused child issues/spikes.

---

## Relationship to older design documentation

`gameDesign.md` remains valuable as a detailed mechanics reference and record of prior intended systems, but some formulas and implementation assumptions are historical.

When documents disagree:

1. this thesis governs **game identity and product intent**;
2. a newer explicit decision/issue governs a specific mechanic when one exists;
3. `gameDesign.md` should be updated after that mechanic is ratified rather than treated as immutable law.

This preserves useful design archaeology without forcing every old implementation assumption into the future game.
