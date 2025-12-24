import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 720})
    page = context.new_page()

    # Start server
    page.goto("http://localhost:8000/index.html")

    # Wait for game ready
    page.wait_for_function("window.Game && window.Game.ready")

    print("Game loaded. Testing Map Transition...")

    # Trigger Map Transition
    # We use setTimeout to trigger it without awaiting
    page.evaluate("setTimeout(() => window.Game.Systems.Explore.resolveStaticTile(3), 0)")

    # Wait for the overlay to be attached
    overlay = page.locator("#transition-overlay")
    overlay.wait_for(state="attached", timeout=2000)

    # Capture 'out' phase (swipe)
    # The animation is 0.6s.
    # At 0.3s (midpoint), opacity is 1, translateX is 0, skew is -20deg.
    # At 0.1s, opacity is ramping up, swipe is moving in.
    # Let's capture at 0.2s to see the swipe mid-motion over the game.
    time.sleep(0.2)
    page.screenshot(path="verification/map_transition_mid.png")
    print("Screenshot captured: map_transition_mid.png")

    # Wait for 'in' phase
    time.sleep(1.0) # After callback
    page.screenshot(path="verification/map_transition_in.png")
    print("Screenshot captured: map_transition_in.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
