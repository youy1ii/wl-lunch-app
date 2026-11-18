const { chromium } = require('playwright-core');
const https=require('https');const BASE='https://youy1ii.github.io/wl-lunch-app';
const SUPA='https://xgkwmkxykxycplhbbyyl.supabase.co/rest/v1',KEY='sb_publishable_cyf7eAL5C1oFJMtu3_V7Ww_4eLM1F2m';
async function closeAnn(p){for(let k=0;k<8;k++){const x=p.getByRole('button',{name:/我已知晓|知道了/});if(!await x.count())break;const en=await x.first().isEnabled().catch(()=>false);if(!en){const sc=p.locator('.dots-bg-fine');if(await sc.count())await sc.first().evaluate(e=>e.scrollTop=e.scrollHeight).catch(()=>{});await p.waitForTimeout(250);}if(await x.first().isEnabled().catch(()=>false)){await x.first().click().catch(()=>{});await p.waitForTimeout(250);}else break;}}
function insertNotif(){return new Promise((res)=>{const d=JSON.stringify({target_uid:'00000000',kind:'reply',text:'📬 E2E微信弹窗-你的反馈收到回复了',read:false});const r=https.request(SUPA+'/notifications',{method:'POST',headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},x=>{x.on('end',()=>res(x.statusCode));});r.write(d);r.end();});}
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(3000);
 const i=p.locator('input[placeholder="账号"]');if(await i.count()){await i.fill('WLLC2026');await p.locator('input[placeholder="密码"]').fill('iloveWL');await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(3000);}
 await closeAnn(p);await p.waitForTimeout(1000);
 console.log('弹窗前 wx-notif 数:',await p.locator('.wx-notif').count());
 console.log('插入通知 HTTP:',await insertNotif());
 await p.waitForTimeout(2500);
 const pop=p.locator('.wx-notif');
 console.log('弹窗后 wx-notif 数:',await pop.count());
 if(await pop.count()){console.log('弹窗内容:',(await pop.innerText()).replace(/\n/g,' | '));
   await p.screenshot({path:'D:/桌面/WL lunch APP/_popup.png'});
   console.log('含"评论回复"标题:',(await pop.innerText()).includes('评论回复'));
   console.log('含消息文本:',(await pop.innerText()).includes('E2E微信弹窗'));
 }
 await b.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
