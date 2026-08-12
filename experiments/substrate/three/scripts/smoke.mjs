import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const root = process.cwd();
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const evidenceDir = path.join(root, "evidence");
await mkdir(evidenceDir, { recursive: true });

const viteEntry = path.join(root, "node_modules", "vite", "bin", "vite.js");
const server = spawn(process.execPath, [viteEntry, "--host", "127.0.0.1", "--port", String(port)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"]
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Vite did not start. Output:\n${serverOutput}`);
}

try {
  await waitForServer();
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl"]
  });
  const page = await browser.newPage({ viewport: { width: 1360, height: 820 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__threeControlReady === true);
  await page.evaluate(() => window.threeControl.drawNow());
  await page.waitForTimeout(100);

  const initialEvidence = await page.evaluate(() => window.threeControl.evidence);
  console.log("Canvas diagnostics:", await page.evaluate(() => {
    const canvas = document.querySelector("#world-surface canvas");
    return {
      canvas: canvas ? { width: canvas.width, height: canvas.height, cssWidth: canvas.getBoundingClientRect().width, cssHeight: canvas.getBoundingClientRect().height } : null,
      webgl2: Boolean(canvas?.getContext("webgl2")),
      webgl: Boolean(canvas?.getContext("webgl")),
      computedBackground: getComputedStyle(document.querySelector("#world-surface")).backgroundColor
    };
  }));
  console.log("Render count:", await page.evaluate(() => window.threeControl.evidence.renderCount()));
  const canvasDataUrlLength = await page.evaluate(() => document.querySelector("#world-surface canvas").toDataURL().length);
  console.log("Canvas data URL length:", canvasDataUrlLength);
  if (canvasDataUrlLength < 3000) throw new Error("World canvas did not produce a non-trivial WebGL frame.");
  if (initialEvidence.renderer !== "WebGLRenderer") throw new Error("The control did not boot WebGLRenderer.");
  if (initialEvidence.logicalResolution !== "320x180") throw new Error("World resolution is not deliberately low-resolution.");
  if (initialEvidence.customMaterial?.injection !== "MeshStandardMaterial.onBeforeCompile") {
    throw new Error("The representative custom fog material did not boot.");
  }

  await page.screenshot({ path: path.join(evidenceDir, "initial-forecast.png"), fullPage: true });
  await page.locator("#world-surface").screenshot({ path: path.join(evidenceDir, "room-fog-material.png") });

  await page.click("#swap-button");
  await page.waitForFunction(() => window.threeControl.stage() === "formation");
  await page.evaluate(() => window.threeControl.drawNow());
  const formationCheck = await page.evaluate(() => window.threeControl.getForecast()[0]);
  if (formationCheck.actor !== "nurse" || formationCheck.action !== "triage") throw new Error("Formation reforecast did not put Nurse/Triage first.");
  await page.screenshot({ path: path.join(evidenceDir, "post-formation-forecast.png"), fullPage: true });

  await page.click("#potion-button");
  await page.waitForFunction(() => window.threeControl.stage() === "summoner");
  await page.evaluate(() => window.threeControl.drawNow());
  const potionCheck = await page.evaluate(() => ({ forecast: window.threeControl.getForecast()[0], hp: window.threeControl.getState().party.find((unit) => unit.id === "nurse").hp }));
  if (potionCheck.forecast.targets[0] !== "pixie" || potionCheck.hp !== 16) throw new Error("Small Potion reforecast did not target Pixie from Nurse/Triage.");
  await page.screenshot({ path: path.join(evidenceDir, "post-summoner-forecast.png"), fullPage: true });

  await page.click("#resolve-button");
  await page.waitForFunction(() => window.threeControl.stage() === "resolved");
  await page.evaluate(() => window.threeControl.drawNow());
  const finalCheck = await page.evaluate(() => ({
    transcript: window.threeControl.getTranscript(),
    state: window.threeControl.getProjectedState()
  }));
  if (finalCheck.transcript.length !== 8 || finalCheck.state.enemies.lantern_wight.hp !== 1) {
    throw new Error("Locked forecast did not produce the expected semantic result.");
  }
  await page.screenshot({ path: path.join(evidenceDir, "resolved-transcript.png"), fullPage: true });

  await browser.close();
  if (pageErrors.length > 0) throw new Error(`Browser page errors:\n${pageErrors.join("\n")}`);
  console.log(`Three.js browser smoke passed. Evidence written to ${path.relative(root, evidenceDir)}.`);
} finally {
  server.kill();
}
