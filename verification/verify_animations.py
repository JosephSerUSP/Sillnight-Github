from playwright.sync_api import sync_playwright, expect
import time

def verify_battle_animations():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        # Navigate to the game
        page.goto("http://localhost:8000")

        # Wait for game to be ready
        print("Waiting for game to load...")
        page.wait_for_function("window.Game && window.Game.ready")

        # Start a fixed encounter to test animations
        print("Starting battle...")
        page.evaluate("""
            async () => {
                const enemies = [
                    new window.Game.Classes.Game_Enemy('goblin', 0, 0, 1)
                ];
                // Manually start encounter
                await window.Game.BattleManager._startEncounterWithEnemies(enemies);
            }
        """)

        # Wait for battle UI to appear
        page.wait_for_selector("#battle-layer.active-scene")

        # Wait for player turn
        print("Waiting for player turn...")
        page.wait_for_selector("#battle-controls", state="visible")

        # Function to execute a skill manually and capture screenshots
        def test_skill(skill_name, target_index=0):
            print(f"Testing skill: {skill_name}")
            page.evaluate(f"""
                async () => {{
                    const unit = window.Game.BattleManager.allies[0];
                    const target = window.Game.BattleManager.enemies[{target_index}];
                    const skill = window.Game.Services.get('SkillRegistry').get('{skill_name}');

                    if (!skill) {{
                        console.error('Skill not found: {skill_name}');
                        return;
                    }}

                    // Create action
                    const action = new window.Game.Classes.Game_Action(unit);
                    action.setObject(skill);

                    // Force execute animation sequence (bypass full turn logic for test)
                    const script = window.Game.data.actionScripts[skill.script] || [];

                    console.log('Playing script for {skill_name}:', script);

                    window.Game.Systems.Battle3D.playAnim(unit.uid, script, {{
                        targets: [target],
                        onApply: () => console.log('Apply effect'),
                        onComplete: () => console.log('Complete')
                    }});
                }}
            """)

            # Capture a sequence of screenshots to catch the "focus" and "dim" effect
            for i in range(10):
                time.sleep(0.2)
                page.screenshot(path=f"verification/anim_{skill_name}_{i}.png")

            # Wait for animation to finish
            time.sleep(1)

        # Test Diamond Dust
        test_skill('diamondDust')

        # Test Apocalypse
        test_skill('apocalypse')

        # Test Wait
        test_skill('wait')

        browser.close()

if __name__ == "__main__":
    verify_battle_animations()
