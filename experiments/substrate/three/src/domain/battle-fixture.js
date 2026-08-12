/**
 * Fixture-only battle domain.
 *
 * This module deliberately imports the shared JSON contract instead of the
 * production BattleManager. Forecasting and resolution are synchronous pure
 * operations over plain objects; the Three renderer and DOM never participate
 * in deciding whether a semantic event happened.
 */
import fixture from "../../../shared/battle_fixture.json" with { type: "json" };

const clone = (value) => JSON.parse(JSON.stringify(value));

export const sharedFixture = fixture;

export function validateFixture(source = fixture) {
  const requiredStepIds = [
    "initial_forecast",
    "formation_intervention",
    "post_formation_forecast",
    "summoner_intervention",
    "post_summoner_forecast",
    "resolve_locked_forecast"
  ];

  if (source.contract_version !== 1 || source.synthetic_fixture !== true || source.design_authority !== false) {
    throw new Error("The shared fixture must remain the synthetic v1 comparison contract.");
  }

  const actualStepIds = source.steps.map((step) => step.id);
  if (JSON.stringify(actualStepIds) !== JSON.stringify(requiredStepIds)) {
    throw new Error(`Unexpected fixture sequence: ${actualStepIds.join(", ")}`);
  }

  if (source.party.length !== 6 || source.enemies.length !== 2) {
    throw new Error("Fixture v1 must contain six party members and two enemies.");
  }

  return true;
}

export function createBattleState(source = fixture) {
  validateFixture(source);
  return clone(source);
}

export function getStep(source, id) {
  const step = source.steps.find((candidate) => candidate.id === id);
  if (!step) throw new Error(`Fixture step not found: ${id}`);
  return step;
}

export function getRow(slot) {
  return slot.startsWith("front_") ? "front" : "back";
}

function living(units) {
  return units.filter((unit) => unit.hp > 0);
}

function byLowestHpRatio(a, b) {
  return (a.hp / a.max_hp) - (b.hp / b.max_hp);
}

function byLowestHp(a, b) {
  return a.hp - b.hp;
}

function findUnit(state, id) {
  const unit = [...state.party, ...state.enemies].find((candidate) => candidate.id === id);
  if (!unit) throw new Error(`Unit not found: ${id}`);
  return unit;
}

function actionFor(unit) {
  if (unit.behavior_by_row) return unit.behavior_by_row[getRow(unit.slot)];
  return unit.action;
}

function selectTargets(state, actor, selector) {
  const party = living(state.party);
  const enemies = living(state.enemies);

  switch (selector) {
    case "self":
      return [actor];
    case "enemy_lowest_hp":
      return [enemies.slice().sort(byLowestHp)[0]];
    case "enemy_highest_threat":
      return [enemies.slice().sort((a, b) => b.threat - a.threat)[0]];
    case "enemy_front_all":
      return enemies.filter((unit) => getRow(unit.slot) === "front");
    case "ally_lowest_hp_ratio":
      return [party.slice().sort(byLowestHpRatio)[0]];
    case "ally_front_lowest_hp_ratio":
      return [party.filter((unit) => getRow(unit.slot) === "front").sort(byLowestHpRatio)[0]];
    case "ally_back_lowest_hp_ratio":
      return [party.filter((unit) => getRow(unit.slot) === "back").sort(byLowestHpRatio)[0]];
    default:
      throw new Error(`Unsupported fixture target selector: ${selector}`);
  }
}

export function forecast(state) {
  const actors = [...living(state.party), ...living(state.enemies)];
  const entries = actors.map((actor) => {
    const action = actionFor(actor);
    const targets = selectTargets(state, actor, action.target).filter(Boolean);
    return {
      actor: actor.id,
      action: action.action || action.id,
      targets: targets.map((target) => target.id),
      action_speed: action.action_speed
    };
  });

  entries.sort((a, b) => {
    if (a.action_speed !== b.action_speed) return b.action_speed - a.action_speed;
    return a.actor.localeCompare(b.actor);
  });

  return entries.map((entry, index) => ({ order: index + 1, ...entry }));
}

export function swapPartySlots(state, firstId = "nurse", secondId = "pixie") {
  const next = clone(state);
  const first = next.party.find((unit) => unit.id === firstId);
  const second = next.party.find((unit) => unit.id === secondId);
  if (!first || !second) throw new Error("Formation swap requires Nurse and Pixie.");
  [first.slot, second.slot] = [second.slot, first.slot];
  return next;
}

export function useSmallPotion(state, targetId = "nurse") {
  const next = clone(state);
  const itemId = "potionSmall";
  const target = next.party.find((unit) => unit.id === targetId);
  const item = next.summoner.fixture_item_semantics[itemId];
  if (!target || !item || next.summoner.inventory[itemId] < 1) {
    throw new Error("Small Potion intervention is unavailable.");
  }

  const amount = Math.floor(target.max_hp * item.effect.ratio);
  target.hp = Math.min(target.max_hp, target.hp + amount);
  next.summoner.inventory[itemId] -= 1;
  return next;
}

function effectFor(actor) {
  return actionFor(actor).effect;
}

function addTranscript(transcript, actor, action, target, effect, before) {
  if (effect.type === "damage") {
    target.hp = Math.max(0, target.hp - effect.amount);
    transcript.push({
      type: "damage",
      actor: actor.id,
      action,
      target: target.id,
      amount: effect.amount,
      hp_before: before,
      hp_after: target.hp
    });
  } else if (effect.type === "heal") {
    target.hp = Math.min(target.max_hp, target.hp + effect.amount);
    transcript.push({
      type: "heal",
      actor: actor.id,
      action,
      target: target.id,
      amount: target.hp - before,
      hp_before: before,
      hp_after: target.hp
    });
  } else if (effect.type === "add_state") {
    target.states ??= [];
    if (!target.states.includes(effect.state)) target.states.push(effect.state);
    transcript.push({
      type: "add_state",
      actor: actor.id,
      action,
      target: target.id,
      state: effect.state
    });
  }
}

export function resolveLockedForecast(state, lockedForecast) {
  const next = clone(state);
  const transcript = [];

  for (const entry of lockedForecast) {
    const actor = findUnit(next, entry.actor);
    const effect = effectFor(actor);
    for (const targetId of entry.targets) {
      const target = findUnit(next, targetId);
      addTranscript(transcript, actor, entry.action, target, effect, target.hp);
    }
  }

  return { state: next, transcript };
}

export function projectState(state) {
  const unitState = (unit) => ({ hp: unit.hp, states: [...(unit.states || [])] });
  return {
    party: Object.fromEntries(state.party.map((unit) => [unit.id, unitState(unit)])),
    enemies: Object.fromEntries(state.enemies.map((unit) => [unit.id, unitState(unit)]))
  };
}

export function displayName(state, id) {
  return findUnit(state, id).name;
}
