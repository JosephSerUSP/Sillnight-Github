from playwright.sync_api import sync_playwright, expect
import time

def test_party_ui_update(page):
    print("Navigating to app...")
    page.goto("http://localhost:8000")

    print("Waiting for party slots...")
    page.wait_for_selector(".party-slot", timeout=10000)

    # Get the first party member's HP text element
    # Matches: div.text-[10px].text-right.text-gray-500
    # There are two such elements if MP exists (HP, MP). HP is first.
    hp_text_el = page.locator(".party-slot").first.locator("div.text-right.text-gray-500").first

    original_text = hp_text_el.inner_text()
    print(f"Original HP Text: {original_text}")

    # Ensure unit has HP to lose
    page.evaluate("""
        const party = window.$gameParty;
        const unit = party.activeSlots[0];
        if (unit && unit.hp <= 10) {
            unit.hp = unit.mhp; // Heal if too low
        }
    """)
    # Wait for heal if it happened (though likely it's full)
    time.sleep(0.5)
    original_text = hp_text_el.inner_text() # Update original text just in case

    print("Dealing damage...")
    # Damage the unit
    page.evaluate("""
        const party = window.$gameParty;
        const unit = party.activeSlots[0];
        if (unit) {
            unit.hp = Math.max(0, unit.hp - 10);
        }
    """)

    print("Waiting for text update...")
    expect(hp_text_el).not_to_have_text(original_text)

    new_text = hp_text_el.inner_text()
    print(f"New HP Text: {new_text}")

    # Verify bar update
    # The bar has a style attribute "width: X%"
    bar_el = page.locator(".party-slot").first.locator(".h-full.transition-all").first
    width = bar_el.get_attribute("style")
    print(f"Bar style: {width}")

    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_party_ui_update(page)
            print("Verification passed!")
        except Exception as e:
            print(f"Verification failed: {e}")
            try:
                page.screenshot(path="verification/verification_fail.png")
            except:
                pass
            exit(1)
        finally:
            browser.close()
