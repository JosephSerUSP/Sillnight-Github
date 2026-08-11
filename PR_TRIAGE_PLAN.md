# Sillnight — PR Backlog Triage Plan

**Status at assessment (2026-08-11):** 99 open PRs, 171 remote branches, 46 conflicting.
Last merge to `main`: #256. Backlog spans 2025-12-01 → 2026-07-20.

## Core finding

The backlog is not 99 contributions. It is roughly **8 clusters of repeated work**,
produced by a recurring Google Jules job that re-derived the same tasks nightly
against a `main` it never landed on. Triage by cluster, not by PR.

## Phase 0 — Stop the bleeding (do first)

- Disable/gate the recurring Jules schedule. Nothing else matters until new PRs stop arriving.
- Confirm no PR is mid-review by a human.

## Phase 1 — Cluster triage

For each cluster: pick ONE survivor, close the rest with a comment referencing the survivor.

| # | Cluster | Approx count | Representative PRs | Recommended survivor |
|---|---------|-------------|--------------------|----------------------|
| 1 | Documentation drift audit | ~25 | 279, 271, 242, 225, 287, 281, 277, 275, 267, 260, 246, 240, 238, 236, 233, 231, 224, 222, 220, 218, 211, 269 | Newest that applies cleanly (start #287) |
| 2 | AudioService / audio system | ~9 | 286, 284, 282, 276, 272, 270, 268, 266, 264 | Most complete implementation; compare 282 vs 286 |
| 3 | Architecture assessment / rewrite proposals | ~7 | 157, 159, 160, 161, 162, 150, 147 | Likely close ALL — superseded by REFACTOR_PLAN.md |
| 4 | Fog of War wall displacement | ~5 | 126, 128, 132, 134, 135 | Newest (#135, hybrid world/view space) |
| 5 | Battle transitions / shatter effect | ~4 | 201, 203, 206, 208 | Newest complete pair |
| 6 | Window/party layout | ~3 | 107, 110, 111 | Evaluate individually |
| 7 | Reactive variables/switches | ~2 | 274, 278 | 278 (broader) |
| 8 | Genuine one-offs — review individually | ~10 | 288, 216, 257, 204, 120, 105, 128, 165, 223, 245 | Each on merit |

## Phase 2 — Branch cleanup

After PR closure, prune merged/closed remote branches (171 → expect <20).

## Phase 3 — Prevent recurrence

- Add `README.md` and `CLAUDE.md`/agent guidance (currently absent).
- Wire a real test script into `package.json` (Playwright is a devDep but unwired;
  `verification/` holds ad-hoc Python/JS scripts instead).
- If Jules is re-enabled: cap concurrent open PRs, and make doc-drift a single
  long-lived branch that rebases rather than a new PR per run.

## Rules of engagement

- Never merge two PRs from the same cluster.
- Prefer closing over merging when a PR is docs-only and >2 months stale —
  the docs it describes have drifted again since.
- Any PR touching `src/game/systems` or `src/game/managers` needs a real read,
  not a title-based decision.
