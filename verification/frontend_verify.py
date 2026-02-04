from playwright.sync_api import sync_playwright
import time

def verify_game_ui():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to game...")
        page.goto("http://localhost:8080/index.html")

        # Wait for game to initialize (Game.ready = true)
        # We can check window.Game.ready
        print("Waiting for Game.ready...")
        page.wait_for_function("() => window.Game && window.Game.ready")

        # Wait a bit more for rendering
        page.wait_for_timeout(1000)

        # Check for the help text footer
        # ID is party-help
        footer = page.locator("#party-help")
        if footer.is_visible():
            print("Footer visible.")
            text = footer.text_content().strip()
            print(f"Text: '{text}'")
            if text == "Select a unit...":
                 print("PASS: Default text is correct.")
            else:
                 print("WARN: Text mismatch.")
        else:
            print("FAIL: Footer NOT visible.")

        # Take screenshot
        output_path = "verification/frontend_check.png"
        page.screenshot(path=output_path)
        print(f"Screenshot saved to {output_path}")

        browser.close()

if __name__ == "__main__":
    verify_game_ui()
