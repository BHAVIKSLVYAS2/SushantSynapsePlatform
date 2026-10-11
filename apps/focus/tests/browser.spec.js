const {test,expect}=require('@playwright/test');const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-mixer-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});

test('focus timer pauses, resumes and completes after elapsed background time',async({page})=>{
 await page.clock.install();
 await page.setViewportSize({width:320,height:850});
 await page.goto(base+'/focus');
 await expect(page.locator('#timer')).toHaveText('25:00');
 await expect(page.locator('#pauseBtn')).toBeDisabled();
 await page.locator('#startBtn').click();
 await expect(page.locator('#startBtn')).toBeDisabled();
 await page.clock.fastForward(60000);
 await expect(page.locator('#timer')).toHaveText('24:00');
 await page.locator('#pauseBtn').click();
 await page.clock.fastForward(120000);
 await expect(page.locator('#timer')).toHaveText('24:00');
 await page.locator('#startBtn').click();
 await page.clock.fastForward(24*60000);
 await expect(page.locator('#timer')).toHaveText('00:00');
 await expect(page.locator('#focus-status')).toContainText('Focus session complete!');
 await expect(page.locator('#pauseBtn')).toBeDisabled();
 await page.locator('#startBtn').click();
 await expect(page.locator('#timer')).toHaveText('25:00');
 await page.clock.fastForward(1000);
 await page.locator('#resetBtn').click();
 await expect(page.locator('#timer')).toHaveText('25:00');
 await page.clock.fastForward(60000);
 await expect(page.locator('#timer')).toHaveText('25:00');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('browser tasks work without login, persist, isolate profiles and carry forward',async({page,browser})=>{
 const errors=[],taskRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/focus'))taskRequests.push(r.url());});await page.goto(base+'/focus');
 await expect(page.locator('#task-form')).toBeVisible();
 await page.locator('#plan-date').fill('2026-10-10');await page.locator('#plan-date').dispatchEvent('change');
 await page.locator('#task-form input[name=title]').fill('Prepare client proposal');await page.locator('#task-form select[name=priority]').selectOption('High');await page.locator('#task-form button[type=submit]').click();
 await expect(page.locator('#task-list')).toContainText('Prepare client proposal');await page.reload();
 await page.locator('#plan-date').fill('2026-10-11');await page.locator('#plan-date').dispatchEvent('change');
 await expect(page.locator('#carry-list')).toContainText('Prepare client proposal');await page.getByRole('button',{name:'Bring to this day'}).click();await expect(page.locator('#task-list')).toContainText('Prepare client proposal');
 await page.getByRole('button',{name:'Focus on this'}).click();await expect(page.locator('#current-task')).toContainText('Prepare client proposal');
 await page.getByRole('checkbox',{name:'Complete Prepare client proposal'}).check();await expect(page.locator('#summary')).toContainText('1 of 1 complete');await expect(page.locator('#task-status')).toHaveText('Saved in this browser.');
 const other=await browser.newContext();try{const otherPage=await other.newPage();await otherPage.goto(base+'/focus');await expect(otherPage.locator('#task-form')).toBeVisible();await expect(otherPage.locator('#task-list .task-row')).toHaveCount(0);}finally{await other.close();}
 const tab=await page.context().newPage();await tab.goto(base+'/focus');await tab.locator('#plan-date').fill('2026-10-11');await tab.locator('#plan-date').dispatchEvent('change');await expect(tab.locator('#task-list')).toContainText('Prepare client proposal');await tab.close();expect(taskRequests).toEqual([]);
 await page.getByRole('button',{name:'Dark mode',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:'.publish/focus-office-mobile-dark.png',fullPage:true});
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.goto(base+'/pocket-pause');await expect(page.locator('#timer')).toHaveCount(0);await expect(page.getByRole('link',{name:'Planning your work? Open Focus'})).toBeVisible();expect(errors).toEqual([]);
});


test('blocked storage rejects saves without losing the existing browser tasks',async({page})=>{
 await page.goto(base+'/focus');await page.locator('#task-form input[name=title]').fill('First saved task');await page.locator('#task-form button[type=submit]').click();await expect(page.locator('#task-list')).toContainText('First saved task');
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};});
 await page.locator('#task-form input[name=title]').fill('Unsaved task');await page.locator('#task-form button[type=submit]').click();await expect(page.locator('#task-status')).toContainText('Unable to save');await expect(page.locator('#task-list .task-row')).toHaveCount(1);await page.reload();await expect(page.locator('#task-list')).toContainText('First saved task');await expect(page.locator('#task-list')).not.toContainText('Unsaved task');
});
