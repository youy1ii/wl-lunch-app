const { chromium } = require('playwright-core');
const BASE = 'https://youy1ii.github.io/wl-lunch-app';
const ROUTES = [
  ['/admin', '管理后台', ['总结报告','菜品管理','用户管理','反馈信箱','公告管理','滚动通知']],
  ['/admin/report', '总结报告', ['WL Lunch 食堂口碑报告','数据概览','TOP3 最爱','导出 PDF']],
  ['/admin/announcements', '公告管理', ['公告标题','公告内容','发布公告']],
  ['/admin/ticker', '滚动通知', ['当前通知','发布通知']],
  ['/admin/banner', 'Banner 轮播', ['现有 Banner','添加 Banner','点击后跳转']],
  ['/admin/pinned', '置顶公告', ['置顶公告']],
  ['/admin/tips', '赞赏码', ['赞赏码','上传']],
  ['/admin/frames', '头像框管理', ['现有头像框','上传新头像框']],
  ['/admin/invite', '管理员邀请码', ['邀请码','生成 8 个']],
  ['/admin/dm', '私信广播', ['私信广播','发送消息','全员广播']],
  ['/dish-admin', '菜品管理', ['菜品管理']],
  ['/feedback-inbox', '反馈信箱', ['反馈信箱']],
];
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // 登录
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const i = p.locator('input[placeholder="账号"]');
  if (await i.count()) { await i.fill('WLLC2026'); await p.locator('input[placeholder="密码"]').fill('iloveWL'); await p.getByRole('button',{name:'登录',exact:true}).click(); await p.waitForTimeout(2500); }
  // 关公告
  for(let k=0;k<10;k++){const x=p.getByRole('button',{name:/我已知晓|知道了/});if(!await x.count())break;const en=await x.first().isEnabled().catch(()=>false);if(!en){const sc=p.locator('.dots-bg-fine');if(await sc.count())await sc.first().evaluate(e=>e.scrollTop=e.scrollHeight).catch(()=>{});await p.waitForTimeout(200);}if(await x.first().isEnabled().catch(()=>false)){await x.first().click().catch(()=>{});await p.waitForTimeout(200);}else break;}
  for (const [route, name, keywords] of ROUTES) {
    errs.length = 0;
    await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1200);
    const body = await p.locator('body').innerText();
    const missing = keywords.filter(k => !body.includes(k));
    const ok = missing.length === 0 && errs.length === 0;
    console.log(`${ok?'PASS':'FAIL'} ${route} [${name}] ${body.length}字 ${missing.length?'缺:'+missing.join(','):''} ${errs.length?'ERR:'+errs[0]:''}`);
  }
  await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
