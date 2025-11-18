
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pagesToTest = [
    'index.html',
    'monsterspawneditor.html',
    'shopeditor.html',
    'mixeditor.html',
    'monsterdropeditor.html',
    'zendropeditor.html'
  ];

  let allTestsPassed = true;

  for (const pageName of pagesToTest) {
    try {
      const response = await page.goto(`http://localhost:3000/${pageName}`);
      if (response.status() !== 200) {
        console.error(`Error: ${pageName} returned status ${response.status()}`);
        allTestsPassed = false;
      } else {
        console.log(`Success: ${pageName} loaded successfully.`);
      }
    } catch (error) {
      console.error(`Error navigating to ${pageName}: ${error.message}`);
      allTestsPassed = false;
    }
  }

  await browser.close();

  if (allTestsPassed) {
    console.log('All pages loaded successfully!');
  } else {
    console.error('Some pages failed to load.');
    process.exit(1);
  }
})();
