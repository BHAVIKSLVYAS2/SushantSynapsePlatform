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


test('daily tasks save across refresh, stay private and carry forward',async({page,browser})=>{
 const password='Isolated Focus browser password 2026!';
 const setup=await page.request.post(base+'/api/auth/setup',{data:{name:'Focus owner',email:'focus-owner@example.test',password,firmName:'Focus office'}});expect(setup.status()).toBe(201);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/focus');
 await expect(page.locator('#task-form')).toBeVisible();
 await page.locator('#plan-date').fill('2026-10-10');await page.locator('#plan-date').dispatchEvent('change');
 await page.locator('#task-form input[name=title]').fill('Prepare client proposal');await page.locator('#task-form select[name=priority]').selectOption('High');await page.locator('#task-form button[type=submit]').click();
 await expect(page.locator('#task-list')).toContainText('Prepare client proposal');await page.reload();
 await page.locator('#plan-date').fill('2026-10-11');await page.locator('#plan-date').dispatchEvent('change');
 await expect(page.locator('#carry-list')).toContainText('Prepare client proposal');await page.getByRole('button',{name:'Bring to this day'}).click();await expect(page.locator('#task-list')).toContainText('Prepare client proposal');
 await page.getByRole('button',{name:'Focus on this'}).click();await expect(page.locator('#current-task')).toContainText('Prepare client proposal');
 await page.getByRole('checkbox',{name:'Complete Prepare client proposal'}).check();await expect(page.locator('#summary')).toContainText('1 of 1 complete');await expect(page.locator('#task-status')).toHaveText('Saved.');
 const staff=await page.request.post(base+'/api/users',{data:{name:'Focus staff',email:'focus-private@example.test',role:'Clerk',password,appIds:[]}});expect(staff.status()).toBe(201);
 const other=await browser.newContext();try{const login=await other.request.post(base+'/api/auth/login',{data:{email:'focus-private@example.test',password}});expect(login.status()).toBe(200);const list=await other.request.get(base+'/api/focus');expect((await list.json()).tasks).toEqual([]);}finally{await other.close();}
 await page.getByRole('button',{name:'Dark mode',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:'.publish/focus-office-mobile-dark.png',fullPage:true});
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.goto(base+'/pocket-pause');await expect(page.locator('#timer')).toHaveCount(0);await expect(page.getByRole('link',{name:'Planning your work? Open Focus'})).toBeVisible();expect(errors).toEqual([]);
});
