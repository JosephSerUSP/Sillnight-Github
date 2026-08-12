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

const assertStaticContract = async () => {
  const sourceIndex = await readFile(join(repoRoot, 'index.html'), 'utf8');
  const builtIndex = await readFile(join(distRoot, 'index.html'), 'utf8');
  const sourceThree = await readFile(join(repoRoot, 'node_modules', 'three', 'build', 'three.module.js'));
  const builtThree = await readFile(join(distRoot, 'vendor', 'three.module.js'));
  const adapter = await readFile(join(repoRoot, 'src', 'game', 'runtime', 'ThreeRuntime.js'), 'utf8');
  const bootstrap = await readFile(join(repoRoot, 'src', 'game', 'bootstrap.js'), 'utf8');

  if (!sourceIndex.includes('"three": "./node_modules/three/build/three.module.js"')) {
    throw new Error('Source index does not map the bare three specifier to the pinned package ESM build.');
  }
  if (!sourceIndex.includes('src/game/bootstrap.js')) throw new Error('Source index does not boot through bootstrap.js.');
  if (sourceIndex.includes('three.min.js')) throw new Error('Source index still references the legacy classic Three.js build.');

  if (!builtIndex.includes('"three": "./vendor/three.module.js"')) {
    throw new Error('Built index does not map the bare three specifier to vendor/three.module.js.');
  }
  if (builtIndex.includes('node_modules/three/')) throw new Error('Built index still references node_modules/three/.');
  if (builtIndex.includes('three.min.js')) throw new Error('Built index still references the classic Three.js build.');
  if (!builtThree.equals(sourceThree)) throw new Error('Built Three ESM module does not match the pinned npm package byte-for-byte.');
  if (!adapter.includes("import * as THREE from 'three'")) throw new Error('ThreeRuntime is not backed by the package ESM module.');
  if (!bootstrap.includes("await import('./main.js')")) throw new Error('Bootstrap does not defer main.js until after Three runtime initialization.');

  for (const asset of [
    'src/game/bootstrap.js',
    'src/game/main.js',
    'src/game/runtime/ThreeRuntime.js',
    'src/libs/effekseer.min.js'
  ]) {
    await stat(join(distRoot, asset));
  }
};

await assertStaticContract();

const screenshotDir = await mkdtemp(join(tmpdir(), 'sillnight-three-esm-'));
const browser = await chromium.launch({ headless: true });

try {
  for (const target of [
    { label: 'source', rootDir: repoRoot, expectedModule: 'node_modules/three/build/three.module.js' },
    { label: 'built dist', rootDir: distRoot, expectedModule: 'vendor/three.module.js' }
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
        const runtime = await import('/src/game/runtime/ThreeRuntime.js');
        const fog = await import('/src/game/materials/FogMaterial.js');
        const renderer = window.Game.RenderManager.getRenderer();
        const attrs = renderer?.getContextAttributes?.() ?? {};
        const probeMaterial = new runtime.THREE.MeshStandardMaterial();
        const returnedMaterial = fog.modifyMaterialWithFog(probeMaterial, true);
        const importMap = JSON.parse(document.querySelector('script[type="importmap"]')?.textContent ?? '{}');

        return {
          ready: window.Game?.ready === true,
          revision: runtime.THREE?.REVISION,
          runtimeSource: runtime.threeRuntimeInfo?.source,
          runtimeSpecifier: runtime.threeRuntimeInfo?.moduleSpecifier,
          compatibilityGlobal: runtime.threeRuntimeInfo?.compatibilityGlobal,
          globalMatchesEsm: window.THREE === runtime.THREE,
          diagnosticsMatchRuntime: window.__SILLNIGHT_THREE_RUNTIME__ === runtime.threeRuntimeInfo,
          rendererUsesEsmRuntime: renderer instanceof runtime.THREE.WebGLRenderer,
          rendererType: renderer?.constructor?.name,
          canvasWidth: renderer?.domElement?.width,
          canvasHeight: renderer?.domElement?.height,
          antialias: attrs.antialias,
          pixelRatio: renderer?.getPixelRatio?.(),
          preserveDrawingBuffer: attrs.preserveDrawingBuffer,
          importMapThree: importMap.imports?.three,
          fogUsesEsmRuntime: returnedMaterial === probeMaterial
            && probeMaterial.transparent === true
            && probeMaterial.extensions?.shaderTextureLOD === true
            && typeof probeMaterial.onBeforeCompile === 'function'
        };
      });

      const esmRequests = requestedUrls.filter(url => /\/three\.module\.js(?:$|\?)/i.test(url));
      const classicRequests = requestedUrls.filter(url => /\/three(?:\.min)?\.js(?:$|\?)/i.test(url) && !/three\.module\.js/i.test(url));
      const cdnThreeRequests = requestedUrls.filter(url => /cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js/i.test(url));

      if (!evidence.ready) throw new Error(`${target.label}: Game.ready is not true.`);
      if (String(evidence.revision) !== '128') throw new Error(`${target.label}: expected Three r128, got ${evidence.revision}.`);
      if (evidence.runtimeSource !== 'package-esm-compatibility-bridge') throw new Error(`${target.label}: unexpected runtime source ${evidence.runtimeSource}.`);
      if (evidence.runtimeSpecifier !== 'three') throw new Error(`${target.label}: runtime is not using the bare three module specifier.`);
      if (evidence.compatibilityGlobal !== true || !evidence.globalMatchesEsm) throw new Error(`${target.label}: legacy global is not the exact ESM runtime namespace.`);
      if (!evidence.diagnosticsMatchRuntime) throw new Error(`${target.label}: runtime diagnostics do not identify the active ESM runtime.`);
      if (!evidence.rendererUsesEsmRuntime) throw new Error(`${target.label}: RenderManager renderer does not come from the ESM runtime.`);
      if (!evidence.fogUsesEsmRuntime) throw new Error(`${target.label}: FogMaterial probe did not use the ESM runtime.`);
      if (evidence.canvasWidth !== 480 || evidence.canvasHeight !== 270) throw new Error(`${target.label}: renderer size changed to ${evidence.canvasWidth}x${evidence.canvasHeight}.`);
      if (evidence.pixelRatio !== 1) throw new Error(`${target.label}: pixel ratio changed to ${evidence.pixelRatio}.`);
      if (evidence.antialias !== false) throw new Error(`${target.label}: antialias changed to ${evidence.antialias}.`);
      if (evidence.preserveDrawingBuffer !== true) throw new Error(`${target.label}: preserveDrawingBuffer changed.`);
      if (!String(evidence.importMapThree).endsWith(target.expectedModule)) throw new Error(`${target.label}: import map points to ${evidence.importMapThree}.`);
      if (!esmRequests.some(url => url.endsWith(`/${target.expectedModule}`))) throw new Error(`${target.label}: expected ESM runtime request was not observed.`);
      if (classicRequests.length > 0) throw new Error(`${target.label}: classic Three runtime was requested: ${classicRequests.join(' | ')}`);
      if (cdnThreeRequests.length > 0) throw new Error(`${target.label}: Three CDN request was made: ${cdnThreeRequests.join(' | ')}`);
      if (pageErrors.length > 0) throw new Error(`${target.label}: page errors: ${pageErrors.join(' | ')}`);

      const screenshotPath = join(screenshotDir, `${target.label.replace(/\s+/g, '-')}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`${target.label} Three ESM runtime smoke passed:`, { ...evidence, esmRequests, consoleErrors, screenshotPath });
      await page.close();
    } finally {
      await new Promise(resolveClose => server.close(resolveClose));
    }
  }
} finally {
  await browser.close();
}
