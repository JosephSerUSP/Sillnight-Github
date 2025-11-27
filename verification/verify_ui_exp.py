from playwright.sync_api import sync_playwright, expect
import time

def verify_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console logs and errors
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        try:
            print("Navigating to game...")
            page.goto("http://localhost:8000")

            # Wait for game to be ready
            page.wait_for_function("window.Game && window.Game.ready")
            print("Game ready.")

            # --- Verify EXP Gauge ---
            # We need to find a unit with level > 1.
            # The party is randomized, but we can inspect the party grid.
            # We will grab the first unit in the party grid and check its level and EXP bar.

            # Open Party Menu to see stats more clearly if needed, or inspect the HUD.
            # The Party Menu (P) shows "LvX" and sprite.
            # The HUD bottom-right shows active party.

            print("Inspecting party members for Level > 1...")
            # Let's just grab the data directly
            party_data = page.evaluate("""() => {
                return window.Game.GameState.party.activeSlots.filter(u => u).map(u => ({
                    level: u.level,
                    exp: u.exp,
                    nextExp: u.nextLevelExp ? u.nextLevelExp() : 0,
                    uid: u.uid
                }));
            }""")

            print(f"Party Data: {party_data}")

            found_lvl_gt_1 = False
            for unit in party_data:
                if unit['level'] > 1:
                    found_lvl_gt_1 = True
                    print(f"Found Level {unit['level']} unit. EXP: {unit['exp']}")
                    # If initialized correctly, EXP should match the threshold for that level.
                    # L2 requires 100 XP. L3 requires 214 XP.
                    if unit['level'] == 2 and unit['exp'] == 100:
                         print("L2 Unit has correct base EXP (100).")
                    elif unit['level'] == 3 and unit['exp'] == 214:
                         print("L3 Unit has correct base EXP (214).")
                    else:
                        print(f"WARNING: Unit EXP {unit['exp']} might be incorrect for Level {unit['level']}.")

            if not found_lvl_gt_1:
                print("No Level > 1 units found in random party. Reloading might be needed, but checking logic via injection.")
                # Inject a Level 3 unit
                page.evaluate("window.Game.GameState.party.addActor('pixie', 3)")
                print("Added L3 Pixie.")
                time.sleep(1) # Wait for refresh

            # Take a screenshot of the Party Menu
            page.evaluate("window.Game.Windows.PartyMenu.toggle()")
            time.sleep(1)
            page.screenshot(path="verification/party_menu.png")
            print("Screenshot saved to verification/party_menu.png")

            # Close Party Menu using the button to verify the fix
            print("Testing Party Menu Close Button...")
            # The close button is inside #party-modal .rpg-header button
            # But the text is 'X'
            page.locator("#party-modal button", has_text="X").click()
            time.sleep(0.5)

            # Check if hidden
            expect(page.locator("#party-modal")).to_have_class(re.compile(r'\bhidden\b'))
            print("Party Menu closed successfully.")

            # --- Verify Inventory Close Button ---
            print("Testing Inventory Menu...")
            page.evaluate("window.Game.Windows.Inventory.toggle()")
            time.sleep(0.5)
            page.locator("#inventory-modal button", has_text="X").click()
            time.sleep(0.5)
            expect(page.locator("#inventory-modal")).to_have_class(re.compile(r'\bhidden\b'))
            print("Inventory Menu closed successfully.")

        except Exception as e:
            print(f"Verification failed: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    import re
    verify_fixes()
