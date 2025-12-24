from playwright.sync_api import sync_playwright, expect
import time

def verify_hub(page):
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

    time.sleep(2) # Wait for rebuild

    # Take screenshot of Hub
    page.screenshot(path="verification/hub.png")

    # Check for correct event text via console log
    events = page.evaluate("window.$gameMap.events.length")
    print(f"Events on map: {events}")

    # Verify MP drain
    # 1. Set summoner MP to full
    page.evaluate("window.$gameParty.summoner.mp = 100")
    # 2. Move player
    page.evaluate("window.Game.Systems.Explore.move(1, 0)")
    time.sleep(1)
    # 3. Check MP
    mp = page.evaluate("window.$gameParty.summoner.mp")
    print(f"MP after move: {mp}")

    assert mp == 100, "MP should not drain in Hub (Flag check NO_MP_DRAIN)"

    # Verify flag logic works generally
    has_flag = page.evaluate("window.$gameMap.hasFlag('NO_MP_DRAIN')")
    print(f"Map has NO_MP_DRAIN flag: {has_flag}")
    assert has_flag is True

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_hub(page)
        finally:
            browser.close()
