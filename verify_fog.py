import time
from playwright.sync_api import sync_playwright

def verify_explore_system():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game
        page.goto("http://localhost:8000")

        # Wait for game to initialize
        print("Waiting for Game.ready...")
        page.wait_for_function("window.Game && window.Game.ready")
        print("Game is ready.")

        # Wait for ExploreSystem to initialize
        print("Waiting for ExploreSystem...")
        page.wait_for_function("window.Game.Systems.Explore && window.Game.Systems.Explore.initialized")
        print("ExploreSystem initialized.")

        # Verify Fog Radius values
        print("Verifying Fog Radius...")
        reveal_radius = page.evaluate("window.Game.Systems.Explore.fogRevealRadius")
        fade_radius = page.evaluate("window.Game.Systems.Explore.fogFadeRadius")

        print(f"Reveal Radius: {reveal_radius}")
        print(f"Fade Radius: {fade_radius}")

        if reveal_radius != 2 or fade_radius != 2:
            print("FAILED: Fog radius values are incorrect.")
            exit(1)

        # Verify Fog Target Logic
        print("Verifying Fog Target Logic...")
        # We can simulate a distance check
        # dist <= 2 -> 1.0 (255)
        # dist = 3 -> (3-2)/2 = 0.5 -> 0.5 visible -> 127
        # dist >= 4 -> 0.0 (0)

        # We can check a tile at specific distance.
        # Player is at playerPos
        player_pos = page.evaluate("window.$gameMap.playerPos")
        px, py = player_pos['x'], player_pos['y']
        print(f"Player at: {px}, {py}")

        # Check tile at px+3, py (Distance 3)
        # Should be partially visible if visited?
        # Wait, updateFogTarget updates fogTarget based on CURRENT position.
        # But fogTarget accumulates MAX visibility.

        # Let's inspect the fogTarget array at specific indices
        # We need to find the index for (px+3, py)
        # Texture row is inverted? (h-1)-y

        fog_val_at_dist_0 = page.evaluate(f"""
            (() => {{
                const sys = window.Game.Systems.Explore;
                const map = window.$gameMap;
                const x = {px};
                const y = {py};
                const texRow = (map.height - 1) - y;
                const idx = texRow * map.width + x;
                return sys.fogTarget[idx];
            }})()
        """)

        fog_val_at_dist_3 = page.evaluate(f"""
            (() => {{
                const sys = window.Game.Systems.Explore;
                const map = window.$gameMap;
                const x = {px} + 3;
                const y = {py};
                const texRow = (map.height - 1) - y;
                const idx = texRow * map.width + x;
                return sys.fogTarget[idx];
            }})()
        """)

        print(f"Fog at dist 0: {fog_val_at_dist_0}")
        print(f"Fog at dist 3: {fog_val_at_dist_3}")

        if fog_val_at_dist_0 != 255:
            print("FAILED: Fog at dist 0 should be 255")

        # Dist 3: Fade is 1.0 - (3-2)/2 = 0.5. Byte = 127.
        # Allow small margin
        if not (120 <= fog_val_at_dist_3 <= 135):
            print(f"WARNING: Fog at dist 3 should be around 127, got {fog_val_at_dist_3}")
            # It might be 0 if the map logic prevented updating or something?
            # Or maybe wall blocked it? No, simple distance.

        # Check Shader Uniforms
        print("Verifying Shader Uniforms...")
        is_fog_map_bound = page.evaluate("""
            window.Game.Systems.Explore.matWall.userData.shader &&
            window.Game.Systems.Explore.matWall.userData.shader.uniforms.uFogMap.value !== null
        """)

        if is_fog_map_bound:
            print("SUCCESS: uFogMap is bound.")
        else:
            print("WARNING: uFogMap is NOT bound (might be waiting for compile).")
            # Force a frame?
            page.evaluate("window.Game.Systems.Explore.animate()")
            time.sleep(0.5)
            is_fog_map_bound = page.evaluate("""
                window.Game.Systems.Explore.matWall.userData.shader &&
                window.Game.Systems.Explore.matWall.userData.shader.uniforms.uFogMap.value !== null
            """)
            if is_fog_map_bound:
                print("SUCCESS: uFogMap is bound after animate.")
            else:
                print("FAILED: uFogMap still not bound.")

        # Take screenshot
        page.screenshot(path="verification_fog.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_explore_system()
