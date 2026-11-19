import { chromium } from 'playwright-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'https://youy1ii.github.io/wl-lunch-app/';
const SESSION = {
  user: { uid: '00000000', username: 'WLLC2026', nickname: 'E2E', realName: '测试', role: 'student', showRealInfo: false, avatar: '🙂' },
  isAdmin: true,
  readIds: [],
};

const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
await ctx.addInitScript((session) => {
  localStorage.setItem('wl-lunch:session', JSON.stringify(session));
}, SESSION);
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.locator('nav a').first().waitFor({ timeout: 30000 });

async function dismissPopup() {
  await page.evaluate(() => {
    // 公告弹窗（居中 z-50 遮罩）移除，避免挡住后续点击
    document.querySelectorAll('div.absolute.inset-0.z-50').forEach((el) => el.remove());
  });
}

async function loader(label) {
  const el = page.locator('main > div').first();
  await el.waitFor({ timeout: 10000 });
  const cls = ((await el.getAttribute('class')) || '').trim();
  const dur = await el.evaluate((e) => getComputedStyle(e).animationDuration);
  const name = await el.evaluate((e) => getComputedStyle(e).animationName);
  const filter = await el.evaluate((e) => getComputedStyle(e).filter);
  return { label, cls, dur, name, filter };
}

const results = [];
await dismissPopup();
results.push(await loader('首次进入'));

// 导航栏切到榜单（应为 0.22s 轻量过渡）
await page.locator('nav a').nth(1).click();
await page.waitForTimeout(80);
results.push(await loader('导航栏→榜单'));

// 停在该页一段时间后重渲染确认仍是 swap 不被替换
await page.evaluate(() => window.dispatchEvent(new Event('resize')));
await page.waitForTimeout(120);
results.push(await loader('榜单停留后'));

// 导航栏切到我的，检查设置页头部组件
await page.locator('nav a').nth(3).click();
await page.waitForTimeout(150);
results.push(await loader('导航栏→我的'));

// 从「我的」点外观设置，检查 SettingsHeader 渲染
await dismissPopup();
const appearanceLink = page.locator('button:has-text("外观")').first();
if (await appearanceLink.count()) {
  await appearanceLink.click();
  await page.waitForTimeout(650);
  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  results.push({ label: '外观页标题', h1: (h1 || '').trim() });
  results.push(await loader('卡片→外观页'));
}

// 回到我的，点编辑资料弹窗，检查 0.5s 弹出
await page.locator('nav a').nth(3).click();
await page.waitForTimeout(200);
await dismissPopup();
const editBtn = page.locator('button:has-text("编辑资料")').first();
if (await editBtn.count()) {
  await editBtn.click();
  await page.waitForTimeout(60);
  const sheet = page.locator('.anim-sheet-up').first();
  const sheetDur = await sheet.evaluate((e) => getComputedStyle(e).animationDuration).catch(() => 'N/A');
  const sheetName = await sheet.evaluate((e) => getComputedStyle(e).animationName).catch(() => 'N/A');
  results.push({ label: '编辑资料弹窗', dur: sheetDur, name: sheetName });
}

console.log(JSON.stringify({ results, errors }, null, 2));
await browser.close();
