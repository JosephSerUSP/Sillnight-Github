const { test, expect } = require('@playwright/test');

test.describe('Shop Exit', () => {
  test('should close the shop window on Escape key press', async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:8000');

    // Wait for the game to be ready
    await page.waitForSelector('#game-container:not(.loading)');

    // Programmatically open the shop window
    await page.evaluate(() => {
      window.Game.Windows.Shop.show([{ id: 'potion', type: 'item' }]);
    });

    // Verify the shop window is visible and does NOT have the 'hidden' class
    const shopWindow = page.locator('#window-shop');
    await expect(shopWindow).toBeVisible();
    await expect(shopWindow).not.toHaveClass(/hidden/);

    // Simulate an 'Escape' key press
    await page.keyboard.press('Escape');

    // Verify the shop window now HAS the 'hidden' class
    await expect(shopWindow).toHaveClass(/hidden/);
  });
});
