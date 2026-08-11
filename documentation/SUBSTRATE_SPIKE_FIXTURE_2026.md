# Sillnight — Shared Substrate Spike Fixture

**Status:** Authoritative comparison fixture for #310  
**Machine-readable source:** [`../experiments/substrate/shared/battle_fixture.json`](../experiments/substrate/shared/battle_fixture.json)  
**Purpose:** Give the Godot, Three.js, and Defold experiments one semantic target without forcing them to share runtime code.

## What this fixture is

This is a **comparison contract**, not a new battle-design document.

It freezes one tiny battle situation strongly enough that different engine implementations can be judged against the same questions:

- Can the project represent six autonomous creatures clearly?
- Can it forecast action order, actions, and targets before resolution?
- Does changing formation visibly reprogram behavior?
- Can a Summoner intervention modify state and trigger a new forecast?
- Can the resulting round resolve deterministically without presentation owning game state?
- Can an agent find and change the relevant rules without GUI-only knowledge?

The fixture intentionally borrows existing Sillnight names such as Skeleton, Nurse, Golem, Pixie, Lich, No. 7, Slash, Triage, Thunder, and Small Potion so the experiments remain recognizably shaped like the game.

Their **fixture semantics are self-contained**. Implementations must not assume the current JavaScript creature arrays, skill formulas, element rules, or AI behavior are authoritative for this experiment.

## What this fixture does not decide

The fixture does **not** ratify:

- the historical row/parity behavior model;
- the proposed mini-gambit model;
- final temperament rules;
- final action-speed numbers;
- final target-selection rules;
- final damage/healing formulas;
- hit/crit/variance semantics;
- final Summoner item timing;
- whether forecast targets remain locked in the shipped game.

Those choices remain under #307 and its focused design issues.

The fixture uses a deliberately primitive **front/back behavior choice** because it exercises the ratified invariant that formation can change creature behavior without prejudging the richer final behavior system.

## Scenario

The six-creature party begins as:

```text
FRONT                      BACK

Skeleton    Nurse    Golem | Pixie    Lich    No. 7
```

Two synthetic enemies face them:

```text
Iron Maw                  Lantern Wight
front                     back
```

Nurse begins wounded enough to be the obvious healing/targeting priority.

Every actor has a small fixture-only action definition containing:

- an action ID;
- an `action_speed` used for forecast order;
- a deterministic target selector;
- a fixed effect.

Higher `action_speed` resolves first. There are no ties in fixture v1.

## Target selector vocabulary

Implementations may structure the code however is natural for their substrate, but these selectors must produce the fixture's expected targets.

- `self` — the acting unit.
- `enemy_lowest_hp` — living enemy with the lowest current HP.
- `enemy_highest_threat` — living enemy with the highest `threat` value.
- `enemy_front_all` — all living enemies currently in the enemy front row.
- `ally_lowest_hp_ratio` — living party member with the lowest `hp / max_hp` ratio; self is eligible.
- `ally_front_lowest_hp_ratio` — living party member in the front row with the lowest `hp / max_hp` ratio.
- `ally_back_lowest_hp_ratio` — living party member in the back row with the lowest `hp / max_hp` ratio.

Fixture v1 contains no selector ties. A substrate does not need to invent tie-breaking behavior to pass this contract.

## Required forecast sequence

### 1. Initial forecast

Before intervention, the important behaviors are:

- back-row Pixie chooses **Cure** and targets wounded Nurse;
- front-row Nurse chooses **Injection**;
- Iron Maw targets the lowest-health-ratio creature in the front row: Nurse;
- Lantern Wight targets the lowest-health-ratio creature in the back row: Pixie.

The full ordered forecast is stored in the JSON fixture and should be directly assertable in tests.

### 2. Formation intervention

Swap **Nurse** and **Pixie**:

```text
FRONT                      BACK

Skeleton    Pixie    Golem | Nurse    Lich    No. 7
```

The new forecast must visibly communicate that formation changed behavior:

- Nurse changes from **Injection** to **Triage**;
- Pixie changes from **Cure** to **Thunder**;
- Iron Maw changes its target from Nurse to Pixie because the front row changed;
- Lantern Wight changes its target from Pixie to Nurse because the back row changed.

This is the core legibility test. A player-facing implementation should make this consequence understandable before the round resolves.

### 3. Summoner intervention

The Summoner uses the fixture's **Small Potion** on Nurse.

For this fixture only, Small Potion mirrors the current item's basic idea: heal `floor(max_hp * 0.30)`.

Nurse therefore changes from `10 / 20` HP to `16 / 20` HP.

Reforecast after the item:

- Nurse remains on **Triage** because she is still in the back row;
- Triage's target changes from Nurse to Pixie because Pixie now has the lowest party HP ratio;
- the rest of the forecast remains stable.

This demonstrates that a direct Summoner action can alter semantic state and cause an understandable forecast update without presentation code owning the change.

## Round resolution

The final post-Summoner forecast is then resolved.

Fixture v1 deliberately uses:

- fixed integer damage/healing;
- no misses;
- no critical hits;
- no damage variance;
- no element calculations;
- no random target choices;
- forecast-time target locking.

The expected semantic transcript and final state are completely enumerated in `battle_fixture.json`.

A substrate may animate or present those events however it wants. **Animation completion must not determine whether an event happened.**

A useful boundary is:

```text
fixture / battle state
        |
        v
forecast + semantic transcript
        |
        v
presentation / UI / animation / audio
```

## Determinism

The fixture includes a seed because the long-term project requires seeded, reproducible simulation.

Fixture v1 intentionally consumes **no random draws**. That keeps the first cross-language comparison independent of JavaScript/GDScript/Lua PRNG differences while still requiring implementations to accept/preserve deterministic scenario identity.

If a later comparison needs random behavior, extend the fixture with an explicit deterministic draw stream or a separately ratified portable RNG contract rather than silently depending on each language's default PRNG.

## Required implementation evidence

Each full substrate spike should be able to show:

1. the initial forecast;
2. the changed forecast immediately after the Nurse/Pixie swap;
3. the changed forecast after Small Potion;
4. the final semantic transcript;
5. the asserted final battle state;
6. a headless or command-line verification path that checks the semantic results.

The UI does not need to look identical across substrates. It does need to make the same semantic facts legible.

## Fresh-agent modification task

After a spike can satisfy fixture v1, give an agent that did **not** build the spike this bounded task:

> Add one new fixture-only creature behavior condition that changes one forecast in a clearly specified state, update the expected fixture/test output, and verify the project. Do not refactor unrelated architecture.

The exact condition should be chosen at test time so the agent cannot merely reproduce code written by the original spike author.

Evaluate:

- which files the agent touches;
- whether the semantic change is obvious in the diff;
- whether editor-generated noise appears;
- whether verification can be run without GUI intervention;
- whether the agent understands the domain/presentation boundary;
- whether the project remains understandable to the human owner afterward.

## Defold learning track

The initial Defold experiment may implement only the forecast/intervention subset before full round resolution if that is enough to evaluate the editor, GUI, Lua/message model, Git diffs, CLI build, and human learning experience.

If Defold passes its promotion gate in #310, it should then satisfy the complete fixture like Godot and the Three.js control.

## Change policy

Because this fixture is the shared measurement target, engine-specific spike branches should **not silently alter it** to make their implementation easier.

If the fixture itself is flawed or unnecessarily biased:

1. change the shared fixture on `main` through a focused PR;
2. explain why the change improves fairness or better reflects the ratified game thesis;
3. update all affected expected forecasts/transcripts;
4. then rebase or adapt the experimental tracks.

This keeps the three experiments comparable and prevents the substrate from redefining the question it is supposed to answer.
