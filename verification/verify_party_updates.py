from playwright.sync_api import sync_playwright
import time

def verify_party_updates():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to game
        page.goto("http://localhost:8000")

        # Wait for game to initialize
        page.wait_for_selector("#hud", state="visible", timeout=10000)
        time.sleep(2) # Give extra time for everything to settle

        # 1. Verify Truncation
        print("Injecting long name to verify truncation...")
        page.evaluate("""
            if (window.$gameParty.activeSlots[0]) {
                // Determine if name is property or function and override
                const u = window.$gameParty.activeSlots[0];
                if (typeof u.name === 'function') {
                    u.name = () => 'Very Long Name That Should Truncate';
                } else {
                    u.name = 'Very Long Name That Should Truncate';
                }
                window.Game.Windows.Party.refresh();
            }
        """)
        time.sleep(1)
        page.screenshot(path="verification/verification_truncation.png")
        print("Captured verification_truncation.png")

        # 2. Verify Removal (Right Click)
        print("Attempting to remove unit via right-click...")
        # Get the first party slot
        # The party grid has id 'party-grid'. The slots are children.
        # Window_Party uses PartySlotComponent which creates divs.
        slot_selector = "#party-grid > div:first-child"

        # Check if slot has content
        content = page.text_content(slot_selector)
        print(f"Slot 0 content before: {content}")

        # Right click
        page.click(slot_selector, button="right")
        time.sleep(1)

        page.screenshot(path="verification/verification_removal.png")
        print("Captured verification_removal.png")

        content_after = page.text_content(slot_selector)
        print(f"Slot 0 content after: {content_after}")

        if "EMPTY" in content_after and "Very Long Name" not in content_after:
             print("SUCCESS: Unit removed and slot shows EMPTY.")
        else:
             print("FAILURE: Unit not removed or EMPTY not shown.")

        # 3. Verify Initial Inventory (Randomized)
        print("Verifying inventory...")
        inventory = page.evaluate("window.$gameParty.inventory")
        print(f"Inventory: {inventory}")

        # Check if we have items/equip
        items_count = sum(inventory['items'].values())
        equip_count = sum(inventory['equipment'].values())
        print(f"Items count: {items_count} (Expected ~3)")
        print(f"Equip count: {equip_count} (Expected ~5)")

        if items_count >= 3 and equip_count >= 5:
            print("SUCCESS: Inventory populated.")
        else:
            print("FAILURE: Inventory empty or insufficient.")

        browser.close()

if __name__ == "__main__":
    verify_party_updates()
