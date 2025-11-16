const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  await page.goto('http://localhost:3000');

  if (errors.length > 0) {
    console.error('Errors found:');
    errors.forEach(error => {
      console.error(`  URL: ${error.url}, Status: ${error.status}`);
    });
  } else {
    console.log('No 404 errors found.');
  }

  await page.screenshot({ path: 'verification.png' });

  await browser.close();
})();
