const { test, expect } = require('@playwright/test');

test.describe('Event Scheduler', () => {
  test('should load and take a screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/eventscheduler.html');
    await page.screenshot({ path: 'eventscheduler_screenshot.png', fullPage: true });
  });
});
