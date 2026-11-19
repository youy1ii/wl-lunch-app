import { chromium } from 'playwright-core';
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const b=await chromium.launch({headless:true,executablePath:EDGE});
// 用手机宽度截图同款场景
const ctx=await b.newContext({viewport:{width:500,height:1000}});
await ctx.addInitScript(()=>{localStorage.setItem('wl-lunch:session',JSON.stringify({user:{uid:'00000000',username:'AAA',realName:'测试',role:'owner',showRealInfo:true,avatar:''},isAdmin:true,readIds:[]}));});
const p=await ctx.newPage();
await p.goto('https://youy1ii.github.io/wl-lunch-app/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(4000);
const r=await p.evaluate(()=>{
  const el=document.querySelector('.wx-notif');
  if(!el)return {err:'no notif'};
  const b=el.getBoundingClientRect();
  const cs=getComputedStyle(el);
  return {left:Math.round(b.left),right:Math.round(b.right),width:Math.round(b.width),center:Math.round((b.left+b.right)/2),viewportCenter:window.innerWidth/2,transform:cs.transform,animationName:cs.animationName};
});
console.log(JSON.stringify(r,null,2));
await b.close();
