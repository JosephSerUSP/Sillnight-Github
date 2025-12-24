from playwright.sync_api import sync_playwright
import time
import sys
import os

def check_registry_loading(page):
    print("Checking Registry Loading...")

    # Check CreatureRegistry
    creature_count = page.evaluate("window.Game.Services.get('CreatureRegistry').count()")
    print(f"CreatureRegistry count: {creature_count}")
    if creature_count == 0:
        print("FAIL: CreatureRegistry is empty.")
        return False

    # Check SkillRegistry
    skill_count = page.evaluate("window.Game.Services.get('SkillRegistry').count()")
    print(f"SkillRegistry count: {skill_count}")
    if skill_count == 0:
        print("FAIL: SkillRegistry is empty.")
        return False

    # Check DungeonRegistry
    dungeon_count = page.evaluate("window.Game.Services.get('DungeonRegistry').count()")
    print(f"DungeonRegistry count: {dungeon_count}")
    if dungeon_count == 0:
        print("FAIL: DungeonRegistry is empty.")
        return False

    # Check EventDataRegistry
    event_count = page.evaluate("window.Game.Services.get('EventDataRegistry').count()")
    print(f"EventDataRegistry count: {event_count}")
    if event_count == 0:
        print("FAIL: EventDataRegistry is empty.")
        return False

    print("PASS: Registries loaded.")
    return True

def check_inheritance(page):
    print("Checking Inheritance...")

    # Check if 'goblin' inherits 'acts' from base_creature if not overridden,
    # but goblin overrides acts. Let's check something that is inherited.
    # 'pixie' inherits 'base_fey'. 'base_fey' inherits 'base_creature'.
    # 'base_fey' has temperament 'kind'. 'pixie' does not define temperament.

    pixie_temperament = page.evaluate("""
        (() => {
            const r = window.Game.Services.get('CreatureRegistry');
            const p = r.get('pixie');
            return p.temperament;
        })()
    """)
    print(f"Pixie temperament: {pixie_temperament} (Expected: kind)")

    if pixie_temperament != 'kind':
         print("FAIL: Inheritance check failed for Pixie.")
         return False

    # Check deep inheritance (base_creature -> base_fey -> pixie)
    # base_creature has mpGrowth 0.05. pixie overrides to 0.15? Wait, let's check.
    # Pixie has hpGrowth 0.15. base_creature has 0.20.

    pixie_hp_growth = page.evaluate("""
        (() => {
            const r = window.Game.Services.get('CreatureRegistry');
            const p = r.get('pixie');
            return p.hpGrowth;
        })()
    """)
    print(f"Pixie hpGrowth: {pixie_hp_growth} (Expected: 0.15)")
    if pixie_hp_growth != 0.15:
         print("FAIL: Pixie own property check failed.")
         return False

    print("PASS: Inheritance checks.")
    return True

def check_game_actor(page):
    print("Checking Game_Actor Stats...")

    # Create a Goblin actor level 1
    # Goblin Base HP 18.
    hp = page.evaluate("""
        (() => {
            const actor = new window.Game.Classes.Game_Actor('goblin', 1);
            return actor.mhp;
        })()
    """)
    print(f"Level 1 Goblin MaxHP: {hp} (Expected: 18)")

    if hp != 18:
        print("FAIL: Game_Actor stat calculation failed.")
        return False

    print("PASS: Game_Actor stats.")
    return True

def check_event_system(page):
    print("Checking Event System...")

    # Check Shop Generation
    shop_stock = page.evaluate("""
        (() => {
            return window.Game.Systems.Event.generateShopStock();
        })()
    """)
    print(f"Shop stock count: {len(shop_stock)}")
    if len(shop_stock) == 0:
        print("FAIL: Shop stock generation returned empty list.")
        return False

    # Check Recruit Generation
    recruit_offer = page.evaluate("""
        (() => {
            return window.Game.Systems.Event.generateRecruit(1);
        })()
    """)
    print(f"Recruit offer: {recruit_offer}")
    if not recruit_offer or not recruit_offer['speciesId']:
        print("FAIL: Recruit generation failed.")
        return False

    print("PASS: Event System checks.")
    return True

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:8000/index.html")

        # Wait for Game.ready
        try:
            page.wait_for_function("window.Game && window.Game.ready", timeout=5000)
        except Exception as e:
            print(f"Game did not load: {e}")
            return

        if not check_registry_loading(page):
            sys.exit(1)

        if not check_inheritance(page):
            sys.exit(1)

        if not check_game_actor(page):
            sys.exit(1)

        if not check_event_system(page):
            sys.exit(1)

        print("ALL TESTS PASSED")
        browser.close()

if __name__ == "__main__":
    run_tests()
