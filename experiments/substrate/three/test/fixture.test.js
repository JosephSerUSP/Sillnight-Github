import assert from "node:assert/strict";
import {
  createBattleState,
  forecast,
  getStep,
  projectState,
  sharedFixture,
  swapPartySlots,
  useSmallPotion,
  resolveLockedForecast,
  validateFixture
} from "../src/domain/battle-fixture.js";

const pick = (state, id) => state.party.find((unit) => unit.id === id) ?? state.enemies.find((unit) => unit.id === id);

validateFixture(sharedFixture);
const initialState = createBattleState(sharedFixture);
const initialForecast = forecast(initialState);
assert.deepEqual(initialForecast, getStep(sharedFixture, "initial_forecast").expected, "initial forecast");

const formationState = swapPartySlots(initialState);
assert.equal(pick(formationState, "nurse").slot, "back_1");
assert.equal(pick(formationState, "pixie").slot, "front_2");
const formationForecast = forecast(formationState);
assert.deepEqual(formationForecast, getStep(sharedFixture, "post_formation_forecast").expected, "formation forecast");

const potionState = useSmallPotion(formationState);
assert.equal(pick(potionState, "nurse").hp, 16, "Small Potion heals Nurse to 16/20");
assert.equal(potionState.summoner.inventory.potionSmall, 0, "Small Potion is consumed");
const postPotionForecast = forecast(potionState);
assert.deepEqual(postPotionForecast, getStep(sharedFixture, "post_summoner_forecast").expected, "post-Summoner forecast");

const resolution = resolveLockedForecast(potionState, postPotionForecast);
assert.deepEqual(resolution.transcript, getStep(sharedFixture, "resolve_locked_forecast").expected_transcript, "semantic transcript");
assert.deepEqual(projectState(resolution.state), getStep(sharedFixture, "resolve_locked_forecast").expected_end_state, "final state");

// The presentation/intervention sequence must be immutable at every boundary.
assert.equal(initialState.party.find((unit) => unit.id === "nurse").slot, "front_2");
assert.equal(initialState.party.find((unit) => unit.id === "nurse").hp, 10);
assert.equal(initialState.summoner.inventory.potionSmall, 1);
assert.notEqual(initialState, formationState);
assert.notEqual(formationState, potionState);

console.log("Three.js fixture verification passed: forecasts, transcript, final state, and immutable domain boundaries.");
