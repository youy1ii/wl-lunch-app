import { chromium } from 'playwright-core';
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE='http://127.0.0.1:4174/wl-lunch-app/';
const browser=await chromium.launch({executablePath:EDGE,headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{
  const user={uid:'12345678',username:'tester',realName:'测',role:'student',showRealInfo:false,avatar:'😀'};
  localStorage.setItem('wl-lunch:session',JSON.stringify({user,isAdmin:false,readIds:[]}));
  localStorage.setItem('wl-lunch:settings',JSON.stringify({lang:'zh',accent:'#E8B923',bgColor:'#dbeafe',textColor:'',bgImage:null,bgBlur:0,frosted:true,opacity:0.82,parallax:false,haptics:true,font:null,theme:'light'}));
});
const page=await ctx.newPage();
const errs=[];
page.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errs.push(m.text())});
page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
await page.goto(BASE,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2400);
// 找到真正滚动的容器并测滚动
const before=await page.evaluate(()=>{
  const body=getComputedStyle(document.body);
  const main=document.querySelector('main');
  return {
    attachment: body.backgroundAttachment,
    bgImage: body.backgroundImage.slice(0,40),
    bodyScrollH: document.body.scrollHeight,
    bodyClientH: document.body.clientHeight,
    mainScrollH: main?.scrollHeight,
    mainClientH: main?.clientHeight,
  };
});
await page.evaluate(()=>{const m=document.querySelector('main');if(m)m.scrollTop=300;});
await page.waitForTimeout(200);
const after=await page.evaluate(()=>({mainScrollTop:document.querySelector('main')?.scrollTop}));
await page.screenshot({path:'D:/桌面/WL lunch APP/wl-lunch-app/_scroll_check.png'});
console.log(JSON.stringify({before,after,errs},null,2));
await browser.close();
