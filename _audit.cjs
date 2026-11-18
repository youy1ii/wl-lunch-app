const { chromium }=require('playwright-core');
const BASE='https://youy1ii.github.io/wl-lunch-app';
const ROUTES=['/','/leaderboard','/dishes','/dishes/1','/me','/announcements','/feedback','/tips','/appearance','/admin','/feedback-inbox','/dish-admin','/user-management'];
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
 let errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(BASE+'/',{waitUntil:'networkidle'});await p.waitForTimeout(1200);
 const i=p.locator('input[placeholder="账号"]');
 if(await i.count()){await i.fill('WLLC2026');await p.locator('input[placeholder="密码"]').fill('iloveWL');await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(1500);}
 for(const r of ROUTES){errs=[];await p.goto(BASE+r,{waitUntil:'networkidle'});await p.waitForTimeout(800);
  for(let k=0;k<6;k++){const x=p.getByRole('button',{name:/我已知晓/});if(!await x.count())break;if(!(await x.isEnabled().catch(()=>false))){const sc=p.locator('.dots-bg-fine');if(await sc.count())await sc.evaluate(e=>e.scrollTop=e.scrollHeight);await p.waitForTimeout(350);}if(await x.isEnabled().catch(()=>false)){await x.click().catch(()=>{});await p.waitForTimeout(250);}else break;}
  const body=await p.locator('body').innerText();
  console.log((body.length>50?'OK ':'EMPTY ')+r+' ('+body.length+'字) '+(errs.length?'ERR:'+errs[0]:''));
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
