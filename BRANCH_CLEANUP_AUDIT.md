# Branch Cleanup Audit

Baseline: `origin/main` at `b47a38c4d7ce529fddba725dcd6037959545f8f6`.
Inventory scope: all 97 non-main remote branches after `git fetch origin --prune`.
Every branch tip is preserved in the external bundle and archive tags documented below.

- Bundle: `D:\Github\Sillnight-branch-archives\2026-08-11\sillnight-remote-branches.bundle`
- Archive tags: `archive/branch-cleanup-2026-08-11/<branch-name>`
- Deletion gate: `deletion_permitted` remains `false` until the branch has been individually reviewed and its disposition is supported by evidence.

The CSV is the detailed inventory: tip SHA, merge-base, tip metadata, branch-only commit count, merge-base-relative diff summary, changed-path count, content flags, functional area, reviewer rationale, disposition, and deletion gate.

| Branch | Tip | Merge-base | Branch-only commits | Changed paths | Diff summary | Disposition |
|---|---|---|---:|---:|---|---|
| `analysis-gameplay-emergence` | `e931ec7b7aa3` | `b4a2b2f2f648` | 1 | 1 | 1 file changed, 79 insertions(+) | retained-pending-decision |
| `architectural-analysis` | `3d4d5e84ec88` | `31ba1bdfaa0d` | 1 | 1 | 1 file changed, 78 insertions(+) | retained-pending-decision |
| `architectural-analysis-report` | `2286692a2ed6` | `e5821fb5ed35` | 1 | 1 | 1 file changed, 103 insertions(+) | retained-pending-decision |
| `architectural-refactor-phase-1` | `f6642509fea9` | `575c45ade7e3` | 2 | 4 | 4 files changed, 315 insertions(+), 166 deletions(-) | retained-pending-decision |
| `architecture-assessment` | `e9eecf4cb366` | `575c45ade7e3` | 1 | 1 | 1 file changed, 83 insertions(+) | retained-pending-decision |
| `architecture-proposal-rewrite` | `d8cee2d8fb2f` | `6024353db698` | 1 | 1 | 1 file changed, 171 insertions(+) | retained-pending-decision |
| `audit-documentation-drift-1279079876786371621` | `bfcffe1c1ff9` | `0e72de37b363` | 1 | 0 |  | retained-pending-decision |
| `audit-documentation-drift-3331521598106175776` | `c987e2ca8598` | `1e14a672d7dc` | 1 | 5 | 5 files changed, 58 insertions(+), 1 deletion(-) | retained-pending-decision |
| `audit-documentation-drift-838137639763943067` | `e952763484fd` | `9aa17c569d1f` | 1 | 3 | 3 files changed, 61 insertions(+), 2 deletions(-) | retained-pending-decision |
| `audit-documentation-drift-9002616420988873752` | `18c829df07ef` | `51720ab7c73a` | 1 | 4 | 4 files changed, 47 insertions(+), 6 deletions(-) | retained-pending-decision |
| `battle-pacing-improvements` | `8525d1c46d17` | `4d7365b80213` | 1 | 2 | 2 files changed, 70 insertions(+), 23 deletions(-) | retained-pending-decision |
| `battle-shatter-transition-15597759711949042376` | `1e6a5a7d708d` | `a8b08806939f` | 3 | 2 | 2 files changed, 287 insertions(+), 76 deletions(-) | retained-pending-decision |
| `bugfix/recruit-error-fix` | `655f92f52d54` | `81cfc9f52334` | 1 | 2 | 2 files changed, 4 insertions(+), 9 deletions(-) | retained-pending-decision |
| `doc-drift-audit-15100197966629171290` | `bb8ac8dd47ac` | `9aa17c569d1f` | 1 | 4 | 4 files changed, 24 insertions(+), 3 deletions(-) | retained-pending-decision |
| `doc-drift-audit-17292721646525560420` | `d887c2ec4325` | `1e14a672d7dc` | 1 | 2 | 2 files changed, 5 insertions(+), 3 deletions(-) | retained-pending-decision |
| `doc-drift-audit-9865479593348390183` | `f8510036f775` | `0e72de37b363` | 1 | 0 |  | retained-pending-decision |
| `doc-window-comparison` | `1b5d239fff4e` | `503e8b0f13ac` | 1 | 2 | 2 files changed, 195 insertions(+) | retained-pending-decision |
| `doc-window-refactor` | `5f88fc99e119` | `503e8b0f13ac` | 1 | 1 | 1 file changed, 130 insertions(+) | retained-pending-decision |
| `doc-window-system-refactor` | `c7158e8d44b0` | `503e8b0f13ac` | 1 | 2 | 2 files changed, 244 insertions(+) | retained-pending-decision |
| `doc-window-system-refactor-refined` | `d2b90b5e4d55` | `503e8b0f13ac` | 1 | 2 | 2 files changed, 289 insertions(+) | retained-pending-decision |
| `docs-audit-drift-9399199540632389225` | `8355bb512f9c` | `1e14a672d7dc` | 1 | 3 | 3 files changed, 49 insertions(+), 4 deletions(-) | retained-pending-decision |
| `docs-audit-synchronization-6894581242011254787` | `c615207caaa0` | `eb5a1616147d` | 1 | 5 | 5 files changed, 20 insertions(+), 6 deletions(-) | retained-pending-decision |
| `docs-audit-updates-1145650340972809569` | `2ebfe3084f72` | `9aa17c569d1f` | 1 | 1 | 1 file changed, 109 insertions(+) | retained-pending-decision |
| `docs-drift-audit-3080414279409390794` | `1121be976fd4` | `9aa17c569d1f` | 1 | 4 | 4 files changed, 10 insertions(+), 7 deletions(-) | retained-pending-decision |
| `docs-update-drift-audit-11654786190562891071` | `b3c3b6b9fe75` | `9aa17c569d1f` | 1 | 3 | 3 files changed, 9 insertions(+), 1 deletion(-) | retained-pending-decision |
| `docs-update-drift-audit-15711358919568912432` | `42ca044f0c66` | `105a1209f46b` | 2 | 4 | 4 files changed, 141 insertions(+), 111 deletions(-) | retained-pending-decision |
| `docs/revise-gameplay-guide` | `2bfd817ade67` | `4d7365b80213` | 1 | 1 | 1 file changed, 88 insertions(+) | retained-pending-decision |
| `documentation-audit-14046895942092325370` | `859e9b0b16ef` | `9aa17c569d1f` | 1 | 5 | 5 files changed, 38 insertions(+), 20 deletions(-) | retained-pending-decision |
| `documentation-audit-update-1430419203719429558` | `d01302cb0a50` | `9aa17c569d1f` | 1 | 4 | 4 files changed, 31 insertions(+), 24 deletions(-) | retained-pending-decision |
| `documentation-audit-updates-179830062199797946` | `4ac22c4494ab` | `0e72de37b363` | 1 | 2 | 2 files changed, 6 insertions(+), 6 deletions(-) | retained-pending-decision |
| `documentation-audit-updates-2082069002758705748` | `727c7835e58d` | `0e72de37b363` | 1 | 2 | 2 files changed, 6 insertions(+), 6 deletions(-) | retained-pending-decision |
| `documentation-audit-updates-9681998856619555653` | `6dda9db5263b` | `0e72de37b363` | 1 | 2 | 2 files changed, 6 insertions(+), 6 deletions(-) | retained-pending-decision |
| `documentation-drift-audit-10406535168140030955` | `36c2b829f0ff` | `1e14a672d7dc` | 1 | 6 | 6 files changed, 56 insertions(+), 11 deletions(-) | retained-pending-decision |
| `documentation-drift-audit-13304102890181895345` | `a06c5e70e3df` | `51f811a7d80b` | 1 | 3 | 3 files changed, 15 insertions(+), 2 deletions(-) | retained-pending-decision |
| `documentation-drift-audit-1583803531309484466` | `9b3564dee416` | `f528535a263b` | 1 | 4 | 4 files changed, 32 insertions(+), 16 deletions(-) | retained-pending-decision |
| `documentation-drift-audit-17051027663290310438` | `94bf32bc51ea` | `1e14a672d7dc` | 1 | 4 | 4 files changed, 35 insertions(+), 4 deletions(-) | retained-pending-decision |
| `documentation-drift-audit-4630824222758146546` | `d4fd0b64289c` | `1e14a672d7dc` | 1 | 1 | 1 file changed, 7 insertions(+), 3 deletions(-) | retained-pending-decision |
| `documentation-rewrite-proposal` | `849a36474eae` | `575c45ade7e3` | 2 | 1 | 1 file changed, 114 insertions(+) | retained-pending-decision |
| `feat/data-editor-3972108228662286533` | `d1c2efad2afa` | `1e14a672d7dc` | 1 | 5 | 5 files changed, 744 insertions(+) | retained-pending-decision |
| `feat/gameplay-guide` | `3166a06aa7af` | `4d7365b80213` | 1 | 1 | 1 file changed, 123 insertions(+) | retained-pending-decision |
| `feat/randomized-starting-inventory` | `919c7b167b54` | `4d7365b80213` | 1 | 2 | 2 files changed, 41 insertions(+) | retained-pending-decision |
| `feature/camera-easing-summoner-pos-652246758887171837` | `58fe1cb695cf` | `fd90caf85b11` | 1 | 3 | 3 files changed, 62 insertions(+), 29 deletions(-) | retained-pending-decision |
| `feature/map-effects-and-popups-v2` | `73d72c7f5483` | `ba25f1d761a9` | 1 | 13 | 13 files changed, 354 insertions(+), 183 deletions(-) | retained-pending-decision |
| `feature/scene-transitions-9186627439843748144` | `ce7d9bd61102` | `15565fe7a941` | 1 | 12 | 12 files changed, 264 insertions(+), 25 deletions(-) | retained-pending-decision |
| `feature/visual-transitions-8417055012383503091` | `bb94e4f84b24` | `15565fe7a941` | 1 | 7 | 7 files changed, 651 insertions(+), 34 deletions(-) | retained-pending-decision |
| `fix-battle-pacing-13099592463894018345` | `44a1260b8562` | `f528535a263b` | 3 | 3 | 3 files changed, 65 insertions(+), 3 deletions(-) | retained-pending-decision |
| `fix-fog-of-war-animation` | `020455130119` | `3839ba62430a` | 1 | 1 | 1 file changed, 57 insertions(+), 32 deletions(-) | retained-pending-decision |
| `fix-fog-wall-displacement` | `da1854b24d35` | `c8d08d016c11` | 1 | 1 | 1 file changed, 1 insertion(+), 1 deletion(-) | retained-pending-decision |
| `fix-recruit-and-treasure-find` | `274265d55fd6` | `efdeb1912137` | 1 | 2 | 2 files changed, 25 insertions(+), 12 deletions(-) | retained-pending-decision |
| `fix/explore-effects-and-recruit` | `2fd1ae64ebf9` | `ba25f1d761a9` | 1 | 11 | 11 files changed, 311 insertions(+), 187 deletions(-) | retained-pending-decision |
| `fix/fog-of-war` | `8cbe0cb3800a` | `699d1a0e2925` | 1 | 3 | 3 files changed, 133 insertions(+), 59 deletions(-) | retained-pending-decision |
| `fix/shop-ui-persistence-17639534428531026715` | `ce386c76df9b` | `fbe6993bf0a2` | 1 | 1 | 1 file changed, 5 insertions(+), 3 deletions(-) | retained-pending-decision |
| `fog-displacement-fix-v2` | `01ae126ac491` | `f1f8d9681951` | 1 | 3 | 3 files changed, 81 insertions(+), 13 deletions(-) | retained-pending-decision |
| `fog-displacement-fix-v3` | `445f288b30e1` | `f1f8d9681951` | 1 | 3 | 3 files changed, 77 insertions(+), 15 deletions(-) | retained-pending-decision |
| `fog-of-war-and-fix-spawn` | `f7e1ba10cc28` | `efdeb1912137` | 1 | 5 | 5 files changed, 137 insertions(+), 92 deletions(-) | retained-pending-decision |
| `fog-of-war-shader-fix` | `57ac2262442b` | `f1f8d9681951` | 1 | 2 | 2 files changed, 59 insertions(+), 1 deletion(-) | retained-pending-decision |
| `fog-persistence-fix` | `af2ebc1e9d04` | `699d1a0e2925` | 1 | 2 | 2 files changed, 186 insertions(+), 97 deletions(-) | retained-pending-decision |
| `jules-fix-exp-math-5379748466734844540` | `2493299d5a27` | `23cffca33a61` | 3 | 3 | 3 files changed, 107 insertions(+), 26 deletions(-) | retained-pending-decision |
| `jules-maintenance-audio-11583633844333495691` | `be1f281015bd` | `eb5a1616147d` | 1 | 38 | 38 files changed, 83 insertions(+), 2 deletions(-) | retained-pending-decision |
| `jules-stillnight-threejs-spec-22793016497390911` | `b45d6c96ad77` | `f528535a263b` | 1 | 1 | 1 file changed, 140 insertions(+) | retained-pending-decision |
| `maintain-audio-integration-17985976936438372451` | `e03c1e20da57` | `1e14a672d7dc` | 1 | 6 | 6 files changed, 238 insertions(+), 2 deletions(-) | retained-pending-decision |
| `maintenance-audio-service-7105684685514338722` | `af250f121447` | `eb5a1616147d` | 1 | 4 | 4 files changed, 132 insertions(+), 3 deletions(-) | retained-pending-decision |
| `maintenance-cleanup-todos-13252880406077690334` | `e0d33e0075eb` | `0e72de37b363` | 1 | 3 | 3 files changed, 9 insertions(+), 19 deletions(-) | retained-pending-decision |
| `maintenance-fix-verification-870040479274439439` | `473727655c45` | `0e72de37b363` | 1 | 1 | 1 file changed, 1 insertion(+), 1 deletion(-) | retained-pending-decision |
| `maintenance-fix-verification-script-10796663856295131595` | `917616c83bcd` | `0e72de37b363` | 1 | 1 | 1 file changed, 1 insertion(+), 1 deletion(-) | retained-pending-decision |
| `maintenance-reactive-ui-and-cleanup-4445906571412925044` | `1a85ef385394` | `9aa17c569d1f` | 1 | 4 | 4 files changed, 17 insertions(+), 23 deletions(-) | retained-pending-decision |
| `maintenance-reactivity-cleanup-4749837984488329422` | `aeefebe677dd` | `0e72de37b363` | 1 | 4 | 4 files changed, 104 insertions(+), 22 deletions(-) | retained-pending-decision |
| `maintenance-refactor-battler-ui-12571708989504921944` | `3b0c290911cb` | `1e14a672d7dc` | 1 | 5 | 5 files changed, 55 insertions(+), 16 deletions(-) | retained-pending-decision |
| `maintenance-refactor-cleanup-2209106276973364194` | `fe9c4acaa796` | `0e72de37b363` | 1 | 3 | 3 files changed, 9 insertions(+), 2 deletions(-) | retained-pending-decision |
| `maintenance-refactor-reactivity-10656735279742520841` | `814728c74e44` | `0e72de37b363` | 1 | 4 | 4 files changed, 104 insertions(+), 22 deletions(-) | retained-pending-decision |
| `maintenance-task-15231775127487200430` | `f8be86b77ddd` | `0e72de37b363` | 1 | 3 | 3 files changed, 22 insertions(+), 22 deletions(-) | retained-pending-decision |
| `maintenance-verification-593669660290646820` | `a89ccb8b973a` | `0e72de37b363` | 1 | 34 | 34 files changed, 102 insertions(+), 1 deletion(-) | retained-pending-decision |
| `maintenance/audio-drift-report-15486914203244453182` | `9abf1dae18cf` | `1e14a672d7dc` | 1 | 5 | 5 files changed, 132 insertions(+), 4 deletions(-) | retained-pending-decision |
| `maintenance/audio-element-refactor-9755390309044697866` | `edc2789db29e` | `1e14a672d7dc` | 1 | 11 | 11 files changed, 323 insertions(+), 77 deletions(-) | retained-pending-decision |
| `maintenance/audio-system-3677687844805769385` | `76ff9b221d68` | `eb5a1616147d` | 1 | 10 | 10 files changed, 186 insertions(+), 1 deletion(-) | retained-pending-decision |
| `maintenance/battle-refactor-audio-2570828225764409497` | `fe3747d9dd11` | `eb5a1616147d` | 1 | 6 | 6 files changed, 113 insertions(+), 13 deletions(-) | retained-pending-decision |
| `maintenance/fix-verification-script-12902203665249126600` | `d3dbfd16a375` | `0e72de37b363` | 1 | 1 | 1 file changed, 1 insertion(+), 1 deletion(-) | retained-pending-decision |
| `maintenance/reactive-state-events-8749322186825554881` | `1b56e981b2d6` | `1e14a672d7dc` | 1 | 4 | 4 files changed, 66 insertions(+), 4 deletions(-) | retained-pending-decision |
| `maintenance/summoner-turn-params-1622379730779134202` | `1f2ebc00e036` | `a81bac02cbde` | 1 | 6 | 6 files changed, 144 insertions(+), 2 deletions(-) | retained-pending-decision |
| `party-menu-summoner-fix-14374155521116181425` | `7f22983f8ac1` | `a158ead5f547` | 1 | 8 | 8 files changed, 9 insertions(+), 400 deletions(-) | retained-pending-decision |
| `random-initial-equipment-2273420533820399733` | `4cd3a5baa2a9` | `782f6e2eff92` | 1 | 2 | 2 files changed, 66 insertions(+), 1 deletion(-) | retained-pending-decision |
| `refactor-phase-1-complete` | `b39b75984c6f` | `4c09fad5227c` | 3 | 15 | 15 files changed, 190 insertions(+), 284 deletions(-) | retained-pending-decision |
| `refactor-phase-1-final` | `c27487e0981f` | `4c09fad5227c` | 1 | 13 | 13 files changed, 189 insertions(+), 283 deletions(-) | retained-pending-decision |
| `refactor-phase-3` | `307c6286ca81` | `d95c0453c2b6` | 3 | 5 | 5 files changed, 174 insertions(+), 35 deletions(-) | retained-pending-decision |
| `refactor-phase2-registry-data-11108778643606894229` | `f1d3dd52ee36` | `6ff7935ebb30` | 1 | 0 |  | retained-pending-decision |
| `refactor-reactive-ui-6904314077815251248` | `e0c5538ddf17` | `9aa17c569d1f` | 1 | 11 | 11 files changed, 464 insertions(+), 58 deletions(-) | retained-pending-decision |
| `refactor/phase-4-reactive-backend-6812772952284714320` | `453d4d9785eb` | `9aa17c569d1f` | 1 | 6 | 6 files changed, 144 insertions(+), 14 deletions(-) | retained-pending-decision |
| `refactor/reactive-ui-audio-7150135249304217381` | `93ec7d0a1a8f` | `9aa17c569d1f` | 1 | 9 | 9 files changed, 144 insertions(+), 11 deletions(-) | retained-pending-decision |
| `refactor/reactive-ui-party-7296181845657522236` | `8079f4692970` | `9aa17c569d1f` | 1 | 9 | 9 files changed, 319 insertions(+), 12 deletions(-) | retained-pending-decision |
| `rewrite-proposal` | `3742be3765af` | `575c45ade7e3` | 1 | 1 | 1 file changed, 103 insertions(+) | retained-pending-decision |
| `shatter-transition-11559666246248154339` | `f4cf11c3f611` | `a8b08806939f` | 2 | 1 | 1 file changed, 235 insertions(+), 80 deletions(-) | retained-pending-decision |
| `stillnight-threejs-plugin-12732119604071080682` | `20c4883e4b86` | `f528535a263b` | 1 | 281 | 281 files changed, 78802 insertions(+), 239 deletions(-) | retained-pending-decision |
| `vertex-warp-walls` | `58ab8bcb3f68` | `0a208398e16f` | 1 | 2 | 2 files changed, 18 insertions(+), 2 deletions(-) | retained-pending-decision |
| `walkthrough-design-15639535685884753731` | `8517cf7044a6` | `c32427d0b017` | 1 | 1 | 1 file changed, 229 insertions(+) | retained-pending-decision |
| `window-refactor-phase-2-dynamic-height` | `78fe67b60831` | `ba363b2913a2` | 1 | 10 | 10 files changed, 148 insertions(+), 49 deletions(-) | retained-pending-decision |
| `window-refactor-phase-2-fix-height` | `78a34417ab90` | `ba363b2913a2` | 1 | 10 | 10 files changed, 147 insertions(+), 49 deletions(-) | retained-pending-decision |
| `xp-calc-fix-1238135631318676896` | `2c4e0aa1cdd1` | `418ba4f3848a` | 1 | 5 | 5 files changed, 103 insertions(+), 9 deletions(-) | retained-pending-decision |

No remote branch is deleted by this baseline record.

## Absorption record

The three verification branches `maintenance-fix-verification-870040479274439439`, `maintenance-fix-verification-script-10796663856295131595`, and `maintenance/fix-verification-script-12902203665249126600` contained the same one-line correction: replace the invalid `slime` enemy fixture with `goblin` in `verification/verify_animations.py`. The change was manually ported as focused commit `86e1d14` on `main`; `git diff --check` passed, and no Python runtime was available for bytecode compilation.

The four duplicate branches `doc-drift-audit-9865479593348390183`, `documentation-audit-updates-179830062199797946`, `documentation-audit-updates-9681998856619555653`, and `maintenance-reactivity-cleanup-4749837984488329422` had byte-for-byte identical complete tip trees to retained representatives. They were deleted only after exact tip and archive-tag verification. Retained representatives are `audit-documentation-drift-1279079876786371621`, `documentation-audit-updates-2082069002758705748`, and `maintenance-refactor-reactivity-10656735279742520841`.

## Deletion verification

Seven exact branches were deleted in two reviewed batches. The final remote non-main count is 90. `origin/main` was unchanged by deletion and is now recorded at the final audit commit. Recovery bundles: `D:\Github\Sillnight-branch-archives\2026-08-11\sillnight-remote-branches.bundle`, `D:\Github\Sillnight-branch-archives\2026-08-11\sillnight-remote-branches-post-absorption.bundle`, `D:\Github\Sillnight-branch-archives\2026-08-11\sillnight-remote-branches-pre-duplicate-deletion.bundle`, and `D:\Github\Sillnight-branch-archives\2026-08-11\sillnight-remote-branches-final-audit-2026-08-11.bundle`. The final bundle verified as a complete history with 98 refs: current main, current remote branches, and seven deleted-branch archive tags.

No remaining branch is marked deletion-permitted; retained branches require individual product or implementation decisions.

## Independent gameplay review

Two narrow branches were rejected after current-main code review. `bugfix/recruit-error-fix` patches a legacy recruit modal that has been replaced by `Window_Recruit`, which already calls `Game_Party.addActor(speciesId, level)`. `fix/shop-ui-persistence-17639534428531026715` bypasses the base window show/hide lifecycle and would skip SceneManager registration; the reproducible browser fix remains tracked in Issue #297. Both exact tips remain in the bundle and archive tags and are approved for deletion.
