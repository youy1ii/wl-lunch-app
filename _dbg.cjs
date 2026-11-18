const { chromium } = require('playwright-core');const BASE='https://youy1ii.github.io/wl-lunch-app';
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(3000);
console.log('初始BODY:',(await p.locator('body').innerText()).replace(/\n/g,'|').slice(0,200));
const i=p.locator('input[placeholder="账号"]');console.log('账号框数:',await i.count());
if(await i.count()){await i.fill('WLLC2026');await p.locator('input[placeholder="密码"]').fill('iloveWL');await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(3000);}
console.log('登录后BODY:',(await p.locator('body').innerText()).replace(/\n/g,'|').slice(0,250));
await p.goto(BASE+'/admin',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2000);
console.log('/admin BODY:',(await p.locator('body').innerText()).replace(/\n/g,'|').slice(0,400));
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
