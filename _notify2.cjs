const { chromium } = require('playwright-core');const BASE='https://youy1ii.github.io/wl-lunch-app';
async function closeAnn(p){for(let k=0;k<15;k++){const x=p.getByRole('button',{name:/我已知晓|知道了/});if(!await x.count())break;const en=await x.first().isEnabled().catch(()=>false);if(!en){const sc=p.locator('.dots-bg-fine');if(await sc.count())await sc.first().evaluate(e=>e.scrollTop=e.scrollHeight).catch(()=>{});await p.waitForTimeout(250);}if(await x.first().isEnabled().catch(()=>false)){await x.first().click().catch(()=>{});await p.waitForTimeout(250);}else break;}}
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(3500);
 const i=p.locator('input[placeholder="账号"]');if(await i.count()){await i.fill('WLLC2026');await p.locator('input[placeholder="密码"]').fill('iloveWL');await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(3000);}
 await closeAnn(p);
 await p.goto(BASE+'/feedback-inbox',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.body.innerText.includes('反馈信箱'),{timeout:10000}).catch(()=>{});
 await p.waitForTimeout(1200);await closeAnn(p);
 let body=await p.locator('body').innerText();
 console.log('信箱全文:',body.replace(/\n/g,' | ').slice(0,200));
 // 点第一个会话卡片
 const cards=p.locator('button:has-text("测试学生")');
 console.log('测试学生卡片数:',await cards.count());
 if(await cards.count()){await cards.first().click();await p.waitForTimeout(1000);
   const chat=await p.locator('body').innerText();
   console.log('聊天窗含反馈:',chat.includes('E2E验证通知弹窗'));
   const inp=p.locator('input[placeholder*="回复"]');console.log('输入框数:',await inp.count());
   if(await inp.count()){await inp.fill('E2E管理员已回复');
     const sendBtn=p.locator('button:has(svg.lucide-send)');console.log('发送按钮数:',await sendBtn.count());
     await sendBtn.click().catch(e=>console.log('发送点击失败',e.message));await p.waitForTimeout(2000);}
 }
 const glow=await p.locator('.glow-mint').count();
 console.log('glow-mint元素:',glow);
 body=await p.locator('body').innerText();
 console.log('含回复:',body.includes('E2E管理员已回复'),'含总管理员徽章:',body.includes('总管理员'));
 await b.close();
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
