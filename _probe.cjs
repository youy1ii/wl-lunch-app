const { chromium } = require('playwright-core');
(async()=>{
  const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true, args:['--no-sandbox']});
  const ctx = await browser.newContext({viewport:{width:390,height:844}});
  const page = await ctx.newPage();
  page.on('pageerror',e=>console.log('PAGEERR', e.message));
  page.on('console',m=>console.log('CONSOLE',m.type(),m.text().slice(0,300)));
  page.on('requestfailed',r=>console.log('REQFAIL',r.url().slice(0,150),r.failure()?.errorText));
  page.on('response',r=>{ if(r.status()>=400) console.log('HTTP',r.status(),r.url().slice(0,150)); });
  await page.goto('http://127.0.0.1:4174/wl-lunch-app/',{waitUntil:'networkidle'});
  await page.waitForTimeout(3000);
  console.log('URL', page.url());
  console.log('ROOT HTML', (await page.locator('#root').innerHTML()).slice(0,300));
  console.log('INPUTS', await page.locator('input').count());
  console.log('BODY', (await page.locator('body').innerText()).slice(0,600).replace(/\n/g,' | '));
  await browser.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
