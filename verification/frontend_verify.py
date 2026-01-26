from playwright.sync_api import sync_playwright, expect
import time

def run(page):
    print("Navigating to game...")
    page.goto("http://localhost:8000")

    # Wait for game to load
    print("Waiting for HUD...")
    expect(page.locator("#hud")).to_be_visible(timeout=10000)

    # Wait a bit for initialisation
    time.sleep(2)

    # Open Party Menu (P)
    print("Opening Party Menu...")
    page.keyboard.press("p")

    # Check if Party Modal is visible
    party_modal = page.locator("#party-modal")
    expect(party_modal).to_be_visible()

    # Check if Help Window is visible
    help_window = page.locator("#party-help-text")
    expect(help_window).to_be_visible()

    # Check text in help window
    text = help_window.inner_text()
    print(f"Help Text: {text}")
    expect(help_window).not_to_have_text("")

    page.screenshot(path="/home/jules/verification/party_menu_help.png")

    # Move Cursor Right
    print("Navigating Right...")
    page.keyboard.press("ArrowRight")
    time.sleep(0.5)

    page.screenshot(path="/home/jules/verification/party_menu_navigated.png")

    # Close Party Menu
    print("Closing Party Menu...")
    page.keyboard.press("Escape")
    expect(party_modal).not_to_be_visible()
    expect(help_window).not_to_be_visible()

    print("Verification Successful!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise e
        finally:
            browser.close()
