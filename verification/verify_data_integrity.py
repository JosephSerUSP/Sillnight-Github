from playwright.sync_api import sync_playwright
import sys
import re

def verify_data():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We load the JS files by evaluating them or loading them in a page context.
        # Since they are ES modules, we can import them dynamically in page.evaluate if we serve them.

        # Start a server (assuming one is running from previous step or we restart it)
        # Actually, in the previous step I killed the server. I need to restart it.
        # But this script is just a snippet. I should wrap it in a bash session.
        # Wait, I cannot run bash inside this create_file block.
        # I will assume the caller runs the server.

        page.goto("http://localhost:8000/index.html")

        # Wait for Game ready to ensure modules are loaded/available or just use dynamic import
        try:
            page.wait_for_function("window.Game && window.Game.ready", timeout=10000)
        except:
            print("Game load timeout. Proceeding with dynamic check anyway.")

        print("Checking Data Integrity...")

        result = page.evaluate("""
            async () => {
                // We access the global data if available, or import it.
                // Based on file structure:
                // Data is likely at window.Game.data (lowercased) based on memory
                // or we can import.

                // Let's try to import specifically to be sure we get the source of truth
                const { Creatures } = await import('/src/assets/data/creatures.js');
                const { Skills } = await import('/src/assets/data/skills.js');
                const { Items } = await import('/src/assets/data/items.js');

                const errors = [];
                const skillIds = new Set(Object.keys(Skills));
                const itemIds = new Set(Object.keys(Items));

                // Also check item.id property inside the object, as registry might key off that
                // But BattleManager uses `skillRegistry.get(chosen)` where chosen is the key from acts.
                // The registry usually maps ID -> Object.
                // In systems.js/registries, they load these objects.
                // SkillRegistry keys are likely the keys in the export object.

                for (const [key, creature] of Object.entries(Creatures)) {
                    if (!creature.acts) continue;

                    for (const actRow of creature.acts) {
                        for (const act of actRow) {
                            // Check if act exists in Skills or Items
                            // or is 'attack' / 'guard' / 'wait' which should be in Skills

                            // Exact match check
                            if (!skillIds.has(act) && !itemIds.has(act)) {
                                errors.push(`Creature '${key}' has unknown action '${act}'`);
                            }
                        }
                    }
                }

                return errors;
            }
        """)

        if result:
            print("Data Integrity FAIL:")
            for err in result:
                print(f"  - {err}")
            sys.exit(1)
        else:
            print("PASS: All creature actions map to valid Skills or Items.")

        browser.close()

if __name__ == "__main__":
    verify_data()
