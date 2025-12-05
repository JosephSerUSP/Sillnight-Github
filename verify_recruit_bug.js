
import { chromium } from 'playwright';

async function testRecruitBug() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Handle console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
        console.log(`[Browser ${type.toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
      console.log(`[Browser EXCEPTION] ${err}`);
  });

  try {
    // Navigate to the game (assuming it's served at localhost:8000)
    await page.goto('http://localhost:8000');

    // Wait for game to be ready
    await page.waitForFunction(() => window.Game && window.Game.ready);
    console.log('Game initialized.');

    // Manually trigger the recruit window via system call
    // Note: We need to use the method that shows the window.
    // Based on `Window_Recruit` code, it's `window.Game.Windows.Recruit.show(offers)`

    // Mock offers
    const offers = [
      { id: 'slime', name: 'Slime', baseHp: 100 },
      { id: 'bat', name: 'Bat', baseHp: 80 }
    ];

    console.log('Showing recruit window...');
    await page.evaluate((offers) => {
       window.Game.Windows.Recruit.show(offers);
    }, offers);

    // Wait for window to appear
    await page.waitForSelector('#window-recruit:not(.hidden)');
    console.log('Recruit window visible.');

    // Find the LEAVE button
    const leaveBtn = page.getByRole('button', { name: 'LEAVE' });
    if (await leaveBtn.count() === 0) {
        console.error('LEAVE button not found!');
    } else {
        console.log('LEAVE button found. Clicking...');
        await leaveBtn.click();
    }

    // Check if window is hidden
    await page.waitForFunction(() => {
        const win = document.getElementById('window-recruit');
        return win && win.classList.contains('hidden');
    }, { timeout: 3000 }).catch(() => {
        console.error('Timeout waiting for recruit window to hide.');
    });

    const isHidden = await page.evaluate(() => {
        const win = document.getElementById('window-recruit');
        return win.classList.contains('hidden');
    });

    if (isHidden) {
        console.log('SUCCESS: Recruit window hidden.');
    } else {
        console.log('FAILURE: Recruit window still visible.');
    }

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
}

testRecruitBug();
