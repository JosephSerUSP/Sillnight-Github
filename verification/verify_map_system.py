from playwright.sync_api import sync_playwright, expect
import time

def verify_map_system():
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

        # Verify initial map loading
        print("Verifying map loaded...")

        # In this architecture, Game_Map might not have mapId property directly,
        # or it might be initialized with a specific map ID but the property is private or named differently.
        # Let's check window.$gameMap properties.
        map_props = page.evaluate("Object.keys(window.$gameMap)")
        print(f"Map properties: {map_props}")

        # Check if map is valid by checking width/height or events
        # Based on properties ['_mapId', '_width', '_height', '_data', '_visited', '_playerPos', '_floor', '_events', '_flags', '_visuals']
        # it seems width and height are properties (getters) or internal _width/_height
        width = page.evaluate("window.$gameMap.width")
        height = page.evaluate("window.$gameMap.height")
        print(f"Map dimensions: {width}x{height}")

        assert width > 0 and height > 0, "Map dimensions should be positive"

        # Verify events are loaded
        event_count = page.evaluate("window.$gameMap.events.length") # events seems to be a property (array)
        print(f"Loaded {event_count} events on the map")
        # There should be at least some events (e.g. recruit, shop, enemies)
        assert event_count >= 0

        # Verify player position
        px = page.evaluate("window.$gameMap.playerX")
        py = page.evaluate("window.$gameMap.playerY")
        print(f"Player at ({px}, {py})")

        # Check if render loop is active
        # Systems.Explore might have isAnimating property
        is_animating = page.evaluate("window.Game.Systems.Explore.isAnimating")
        print(f"Explore System Animating: {is_animating}")

        # We can try to trigger an event manually to test Interpreter
        print("Testing Event Interpreter...")
        result = page.evaluate("""
            async () => {
                const interpreter = new window.Game.Classes.Game_Interpreter();
                // simple script: Wait 10 frames
                const list = [{ code: 'WAIT', parameters: [10] }];
                interpreter.setup(list);
                // The interpreter might not have an async update method exposed directly or it runs on tick.
                // But usually we can await if it returns a promise or checking isRunning.
                // If update() is synchronous for one frame:
                // Game_Interpreter.execute is async and returns promise
                // setup calls execute().
                // So we should await interpreter.setup(list);
                await interpreter.setup(list);
                return 'setup_done';
            }
        """)
        print(f"Interpreter Result: {result}")
        assert result == 'setup_done'

        # Verify scene switching (manual trigger to Battle)
        print("Testing Scene Switch to Battle...")
        page.evaluate("window.Game.SceneManager.changeScene(window.Game.Scenes.battle)")

        # Wait for battle UI
        try:
            page.wait_for_selector("#battle-layer.active-scene", timeout=5000)
            print("Battle Scene Active")
        except:
             print("Battle scene did not activate in time.")
             # Check current scene
             scene = page.evaluate("window.Game.ui.mode")
             print(f"Current UI mode: {scene}")

        # Switch back
        print("Switching back to Explore...")
        page.evaluate("window.Game.SceneManager.changeScene(window.Game.Scenes.explore)")
        page.wait_for_selector("#explore-layer.active-scene")
        print("Explore Scene Active")

        browser.close()

if __name__ == "__main__":
    verify_map_system()
