import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('https://surechigai-romi-link.vercel.app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait 5 seconds to see if it hydrates
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log('--- DOM TEXT ---');
    console.log(text);
    console.log('----------------');
    
    const clerkStatus = await page.evaluate(() => {
      return {
        hasClerk: !!window.Clerk,
        clerkLoaded: window.Clerk ? window.Clerk.isReady() : false,
      };
    });
    console.log('Clerk Status:', clerkStatus);
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
