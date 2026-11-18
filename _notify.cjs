const { chromium } = require('playwright-core');const BASE='https://youy1ii.github.io/wl-lunch-app';
async function login(p,acc,pwd){await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);const i=p.locator('input[placeholder="账号"]');if(await i.count()){await i.fill(acc);await p.locator('input[placeholder="密码"]').fill(pwd);await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(3500);}}
async function closeAnn(p){for(let k=0;k<12;k++){const x=p.getByRole('button',{name:/我已知晓|知道了/});if(!await x.count())break;const en=await x.first().isEnabled().catch(()=>false);if(!en){const sc=p.locator('.dots-bg-fine');if(await sc.count())await sc.first().evaluate(e=>e.scrollTop=e.scrollHeight).catch(()=>{});await p.waitForTimeout(200);}if(await x.first().isEnabled().catch(()=>false)){await x.first().click().catch(()=>{});await p.waitForTimeout(200);}else break;}}
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 // 管理员登录并回复
 await login(p,'WLLC2026','iloveWL');await closeAnn(p);
 await p.goto(BASE+'/feedback-inbox',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2800);
 const session=p.getByText('测试学生',{exact:true}).first();
 if(await session.count()){await session.click();await p.waitForTimeout(600);
   const inp=p.locator('input[placeholder*="回复"]');
   if(await inp.count()){await inp.fill('E2E管理员已回复');await p.locator('button:has(svg.lucide-send)').click().catch(()=>{});await p.waitForTimeout(1500);}
 }
 // 检查管理员头像class
 const ownerAvatars=await p.locator('.glow-mint').count();
 console.log('【总管理员头像泛光】glow-mint元素数:',ownerAvatars, ownerAvatars>0?'PASS':'FAIL');
 // 检查回复后是否薄荷绿
 const body=await p.locator('body').innerText();
 console.log('【回复显示】含回复内容:',body.includes('E2E管理员已回复'));
 console.log('【总管理员徽章】:',body.includes('总管理员')?'PASS':'未显示');
 await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
