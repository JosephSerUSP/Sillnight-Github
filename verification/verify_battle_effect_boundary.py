from playwright.sync_api import sync_playwright


def verify_battle_effect_boundary():
    """Verify semantic mutation is independent from presentation publication.

    Run the game separately from the repository root, for example:

        python -m http.server 8000

    Then run:

        python verification/verify_battle_effect_boundary.py
    """

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        page.goto("http://localhost:8000")
        page.wait_for_function("window.Game && window.Game.ready")

        registry_result = page.evaluate(
            """
            () => {
                const registry = window.Game.Services.get('EffectRegistry');
                if (!registry || typeof registry.resolve !== 'function' || typeof registry.publish !== 'function') {
                    throw new Error('EffectRegistry resolve/publish boundary is unavailable');
                }

                const source = { uid: 'verify-source', name: 'Verifier' };
                const target = {
                    uid: 'verify-target',
                    name: 'Target',
                    hp: 10,
                    mhp: 10,
                    status: [],
                    traitsSum: () => 0,
                    isStateAffected: () => false
                };

                let damageEvents = 0;
                const unsubscribe = window.Game.Services.events.on(
                    'battle:damage_dealt',
                    () => { damageEvents += 1; }
                );

                const presentation = registry.resolve(
                    { type: 'hp_damage' },
                    source,
                    target,
                    4,
                    false,
                    false
                );

                const hpAfterResolve = target.hp;
                const eventsAfterResolve = damageEvents;

                registry.publish(presentation);
                const eventsAfterPublish = damageEvents;
                unsubscribe();

                return {
                    hpAfterResolve,
                    eventsAfterResolve,
                    eventsAfterPublish,
                    presentationCount: presentation.length
                };
            }
            """
        )

        assert registry_result["hpAfterResolve"] == 6, registry_result
        assert registry_result["eventsAfterResolve"] == 0, registry_result
        assert registry_result["eventsAfterPublish"] == 1, registry_result
        assert registry_result["presentationCount"] >= 1, registry_result

        turn_result = page.evaluate(
            """
            () => {
                const game = window.Game;
                const manager = game.BattleManager;
                const battle3D = game.Systems.Battle3D;

                const previous = {
                    allies: manager.allies,
                    enemies: manager.enemies,
                    queue: manager.queue,
                    turnIndex: manager.turnIndex,
                    roundCount: manager.roundCount,
                    playerTurnRequested: manager.playerTurnRequested,
                    phase: manager.phase,
                    playAnim: battle3D.playAnim
                };

                const target = {
                    uid: 'verify-ally',
                    name: 'Boundary Target',
                    hp: 10,
                    mhp: 10,
                    isSummoner: false,
                    slotIndex: 0,
                    status: [],
                    traitsSum: () => 0,
                    isStateAffected: () => false
                };

                const actionData = {
                    id: 'verify-boundary-action',
                    name: 'Boundary Action',
                    target: 'enemy-single',
                    script: 'attack',
                    effects: [{ type: 'hp_damage' }]
                };

                const action = {
                    item: () => actionData,
                    apply: (actualTarget) => [{
                        target: actualTarget,
                        value: 4,
                        effect: actionData.effects[0],
                        isCrit: false,
                        isMiss: false
                    }]
                };

                const attacker = {
                    uid: 'verify-enemy',
                    name: 'Boundary Attacker',
                    hp: 10,
                    mhp: 10,
                    speed: 1,
                    isSummoner: false,
                    slotIndex: 0,
                    _currentAction: action,
                    traitsSum: () => 0,
                    isStateAffected: () => false,
                    makeActions: () => {}
                };

                let primaryAnimationContext = null;
                let damageEvents = 0;
                const unsubscribe = game.Services.events.on(
                    'battle:damage_dealt',
                    () => { damageEvents += 1; }
                );

                battle3D.playAnim = (uid, steps, context = {}) => {
                    if (uid === attacker.uid && primaryAnimationContext === null) {
                        primaryAnimationContext = context;
                    }
                };

                try {
                    manager.allies = [target];
                    manager.enemies = [attacker];
                    manager.queue = [attacker];
                    manager.turnIndex = 0;
                    manager.playerTurnRequested = false;
                    manager.processNextTurn();

                    if (!primaryAnimationContext) {
                        throw new Error('Production turn path did not reach Battle3D.playAnim');
                    }

                    const hpBeforeApplyCue = target.hp;
                    const eventsBeforeApplyCue = damageEvents;

                    primaryAnimationContext.onApply?.();

                    const hpAfterApplyCue = target.hp;
                    const eventsAfterApplyCue = damageEvents;

                    // Publication is idempotent even if a script or completion path
                    // attempts to flush the same presentation more than once.
                    primaryAnimationContext.onApply?.();
                    const eventsAfterSecondApplyCue = damageEvents;

                    return {
                        hpBeforeApplyCue,
                        hpAfterApplyCue,
                        eventsBeforeApplyCue,
                        eventsAfterApplyCue,
                        eventsAfterSecondApplyCue
                    };
                } finally {
                    unsubscribe();
                    battle3D.playAnim = previous.playAnim;
                    manager.allies = previous.allies;
                    manager.enemies = previous.enemies;
                    manager.queue = previous.queue;
                    manager.turnIndex = previous.turnIndex;
                    manager.roundCount = previous.roundCount;
                    manager.playerTurnRequested = previous.playerTurnRequested;
                    manager.phase = previous.phase;
                }
            }
            """
        )

        assert turn_result["hpBeforeApplyCue"] == 6, turn_result
        assert turn_result["eventsBeforeApplyCue"] == 0, turn_result
        assert turn_result["hpAfterApplyCue"] == 6, turn_result
        assert turn_result["eventsAfterApplyCue"] == 1, turn_result
        assert turn_result["eventsAfterSecondApplyCue"] == 1, turn_result

        print("EffectRegistry boundary passed:", registry_result)
        print("Production turn boundary passed:", turn_result)
        browser.close()


if __name__ == "__main__":
    verify_battle_effect_boundary()
