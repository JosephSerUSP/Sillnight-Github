const { test, expect } = require('@playwright/test');

test('Passives UI', async ({ page }) => {
  // Disable cache by routing all requests
  await page.route('**', route => route.continue());

  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });

  // Wait for the party grid to be populated, then click the first unit
  const firstUnit = page.locator('.party-slot').first();
  await firstUnit.waitFor({ state: 'visible', timeout: 10000 });
  await firstUnit.click();

  // The click opens the status modal directly. Wait for the modal to be visible.
  const creatureModal = page.locator('#creature-modal');
  await creatureModal.waitFor({ state: 'visible', timeout: 10000 });

  // Find the element displaying the passive's name/description within the modal
  const passivesElement = creatureModal.locator('#modal-passive');
  const passivesText = await passivesElement.innerText();
  console.log(`Passives text found: "${passivesText}"`);

  // Assert that the passives text is not the placeholder
  await expect(passivesElement).not.toHaveText('—');
  await expect(passivesElement).not.toHaveText('coming soon');

  // Take a screenshot for visual verification
  await page.screenshot({ path: '/home/jules/verification/passives_ui.png' });
});
