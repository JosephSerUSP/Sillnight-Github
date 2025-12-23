
import time
import re
from playwright.sync_api import sync_playwright, expect

def verify_battle_mechanics(page):
    page.on("console", lambda msg: print(f"Browser Log: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

    # Navigate to game
    page.goto("http://localhost:8000/index.html")

    # Wait for game initialization
    page.wait_for_function("window.Game && window.Game.ready")

    mode = page.evaluate("window.Game.ui.mode")
    print(f"Initial Mode: {mode}")

    # If in explore, trigger a battle manually to test BattleManager
    if mode == 'EXPLORE':
        print("Triggering battle...")
        page.evaluate("window.Game.BattleManager.startEncounter()")

    # Wait for battle mode
    page.wait_for_function("window.Game.ui.mode === 'BATTLE'")

    # Wait for battle UI (checking that active-scene class is present among others)
    expect(page.locator("#battle-layer")).to_have_class(re.compile(r"active-scene"))

    # Check if EffectRegistry is initialized and registered in Services
    is_registry_init = page.evaluate("!!window.Game.Services.get('EffectRegistry')")
    print(f"EffectRegistry Service Registered: {is_registry_init}")

    is_trait_init = page.evaluate("!!window.Game.Services.get('TraitRegistry')")
    print(f"TraitRegistry Service Registered: {is_trait_init}")

    # Wait for automatic battle logs indicating damage
    print("Waiting for battle logs...")

    # Wait until log history has entries containing battle actions
    try:
        page.wait_for_function("""
            () => {
                const logs = window.Game.log.history;
                return logs.some(msg => msg.includes('hits') || msg.includes('missed') || msg.includes('used'));
            }
        """, timeout=15000)

        logs = page.evaluate("window.Game.log.history")
        print("Battle logs found:")
        for log in logs[-5:]: # Print last 5
            print(f" - {log}")

    except Exception as e:
        print("Timed out waiting for battle log.")
        logs = page.evaluate("window.Game.log.history")
        print(f"Current logs: {logs}")
        raise e

    # Take screenshot
    page.screenshot(path="verification/battle_verification.png")
    print("Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_battle_mechanics(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
