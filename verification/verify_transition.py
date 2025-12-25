from playwright.sync_api import sync_playwright
import time

def verify_transition():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console errors
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

        # Navigate to game
        page.goto("http://localhost:8000/index.html")

        # Wait for Game ready
        page.wait_for_function("window.Game && window.Game.ready")
        print("Game initialized.")

        # Ensure we are in Explore mode so there is something to capture
        page.evaluate("window.Game.ui.mode = 'EXPLORE'")

        # Wait a bit for map to render
        time.sleep(1.0)

        print("Starting transition...")
        page.evaluate("""
            const renderer = window.Game.RenderManager.getRenderer();
            if (!renderer) throw new Error("Renderer not found");
            window.Game.TransitionManager.startBattleTransition(renderer.domElement);
        """)

        # Wait for partial progress (e.g. 500ms into 1500ms duration)
        time.sleep(0.5)

        # Take screenshot
        page.screenshot(path="verification/transition_shatter.png")
        print("Screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_transition()
