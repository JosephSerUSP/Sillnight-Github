
from playwright.sync_api import sync_playwright
import time

def test_recruit_bug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a consistent context/page
        page = browser.new_page()

        try:
            # Navigate to the game
            page.goto('http://localhost:8000')

            # Wait for game to be ready - reduce timeout to fail faster
            page.wait_for_function('() => window.Game && window.Game.ready', timeout=20000)
            print('Game initialized.')

            # Mock offers
            offers = [
                {'id': 'slime', 'name': 'Slime', 'baseHp': 100},
            ]

            print('Showing recruit window...')
            # CRITICAL FIX: Do not return the promise from show()!
            page.evaluate('offers => { window.Game.Windows.Recruit.show(offers); }', offers)

            # Wait for window to appear
            page.wait_for_selector('#window-recruit:not(.hidden)', timeout=5000)
            print('Recruit window visible.')

            # Find the LEAVE button
            leave_btn = page.locator("button", has_text="LEAVE")
            if leave_btn.count() == 0:
                print('LEAVE button not found!')
            else:
                print('LEAVE button found. Clicking...')
                # Force click in case of overlay issues, or regular click
                leave_btn.click(force=True)

            # Check if window is hidden
            # We poll for the 'hidden' class
            start_time = time.time()
            success = False
            while time.time() - start_time < 5:
                is_hidden = page.evaluate("""() => {
                    const win = document.getElementById('window-recruit');
                    return win && win.classList.contains('hidden');
                }""")
                if is_hidden:
                    print('SUCCESS: Recruit window hidden.')
                    success = True
                    break
                time.sleep(0.5)

            if not success:
                print('FAILURE: Recruit window still visible.')

        except Exception as e:
            print(f'Test failed: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    test_recruit_bug()
