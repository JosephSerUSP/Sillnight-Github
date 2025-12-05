
from playwright.sync_api import sync_playwright

def test_simple_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"ERROR: {err}"))

        try:
            print("Navigating...")
            page.goto('http://localhost:8000', timeout=5000)
            print("Page loaded.")

            # Check title
            print(f"Title: {page.title()}")

            # Check if Game object exists
            game_exists = page.evaluate("typeof window.Game !== 'undefined'")
            print(f"Game object exists: {game_exists}")

            if game_exists:
                # Check ready state
                is_ready = page.evaluate("window.Game && window.Game.ready")
                print(f"Game ready: {is_ready}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == '__main__':
    test_simple_load()
