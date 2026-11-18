const { chromium }=require('playwright-core');const BASE='https://youy1ii.github.io/wl-lunch-app';
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(BASE+'/',{waitUntil:'networkidle'});await p.waitForTimeout(1200);
const i=p.locator('input[placeholder="账号"]');if(await i.count()){await i.fill('WLLC2026');await p.locator('input[placeholder="密码"]').fill('iloveWL');await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(1600);}
for(const r of ['/feedback','/feedback-inbox','/user-management']){
 await p.goto(BASE+r,{waitUntil:'networkidle'});await p.waitForTimeout(1500);
 const body=await p.locator('body').innerText();
 console.log('=== '+r+' ('+body.length+'字) ===');console.log(body.replace(/\n/g,' | ').slice(0,300));
}
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
