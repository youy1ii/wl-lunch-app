const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:4174/wl-lunch-app';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const ROUTES = ['/', '/leaderboard', '/dishes', '/dishes/1', '/me', '/announcements', '/feedback', '/tips', '/appearance', '/admin', '/feedback-inbox', '/dish-admin', '/user-management'];

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  let errs = [];
  page.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('logo.png') && !m.text().includes('Failed to load resource')) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('input[placeholder="账号"]').fill('WLLC2026');
  await page.locator('input[placeholder="密码"]').fill('iloveWL');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForTimeout(1500);
  console.log('LOGIN URL', page.url());

  for (const r of ROUTES) {
    errs = [];
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.innerText.length > 80, null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    // 关闭公告弹窗
    const known = page.getByRole('button', { name: /我已知晓|知道了/ });
    if (await known.count()) { await known.first().click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
    const body = (await page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 180);
    const btns = (await page.locator('button').allTextContents()).map(s => s.trim()).filter(Boolean).slice(0, 35);
    const inputs = await page.locator('input,textarea').evaluateAll(els => els.map(e => e.placeholder || e.type).slice(0, 15));
    console.log('\n=== ' + r + ' ===');
    console.log('URL:', page.url().replace(BASE, ''), '| BODY:', body);
    console.log('BTNS:', JSON.stringify(btns));
    console.log('INPUTS:', JSON.stringify(inputs));
    console.log('ERRS:', errs.length ? JSON.stringify(errs) : 'none');
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
