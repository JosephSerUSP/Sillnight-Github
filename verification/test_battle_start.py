from playwright.sync_api import sync_playwright
import sys
import time

def test_battle_start():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:8000/index.html")

        try:
            page.wait_for_function("window.Game && window.Game.ready", timeout=5000)
        except Exception as e:
            print(f"Game not ready: {e}")
            return False

        # Mock dependencies to avoid full 3D scene switch if possible,
        # but BattleManager.startEncounter calls Systems.Battle3D.setupScene which might fail in headless without proper context.
        # However, we just want to check if `Services.get` throws an error.

        # We can try to invoke just the part we changed.
        # The change was in `startEncounter`.

        # We'll try to execute the code inside startEncounter that fetches the dungeon.

        result = page.evaluate("""
            (() => {
                try {
                    const registry = window.Game.Services.get('DungeonRegistry');
                    if (!registry) return "Registry not found";
                    const dungeon = registry.get('default');
                    if (!dungeon) return "Dungeon 'default' not found";
                    return "OK";
                } catch (e) {
                    return "Error: " + e.message;
                }
            })()
        """)

        print(f"Registry Access Check: {result}")

        if result != "OK":
            print("FAIL: Registry access failed.")
            return False

        print("PASS: Registry access verified.")
        return True

if __name__ == "__main__":
    if not test_battle_start():
        sys.exit(1)
