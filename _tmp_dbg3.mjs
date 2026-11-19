import { chromium } from 'playwright-core';
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const b=await chromium.launch({headless:true,executablePath:EDGE});
const ctx=await b.newContext({viewport:{width:430,height:900}});
await ctx.addInitScript((s)=>localStorage.setItem('wl-lunch:session',JSON.stringify(s)),{user:{uid:'12345678',username:'haptics_tester',realName:'触感测试',role:'student',showRealInfo:false,avatar:'😀'},isAdmin:false,readIds:[]});
const p=await ctx.newPage();
await p.goto('https://youy1ii.github.io/wl-lunch-app/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(4000);
console.log(await p.evaluate(()=>({
  mainButtons:[...document.querySelectorAll('main button')].slice(0,12).map(e=>({cls:e.className.slice(0,90),text:e.innerText.slice(0,30)})),
  animRise:document.querySelectorAll('.anim-rise').length,
  links:[...document.querySelectorAll('main a')].slice(0,5).map(e=>e.getAttribute('href')),
})));
await b.close();
