import { chromium } from 'playwright-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'https://youy1ii.github.io/wl-lunch-app/';
// 用一个全新的 uid，确保从未点过赞
const SESSION = {
  user: { uid: 'LIKETEST777', username: 'liketester', realName: '点赞测试', role: 'student', showRealInfo: false, avatar: '' },
  isAdmin: false, readIds: [],
};
const browser = await chromium.launch({ headless: true, executablePath: EDGE });
const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
await ctx.addInitScript((s) => {
  localStorage.setItem('wl-lunch:session', JSON.stringify(s));
  window.__writes = [];
  const origFetch = window.fetch;
  window.fetch = function (url, opts) {
    const u = String(url);
    const m = (opts?.method || 'GET').toUpperCase();
    if (u.includes('/rest/v1/rating_likes') && m !== 'GET') {
      window.__writes.push({ method: m, body: opts?.body, url: u.split('/rest/v1/')[1] });
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

const getHeart = () => page.evaluate(() => {
  const p = [...document.querySelectorAll('p')].find((e) => (e.textContent || '').includes('蒜香够'));
  const card = p?.closest('div.anim-rise');
  const heart = card && [...card.querySelectorAll('button')].find((b) => b.querySelector('svg.lucide-heart'));
  return { text: heart?.textContent?.trim(), cls: heart?.className?.slice(-80) };
});
console.log('点赞前:', JSON.stringify(await getHeart()));
await page.evaluate(() => {
  const p = [...document.querySelectorAll('p')].find((e) => (e.textContent || '').includes('蒜香够'));
  const card = p?.closest('div.anim-rise');
  const heart = card && [...card.querySelectorAll('button')].find((b) => b.querySelector('svg.lucide-heart'));
  heart?.click();
});
await page.waitForTimeout(300);
console.log('点击后即时:', JSON.stringify(await getHeart()));
await page.waitForTimeout(2000);
console.log('2秒后:', JSON.stringify(await getHeart()));
const writes = await page.evaluate(() => window.__writes);
console.log('写请求:', JSON.stringify(writes, null, 2));
console.log('错误:', errors.length, errors.slice(0, 3));
await browser.close();
