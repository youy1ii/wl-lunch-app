import { chromium } from 'playwright-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL = 'https://youy1ii.github.io/wl-lunch-app/';
const SESSION = {
  user: {
    uid: '59555332', username: 'hycdashabi', realName: '测试用户',
    role: 'student', showRealInfo: false, avatar: '',
  },
  isAdmin: false, readIds: [],
};

const browser = await chromium.launch({ headless: true, executablePath: EDGE });
// 宽屏视口，模拟桌面居中卡片（两侧黑边），这是截图里的场景
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript((s) => localStorage.setItem('wl-lunch:session', JSON.stringify(s)), SESSION);
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
await page.evaluate(() => {
  window.history.pushState({}, '', '/wl-lunch-app/dishes/11');
  window.dispatchEvent(new PopStateEvent('popstate'));
});
await page.waitForTimeout(2500);

// 滚动评论区容器
await page.evaluate(() => {
  document.querySelectorAll('[class*="anim-sheet-mask"]').forEach((e) => e.remove());
  const main = document.querySelector('main');
  const sc = main?.querySelector('.overflow-y-auto') || main;
  if (sc) sc.scrollTop = 500;
});
await page.waitForTimeout(600);

const dump = await page.evaluate(() => {
  const frame = document.querySelector('.app-frame');
  const fr = frame.getBoundingClientRect();
  const out = [];
  const all = document.querySelectorAll('*');
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // 找出水平方向超出卡片边界的可见元素
    if (r.right > fr.right + 2 || r.left < fr.left - 2) {
      const txt = (el.textContent || '').trim().slice(0, 20);
      out.push({
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 90),
        pos: cs.position,
        bg: cs.backgroundColor,
        left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top),
        txt,
      });
    }
  }
  return {
    frame: { left: Math.round(fr.left), right: Math.round(fr.right), width: Math.round(fr.width) },
    viewport: { w: window.innerWidth },
    over: out.slice(0, 40),
  };
});
console.log(JSON.stringify(dump, null, 2));
await browser.close();
