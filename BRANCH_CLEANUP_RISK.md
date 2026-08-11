# Remote Branch Cleanup and Deletion Risk

**Repository:** `JosephSerUSP/Sillnight-Github`  
**Snapshot date:** 2026-08-11  
**Current main:** `6d0ed7e`
**Remote refs reviewed:** 97 baseline non-`main` branches; 90 remain after seven verified duplicate deletions
**Open pull requests:** 0

The complete branch-by-branch evidence is in [BRANCH_CLEANUP_AUDIT.md](BRANCH_CLEANUP_AUDIT.md) and [BRANCH_CLEANUP_AUDIT.csv](BRANCH_CLEANUP_AUDIT.csv). The final recovery bundle is stored outside the repository at `D:\Github\Sillnight-branch-archives\2026-08-11\sillnight-remote-branches-final-audit-2026-08-11.bundle`.

## Purpose

This document explains what remains in the remote branch backlog, why branch names and PR titles are not sufficient evidence for deletion, and how to finish cleanup without losing unmerged code, documentation, tests, or binary assets.

Deleting a remote branch deletes the convenient Git reference to its tip. It does not change commits already reachable from `main`, but it can make unmerged commits difficult to find and recover. GitHub may retain pull-request objects temporarily, but that is not a preservation strategy for source or binary work.

## Current cleanup boundary

The following work is already represented on current `main` as focused commits:

| Commit | Contents |
|---|---|
| `f711b10` | Documentation drift and implementation-gap notes. |
| `08739bd` | Selected event-driven `AudioService` integration. |
| `42b8674` | Reactive variable/switch events, action-speed turn ordering, and enemy action extraction. |
| `44a3cd6` | `BattleRenderSystem` ownership documentation. |
| `36be5cc` | README, roadmap, and triage-record alignment. |
| `9f2ac17` | Local `.claude` settings ignored. |
| `403b433` | Final PR-triage cleanup record. |

All 99 open PRs were closed with replacement-commit or future-Issue references. The category lists below describe the 97-branch baseline; the audit records the seven subsequently deleted duplicate refs and the 90 current retained refs. The remaining branches are therefore not open review work; they are either unmerged alternatives, historical snapshots, or refs without a currently associated PR.

## Risk model

### Low risk

Delete only when all of the following are true:

- The branch tip is an ancestor of `origin/main`, or the corresponding PR was merged and the merged result is verified on `main`.
- No branch-only assets, tests, or documentation are needed for a retained Issue.
- The deletion target is named explicitly and checked immediately before deletion.

### Medium risk

The branch overlaps a landed commit, but also contains mixed UI, data, verification, or documentation changes. Keep it until those extra changes are either ported, rejected with an Issue, or explicitly archived.

### High risk

The branch contains an unmerged architecture, rendering, transition, UI, data, or asset alternative. An Issue summary does not preserve the implementation itself. Retain the branch until the product decision is made or the useful parts are selectively ported.

## Branch families

### 1. Documentation audits — 30 refs

Representative refs:

`audit-documentation-drift-1279079876786371621`, `audit-documentation-drift-3331521598106175776`, `audit-documentation-drift-838137639763943067`, `audit-documentation-drift-9002616420988873752`, `doc-drift-audit-15100197966629171290`, `doc-drift-audit-17292721646525560420`, `doc-drift-audit-9865479593348390183`, `docs-audit-drift-9399199540632389225`, `docs-audit-synchronization-6894581242011254787`, `docs-audit-updates-1145650340972809569`, `docs-drift-audit-3080414279409390794`, `docs-update-drift-audit-11654786190562891071`, `docs-update-drift-audit-15711358919568912432`, `documentation-audit-14046895942092325370`, `documentation-audit-update-1430419203719429558`, `documentation-audit-updates-179830062199797946`, `documentation-audit-updates-2082069002758705748`, `documentation-audit-updates-9681998856619555653`, `documentation-drift-audit-10406535168140030955`, `documentation-drift-audit-13304102890181895345`, `documentation-drift-audit-1583803531309484466`, `documentation-drift-audit-17051027663290310438`, `documentation-drift-audit-4630824222758146546`, `documentation-rewrite-proposal`, `docs/revise-gameplay-guide`, `feat/gameplay-guide`, `walkthrough-design-15639535685884753731`, `doc-window-comparison`, `doc-window-refactor`, `doc-window-system-refactor`, and `doc-window-system-refactor-refined`.

Most are not documentation-only snapshots. Several were created from much older `main` and would appear to delete current architecture, data, registries, or renderer files when compared with today’s tip. For example, `doc-window-comparison` differs by roughly 137 files and includes an alternate full-project snapshot plus window architecture documents.

**Risk:** Low for repeated drift text already represented by `f711b10`; high for old snapshot branches containing distinct design documents, screenshots, or tests.  
**Related Issues:** #293, #298, #303, #305.

### 2. Architecture and renderer proposals — 14 refs

Representative refs:

`analysis-gameplay-emergence`, `architectural-analysis`, `architectural-analysis-report`, `architectural-refactor-phase-1`, `architecture-assessment`, `architecture-proposal-rewrite`, `documentation-rewrite-proposal`, `jules-stillnight-threejs-spec-22793016497390911`, `refactor-phase-1-complete`, `refactor-phase-1-final`, `refactor-phase2-registry-data-11108778643606894229`, `refactor-phase-3`, `rewrite-proposal`, and `stillnight-threejs-plugin-12732119604071080682`.

These branches propose materially different ownership boundaries: registry/strategy refactors, model/view separation, RPG Maker-style MVC, scene/spriteset lifecycle changes, formula-parser/DI work, and a Three.js plugin boundary. `architectural-analysis` alone differs by approximately 123 files, with thousands of insertions and deletions because it is a broad alternate snapshot rather than a focused patch.

**Risk:** High. Deleting these refs loses competing architecture proposals and branch-only implementation experiments.  
**Related Issues:** #290 and #304.

### 3. Audio implementations — 8 refs

Representative refs:

`jules-maintenance-audio-11583633844333495691`, `maintain-audio-integration-17985976936438372451`, `maintenance/audio-drift-report-15486914203244453182`, `maintenance/audio-element-refactor-9755390309044697866`, `maintenance/audio-system-3677687844805769385`, `maintenance/battle-refactor-audio-2570828225764409497`, `maintenance-audio-service-7105684685514338722`, and `refactor/reactive-ui-audio-7150135249304217381`.

The selected shared foundation is `08739bd`. The alternatives differ in AudioService API, scene-level BGM, cross-fading, asset layout, BattleObserver hooks, verification scripts, and unrelated element/UI changes. For example, `maintenance/audio-element-refactor-9755390309044697866` changes about 25 files with both additions and removals.

**Risk:** Low for duplicated AudioService-only implementations; medium for branches containing scene BGM, assets, verification, or element-rate work.  
**Related Issues:** #294 and #295.

### 4. Reactive backend and party UI — 12 refs

Representative refs:

`maintenance/reactive-state-events-8749322186825554881`, `maintenance/summoner-turn-params-1622379730779134202`, `maintenance-reactive-ui-and-cleanup-4445906571412925044`, `maintenance-reactivity-cleanup-4749837984488329422`, `maintenance-refactor-reactivity-10656735279742520841`, `party-menu-summoner-fix-14374155521116181425`, `refactor/phase-4-reactive-backend-6812772952284714320`, `refactor/reactive-ui-party-7296181845657522236`, `refactor-reactive-ui-6904314077815251248`, `refactor/reactive-ui-audio-7150135249304217381`, `window-refactor-phase-2-dynamic-height`, and `window-refactor-phase-2-fix-height`.

`42b8674` contains the selected narrow backend work. The remaining alternatives mix event emission with parameter getters, Summoner placement, reactive gauges, party-menu structure, and UI ownership. A representative backend branch changes roughly 68 files because it is based on an older architecture.

**Risk:** Medium to high. The backend subset is superseded, but party layout and reactive ownership remain product decisions.  
**Related Issues:** #293 and #299.

### 5. Fog of War — 9 refs

`fix/fog-of-war`, `fix-fog-of-war-animation`, `fix-fog-wall-displacement`, `fog-displacement-fix-v2`, `fog-displacement-fix-v3`, `fog-of-war-and-fix-spawn`, `fog-of-war-shader-fix`, `fog-persistence-fix`, and `vertex-warp-walls`.

These are not interchangeable fixes. They vary between persistent visibility textures, shader/material changes, interpolation, reveal-radius logic, WebGL2 texture sampling, and world-space versus view-space displacement. `fix/fog-of-war` differs by more than 120 files because it is a full older-system snapshot, not a safe incremental patch.

**Risk:** High. Deleting the refs removes shader experiments and visual verification material before a rendering contract is selected.  
**Related Issue:** #289.

### 6. Transitions and shatter — 4 refs

`battle-shatter-transition-15597759711949042376`, `feature/scene-transitions-9186627439843748144`, `feature/visual-transitions-8417055012383503091`, and `shatter-transition-11559666246248154339`.

These propose DOM/CSS transitions, shader swirls and wipes, and incompatible shatter mesh/shader implementations. The later shatter branch changes roughly 78 files relative to current `main`, so it cannot be treated as a small visual replacement.

**Risk:** High until timing, interruption, and rendering ownership are chosen.  
**Related Issue:** #291.

### 7. Independent features and bug fixes — 15 refs

Representative refs:

`battle-pacing-improvements`, `bugfix/recruit-error-fix`, `feat/data-editor-3972108228662286533`, `feat/randomized-starting-inventory`, `feature/camera-easing-summoner-pos-652246758887171837`, `feature/map-effects-and-popups-v2`, `fix/explore-effects-and-recruit`, `fix/shop-ui-persistence-17639534428531026715`, `fix-battle-pacing-13099592463894018345`, `fix-recruit-and-treasure-find`, `jules-fix-exp-math-5379748466734844540`, `maintenance-fix-verification-870040479274439439`, `maintenance-fix-verification-script-10796663856295131595`, `maintenance-verification-593669660290646820`, and `xp-calc-fix-1238135631318676896`.

These are not redundant by title alone. They cover recruit and treasure flows, an editor tool, randomized inventory, camera behavior, shop persistence, battle pacing, XP formulas, and verification harnesses. The data-editor branch alone adds roughly 820 lines and a separate tool surface.

**Risk:** Medium to high; each needs individual disposition.  
**Related Issues:** #292 and #296–#303.

### 8. Historical maintenance refs — 5 refs

`maintenance/fix-verification-script-12902203665249126600`, `maintenance-cleanup-todos-13252880406077690334`, `maintenance-refactor-battler-ui-12571708989504921944`, `maintenance-refactor-cleanup-2209106276973364194`, and `maintenance-task-15231775127487200430`.

These refs have no currently associated open PR and contain mixed cleanup, verification, reactive, and UI changes. Their branch names do not establish whether the work was superseded.

**Risk:** Medium to high until each tip is compared with current `main`.  
**Related Issues:** #293, #303, and #305.

### Unassociated-ref subset — 8 refs

The following refs were not matched to a current PR record during the cleanup audit: `doc-window-comparison`, `doc-window-system-refactor`, `doc-window-system-refactor-refined`, `docs/revise-gameplay-guide`, `feature/map-effects-and-popups-v2`, `fix/explore-effects-and-recruit`, `fog-displacement-fix-v2`, and `fog-of-war-and-fix-spawn`.

This subset overlaps the families above; it is called out separately because PR metadata cannot establish whether its branch-only commits were superseded. Issue #305 is the explicit audit record for these refs.

## Recommended deletion policy

1. Delete branches whose tips are proven ancestors of `origin/main`.
2. For a closed unmerged PR, inspect the complete diff, not only the title or changed-file count.
3. If all behavior is represented by a landed commit and all remaining scope is represented by an Issue, record that mapping and delete the exact branch.
4. If a branch contains unique code, tests, screenshots, assets, or a proposal not represented elsewhere, retain it until that work is ported or consciously rejected.
5. Do not use a generated “delete every non-main ref” command. Resolve and delete explicit branch names only.
6. After each deletion batch, refresh refs and verify that `main` is unchanged and no open PR has reappeared.

## Practical decision guide

### Safe candidates after final spot-check

Repeated documentation-only or AudioService-only branches whose unique content is already in `f711b10` or `08739bd`, with no branch-only assets or verification coverage.

### Retain pending product decision

Architecture, Fog-of-War, transition, party-layout, renderer/plugin, data-driven element, and Summoner-parameter alternatives.

### Retain pending individual review

The data editor, XP/pacing/recruit/shop fixes, randomized inventory, old verification branches, and the eight refs tracked in Issue #305.

## Evidence commands

Use these read-only checks before deleting an individual branch:

```powershell
git diff --stat origin/main..origin/<branch>
git log --oneline --decorate -8 origin/<branch>
git merge-base --is-ancestor origin/<branch> origin/main
```

Only after the result and preservation decision are recorded should the exact ref be deleted. The final audit should confirm that `origin/main` still equals the intended local commit, no PRs are open, and the worktree is clean.
