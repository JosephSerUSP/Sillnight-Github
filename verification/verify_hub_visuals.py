from playwright.sync_api import sync_playwright, expect
import time

def verify_hub_visuals(page):
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page Error: {err}"))

    page.goto("http://localhost:8000")

    # Wait for game to initialize
    page.wait_for_function("window.Game && window.Game.ready")

    # Force map generation to Floor 0 (Hub)
    page.evaluate("""
        window.$gameMap.setup(0);
        window.Game.Systems.Explore.rebuildLevel();
    """)

    time.sleep(2)

    # Take screenshot of Hub
    page.screenshot(path="verification/hub_visuals.png")

    # Verify Visual Settings in Scene
    fog_density = page.evaluate("window.Game.Systems.Explore.scene.fog.density")
    print(f"Fog Density: {fog_density}")

    light_intensity = page.evaluate("window.Game.Systems.Explore.playerLight.intensity")
    print(f"Player Light Intensity: {light_intensity}")

    # Verify Texture
    has_map = page.evaluate("!!window.Game.Systems.Explore.matFloor.map")
    print(f"Has Floor Map: {has_map}")

    assert fog_density < 0.1, "Fog density should be low (< 0.1) for clarity, but foggy"
    assert light_intensity == 0, "Player light intensity should be 0"
    assert has_map is True, "Floor should have a texture map"

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_hub_visuals(page)
        finally:
            browser.close()
