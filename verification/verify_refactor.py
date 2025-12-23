
import time
from playwright.sync_api import sync_playwright, expect

def test_refactor(page):
    # Capture console logs
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

    # 1. Load the game
    print("Loading game...")
    page.goto("http://localhost:8000/index.html")

    # 2. Wait for Game object (not ready)
    print("Waiting for window.Game...")
    page.wait_for_function("window.Game")

    # 3. Verify Registries
    print("Verifying Registries...")
    # Wait until Services are populated (TraitRegistry is first)
    page.wait_for_function("window.Game.Services && window.Game.Services.get('TraitRegistry')")

    registries_ok = page.evaluate("""() => {
        const dungeon = Game.Services.get('DungeonRegistry').get('default');
        const treasure = Game.Services.get('EventDataRegistry').get('treasure');
        return !!dungeon && !!treasure;
    }""")
    assert registries_ok, "Dungeon or EventData Registry failed to load."
    print("Registries loaded successfully.")

    # 4. Verify Map Generation
    print("Verifying Map Generation...")
    # Wait for map to be setup (width > 0)
    # We poll this because it happens in DataManager.setupNewGame()
    try:
        page.wait_for_function("window.$gameMap && window.$gameMap.width > 0", timeout=5000)
        map_ok = True
    except:
        map_ok = False
        print("Map generation timed out or failed.")

    if map_ok:
        events_ok = page.evaluate("window.$gameMap.events.length > 0")
        print(f"Map Events: {events_ok}")
        assert events_ok, "Map has no events."
        print("Map generated successfully.")
    else:
        raise Exception("Map generation failed.")

    # 5. Verify Actor XP Logic
    print("Verifying Actor XP Logic...")
    # Wait for party
    page.wait_for_function("window.$gameParty && window.$gameParty.activeMembers.length > 0")

    xp_ok = page.evaluate("""() => {
        const actor = window.$gameParty.activeMembers[0];
        // Check if expForLevel returns a number
        const nextLvl = actor.expForLevel(2);
        console.log('Next Level XP:', nextLvl);
        return typeof nextLvl === 'number' && nextLvl > 0;
    }""")
    assert xp_ok, "Actor XP logic failed."
    print("Actor XP logic verified.")

    # 6. Screenshot (Optional, UI might not be fully ready)
    time.sleep(1)
    page.screenshot(path="verification/refactor_check.png")
    print("Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_refactor(page)
        except Exception as e:
            print(f"Test failed: {e}")
            raise e
        finally:
            browser.close()
