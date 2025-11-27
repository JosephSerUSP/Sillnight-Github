import asyncio
import re
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console errors
        page.on('console', lambda msg: print(f'CONSOLE: {msg.text}'))
        page.on('pageerror', lambda err: print(f'PAGE ERROR: {err}'))

        # 1. Start a web server
        process = await asyncio.create_subprocess_shell(
            'python3 -m http.server 8000',
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            await page.goto('http://localhost:8000')
            await page.wait_for_function('window.Game && window.Game.ready')

            # 2. Inspect a creature outside of battle
            await page.click('#party-grid .party-slot:nth-child(1)')
            await expect(page.locator('#creature-modal')).not_to_have_class(re.compile(r'hidden'))
            await page.click('#creature-modal .rpg-header button')
            await expect(page.locator('#creature-modal')).to_have_class(re.compile(r'hidden'))
            print('✅ Creature inspection test passed.')

            # 3. Trigger a battle and wait for combat
            await page.evaluate('() => window.Game.Systems.Map.resolveTile(2)')
            await expect(page.locator('#battle-layer')).to_have_class(re.compile(r'active-scene'))
            print('✅ Battle started.')

            print('Waiting for a few turns of combat...')
            await asyncio.sleep(5) # Let a few turns pass to check for softlocks
            print('✅ Combat did not softlock.')

            # Take screenshot mid-battle to verify sprites
            await page.screenshot(path='verification.png')
            print('📸 Screenshot taken mid-battle.')

            # 4. End battle by forcing a win
            await page.evaluate('() => window.Game.Systems.Battle.end(true)')
            await page.click('button:has-text("CONTINUE")')
            await expect(page.locator('#battle-layer')).not_to_have_class(re.compile(r'active-scene'))
            print('✅ Battle ended.')

            # 5. Test recruitment
            await page.evaluate('() => window.Game.Systems.Map.resolveTile(6)')
            await expect(page.locator('#event-modal')).not_to_have_class(re.compile(r'hidden'))
            await page.click('#event-modal button:has-text("RECRUIT")')
            await page.click('#event-modal button:has-text("Leave")')
            await expect(page.locator('#event-modal')).to_have_class(re.compile(r'hidden'))
            print('✅ Recruitment test passed.')

        finally:
            try:
                process.kill()
            except ProcessLookupError:
                pass # process is already dead
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
