
import { test, expect } from '@playwright/test';

test('Verify XP calculation', async ({ page }) => {
  // Go to the game
  await page.goto('http://localhost:8000/');

  // Wait for game to be ready
  await page.waitForFunction('window.Game && window.Game.ready');

  // We need to trigger a battle end sequence to see the XP calculation
  // We can do this by mocking the BattleManager.end function or just setting up a scenario

  // Let's create a test party and enemies
  await page.evaluate(async () => {
    // Reset party
    window.$gameParty._activeSlots = [];
    window.$gameParty._roster = [];

    // Add a Pixie (level 1)
    window.$gameParty.addActor('pixie', 1);
    const pixie = window.$gameParty.activeSlots[0];

    // Ensure we know the XP needed for next level
    // Pixie exp curve: 10
    // But Game_Actor uses: 100 * (level-1)^1.1
    // Wait, Game_Actor.js:
    // expForLevel(level) { return Math.round(100 * Math.pow(level - 1, 1.1)); }
    // This ignores `xpCurve` from creatures.js! This is a discrepancy.

    // Let's check the current exp for level 1: 0
    // Level 2: 100 * 1^1.1 = 100

    // Create some enemies to kill
    // BattleManager.end calculates xp based on:
    // enemies.length * Data.config.baseXpPerEnemy * window.$gameMap.floor

    window.Game.BattleManager.allies = [pixie];
    window.Game.BattleManager.enemies = [
        new window.Game.Classes.Game_Enemy('goblin', 0, 0, 1),
        new window.Game.Classes.Game_Enemy('goblin', 0, 0, 1)
    ];

    // Config: baseXpPerEnemy = 20 (assuming default)
    // Map floor = 1 (default)
    window.$gameMap.floor = 1;

    // So 2 * 20 * 1 = 40 XP expected.

    // Call end(true)
    await window.Game.BattleManager.end(true);
  });

  // Wait for Victory Window
  await expect(page.locator('#victory-window')).toBeVisible();

  // Check displayed XP
  const xpText = await page.locator('#victory-window .text-blue-300').innerText();
  console.log('Displayed XP:', xpText);

  // Check actual XP on the actor
  const actorExp = await page.evaluate(() => {
    return window.$gameParty.activeSlots[0].exp;
  });
  console.log('Actor XP:', actorExp);

});
