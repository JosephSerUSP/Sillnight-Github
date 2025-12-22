from playwright.sync_api import sync_playwright

def verify_main_screen():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto('http://localhost:8000')
            # Wait for game to initialize
            page.wait_for_function('() => window.Game && window.Game.ready', timeout=30000)

            # Wait for initial message to ensure rendering started
            page.wait_for_selector('#battle-log-window', state='visible')

            # Take screenshot
            page.screenshot(path='verification/maintenance_check.png')
            print("Screenshot taken successfully.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == '__main__':
    verify_main_screen()
