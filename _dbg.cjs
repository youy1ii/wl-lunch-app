const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:4174/wl-lunch-app';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message));

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.locator('input[placeholder="账号"]').fill('xranne');
  await page.locator('input[placeholder="密码"]').fill('test1234');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForTimeout(1500);
  console.log('STU HOME:', (await page.locator('body').innerText()).replace(/\n/g, ' | ').slice(0, 200));

  // 关公告
  const btn = page.getByRole('button', { name: /我已知晓/ });
  if (await btn.count()) {
    const sc = page.locator('.dots-bg-fine');
    if (await sc.count()) await sc.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(400);
    if (await btn.isEnabled()) await btn.click();
    await page.waitForTimeout(300);
  }

  await page.goto(BASE + '/dishes/1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  console.log('DISH BTNS:', JSON.stringify((await page.locator('button').allTextContents()).map(s => s.trim()).filter(Boolean).slice(0, 45)));
  console.log('DISH BODY:', (await page.locator('body').innerText()).replace(/\n/g, ' | ').slice(0, 900));

  // 管理员后台按钮全量
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  console.log('ADMIN BTNS:', JSON.stringify((await page.locator('button').allTextContents()).map(s => s.trim()).filter(Boolean)));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
