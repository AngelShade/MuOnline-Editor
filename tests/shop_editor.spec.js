const { test, expect } = require('@playwright/test');

test.describe('Shop Editor', () => {
  test('should load and take a screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/shopeditor.html');
    await page.screenshot({ path: 'shopeditor_screenshot.png', fullPage: true });
  });
});
