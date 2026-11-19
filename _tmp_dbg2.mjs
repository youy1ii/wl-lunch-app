import { chromium } from 'playwright-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const b = await chromium.launch({ headless: true, executablePath: EDGE });
const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
await ctx.addInitScript((s) => {
  localStorage.setItem('wl-lunch:session', JSON.stringify(s));
  window.__vibes = [];
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p) => { window.__vibes.push(p); return true; } });
  window.__log = [];
  document.addEventListener('pointerdown', e => window.__log.push('down:'+e.target.tagName), true);
  document.addEventListener('pointerup', e => window.__log.push('up:'+e.target.tagName+':'+e.clientX), true);
}, { user: { uid:'12345678', username:'haptics_tester', realName:'触感测试', role:'student', showRealInfo:false, avatar:'😀' }, isAdmin:false, readIds:[] });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0,300)));
await p.goto('https://youy1ii.github.io/wl-lunch-app/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
console.log(await p.evaluate(() => {
  const btn = document.querySelector('nav a');
  const r = btn.getBoundingClientRect();
  const x = r.left + r.width/2, y = r.top + r.height/2;
  window.__vibes.length = 0; window.__log.length = 0;
  btn.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, clientX:x, clientY:y, pointerId:1, pointerType:'touch'}));
  document.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, clientX:x, clientY:y, pointerId:1, pointerType:'touch'}));
  return { rect: {x:r.x,y:r.y,w:r.width,h:r.height}, vibes: window.__vibes.slice(), log: window.__log.slice() };
}));
await b.close();
