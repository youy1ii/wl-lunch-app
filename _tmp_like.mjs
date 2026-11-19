import { chromium } from 'playwright-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'https://youy1ii.github.io/wl-lunch-app/';
const SESSION = {
  user: { uid: '59555332', username: 'hycdashabi', realName: '测试', role: 'student', showRealInfo: false, avatar: '' },
  isAdmin: false, readIds: [],
};
const browser = await chromium.launch({ headless: true, executablePath: EDGE });
const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
await ctx.addInitScript((s) => {
  localStorage.setItem('wl-lunch:session', JSON.stringify(s));
  // 拦截并记录所有 supabase 请求
  window.__reqs = [];
  const origFetch = window.fetch;
  window.fetch = function (url, opts) {
    const u = String(url);
    if (u.includes('/rest/v1/')) {
      window.__reqs.push({ method: opts?.method || 'GET', url: u.split('/rest/v1/')[1].slice(0, 80), t: Date.now() });
    }
    return origFetch.apply(this, arguments);
  };
}, SESSION);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
await page.evaluate(() => {
  window.history.pushState({}, '', '/wl-lunch-app/dishes/11');
  window.dispatchEvent(new PopStateEvent('popstate'));
});
await page.waitForTimeout(2500);
await page.evaluate(() => document.querySelectorAll('[class*="anim-sheet-mask"]').forEach((e) => e.remove()));

// 找到一条他人评论的点赞按钮（华子豪"蒜香够"）
const before = await page.evaluate(() => {
  const p = [...document.querySelectorAll('p')].find((e) => (e.textContent || '').includes('蒜香够'));
  const card = p?.closest('div.anim-rise');
  const heart = card && [...card.querySelectorAll('button')].find((b) => b.querySelector('svg.lucide-heart'));
  return { found: !!heart, before: heart?.textContent?.trim(), reqBefore: window.__reqs.length };
});
console.log('===点赞前===', JSON.stringify(before));

// 点击点赞
await page.evaluate(() => {
  const p = [...document.querySelectorAll('p')].find((e) => (e.textContent || '').includes('蒜香够'));
  const card = p?.closest('div.anim-rise');
  const heart = card && [...card.querySelectorAll('button')].find((b) => b.querySelector('svg.lucide-heart'));
  heart?.click();
});
await page.waitForTimeout(200);
const immediate = await page.evaluate(() => {
  const p = [...document.querySelectorAll('p')].find((e) => (e.textContent || '').includes('蒜香够'));
  const card = p?.closest('div.anim-rise');
  const heart = card && [...card.querySelectorAll('button')].find((b) => b.querySelector('svg.lucide-heart'));
  return { text: heart?.textContent?.trim(), red: heart?.className.includes('text-primary') };
});
console.log('===点击后立即(乐观更新)===', JSON.stringify(immediate));

// 等2秒看是否被 loadAll 回滚
await page.waitForTimeout(2500);
const after = await page.evaluate(() => {
  const p = [...document.querySelectorAll('p')].find((e) => (e.textContent || '').includes('蒜香够'));
  const card = p?.closest('div.anim-rise');
  const heart = card && [...card.querySelectorAll('button')].find((b) => b.querySelector('svg.lucide-heart'));
  const reqs = window.__reqs.slice(-20);
  return { text: heart?.textContent?.trim(), red: heart?.className.includes('text-primary'), reqs };
});
console.log('===2.5秒后===', JSON.stringify(after, null, 2));
console.log('===错误===', errors.length, errors.slice(0, 3));
await browser.close();
