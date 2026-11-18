const { chromium } = require('playwright-core');const BASE='https://youy1ii.github.io/wl-lunch-app';
async function closeAnn(p){for(let k=0;k<8;k++){const x=p.getByRole('button',{name:/我已知晓|知道了/});if(!await x.count())break;const en=await x.first().isEnabled().catch(()=>false);if(!en){const sc=p.locator('.dots-bg-fine');if(await sc.count())await sc.first().evaluate(e=>e.scrollTop=e.scrollHeight).catch(()=>{});await p.waitForTimeout(250);}if(await x.first().isEnabled().catch(()=>false)){await x.first().click().catch(()=>{});await p.waitForTimeout(250);}else break;}}
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
 const i=p.locator('input[placeholder="账号"]');if(await i.count()){await i.fill('WLLC2026');await p.locator('input[placeholder="密码"]').fill('iloveWL');await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(2800);}
 await closeAnn(p);
 // 等弹窗出现(登录后通知加载触发)
 let found=false;
 for(let k=0;k<12;k++){if(await p.locator('.wx-notif').count()){found=true;break;}await p.waitForTimeout(500);}
 console.log('微信弹窗出现:',found);
 if(found){const t=await p.locator('.wx-notif').innerText();console.log('弹窗内容:',t.replace(/\n/g,' | '));await p.screenshot({path:'D:/桌面/WL lunch APP/_popup.png'});}
 await b.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
