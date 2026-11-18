const { chromium } = require('playwright-core');
const BASE = 'https://youy1ii.github.io/wl-lunch-app';
const ROUTES = [
  ['/admin', ['总结报告','菜品管理','用户管理','反馈信箱','公告管理','滚动通知','私信广播']],
  ['/admin/report', ['WL Lunch 食堂口碑报告','数据概览','TOP3 最爱','导出 PDF']],
  ['/admin/announcements', ['公告标题','公告内容','发布']],
  ['/admin/ticker', ['当前通知','发布通知']],
  ['/admin/banner', ['现有 Banner','添加 Banner']],
  ['/admin/pinned', ['置顶公告']],
  ['/admin/tips', ['赞赏码']],
  ['/admin/frames', ['现有头像框','上传新头像框']],
  ['/admin/invite', ['邀请码','生成 8 个']],
  ['/admin/dm', ['私信广播','发送消息','全员广播']],
  ['/dish-admin', ['菜品管理']],
  ['/feedback-inbox', ['反馈信箱']],
];
async function closeAnn(p){for(let k=0;k<12;k++){const x=p.getByRole('button',{name:/我已知晓|知道了/});if(!await x.count())break;const en=await x.first().isEnabled().catch(()=>false);if(!en){const sc=p.locator('.dots-bg-fine');if(await sc.count())await sc.first().evaluate(e=>e.scrollTop=e.scrollHeight).catch(()=>{});await p.waitForTimeout(200);}if(await x.first().isEnabled().catch(()=>false)){await x.first().click().catch(()=>{});await p.waitForTimeout(200);}else break;}}
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(BASE+'/',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3000);
  const i=p.locator('input[placeholder="账号"]');
  if(await i.count()){await i.fill('WLLC2026');await p.locator('input[placeholder="密码"]').fill('iloveWL');await p.getByRole('button',{name:'登录',exact:true}).click();await p.waitForTimeout(3000);}
  await closeAnn(p);
  let pass=0, fail=0;
  for(const [route,keywords] of ROUTES){
    errs.length=0;
    await p.goto(BASE+route,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2000);
    await closeAnn(p);
    const body=await p.locator('body').innerText();
    const missing=keywords.filter(k=>!body.includes(k));
    const ok=missing.length===0 && errs.length===0;
    if(ok)pass++;else fail++;
    console.log(`${ok?'PASS':'FAIL'} ${route} (${body.length}字)${missing.length?' 缺:'+missing.join(','):''}${errs.length?' ERR:'+errs[0]:''}`);
  }
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
