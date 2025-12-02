
from playwright.sync_api import sync_playwright, expect
import time

def verify_window_refactor(page):
    page.goto("http://localhost:8000")

    # Wait for game to initialize
    page.wait_for_function("window.Game && window.Game.ready")

    # 1. Verify Window_Inventory (B)
    # Trigger open
    page.evaluate("window.Game.Windows.Inventory.toggle()")

    # Check if element exists and is visible
    inv_modal = page.locator("#inventory-modal")
    expect(inv_modal).to_be_visible()

    # Check content (Header)
    expect(inv_modal).to_contain_text("INVENTORY")

    # Close it
    page.evaluate("window.Game.Windows.Inventory.toggle()")
    expect(inv_modal).not_to_be_visible()

    # 2. Verify Window_PartyMenu (P)
    page.evaluate("window.Game.Windows.PartyMenu.toggle()")

    party_modal = page.locator("#party-modal")
    expect(party_modal).to_be_visible()
    expect(party_modal).to_contain_text("PARTY / RESERVE")

    # Close it
    page.evaluate("window.Game.Windows.PartyMenu.toggle()")
    expect(party_modal).not_to_be_visible()

    # 3. Verify Window_BattleLog
    # It should be visible on screen in the footer area
    log_window = page.locator("#battle-log-window")
    expect(log_window).to_be_visible()
    expect(log_window).to_contain_text("LOG")

    # Take screenshot
    page.screenshot(path="verification/window_refactor.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_window_refactor(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
