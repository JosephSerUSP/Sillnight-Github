import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(repoRoot, 'dist');
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.wasm', 'application/wasm'],
  ['.efkefc', 'application/octet-stream']
]);

const createStaticServer = rootDir => createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const relative = normalize(pathname.replace(/^[/\\]+/, ''));
    const absolute = resolve(rootDir, relative);
    const allowed = absolute === rootDir || absolute.startsWith(`${rootDir}/`) || absolute.startsWith(`${rootDir}\\`);
    if (!allowed) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }
    const body = await readFile(absolute);
    response.writeHead(200, { 'content-type': mime.get(extname(absolute).toLowerCase()) ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

const assertBuiltOutput = async () => {
  const builtIndex = await readFile(join(distRoot, 'index.html'), 'utf8');
  const sourceThree = await readFile(join(repoRoot, 'node_modules', 'three', 'build', 'three.min.js'));
  const builtThree = await readFile(join(distRoot, 'vendor', 'three.min.js'));
  const requiredAssets = [
    'src/game/main.js',
    'src/game/runtime/ThreeRuntime.js',
    'src/libs/effekseer.min.js'
  ];

  if (!builtIndex.includes('vendor/three.min.js')) throw new Error('dist/index.html does not reference vendor/three.min.js.');
  if (builtIndex.includes('node_modules/three/')) throw new Error('dist/index.html still references node_modules/three/.');
  if (builtIndex.includes('cdnjs.cloudflare.com/ajax/libs/three.js')) throw new Error('dist/index.html still references the Three.js CDN.');
  if (!builtThree.equals(sourceThree)) throw new Error('dist/vendor/three.min.js does not match the pinned npm Three.js build.');

  for (const asset of requiredAssets) {
    await stat(join(distRoot, asset));
  }
};

const assertAdapterSources = async () => {
  const renderManager = await readFile(join(repoRoot, 'src', 'game', 'managers', 'RenderManager.js'), 'utf8');
  const fogMaterial = await readFile(join(repoRoot, 'src', 'game', 'materials', 'FogMaterial.js'), 'utf8');
  const adapter = await readFile(join(repoRoot, 'src', 'game', 'runtime', 'ThreeRuntime.js'), 'utf8');

  if (!renderManager.includes("from '../runtime/ThreeRuntime.js'")) {
    throw new Error('RenderManager is not routed through ThreeRuntime.');
  }
  if (!fogMaterial.includes("from '../runtime/ThreeRuntime.js'")) {
    throw new Error('FogMaterial is not routed through ThreeRuntime.');
  }
  if (!adapter.includes('globalThis.THREE')) {
    throw new Error('ThreeRuntime no longer documents/owns the current legacy global boundary.');
  }
};

await assertBuiltOutput();
await assertAdapterSources();

const screenshotDir = await mkdtemp(join(tmpdir(), 'sillnight-three-runtime-'));
const browser = await chromium.launch({ headless: true });

try {
  for (const target of [
    { label: 'source', rootDir: repoRoot, expectedScript: 'node_modules/three/build/three.min.js' },
    { label: 'built dist', rootDir: distRoot, expectedScript: 'vendor/three.min.js' }
  ]) {
    const server = createStaticServer(target.rootDir);
    await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
    const { port } = server.address();

    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const pageErrors = [];
      const consoleErrors = [];
      const requestedUrls = [];
      page.on('pageerror', error => pageErrors.push(String(error)));
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('request', request => requestedUrls.push(request.url()));
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.Game?.ready === true, null, { timeout: 15000 });

      const evidence = await page.evaluate(async () => {
        const renderer = window.Game.RenderManager.getRenderer();
        const attrs = renderer?.getContextAttributes?.() ?? {};
        const runtime = await import('/src/game/runtime/ThreeRuntime.js');
        const fog = await import('/src/game/materials/FogMaterial.js');
        const probeMaterial = new runtime.THREE.MeshStandardMaterial();
        const returnedMaterial = fog.modifyMaterialWithFog(probeMaterial, true);

        return {
          ready: window.Game?.ready === true,
          revision: window.THREE?.REVISION,
          adapterRevision: runtime.threeRuntimeInfo?.revision,
          adapterSource: runtime.threeRuntimeInfo?.source,
          adapterMatchesGlobal: runtime.THREE === window.THREE,
          rendererUsesAdapterRuntime: renderer instanceof runtime.THREE.WebGLRenderer,
          rendererType: renderer?.constructor?.name,
          canvasWidth: renderer?.domElement?.width,
          canvasHeight: renderer?.domElement?.height,
          antialias: attrs.antialias,
          pixelRatio: renderer?.getPixelRatio?.(),
          preserveDrawingBuffer: attrs.preserveDrawingBuffer,
          fogAdapterUsesRuntime: returnedMaterial === probeMaterial
            && probeMaterial.transparent === true
            && probeMaterial.extensions?.shaderTextureLOD === true
            && typeof probeMaterial.onBeforeCompile === 'function'
        };
      });

      const threeRequests = requestedUrls.filter(url => /three/i.test(url));
      const cdnThreeRequests = threeRequests.filter(url => /cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js/i.test(url));
      if (!evidence.ready) throw new Error(`${target.label}: Game.ready is not true.`);
      if (String(evidence.revision) !== '128') throw new Error(`${target.label}: expected THREE.REVISION 128, got ${evidence.revision}`);
      if (String(evidence.adapterRevision) !== '128') throw new Error(`${target.label}: adapter revision mismatch: ${evidence.adapterRevision}`);
      if (evidence.adapterSource !== 'legacy-global-adapter') throw new Error(`${target.label}: unexpected adapter source ${evidence.adapterSource}`);
      if (!evidence.adapterMatchesGlobal) throw new Error(`${target.label}: ThreeRuntime does not reference the production global Three instance.`);
      if (!evidence.rendererUsesAdapterRuntime) throw new Error(`${target.label}: RenderManager renderer is not owned by the ThreeRuntime adapter instance.`);
      if (!evidence.fogAdapterUsesRuntime) throw new Error(`${target.label}: FogMaterial adapter probe failed.`);
      if (evidence.canvasWidth !== 480 || evidence.canvasHeight !== 270) {
        throw new Error(`${target.label}: expected 480x270 renderer canvas, got ${evidence.canvasWidth}x${evidence.canvasHeight}`);
      }
      if (evidence.pixelRatio !== 1) throw new Error(`${target.label}: expected renderer pixel ratio 1, got ${evidence.pixelRatio}`);
      if (evidence.antialias !== false) throw new Error(`${target.label}: expected antialias=false, got ${evidence.antialias}`);
      if (evidence.preserveDrawingBuffer !== true) throw new Error(`${target.label}: preserveDrawingBuffer must remain enabled for transitions.`);
      if (cdnThreeRequests.length > 0) throw new Error(`${target.label}: Three.js CDN request was made: ${cdnThreeRequests.join(' | ')}`);
      if (!threeRequests.some(url => url.endsWith(`/${target.expectedScript}`))) {
        throw new Error(`${target.label}: expected Three.js runtime request ${target.expectedScript} was not observed.`);
      }
      if (pageErrors.length > 0) throw new Error(`${target.label}: page errors: ${pageErrors.join(' | ')}`);

      const screenshotPath = join(screenshotDir, `${target.label.replace(/\s+/g, '-')}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`${target.label} Three runtime boundary smoke passed:`, { ...evidence, threeRequests, consoleErrors, screenshotPath });
      await page.close();
    } finally {
      await new Promise(resolveClose => server.close(resolveClose));
    }
  }
} finally {
  await browser.close();
}
