from playwright.sync_api import sync_playwright, expect
import time

def verify_battle_system():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        print("Navigating to game...")
        page.goto("http://localhost:8000/index.html")

        print("Waiting for game ready state...")
        try:
            page.wait_for_function("window.Game && window.Game.ready", timeout=5000)
            print("Game.ready is true.")
        except:
             print("Game.ready timed out.")

        print("Triggering battle...")
        page.evaluate("""
            window.Game.Systems.Battle.startEncounter();
        """)

        # Wait for log to show encounter in #game-log
        print("Checking battle log...")
        try:
             # Wait for the game log to contain "Enemies:"
             expect(page.locator("#game-log")).to_contain_text("Enemies:", timeout=5000)
             print("Encounter started confirmed in log.")
        except Exception as e:
             print(f"Log check failed: {e}")
             print("Current Log Content:", page.locator("#game-log").text_content())

        time.sleep(4)

        page.screenshot(path="verification/battle_verification.png")

        logs = page.locator("#game-log").text_content()
        print(f"Battle Logs: {logs}")

        browser.close()

if __name__ == "__main__":
    verify_battle_system()
