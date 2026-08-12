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

        result = page.evaluate(
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
                window.Game.Services.events.on('battle:damage_dealt', () => { damageEvents += 1; });

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

                return {
                    hpAfterResolve,
                    eventsAfterResolve,
                    eventsAfterPublish,
                    presentationCount: presentation.length
                };
            }
            """
        )

        assert result["hpAfterResolve"] == 6, result
        assert result["eventsAfterResolve"] == 0, result
        assert result["eventsAfterPublish"] == 1, result
        assert result["presentationCount"] >= 1, result

        print("Battle effect boundary verification passed:", result)
        browser.close()


if __name__ == "__main__":
    verify_battle_effect_boundary()
