const {setTheme}=require('../../../tests/browser-theme');
const {test,expect}=require('@playwright/test');

test('All apps share a responsive platform header and working theme controls',async({page})=>{
 await page.request.post(base+'/api/auth/setup',{data:{name:'Organizer',email:'organizer@example.test',password:'Tournament browser password!',firmName:'Workspace'}});
 for(const route of ['/','/advocate','/tournament-lite','/batchfee-lite','/certificates','/timetable-lite','/fund-overlap','/news']){
  await page.goto(base+route);const header=page.locator('header.synapse-header');await expect(header).toBeVisible();await expect(header.locator('.brand img')).toBeVisible();await expect(header.locator('.brand')).toHaveAttribute('href','/');
  for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});const box=await header.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);expect(await header.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);}
  for(const theme of ['dark','light','system']){await setTheme(page,theme);await expect(page.locator(route==='/timetable-lite'?'body':'html')).toHaveAttribute('data-theme',theme==='system'?'light':theme);}
 }
 await page.goto(base+'/tournament-lite');await page.setViewportSize({width:320,height:900});await page.screenshot({path:'test-results/shared-header-mobile.png'});
});

test('Organizer edits details, validates dates and public viewers cannot edit',async({page,browser})=>{
 await page.request.post(base+'/api/auth/setup',{data:{name:'Organizer',email:'organizer@example.test',password:'Tournament browser password!',firmName:'Workspace'}});
 await page.request.post(base+'/api/tournament-lite',{data:{name:'Original Cup',sport:'Chess',mode:'Singles',format:'Knockout'}});
 await page.goto(base+'/tournament-lite');await page.getByRole('button',{name:'Open tournament →'}).click();
 await page.getByRole('button',{name:'Edit details',exact:true}).click();
 await page.getByLabel('Tournament name',{exact:true}).fill('Updated Cup');await page.getByLabel('Start date').fill('2026-10-03');await page.getByLabel('End date').fill('2026-10-02');
 await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('alert')).toContainText('End date');
 await page.getByLabel('End date').fill('2026-10-04');await page.getByLabel('Organizer contact (private)').fill('Private phone');await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'Open tournament →'}).click();await expect(page.getByRole('heading',{name:'Updated Cup',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Share tournament',exact:true}).click();const url=await page.getByLabel('Public link').inputValue();
 const context=await browser.newContext();try{const viewer=await context.newPage();await viewer.goto(url);await expect(viewer.getByRole('heading',{name:'Updated Cup',exact:true})).toBeVisible();await expect(viewer.getByRole('button',{name:'Edit details'})).toHaveCount(0);expect(await viewer.locator('body').innerText()).not.toContain('Private phone');}finally{await context.close();}
});

test('Blocked group setup can be repaired and automatically advances through the final',async({page})=>{
 await page.request.post(base+'/api/auth/setup',{data:{name:'Organizer',email:'organizer@example.test',password:'Tournament browser password!',firmName:'Workspace'}});
 let response=await page.request.post(base+'/api/tournament-lite',{data:{name:'Group Cup',sport:'Chess',mode:'Singles',format:'Group Stage + Knockout',groupCount:4,qualifiers:2}});let t=await response.json();
 response=await page.request.post(base+'/api/tournament-lite/'+t.id,{data:{revision:t.revision,type:'participants',input:{participants:['One','Two','Three','Four'].map(name=>({name}))}}});expect(response.ok()).toBe(true);
 await page.goto(base+'/tournament-lite');await page.getByRole('button',{name:'Open tournament →'}).click();
 await page.getByRole('button',{name:'Generate Fixtures',exact:true}).click();await expect(page.locator('#notice')).toContainText('Edit qualification');
 await page.getByRole('button',{name:'Rules',exact:true}).click();await page.getByRole('button',{name:'Edit qualification',exact:true}).click();
 await page.getByLabel('Number of groups').fill('2');await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Generate Fixtures',exact:true}).click();
 for(let i=0;i<3;i++){await page.getByRole('button',{name:'Enter result',exact:true}).first().click();await page.getByRole('button',{name:'Save',exact:true}).click();}
 await expect(page.locator('.champion')).toBeVisible();
 await page.reload();await page.getByRole('button',{name:'Open tournament →'}).click();await expect(page.locator('.champion')).toBeVisible();
});

test('Partial scores survive reload and live-filter completion reveals the next round',async({page})=>{
 await page.request.post(base+'/api/auth/setup',{data:{name:'Organizer',email:'organizer@example.test',password:'Tournament browser password!',firmName:'Workspace'}});
 await page.goto(base+'/tournament-lite');
 await page.getByRole('button',{name:'+ Create Tournament'}).click();
 await page.getByLabel('Tournament name',{exact:true}).fill('Progress Cup');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Add / edit participants'}).click();
 await page.getByLabel('Participant entries').fill('One | | 1\nTwo | | 2\nThree | | 3');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Fixtures',exact:true}).click();
 await page.getByRole('button',{name:'Generate Fixtures',exact:true}).click();
 await page.getByRole('button',{name:'Enter result',exact:true}).click();
 await page.getByLabel('Game 1 first score').fill('10');await page.getByLabel('Game 1 second score').fill('10');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.locator('#dialog')).not.toBeVisible();await expect(page.locator('#content')).toContainText('In progress');
 await page.reload();await page.getByRole('button',{name:'Open tournament →'}).click();
 await page.getByLabel('Show matches').selectOption('live');
 await page.getByRole('button',{name:'Continue scoring'}).click();
 await expect(page.getByLabel('Game 1 first score')).toHaveValue('10');
 await page.getByLabel('Game 1 first score').fill('21');await page.getByLabel('Game 1 second score').fill('10');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByRole('button',{name:'Continue scoring'}).click();
 await page.getByLabel('Game 2 first score').fill('21');await page.getByLabel('Game 2 second score').fill('5');
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByLabel('Show matches')).toHaveValue('all');
 await page.getByRole('button',{name:'Enter result',exact:true}).click();
 for(const game of [1,2]){await page.getByLabel(`Game ${game} first score`).fill('21');await page.getByLabel(`Game ${game} second score`).fill('5');}
 await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.locator('.champion')).toContainText('One');
 await page.reload();await page.getByRole('button',{name:'Open tournament →'}).click();await expect(page.locator('.champion')).toContainText('One');
});

test('Creation validates only visible sport rules and clearing participant drafts saves',async({page})=>{
 await page.request.post(base+'/api/auth/setup',{data:{name:'Organizer',email:'organizer@example.test',password:'Tournament browser password!',firmName:'Workspace'}});
 await page.goto(base+'/tournament-lite');await page.getByRole('button',{name:'+ Create Tournament'}).click();
 await page.getByLabel('Tournament name',{exact:true}).fill('Relevant Rules');
 await page.locator('summary').click();await page.getByLabel('Points per game').fill('');
 await page.getByLabel('Sport',{exact:true}).selectOption('Chess');
 await expect(page.getByLabel('Points per game')).not.toBeVisible();await expect(page.getByLabel('Cricket overs')).toBeDisabled();
 await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('#dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Add / edit participants'}).click();await page.getByLabel('Participant entries').fill('One\nTwo');
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Add / edit participants'}).click();
 await page.getByLabel('Participant entries').fill('');await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.locator('#dialog')).not.toBeVisible();await page.reload();await page.getByRole('button',{name:'Open tournament →'}).click();
 const response=await page.request.get(base+'/api/tournament-lite');expect((await response.json()).tournaments[0].participants).toEqual([]);
});
test('Cricket totals and remaining racket/board sports work through their result forms',async({page})=>{
 await page.request.post(base+'/api/auth/setup',{data:{name:'Organizer',email:'organizer@example.test',password:'Tournament browser password!',firmName:'Workspace'}});
 for(const sport of ['Cricket','Table Tennis','Pickleball','Carrom']){
  let r=await page.request.post(base+'/api/tournament-lite',{data:{name:sport+' Cup',sport,mode:sport==='Cricket'?'Teams':'Doubles',format:'League / Round Robin',rules:{bestOf:1,points:11}}});
  expect(r.ok()).toBe(true);let t=await r.json();
  for(const [type,input]of [['participants',{participants:[{name:'Falcons',members:'Aarav, Isha',seed:1},{name:'Tigers',members:'Kabir, Meera',seed:2}]}],['generate',{}]]){
   r=await page.request.post(base+'/api/tournament-lite/'+t.id,{data:{revision:t.revision,type,input}});expect(r.ok()).toBe(true);t=await r.json();
  }
  await page.goto(base+'/tournament-lite');await page.locator('.card').filter({has:page.getByRole('heading',{name:sport+' Cup',exact:true})}).getByRole('button',{name:'Open tournament →'}).click();
  await page.getByRole('button',{name:'Enter result',exact:true}).click();
  if(sport==='Cricket'){
   await page.getByLabel('Runs',{exact:true}).nth(0).fill('100');await page.getByLabel('Runs',{exact:true}).nth(1).fill('101');
   await page.getByLabel('Overs (e.g. 4.3)').nth(0).fill('10');await page.getByLabel('Overs (e.g. 4.3)').nth(1).fill('9.3');
  }else{await page.getByLabel('Game 1 first score').fill('11');await page.getByLabel('Game 1 second score').fill('5');}
  await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.champion')).toContainText(sport==='Cricket'?'Tigers':'Falcons');
  await page.getByRole('button',{name:'Standings',exact:true}).click();await expect(page.locator('tbody tr')).toHaveCount(2);
  for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 }
});
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeEach(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'tournament-browser-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',c=>{out+=c;const m=out.match(/localhost:(\d+)/);if(m){base='http://127.0.0.1:'+m[1];resolve();}});child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));});});
test.afterEach(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('Mobile organizer creates, scores, corrects, shares and exports a persisted tournament',async({page,browser})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.request.post(base+'/api/auth/setup',{data:{name:'Organizer',email:'organizer@example.test',password:'Tournament browser password!',firmName:'Workspace'}});await page.goto(base+'/tournament-lite');await page.getByRole('button',{name:'+ Create Tournament'}).click();await page.getByLabel('Tournament name',{exact:true}).fill('Society Shuttle Cup');await page.getByLabel('Venue',{exact:true}).fill('Court 1');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Add / edit participants'}).click();await page.getByLabel('Participant entries').fill('Aarav | | 1\nMeera | | 2\nKabir | | 3');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Fixtures',exact:true}).click();await page.getByRole('button',{name:'Generate Fixtures',exact:true}).click();await expect(page.locator('#content')).toContainText('Automatic BYE');for(let n=0;n<2;n++){await page.getByRole('button',{name:'Enter result',exact:true}).first().click();await page.getByLabel('Game 1 first score').fill('21');await page.getByLabel('Game 1 second score').fill('8');await page.getByLabel('Game 2 first score').fill('21');await page.getByLabel('Game 2 second score').fill('15');await page.getByRole('button',{name:'Save',exact:true}).click();}await expect(page.locator('.champion')).toContainText('Aarav');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download winner card · PNG'}).click();expect((await download).suggestedFilename()).toBe('tournament-champion.png');await page.getByRole('button',{name:'Share tournament',exact:true}).click();const url=await page.getByLabel('Public link').inputValue();const context=await browser.newContext();const viewer=await context.newPage();await viewer.goto(url);await expect(viewer.locator('.champion')).toContainText('Aarav');await expect(viewer.getByRole('button',{name:'Correct result',exact:true})).toHaveCount(0);await context.close();await setTheme(page,'dark');await page.reload();await page.getByRole('button',{name:'Open tournament →'}).click();await expect(page.locator('.champion')).toContainText('Aarav');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.getByRole('button',{name:'Correct result',exact:true}).first().click();await page.getByLabel('Game 1 first score').fill('8');await page.getByLabel('Game 1 second score').fill('21');await page.getByLabel('Game 2 first score').fill('15');await page.getByLabel('Game 2 second score').fill('21');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.champion')).toHaveCount(0);await page.getByRole('button',{name:'Bracket',exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/tournament-mobile.png',fullPage:true});expect(errors).toEqual([]);});
test('Desktop chess league scheduling, standings and public access boundary',async({page})=>{await page.goto(base+'/tournament-lite');await expect(page.getByRole('link',{name:'Sign in to organize'})).toBeVisible();await page.request.post(base+'/api/auth/setup',{data:{name:'Organizer',email:'organizer@example.test',password:'Tournament browser password!',firmName:'Workspace'}});await page.reload();await page.getByRole('button',{name:'+ Create Tournament'}).click();await page.getByLabel('Tournament name',{exact:true}).fill('Chess Weekend');await page.getByLabel('Sport',{exact:true}).selectOption('Chess');await page.getByLabel('Format',{exact:true}).selectOption('League / Round Robin');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Add / edit participants'}).click();await page.getByLabel('Participant entries').fill('Anaya\nRohan');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Fixtures',exact:true}).click();await page.getByRole('button',{name:'Generate Fixtures',exact:true}).click();await page.getByRole('button',{name:'Schedule / status'}).click();await page.getByLabel('Date and time · IST').fill('2026-10-01T10:30');await page.getByLabel('Court / table / ground').fill('Table 2');await page.getByLabel('Match status').selectOption('live');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('#content')).toContainText('Table 2');await page.getByRole('button',{name:'Enter result',exact:true}).click();await page.getByLabel('Chess result').selectOption('draw');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Standings',exact:true}).click();await expect(page.locator('tbody tr')).toHaveCount(2);await expect(page.locator('tbody tr').first()).toContainText('0.5');await page.screenshot({path:'test-results/tournament-desktop.png',fullPage:true});});
