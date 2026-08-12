import * as THREE from "three";
import "./styles.css";
import {
  createBattleState,
  displayName,
  forecast,
  getRow,
  projectState,
  resolveLockedForecast,
  sharedFixture,
  swapPartySlots,
  useSmallPotion
} from "./domain/battle-fixture.js";
import { RoomRenderer } from "./presentation/room.js";

const worldSurface = document.querySelector("#world-surface");
const room = new RoomRenderer(worldSurface);

let state = createBattleState(sharedFixture);
let currentForecast = forecast(state);
let previousForecast = [];
let stage = "initial";
let transcript = [];

const stageLabels = {
  initial: "INITIAL",
  formation: "FORMATION",
  summoner: "POTION",
  resolved: "RESOLVED"
};

const unitIsEnemy = (id) => state.enemies.some((unit) => unit.id === id);
const nameOf = (id) => displayName(state, id);

function forecastSignature(entry) {
  return `${entry.actor}:${entry.action}:${entry.targets.join(",")}`;
}

function renderFormation() {
  for (const row of ["front", "back"]) {
    const host = document.querySelector(`#${row}-slots`);
    host.replaceChildren();
    state.party
      .filter((unit) => getRow(unit.slot) === row)
      .sort((a, b) => a.slot.localeCompare(b.slot))
      .forEach((unit) => {
        const slot = document.createElement("div");
        slot.className = `formation-slot ${stage !== "initial" && ["nurse", "pixie"].includes(unit.id) ? "changed" : ""} ${unit.hp < unit.max_hp ? "wounded" : ""}`;
        slot.dataset.unit = unit.id;
        slot.textContent = `${unit.name} ${unit.hp}/${unit.max_hp}`;
        host.append(slot);
      });
  }

  const enemyLine = document.querySelector("#enemy-line");
  enemyLine.replaceChildren();
  for (const enemy of state.enemies) {
    const chip = document.createElement("span");
    chip.className = "enemy-chip";
    chip.textContent = `${enemy.name} ${enemy.hp}/${enemy.max_hp}`;
    enemyLine.append(chip);
  }

  document.querySelector("#formation-note").textContent = stage === "initial"
    ? "Front/back behavior is authored data"
    : "Nurse ↔ Pixie swap changed the forecast";
}

function renderForecast() {
  const list = document.querySelector("#forecast-list");
  list.replaceChildren();
  const previous = new Set(previousForecast.map(forecastSignature));

  for (const entry of currentForecast) {
    const row = document.createElement("li");
    const changedNow = previousForecast.length > 0 && !previous.has(forecastSignature(entry));
    row.className = `forecast-row ${unitIsEnemy(entry.actor) ? "enemy" : "party"} ${changedNow ? "changed" : ""}`;
    row.dataset.actor = entry.actor;
    row.innerHTML = `
      <span class="forecast-order">${entry.order}</span>
      <span class="forecast-actor">${nameOf(entry.actor)}</span>
      <span class="forecast-action">${entry.action}</span>
      <span class="forecast-target">→ ${entry.targets.map(nameOf).join(", ")}</span>
      <span class="forecast-speed">${entry.action_speed}</span>`;
    list.append(row);
  }

  document.querySelector("#forecast-note").textContent = stage === "resolved"
    ? "Transcript resolved from the locked post-potion forecast"
    : `${currentForecast.length} actions · higher speed first`;
}

function renderStatus() {
  const badge = document.querySelector("#stage-badge");
  badge.textContent = stageLabels[stage];
  const inventoryCount = state.summoner.inventory.potionSmall;
  document.querySelector("#inventory-note").textContent = `Small Potion ×${inventoryCount}`;

  const swapButton = document.querySelector("#swap-button");
  const potionButton = document.querySelector("#potion-button");
  const resolveButton = document.querySelector("#resolve-button");
  swapButton.disabled = stage !== "initial";
  potionButton.disabled = stage !== "formation";
  resolveButton.disabled = stage !== "summoner";

  const status = document.querySelector("#semantic-status");
  const summary = document.querySelector("#transcript-summary");
  if (stage === "initial") {
    status.textContent = "Awaiting intervention";
    summary.textContent = `Fixture ${sharedFixture.seed} forecasted synchronously from ${sharedFixture.id}.`;
  } else if (stage === "formation") {
    status.textContent = "Formation reforecast";
    summary.textContent = "The domain swapped Nurse and Pixie, then produced a new forecast before the presentation redrew.";
  } else if (stage === "summoner") {
    status.textContent = "Summoner reforecast";
    summary.textContent = "Small Potion changed Nurse to 16/20 HP; Triage now targets Pixie. The next exchange is locked.";
  } else {
    status.textContent = `${transcript.length} semantic events`;
    summary.textContent = "The locked forecast resolved to the exact fixture transcript and final state. No animation callback or timeout applied these results.";
  }
}

function render() {
  room.updateBattle(state);
  renderFormation();
  renderForecast();
  renderStatus();
}

function commandSwap() {
  previousForecast = currentForecast;
  state = swapPartySlots(state);
  currentForecast = forecast(state);
  stage = "formation";
  render();
}

function commandPotion() {
  previousForecast = currentForecast;
  state = useSmallPotion(state);
  currentForecast = forecast(state);
  stage = "summoner";
  render();
}

function commandResolve() {
  const result = resolveLockedForecast(state, currentForecast);
  state = result.state;
  transcript = result.transcript;
  stage = "resolved";
  render();
}

document.querySelector("#swap-button").addEventListener("click", commandSwap);
document.querySelector("#potion-button").addEventListener("click", commandPotion);
document.querySelector("#resolve-button").addEventListener("click", commandResolve);

window.threeControl = {
  THREE_REVISION: THREE.REVISION,
  stage: () => stage,
  getState: () => structuredClone(state),
  getForecast: () => structuredClone(currentForecast),
  getTranscript: () => structuredClone(transcript),
  getProjectedState: () => projectState(state),
  drawNow: () => room.renderFrame(),
  commands: { swap: commandSwap, potion: commandPotion, resolve: commandResolve },
  evidence: {
    renderer: room.renderer.domElement.dataset.renderer,
    logicalResolution: room.renderer.domElement.dataset.logicalResolution,
    renderCount: () => room.renderCount,
    customMaterial: room.fogMaterials[0].userData.controlFog
  }
};

render();
document.body.dataset.threeControlReady = "true";
window.__threeControlReady = true;

// The render loop only draws the latest semantic snapshot. It never advances
// the battle or schedules a state mutation.
