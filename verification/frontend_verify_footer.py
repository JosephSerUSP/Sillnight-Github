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

    # Check if Help Footer is visible (inside the modal)
    # The help footer class: 'bg-[#1a1a1a] border-t border-gray-700 p-2 text-xs text-gray-300 italic min-h-[3rem]'
    # We can use a CSS selector
    help_footer = party_modal.locator("div.bg-\\[\\#1a1a1a\\]")
    expect(help_footer).to_be_visible()

    # Check text in help footer
    text = help_footer.inner_text()
    print(f"Help Footer Text: {text}")
    expect(help_footer).not_to_have_text("")

    page.screenshot(path="/home/jules/verification/party_menu_help_footer.png")

    # Move Cursor Right
    print("Navigating Right...")
    page.keyboard.press("ArrowRight")
    time.sleep(0.5)

    page.screenshot(path="/home/jules/verification/party_menu_footer_navigated.png")

    # Close Party Menu
    print("Closing Party Menu...")
    page.keyboard.press("Escape")
    expect(party_modal).not_to_be_visible()

    # Open Inventory (B)
    print("Opening Inventory...")
    page.keyboard.press("b")
    inv_modal = page.locator("#inventory-modal")
    expect(inv_modal).to_be_visible()

    # Check Inventory Help Footer
    inv_help = inv_modal.locator("div.bg-\\[\\#1a1a1a\\]")
    expect(inv_help).to_be_visible()
    # It should have text if items exist
    # If inventory is empty, it might be empty text

    page.keyboard.press("Escape")

    print("Verification Successful!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_footer.png")
            raise e
        finally:
            browser.close()
