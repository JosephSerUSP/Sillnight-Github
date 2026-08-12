import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const artifactDir = join(repoRoot, 'verification', 'artifacts');

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.wasm', 'application/wasm'],
  ['.efkefc', 'application/octet-stream']
]);

function contentType(path) {
  return mimeTypes.get(extname(path).toLowerCase()) ?? 'application/octet-stream';
}

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://localhost');
      const pathname = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
      const relativePath = normalize(pathname.replace(/^[/\\]+/, ''));
      const absolutePath = resolve(repoRoot, relativePath);

      if (absolutePath !== repoRoot && !absolutePath.startsWith(`${repoRoot}/`) && !absolutePath.startsWith(`${repoRoot}\\`)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }

      const body = await readFile(absolutePath);
      response.writeHead(200, {
        'Content-Type': contentType(absolutePath),
        'Cache-Control': 'no-store'
      });
      response.end(body);
    } catch (error) {
      response.writeHead(error?.code === 'ENOENT' ? 404 : 500);
      response.end(error?.code === 'ENOENT' ? 'Not found' : String(error));
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine verification server port.');
  }

  return {
    server,
    origin: `http://127.0.0.1:${address.port}`
  };
}

async function checkDataIntegrity(page) {
  return page.evaluate(() => {
    const creatures = window.Game.Services.get('CreatureRegistry').getAll();
    const skills = window.Game.Services.get('SkillRegistry');
    const passives = window.Game.Services.get('PassiveRegistry');
    const errors = [];
    const seen = new Set();

    for (const creature of creatures) {
      if (!creature?.id) {
        errors.push('Creature without an id.');
        continue;
      }
      if (seen.has(creature.id)) errors.push(`Duplicate creature id: ${creature.id}`);
      seen.add(creature.id);

      for (const skillId of (creature.acts ?? []).flat()) {
        if (!skills.get(skillId)) {
          errors.push(`${creature.id} references missing skill ${skillId}`);
        }
      }

      for (const passiveId of creature.passives ?? []) {
        if (!passives.get(passiveId)) {
          errors.push(`${creature.id} references missing passive ${passiveId}`);
        }
      }
    }

    if (errors.length > 0) throw new Error(errors.join('\n'));

    return {
      creatures: creatures.length,
      skills: skills.getAll().length,
      passives: passives.getAll().length
    };
  });
}

async function checkMapGeneration(page) {
  return page.evaluate(async () => {
    const { Game_Map } = await import('/src/game/classes/Game_Map.js');
    const map = new Game_Map();
    map.setup(1);

    if (!(map.width > 0 && map.height > 0)) {
      throw new Error(`Generated map has invalid dimensions ${map.width}x${map.height}`);
    }
    if (map._data.length !== map.height || map._data.some((row) => row.length !== map.width)) {
      throw new Error('Generated map grid dimensions do not match width/height.');
    }

    const { x, y } = map.playerPos;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
      throw new Error(`Player start is out of bounds: ${x},${y}`);
    }
    if (map._data[y][x] !== 0) {
      throw new Error(`Player start is not on a walkable tile: ${map._data[y][x]}`);
    }

    let stairs = 0;
    for (const row of map._data) {
      for (const tile of row) {
        if (tile === 3) stairs += 1;
      }
    }
    if (stairs < 1) throw new Error('Generated floor contains no stairs tile.');

    for (const event of map.events) {
      if (event.x < 0 || event.y < 0 || event.x >= map.width || event.y >= map.height) {
        throw new Error(`Generated event is out of bounds: ${event.x},${event.y}`);
      }
    }

    return {
      width: map.width,
      height: map.height,
      stairs,
      events: map.events.length
    };
  });
}

async function checkBattleServices(page) {
  return page.evaluate(() => {
    const manager = window.Game.BattleManager;
    const registry = window.Game.Services.get('EffectRegistry');
    const previous = {
      allies: manager.allies,
      enemies: manager.enemies,
      queue: manager.queue,
      turnIndex: manager.turnIndex,
      roundCount: manager.roundCount,
      playerTurnRequested: manager.playerTurnRequested,
      phase: manager.phase
    };

    try {
      const ally = { uid: 'verify-ally', hp: 10 };
      const enemy = { uid: 'verify-enemy', hp: 10 };
      manager.setup([ally], [enemy]);

      if (manager.allies[0] !== ally || manager.enemies[0] !== enemy) {
        throw new Error('BattleManager.setup did not retain the supplied combatants.');
      }
      if (manager.queue.length !== 0 || manager.turnIndex !== 0 || manager.roundCount !== 0 || manager.phase !== 'INIT') {
        throw new Error('BattleManager.setup did not reset battle flow state.');
      }
      if (!registry || typeof registry.apply !== 'function') {
        throw new Error('EffectRegistry is unavailable after game initialization.');
      }

      return { phase: manager.phase, effectRegistry: true };
    } finally {
      manager.allies = previous.allies;
      manager.enemies = previous.enemies;
      manager.queue = previous.queue;
      manager.turnIndex = previous.turnIndex;
      manager.roundCount = previous.roundCount;
      manager.playerTurnRequested = previous.playerTurnRequested;
      manager.phase = previous.phase;
    }
  });
}

async function checkUiNavigation(page) {
  await page.keyboard.press('p');
  const partyModal = page.locator('#party-modal');
  await partyModal.waitFor({ state: 'visible' });

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await partyModal.waitFor({ state: 'hidden' });

  await page.keyboard.press('b');
  const inventoryModal = page.locator('#inventory-modal');
  await inventoryModal.waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await inventoryModal.waitFor({ state: 'hidden' });

  return { partyMenu: true, inventory: true };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  const { server, origin } = await startStaticServer();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    server.close();
    console.error('Unable to launch Playwright Chromium. Run: npx playwright install chromium');
    throw error;
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  try {
    console.log(`Verification server: ${origin}`);
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.Game?.ready === true, null, { timeout: 20_000 });
    await page.locator('#hud').waitFor({ state: 'visible' });

    console.log('✓ boot: Game.ready and HUD visible');

    const data = await checkDataIntegrity(page);
    console.log(`✓ data: ${data.creatures} creatures, ${data.skills} skills, ${data.passives} passives`);

    const map = await checkMapGeneration(page);
    console.log(`✓ map: ${map.width}x${map.height}, ${map.stairs} stairs, ${map.events} events`);

    const battle = await checkBattleServices(page);
    console.log(`✓ battle: manager reset contract, EffectRegistry available (${battle.phase})`);

    const ui = await checkUiNavigation(page);
    console.log(`✓ ui: party menu=${ui.partyMenu}, inventory=${ui.inventory}`);

    if (pageErrors.length > 0) {
      throw new Error(`Browser page errors:\n${pageErrors.map((error) => error.stack ?? error.message).join('\n\n')}`);
    }

    console.log('\nVerification passed.');
  } catch (error) {
    const failurePath = join(artifactDir, 'verify-failure.png');
    await page.screenshot({ path: failurePath, fullPage: true }).catch(() => {});
    console.error(`\nVerification failed. Failure screenshot: ${failurePath}`);
    throw error;
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
