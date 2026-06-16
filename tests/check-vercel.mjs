import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error(`[Browser Page Error]: ${error.message}`);
  });

  try {
    console.log('Navigating to https://surechigai-romi-link.vercel.app...');
    await page.goto('https://surechigai-romi-link.vercel.app', { waitUntil: 'networkidle' });
    console.log('Page loaded successfully.');
  } catch (err) {
    console.error(`Navigation failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
