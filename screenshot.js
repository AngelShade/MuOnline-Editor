
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/index.html');
  await page.screenshot({ path: 'verification.png' });
  await browser.close();
})();
