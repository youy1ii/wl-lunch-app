import { chromium } from 'playwright-core';

const URL = 'https://youy1ii.github.io/wl-lunch-app/';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const session = {
  user: { uid: '12345678', username: 'haptics_tester', realName: '触感测试', role: 'student', showRealInfo: false, avatar: '😀' },
  isAdmin: false,
  readIds: [],
};

async function makeContext(browser, ua) {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, ...(ua ? { userAgent: ua } : {}) });
  await ctx.addInitScript((s) => {
    localStorage.setItem('wl-lunch:session', JSON.stringify(s));
    window.__vibes = [];
    window.__labelClicks = 0;
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: (p) => { window.__vibes.push(p); return true; },
    });
    const orig = HTMLLabelElement.prototype.click;
    HTMLLabelElement.prototype.click = function () { window.__labelClicks++; return orig.call(this); };
    Element.prototype.setPointerCapture = function () {};
  }, session);
  return ctx;
}

function pe(type, x, y) {
  return { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' };
}

const out = [];
const browser = await chromium.launch({ headless: true, executablePath: EDGE });

// ---------- 场景 1：普通点击 vs 滑动 ----------
{
  const ctx = await makeContext(browser);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  const res = await page.evaluate(() => {
    const btn = document.querySelector('nav a');
    if (!btn) return { error: 'nav a 未找到' };
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    // 轻点
    const a = window.__vibes.length;
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' }));
    const tap = window.__vibes.slice(a);
    // 滑动：按下后位移 30px 再抬起
    const b = window.__vibes.length;
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x + 30, clientY: y, pointerId: 1, pointerType: 'touch' }));
    const swipe = window.__vibes.slice(b);
    return { tap, swipe, labelClicks: window.__labelClicks };
  });
  out.push({ scene: '普通点击 vs 滑动', ...res, errors: errors.length });
  await ctx.close();
}

// ---------- 场景 2：打分滑块 0.1 / 整数分级 ----------
{
  const ctx = await makeContext(browser);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  const opened = await page.evaluate(async () => {
    document.querySelectorAll('[class*="anim-sheet-mask"]').forEach((el) => el.remove());
    const card = document.querySelector('main button.pressable');
    if (!card) return 'no-card';
    card.click();
    await new Promise((r) => setTimeout(r, 900));
    const btn = [...document.querySelectorAll('button')].find((b) => /写评论|コメント|Write Comment/.test(b.textContent || ''));
    if (!btn) return 'no-rating-btn';
    btn.click();
    await new Promise((r) => setTimeout(r, 600));
    return document.querySelector('[data-rating-track]') ? 'ok' : 'no-track';
  });

  let slider = { error: opened };
  if (opened === 'ok') {
    slider = await page.evaluate(async () => {
      const track = document.querySelector('[data-rating-track]');
      const r = track.getBoundingClientRect();
      const X = (score) => r.left + ((score - 1) / 4) * r.width;
      const y = r.top + r.height / 2;
      window.__vibes.length = 0;
      // 从 1.1 逐步拖到 2.0：跨 9 个 0.1 刻度，其中 2.0 是整数
      track.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: X(1.1), clientY: y, pointerId: 2, pointerType: 'touch' }));
      for (let s = 1.2; s <= 1.999; s += 0.1) {
        track.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: X(s), clientY: y, pointerId: 2, pointerType: 'touch' }));
      }
      track.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: X(2.0), clientY: y, pointerId: 2, pointerType: 'touch' }));
      track.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: X(2.0), clientY: y, pointerId: 2, pointerType: 'touch' }));
      const v = window.__vibes;
      return {
        total: v.length,
        light: v.filter((p) => p === 7).length,
        strong: v.filter((p) => Array.isArray(p)).length,
        firstFew: v.slice(0, 4),
        lastFew: v.slice(-3),
      };
    });
  }
  out.push({ scene: '打分滑块分级', ...slider, errors: errors.length });
  await ctx.close();
}

// ---------- 场景 3：iPhone UA ----------
{
  const ctx = await makeContext(browser, IPHONE_UA);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  const res = await page.evaluate(async () => {
    const btn = document.querySelector('nav a');
    if (!btn) return { error: 'nav a 未找到' };
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const before = window.__labelClicks;
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 3, pointerType: 'touch' }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 3, pointerType: 'touch' }));
    await new Promise((r) => setTimeout(r, 120));
    return {
      labelClicks: window.__labelClicks - before,
      switchExists: !!document.querySelector('input[switch]'),
      vibrateCalls: window.__vibes.length,
    };
  });
  out.push({ scene: 'iPhone隐藏switch', ...res, errors: errors.length });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 2));
