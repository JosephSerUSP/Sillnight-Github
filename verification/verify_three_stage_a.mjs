import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)), '..');
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

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const relative = normalize(pathname.replace(/^[/\\]+/, ''));
    const absolute = resolve(repoRoot, relative);
    const rootPrefix = repoRoot.endsWith('/') || repoRoot.endsWith('\\') ? repoRoot : `${repoRoot}/`;
    const windowsPrefix = `${repoRoot}\\`;
    if (absolute !== repoRoot && !absolute.startsWith(rootPrefix) && !absolute.startsWith(windowsPrefix)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(absolute);
    response.writeHead(200, { 'content-type': mime.get(extname(absolute).toLowerCase()) ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const { port } = server.address();
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.Game?.ready === true, null, { timeout: 15000 });

  const evidence = await page.evaluate(() => {
    const renderer = window.Game.RenderManager.getRenderer();
    return {
      revision: window.THREE?.REVISION,
      isWebGLRenderer: renderer?.isWebGLRenderer === true,
      canvasWidth: renderer?.domElement?.width,
      canvasHeight: renderer?.domElement?.height,
      antialias: renderer?.getContextAttributes?.().antialias,
      pixelRatio: renderer?.getPixelRatio?.(),
      preserveDrawingBuffer: renderer?.getContextAttributes?.().preserveDrawingBuffer
    };
  });

  if (String(evidence.revision) !== '128') throw new Error(`Expected THREE.REVISION 128, got ${evidence.revision}`);
  if (!evidence.isWebGLRenderer) throw new Error('Production renderer is not a WebGLRenderer.');
  if (evidence.canvasWidth !== 480 || evidence.canvasHeight !== 270) {
    throw new Error(`Expected 480x270 renderer canvas, got ${evidence.canvasWidth}x${evidence.canvasHeight}`);
  }
  if (evidence.pixelRatio !== 1) throw new Error(`Expected renderer pixel ratio 1, got ${evidence.pixelRatio}`);
  if (evidence.antialias !== false) throw new Error(`Expected antialias=false, got ${evidence.antialias}`);
  if (evidence.preserveDrawingBuffer !== true) throw new Error('preserveDrawingBuffer must remain enabled for transitions.');
  if (pageErrors.length > 0) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);

  console.log('Three.js Stage A smoke passed:', evidence);
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
