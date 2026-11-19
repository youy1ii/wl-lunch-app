import { chromium } from 'playwright-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const b = await chromium.launch({ headless: true, executablePath: EDGE });
const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
await ctx.addInitScript((s) => {
  localStorage.setItem('wl-lunch:session', JSON.stringify(s));
  window.__vibes = [];
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p) => { window.__vibes.push(p); return true; } });
}, { user: { uid:'12345678', username:'haptics_tester', realName:'触感测试', role:'student', showRealInfo:false, avatar:'😀' }, isAdmin:false, readIds:[] });
const p = await ctx.newPage();
p.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0,300)));
p.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0,500)));
await p.goto('https://youy1ii.github.io/wl-lunch-app/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
console.log(await p.evaluate(() => ({
  url: location.pathname,
  navCount: document.querySelectorAll('nav a').length,
  vibeType: typeof navigator.vibrate,
  bodyText: document.body.innerText.slice(0, 400),
  settings: localStorage.getItem('wl-lunch:settings'),
  hapticsCheckbox: [...document.querySelectorAll('input[type=checkbox]')].map(e => ({checked:e.checked, parent:e.parentElement?.innerText?.slice(0,30)})).slice(0,8),
})));
await b.close();
