
import os
import time
from playwright.sync_api import sync_playwright, expect

def verify_shatter_transition():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720} # Standard 720p
        )
        page = context.new_page()

        # Listen for console errors
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

        # Load game
        print("Loading game...")
        page.goto("http://localhost:8000/index.html")

        # Wait for game ready
        print("Waiting for game to initialize...")
        page.wait_for_function('window.Game && window.Game.ready')

        # We need to trigger a battle transition.
        # We can simulate this by calling Game.TransitionManager.startBattleTransition() directly.
        # But startBattleTransition usually takes a source canvas to capture.
        # In this environment, we can grab the renderer canvas.

        print("Triggering Battle Transition...")

        # Inject script to start transition and freeze it at a certain point to take a screenshot
        # We'll override the loop to pause at 50% progress (mid-fly) for the screenshot

        page.evaluate("""
            async () => {
                const renderer = window.Game.RenderManager.getRenderer();
                const canvas = renderer.domElement;

                // Start the transition
                // We modify the loop method on the fly to pause at a specific frame if needed,
                // OR we just let it run and snap a screenshot in python.
                // Let's just let it run. It's 2000ms duration.

                window.Game.TransitionManager.startBattleTransition(canvas);
            }
        """)

        # Wait a bit for the animation to progress into the "Fly" phase
        # Timeline: 0-0.3 is Crack/Hold. 0.3-1.0 is Fly.
        # Duration 2000ms.
        # 0.5 progress = 1000ms.

        time.sleep(1.0)

        # Take screenshot of the mid-transition state
        screenshot_path = "verification/shatter_mid.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot taken: {screenshot_path}")

        # Wait for completion
        time.sleep(1.5)

        # Take screenshot of end state (should be black background if we kept it visible,
        # or if startBattleTransition finished, it might hide? No, BATTLE_START keeps it visible/black).
        screenshot_path_end = "verification/shatter_end.png"
        page.screenshot(path=screenshot_path_end)
        print(f"Screenshot taken: {screenshot_path_end}")

        browser.close()

if __name__ == "__main__":
    verify_shatter_transition()
