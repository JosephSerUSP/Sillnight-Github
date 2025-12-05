
from playwright.sync_api import sync_playwright
import time

def test_input_system():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"ERROR: {err}"))

        try:
            print("Navigating...")
            page.goto('http://localhost:8000')
            page.wait_for_function('() => window.Game && window.Game.ready', timeout=10000)
            print("Game Ready.")

            # Test Menu Toggle (P key)
            print("Testing Menu Toggle (P)...")
            page.keyboard.press("P")
            time.sleep(0.5) # Wait for UI update

            # Check if Party Menu is visible (not hidden)
            # Window_PartyMenu is usually 'hidden' by default.
            # We need to know the ID or selector. Window_PartyMenu likely attaches to body or game container.
            # Let's check the DOM state.

            is_visible = page.evaluate("""() => {
                const menu = document.getElementById('window-party-menu'); // Assuming ID
                // If ID is different, we might fail. Let's check if we can find it.
                // The refactor didn't explicitly set IDs for all windows in the snippet I read,
                // but `Window_PartyMenu` usually has `root.id = ...` in `initialize`.
                // Let's assume it's 'window-party-menu' or check classes.

                // Actually, let's check Game.Windows.PartyMenu.root
                const w = window.Game.Windows.PartyMenu;
                return w && !w.root.classList.contains('hidden');
            }""")

            if is_visible:
                print("SUCCESS: Party Menu opened.")
                # Close it
                page.keyboard.press("P")
                time.sleep(0.5)
            else:
                print("FAILURE: Party Menu did not open.")

            # Test Inventory (B key)
            print("Testing Inventory Toggle (B)...")
            page.keyboard.press("B")
            time.sleep(0.5)

            is_inv_visible = page.evaluate("""() => {
                const w = window.Game.Windows.Inventory;
                return w && !w.root.classList.contains('hidden');
            }""")

            if is_inv_visible:
                print("SUCCESS: Inventory opened.")
            else:
                print("FAILURE: Inventory did not open.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == '__main__':
    test_input_system()
