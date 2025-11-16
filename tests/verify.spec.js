const { test, expect } = require('@playwright/test');

test('homepage has no 404 errors and loads correctly', async ({ page }) => {
  const errors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  await page.goto('http://localhost:3000/monsterspawneditor.html');

  // Assert that there are no errors.
  expect(errors.length).toBe(0);

  // Take a screenshot
  await page.screenshot({ path: 'verification.png' });
});
