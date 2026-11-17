const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:4174/wl-lunch-app';
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.locator('input[placeholder="账号"]').fill('xranne');
  await page.locator('input[placeholder="密码"]').fill('test1234');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForTimeout(1400);
  const btn = page.getByRole('button', { name: /我已知晓/ });
  if (await btn.count()) { const sc = page.locator('.dots-bg-fine'); if (await sc.count()) await sc.evaluate(el => el.scrollTop = el.scrollHeight); await page.waitForTimeout(400); if (await btn.isEnabled()) await btn.click(); await page.waitForTimeout(300); }
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  console.log('BTN HTMLS:', JSON.stringify((await page.locator('button').evaluateAll(els => els.map(e => e.outerHTML.slice(0, 180)))).slice(0, 6)));
  const bell = page.locator('button:has(svg.lucide-bell)');
  console.log('BELL COUNT', await bell.count());
  if (await bell.count()) { await bell.first().click({ force: true }); await page.waitForTimeout(500); }
  console.log('BODY AFTER BELL:', (await page.locator('body').innerText()).replace(/\n/g, ' | ').slice(0, 700));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
