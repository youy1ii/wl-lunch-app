const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:4174/wl-lunch-app';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SUPA = 'https://xgkwmkxykxycplhbbyyl.supabase.co/rest/v1';
const KEY = 'sb_publishable_cyf7eAL5C1oFJMtu3_V7Ww_4eLM1F2m';
const M = 'Z' + Date.now().toString().slice(-7);
const TAG = { fb: M + 'F', cm: M + 'C', dm: M + 'D', an: M + 'A', tk: M + 'T' };
const results = [];

function log(name, ok, detail = '') {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' | ' + detail : ''));
  results.push({ name, ok });
}
async function waitRender(page) {
  await page.waitForFunction(() => document.body.innerText.length > 80, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
}
async function closePopup(page) {
  // 可能连续有多条未读公告，逐条滑到底关闭
  for (let i = 0; i < 8; i++) {
    const btn = page.getByRole('button', { name: /我已知晓/ });
    if (!await btn.count()) return;
    if (!(await btn.isEnabled().catch(() => false))) {
      const sc = page.locator('.dots-bg-fine');
      if (await sc.count()) await sc.evaluate(el => { el.scrollTop = el.scrollHeight; }).catch(() => {});
      await page.waitForTimeout(500);
    }
    if (await btn.isEnabled().catch(() => false)) { await btn.click().catch(() => {}); await page.waitForTimeout(350); }
    else return;
  }
}
async function login(page, acc, pwd) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await waitRender(page);
  const inp = page.locator('input[placeholder="账号"]');
  if (await inp.count()) {
    await inp.fill(acc);
    await page.locator('input[placeholder="密码"]').fill(pwd);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.waitForTimeout(1400);
  }
  await closePopup(page);
}
async function goto(page, path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await waitRender(page);
  await closePopup(page);
}
async function toastText(page) {
  return await page.locator('body').innerText();
}
async function bus(kind) {
  const r = await fetch(`${SUPA}/admin_messages?kind=eq.${kind}&select=id,text,author_uid,author_name,created_at&order=id.desc&limit=40`, {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
  });
  return r.json();
}

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox'] });
  const sctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const actx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const stu = await sctx.newPage();
  const adm = await actx.newPage();
  const errs = [];
  for (const [p, label] of [[stu, '学生'], [adm, '管理员']]) {
    p.on('pageerror', e => errs.push(label + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(label + ' console: ' + m.text().slice(0, 160)); });
  }

  await login(stu, 'xranne', 'test1234');
  await login(adm, 'WLLC2026', 'iloveWL');
  const stuHome = await stu.locator('body').innerText();
  await goto(adm, '/admin');
  const admOk = (await adm.locator('body').innerText()).includes('管理后台导览');
  log('双账号登录 + 管理员路由守卫', stuHome.includes('首页') && admOk);

  // 1. 学生提交非匿名反馈
  await goto(stu, '/feedback');
  const anonBox = stu.locator('input[type="checkbox"]');
  if (await anonBox.count() && await anonBox.first().isChecked()) await anonBox.first().uncheck().catch(() => {});
  await stu.locator('textarea[placeholder="发生了什么…"]').fill(TAG.fb + ' 共享反馈');
  await stu.getByRole('button', { name: '提交', exact: true }).click();
  await stu.waitForTimeout(500);
  log('反馈成功提示', (await toastText(stu)).includes('提交成功'), await toastText(stu));
  await stu.waitForTimeout(900);
  const myFb = (await bus('app_feedback')).find(r => r.text.includes(TAG.fb));
  log('反馈写入共享总线', !!myFb, myFb ? 'id=' + myFb.id : '');

  // 2. 管理员信箱看到并回复
  await goto(adm, '/feedback-inbox');
  log('管理员信箱实时看到反馈', (await adm.locator('body').innerText()).includes(TAG.fb));
  const input = adm.locator('input[placeholder="回复"]').first();
  await input.fill(TAG.fb + ' 已回复').catch(() => {});
  await adm.locator('section, div').last().getByRole('button', { name: '发送', exact: true }).first().click({ force: true }).catch(() => {});
  await adm.getByRole('button', { name: '发送', exact: true }).first().click({ force: true }).catch(() => {});
  await adm.waitForTimeout(500);
  log('回复成功提示', (await toastText(adm)).includes('回复已发送'), await toastText(adm));
  await adm.waitForTimeout(1100);
  const replied = (await bus('app_feedback')).find(r => r.id === myFb?.id);
  log('回复写入共享总线', !!replied && replied.text.includes('replied'));

  // 3. 学生收到反馈回复通知
  await goto(stu, '/');
  await stu.waitForTimeout(500);
  await closePopup(stu);
  const bell = stu.locator('button:has(svg.lucide-bell)').first();
  if (await bell.count()) await bell.click({ force: true }).catch(() => {});
  await stu.waitForTimeout(400);
  log('学生收到反馈回复通知', (await stu.locator('body').innerText()).includes('反馈回复'), (await stu.locator('body').innerText()).slice(0, 160));
  if (await bell.count()) await bell.click({ force: true }).catch(() => {});

  // 4. 学生打分评论
  await goto(stu, '/dishes/1');
  const rateBtn = stu.getByRole('button', { name: '我评' }).first();
  if (await rateBtn.count()) await rateBtn.click({ force: true }).catch(() => {});
  await stu.waitForTimeout(600);
  const slider = stu.locator('.h-14.cursor-pointer').first();
  if (await slider.count()) { const b = await slider.boundingBox(); if (b) await stu.mouse.click(b.x + b.width * 0.62, b.y + b.height / 2); }
  const ta = stu.locator('textarea[placeholder="真的不说两句吗？？？"]');
  if (await ta.count()) await ta.fill(TAG.cm + ' 打分实时');
  const submitBtn = stu.locator('button').filter({ hasText: /提交|确定|打分/ }).last();
  if (await submitBtn.count()) await submitBtn.click({ force: true }).catch(() => {});
  await stu.waitForTimeout(500);
  log('打分成功提示', (await toastText(stu)).includes('打分成功') || (await stu.locator('body').innerText()).includes('打分成功'), await toastText(stu));
  await stu.waitForTimeout(1000);
  const rr = await (await fetch(`${SUPA}/ratings?select=id,text&text=like.*${TAG.cm}*`, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })).json().catch(() => []);
  log('评论写入数据库', Array.isArray(rr) && rr.length > 0);

  // 5. 管理员实时看到新评论
  await goto(adm, '/dishes/1');
  log('管理员实时看到新评论', (await adm.locator('body').innerText()).includes(TAG.cm));

  // 6. 管理员广播私信
  await goto(adm, '/admin');
  const secDm = adm.locator('#sec-dm');
  await secDm.locator('textarea').fill(TAG.dm + ' 广播');
  await secDm.getByRole('button', { name: '发送', exact: true }).click({ force: true });
  await adm.waitForTimeout(500);
  log('私信成功提示', (await toastText(adm)).includes('已发送'), await toastText(adm));
  await adm.waitForTimeout(1000);
  log('广播写入共享总线', (await bus('app_notice')).some(r => r.text.includes(TAG.dm)));

  // 7. 管理员发公告
  const secAn = adm.locator('#sec-announce');
  await secAn.locator('input[placeholder="公告标题"]').fill(TAG.an + ' 公告标题');
  await secAn.locator('textarea').fill(TAG.an + ' 公告内容');
  await secAn.getByRole('button', { name: '发布', exact: true }).click({ force: true });
  await adm.waitForTimeout(500);
  log('公告成功提示', (await toastText(adm)).includes('公告发布成功'), await toastText(adm));
  await adm.waitForTimeout(1000);
  log('公告写入共享总线', (await bus('app_announce')).some(r => r.text.includes(TAG.an)));

  // 8. 滚动通知
  const secTk = adm.locator('#sec-ticker');
  await secTk.locator('input').fill(TAG.tk + ' 滚动通知');
  await secTk.getByRole('button', { name: '发布', exact: true }).click({ force: true });
  await adm.waitForTimeout(500);
  log('滚动通知成功提示', (await toastText(adm)).includes('已保存') || (await toastText(adm)).includes('saved'), await toastText(adm));
  await adm.waitForTimeout(1000);
  log('滚动通知写入共享总线', (await bus('app_ticker')).some(r => r.text.includes(TAG.tk)));

  // 9. 学生首页实时看到滚动通知
  await goto(stu, '/');
  await stu.waitForTimeout(600);
  log('学生实时看到滚动通知', (await stu.locator('body').innerText()).includes(TAG.tk));

  // 10. 学生权限
  await goto(stu, '/dishes/1');
  const btns = (await stu.locator('button').allTextContents()).map(s => s.trim());
  log('学生无封禁按钮', !btns.includes('封禁'));
  log('学生删除按钮仅限自己评论', btns.filter(b => b === '删除').length <= 1, '删除按钮 ' + btns.filter(b => b === '删除').length + ' 个');

  log('无运行时错误', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log('\nSUMMARY', results.filter(r => r.ok).length + '/' + results.length);
  await browser.close();
  if (results.some(r => !r.ok)) process.exitCode = 1;
})().catch(e => { console.error('FATAL', e); process.exit(1); });
