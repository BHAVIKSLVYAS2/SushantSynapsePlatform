const {test,expect}=require('../../../../tests/browser-fixture.js');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-navigation-'));
 child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
 base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',c=>{out+=c;const m=out.match(/localhost:(\d+)/);if(m)resolve('http://127.0.0.1:'+m[1]);});child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));});
});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});

test('home, guide, preview and browser traversal preserve the app hierarchy',async({page})=>{
 await page.setViewportSize({width:360,height:740});
 await page.goto(base+'/');await page.locator('a[href="/ritual-assist"]').first().click();
 await expect(page.locator('#guide-list button')).not.toHaveCount(0);
 await page.locator('#search').fill('Ganesh');await page.locator('[data-guide="ganesh-puja"]').click();
 await expect(page).toHaveURL(/guide=ganesh-puja/);
 await page.locator('#print-checklist').click();await expect(page.locator('#checklist-preview')).toBeVisible();
 await page.goBack();await expect(page.locator('#checklist-preview')).not.toBeVisible();await expect(page).toHaveURL(/guide=ganesh-puja/);
 await page.goBack();await expect(page).toHaveURL(base+'/ritual-assist');await expect(page.locator('#search')).toHaveValue('Ganesh');
 await page.goForward();await expect(page).toHaveURL(/guide=ganesh-puja/);
 await page.goForward();await expect(page.locator('#checklist-preview')).toBeVisible();
 await page.reload();await expect(page.locator('#checklist-preview')).toBeVisible();
 await page.locator('#checklist-preview button').first().click();await expect(page.locator('#checklist-preview')).not.toBeVisible();
 await page.goBack();await page.goBack();await expect(page).toHaveURL(base+'/');
});

test('games support Back, Forward and in-app return without discarding the board',async({page})=>{
 await page.goto(base+'/');await page.goto(base+'/take-a-break');
 await page.locator('[data-game="code"]').click();await expect(page.locator('#hub')).toBeHidden();
 await page.locator('.code-form input').fill('042');await page.goBack();await expect(page.locator('#hub')).toBeVisible();
 await page.goForward();await expect(page.locator('.code-form input')).toHaveValue('042');
 await page.evaluate(()=>{window.hubRestorations=0;new MutationObserver(records=>window.hubRestorations+=records.length).observe(document.querySelector('#hub'),{attributes:true,attributeFilter:['data-category']});});
 for(let n=0;n<5;n++){await page.goBack();await expect(page.locator('#hub')).toBeVisible();await page.goForward();await expect(page.locator('.code-form input')).toHaveValue('042');}
 expect(await page.evaluate(()=>window.hubRestorations)).toBe(5);
 await page.locator('#all-breaks').click();await expect(page.locator('#hub')).toBeVisible();
 await page.goForward();await expect(page.locator('.code-form input')).toHaveValue('042');
 await page.goto(base+'/take-a-break?game=memory');await page.reload();await expect(page.locator('#play-title')).toHaveText('Memory Minute');
 await page.locator('#all-breaks').click();await expect(page.locator('#hub')).toBeVisible();
});

test('app switcher is a real overlay route with browser Back and Forward',async({page})=>{
 await page.goto(base+'/decision-wheel');await page.locator('.platform-switch').click();await expect(page.locator('#platform-switcher')).toBeVisible();
 await page.goBack();await expect(page.locator('#platform-switcher')).not.toBeVisible();await expect(page).toHaveURL(base+'/decision-wheel');
 await page.goForward();await expect(page.locator('#platform-switcher')).toBeVisible();
 await page.getByRole('button',{name:'Close app switcher'}).click();await expect(page).toHaveURL(base+'/decision-wheel');
});

test('workspace screens survive traversal and sign-in returns to a validated deep link',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:1280,height:800});
 const password='Navigation browser password!';
 expect((await page.request.post(base+'/api/auth/setup',{data:{name:'Navigation Test',email:'navigation@example.test',password,firmName:'Temporary workspace'}})).ok()).toBe(true);
 await page.goto(base+'/advocate#cases');await page.locator('#list-search').fill('Saved search');
 await page.locator('.sidebar [data-page="tasks"]').click();await expect(page).toHaveURL(/#tasks$/);
 await page.goBack();await expect(page.locator('#list-search')).toHaveValue('Saved search');
 await page.goForward();await expect(page).toHaveURL(/#tasks$/);await page.reload();await expect(page.locator('.sidebar [data-page="tasks"]')).toHaveAttribute('aria-current','page');
 await page.locator('.sidebar [data-page="clients"]').click();await page.getByRole('button',{name:'Add client',exact:true}).first().click();
 await page.getByLabel('Client name').fill('Unsaved draft');await page.goBack();await expect(page.locator('#modal')).not.toBeVisible();
 await page.goForward();await expect(page.getByLabel('Client name')).toHaveValue('Unsaved draft');
 await page.getByLabel('Client name').fill('Navigation Client');await page.getByRole('button',{name:'Save client',exact:true}).click();
 await expect(page.locator('#modal')).not.toBeVisible();await page.getByRole('button',{name:'Navigation Client',exact:true}).click();
 await expect(page.locator('#modal')).toBeVisible();const detailUrl=page.url();await page.goBack();await expect(page.locator('#modal')).not.toBeVisible();
 await page.goForward();await expect(page.locator('#modal')).toBeVisible();await page.reload();await expect(page.locator('#modal')).toBeVisible();await expect(page).toHaveURL(detailUrl);
 await page.locator('#modal [data-action="close"]').click();await expect(page.locator('#modal')).not.toBeVisible();
 let state=await (await page.request.get(base+'/api/batchfee-lite')).json();
 const profile=await page.request.post(base+'/api/batchfee-lite/command',{data:{type:'profile',input:{name:'Navigation Academy',owner:'Test',mobile:'9876543210',dueDay:5,sessionMonth:4},revision:state.revision}});expect(profile.ok()).toBe(true);
 await page.goto(base+'/batchfee-lite');await page.locator('nav [data-id="Students"]').click();await page.locator('nav [data-id="Batches"]').click();
 await page.goBack();await expect(page.locator('nav [data-id="Students"]')).toHaveAttribute('aria-current','page');await page.goForward();await page.reload();await expect(page.locator('nav [data-id="Batches"]')).toHaveAttribute('aria-current','page');
 expect((await page.request.post(base+'/api/tournament-lite',{data:{name:'Navigation Cup',sport:'Chess',mode:'Singles',format:'Knockout'}})).ok()).toBe(true);
 await page.goto(base+'/tournament-lite');await page.getByRole('button',{name:'Open tournament →'}).click();await page.getByRole('button',{name:'Rules',exact:true}).click();
 await page.goBack();await expect(page).toHaveURL(/tab=Fixtures$/);await page.goBack();await expect(page.getByRole('button',{name:'Open tournament →'})).toBeVisible();
 await page.goForward();await page.goForward();await page.reload();await expect(page.getByRole('heading',{name:'Local rules'})).toBeVisible();
 await page.goto(base+'/digital-samaj');await page.getByLabel('Samaj name',{exact:true}).fill('Navigation Samaj');await page.getByRole('button',{name:'Create Samaj',exact:true}).click();
 await page.getByRole('button',{name:'Navigation Samaj',exact:true}).click();await page.locator('[data-section="events"]').click();
 await expect(page.getByRole('heading',{name:'Community calendar · IST'})).toBeVisible();await page.goBack();await expect(page.locator('[data-section="directory"]')).toHaveAttribute('aria-current','page');
 await page.goForward();await page.reload();await expect(page.getByRole('heading',{name:'Community calendar · IST'})).toBeVisible();
 await page.request.post(base+'/api/auth/logout');await page.goto(base+'/');
 await page.goto(base+'/signin?next=advocate&returnTo='+encodeURIComponent('/advocate#cases'));
 await page.getByLabel('Email address').fill('navigation@example.test');await page.getByLabel('Password',{exact:true}).fill(password);await page.locator('#auth-form button[type=submit]').click();
 await expect(page).toHaveURL(base+'/advocate#cases');await page.goBack();await expect(page).toHaveURL(base+'/');
 await page.goto(base+'/signin?next=advocate&returnTo='+encodeURIComponent('https://example.com/advocate'));
 await expect(page).toHaveURL(base+'/advocate');
});

test('feedback detail Back and Forward retain the list query',async({page})=>{
 await page.goto(base+'/feedback');await page.locator('#suggest-form [name=title]').fill('Mobile navigation feedback');
 await page.locator('#suggest-form [name=description]').fill('Keep internal screens available when going back and forward.');
 await page.getByRole('button',{name:'Post idea',exact:false}).click();await expect(page.locator('#discussion')).toBeVisible();
 await page.goBack();await expect(page.locator('#discussion')).not.toBeVisible();
 await page.locator('#search').fill('Mobile navigation');await expect(page.locator('#ideas .idea')).toHaveCount(1);
 await page.goForward();await expect(page.locator('#discussion-title')).toHaveText('Mobile navigation feedback');
 await page.goBack();await expect(page.locator('#search')).toHaveValue('Mobile navigation');
});

test('a failed lazy game load keeps navigation usable and does not add a broken entry',async({page})=>{
 await page.route('**/daily-spark/play.mjs',route=>route.abort());await page.goto(base+'/take-a-break');
 const before=await page.evaluate(()=>history.length);await page.locator('[data-feature-game]').click();
 await expect(page.locator('#break-filter-status')).toContainText('could not load');await expect(page.locator('#hub')).toBeVisible();
 expect(await page.evaluate(()=>history.length)).toBe(before);await page.locator('[data-game="code"]').click();
 await expect(page.locator('#play-title')).toHaveText('Crack the Code');
});

test('calendar tabs and News dates restore through Back and Forward',async({page})=>{
 await page.goto(base+'/ritual-assist/calendar?view=dates');
 await page.locator('#view-remembrance').click();
 await expect(page).toHaveURL(/view=remembrance/);await page.goBack();await expect(page).toHaveURL(/view=dates/);
 await page.goForward();await expect(page).toHaveURL(/view=remembrance/);
 await page.goto(base+'/news');const input=page.locator('#edition-date');await expect(input).not.toHaveValue('');
 await input.fill('2026-10-28');await input.dispatchEvent('change');await expect(page).toHaveURL(/date=2026-10-28/);
 await input.fill('2026-10-27');await input.dispatchEvent('change');await expect(page).toHaveURL(/date=2026-10-27/);
 await page.goBack();await expect(input).toHaveValue('2026-10-28');await page.goForward();await expect(input).toHaveValue('2026-10-27');
});

test('Ritual learning loads on demand, offers sourced bilingual prayers, and supports nested Back and direct refresh',async({page})=>{
 test.setTimeout(120000);const errors=[],learningRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/learning-(content|view)\.mjs/.test(r.url()))learningRequests.push(r.url());});
 await page.goto(base+'/ritual-assist?guide=ganesh-puja');await expect(page.locator('[data-ritual-learning]')).not.toHaveAttribute('open','');expect(learningRequests).toEqual([]);
 await page.locator('.ritual-learning>summary').click();await expect(page.locator('[data-learn-tab="vidhi"]')).toHaveAttribute('aria-selected','true');
 await page.locator('[data-learn-tab="mantras"]').click();await expect(page.locator('[data-prayer="ganesha-flower"] .mantra-script')).toHaveText('ॐ गणपतये नमः पुष्पं समर्पयामि।');
 await expect(page.locator('[data-prayer="ganesha-flower"] .mantra-iast')).toHaveText('oṃ gaṇapataye namaḥ puṣpaṃ samarpayāmi');
 await expect(page.locator('#learn-panel-mantras a')).toHaveCount(0);await expect(page.locator('#learn-panel-mantras')).not.toContainText(/Drik|Chinmaya|VedaBase/);await expect(page.locator('#learn-panel-sources a')).toHaveCount(0);
 await page.goBack();await expect(page.locator('[data-learn-tab="vidhi"]')).toHaveAttribute('aria-selected','true');await page.goForward();await expect(page.locator('[data-learn-tab="mantras"]')).toHaveAttribute('aria-selected','true');
 await page.reload();await expect(page.locator('[data-prayer="ganesha-flower"]')).toBeVisible();
 await page.locator('[data-learn-tab="mantras"]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-learn-tab="sources"]')).toHaveAttribute('aria-selected','true');await page.keyboard.press('Home');await expect(page.locator('[data-learn-tab="vidhi"]')).toHaveAttribute('aria-selected','true');await page.locator('[data-learn-tab="mantras"]').click();
 await page.locator('.platform-language>summary').click();await page.locator('.platform-language [data-interface-language="hi"]').click();await expect(page.locator('[data-prayer="ganesha-flower"] h4')).toHaveText('गणपति को पुष्प अर्पण');await expect(page.locator('[data-prayer="ganesha-flower"] .mantra-script')).toHaveText('ॐ गणपतये नमः पुष्पं समर्पयामि।');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('.learning-download').click()]);expect(download.suggestedFilename()).toBe('ritual-learning-ganesh-puja-hi.txt');
 await page.locator('[data-learn-tab="sources"]').click();await expect(page.locator('#learn-panel-sources')).toContainText('31 अक्टूबर 2026');await page.locator('.ritual-learning>summary').click();await expect(page.locator('.ritual-learning')).not.toHaveAttribute('open','');await expect(page).not.toHaveURL(/learn=/);
 await page.goto(base+'/ritual-assist?guide=shraddha&learn=mantras');await expect(page.locator('[data-prayer="self"]')).toBeVisible();await expect(page.locator('.learning-scope')).toContainText('निर्धारित मंत्रों');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:780});await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);}
 await page.setViewportSize({width:390,height:780});await page.locator('.ritual-learning').scrollIntoViewIfNeeded();await page.screenshot({path:'.publish/ritual-learning-mobile.png'});
 expect(errors).toEqual([]);
});

test('public apps fit narrow screens and themes, including the shared keyboard-height dialog',async({page})=>{
 test.setTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/ritual-assist','/ritual-assist/calendar','/moment-studio/cards','/moment-studio/certificates','/rashifal-kundli','/rashifal-kundli/matching','/rashifal-kundli/rashifal','/take-a-break','/team-mixer','/decision-wheel','/timetable-lite','/fund-overlap','/news','/feedback']){
  await page.goto(base+route);await expect(page.locator('.platform-shell')).toBeVisible();
  for(const width of [320,360,375,390,412,430,768,1440])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:740});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),route+' '+width+' '+theme).toBeLessThanOrEqual(1);
  }
 }
 await page.setViewportSize({width:320,height:360});await page.locator('.platform-switch').click();
 const box=await page.locator('#platform-switcher').boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(360);expect(errors).toEqual([]);
});
