const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:4174/wl-lunch-app';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.locator('input[placeholder="账号"]').fill('WLLC2026');
  await page.locator('input[placeholder="密码"]').fill('iloveWL');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForTimeout(1400);
  const btn = page.getByRole('button', { name: /我已知晓/ });
  if (await btn.count()) { const sc = page.locator('.dots-bg-fine'); if (await sc.count()) await sc.evaluate(el => el.scrollTop = el.scrollHeight); await page.waitForTimeout(400); if (await btn.isEnabled()) await btn.click(); await page.waitForTimeout(300); }
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1300);
  console.log('BTNS:', JSON.stringify((await page.locator('button').allTextContents()).map(s => s.trim()).filter(Boolean)));
  console.log('INPUTS:', JSON.stringify(await page.locator('input,textarea').evaluateAll(els => els.map(e => e.placeholder))));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
