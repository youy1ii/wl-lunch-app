import { chromium } from 'playwright-core';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'http://127.0.0.1:4174/wl-lunch-app/';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });

async function shot(name, extra) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  await ctx.addInitScript((ex) => {
    const user = { uid: '12345678', username: 'tester', realName: '测试', role: 'student', showRealInfo: false, avatar: '😀' };
    localStorage.setItem('wl-lunch:session', JSON.stringify({ user, isAdmin: false, readIds: [] }));
    const s = { lang:'zh', accent:'#E8B923', bgColor:'', textColor:'', bgImage:null, bgBlur:0, frosted:true, opacity:0.82, parallax:false, haptics:true, font:null, theme:'light', ...ex };
    localStorage.setItem('wl-lunch:settings', JSON.stringify(s));
  }, extra);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2400);
  await page.screenshot({ path: `D:/桌面/WL lunch APP/wl-lunch-app/_probe_${name}.png` });
  const info = await page.evaluate(() => {
    const glowWrap = document.querySelector('.app-frame > .pointer-events-none.absolute.inset-0.-z-10.overflow-hidden');
    const topGlow = glowWrap?.children[0];
    const botGlow = glowWrap?.children[1];
    const frame = document.querySelector('.app-frame');
    return {
      frameBg: frame ? getComputedStyle(frame).backgroundColor : null,
      hasGlowWrap: !!glowWrap,
      topBg: topGlow ? getComputedStyle(topGlow).backgroundImage : null,
      botBg: botGlow ? getComputedStyle(botGlow).backgroundImage : null,
    };
  });
  console.log(name, JSON.stringify(info));
  await ctx.close();
}

await shot('default', {});
await shot('bgccolor', { bgColor:'#dbeafe' });
await shot('bgccolor_dark', { bgColor:'#1e293b', theme:'dark' });
await shot('accent', { accent:'#ff3366' });
await browser.close();
