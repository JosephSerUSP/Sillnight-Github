# Maintained verification surface

The maintained repository verification entrypoint is:

```bash
npm install
npx playwright install chromium
npm run verify
```

`npm run verify` starts its own local static server on an ephemeral loopback port and runs the current maintained browser-backed checks. You do **not** need to start `python -m http.server` separately.

## Current gates

The first maintained slice verifies:

- **boot:** the real application reaches `Game.ready` and the HUD is visible;
- **data integrity:** resolved creature IDs are unique and all referenced skills/passives exist in their registries;
- **map generation:** a fresh floor can be generated without mutating the live `$gameMap`, with valid dimensions, player start, stairs, and in-bounds events;
- **battle bootstrap:** `BattleManager.setup()` resets its core flow state and the effect registry is available;
- **UI navigation:** the real Party and Inventory modals open, accept navigation, and close through the normal input path.

Failures exit nonzero. When the browser portion fails, the runner attempts to write `verification/artifacts/verify-failure.png`; that directory is ignored by Git.

## Current limitation: external runtime assets

Production `index.html` still loads Three.js, Tailwind, and the VT323 font from public CDNs. Therefore the current browser verification requires network access to boot the production page. This is an existing runtime dependency, not a new requirement introduced by the verification runner.

Issue #304 is responsible for modernizing the Three.js/runtime dependency boundary. Once those production dependencies are local/package-managed, this verification entrypoint should become correspondingly more self-contained.

## Legacy verification files

The older scripts in this directory are retained for now. Some encode useful historical checks or visual evidence, but they are **not** automatically part of the maintained gate because several depend on a separately installed Python Playwright environment, hard-coded Jules paths, screenshot-only interpretation, or non-failing `FAILURE` prints.

Per #303, archive or remove them only after their still-relevant behavior is represented by maintained checks.

## Next additions

As production architecture is extracted under #290, deterministic battle semantics should be added here as fast non-visual checks, with browser automation reserved for integration/presentation behavior. The battle effect-authority slice in draft PR #318 is the first such candidate once it lands.
