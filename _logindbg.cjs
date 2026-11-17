const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:4174/wl-lunch-app';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  page.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0, 300)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  console.log('BEFORE inputs', await page.locator('input').count());
  console.log('BEFORE btns', await page.locator('button').allTextContents());
  await page.locator('input[placeholder="账号"]').fill('WLLC2026');
  await page.locator('input[placeholder="密码"]').fill('iloveWL');
  console.log('FILLED', await page.locator('input').evaluateAll(els => els.map(e => e.value)));
  const loginBtn = page.getByRole('button', { name: '登录', exact: true });
  console.log('LOGIN BTN COUNT', await loginBtn.count());
  await loginBtn.click();
  for (const ms of [500, 1500, 3000]) {
    await page.waitForTimeout(ms);
    console.log('AFTER', ms, 'URL', page.url().replace(BASE, ''), 'inputs', await page.locator('input').count(), 'body', (await page.locator('body').innerText()).replace(/\n/g, ' | ').slice(0, 300));
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
