const { chromium } = require('playwright-core');const BASE='https://youy1ii.github.io/wl-lunch-app';
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);const i=p.locator('input[placeholder="账号"]');if(await i.count()){await i.fill('WLLC2026');await p.locator('input[placeholder="密码"]').fill('iloveWL');await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(2500);}
await p.goto(BASE+'/admin/announcements',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
console.log('公告页全文:',(await p.locator('body').innerText()).replace(/\n/g,' | '));
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
