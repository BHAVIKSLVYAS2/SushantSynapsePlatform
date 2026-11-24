const {test,expect}=require('../../../tests/browser-fixture.js'),{spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');let child,base=process.env.JAPSEVA_TEST_BASE,dir;
test('reading size and spacing apply to short, chapter and Ratna text, persist and reset',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/japseva');await page.locator('[data-tab=learn]').click();
 for(const [id,query]of [['gayatri','Gayatri'],['rudram-complete','Complete Namakam'],['puja-ratna-abhimantran','Ratna']]){
  await page.locator('#mantra-search').fill(query);await openGuide(page,id);if(id==='puja-ratna-abhimantran'){await page.locator('#library .ratna-grid button').first().click();for(let i=0;i<2;i++)await page.locator('.book-page-navigation button').last().click();}
  const text=page.locator('#library .mantra:visible').first(),settings=page.locator('.book-reading-settings'),size=page.locator('.book-settings-panel select').first(),spacing=page.locator('.book-settings-panel select').last();await settings.locator(':scope>summary').click();await size.selectOption('34');await spacing.selectOption('2.5');
  for(const learn of [false,true]){await page.locator('.reading-mode input').setChecked(learn);await expect(text).toHaveCSS('font-size','34px');await expect(text).toHaveCSS('line-height','85px');await expect(settings).toHaveAttribute('open','');}
  const verse=page.locator('#library .verse-pair:visible').first();
  await expect(verse.locator(':scope > :nth-child(1)')).toHaveAttribute('lang','sa-Deva');
  await expect(verse.locator(':scope > :nth-child(2) p')).toHaveAttribute('lang','sa-Deva');
  await expect(verse.locator(':scope > :nth-child(2)')).toContainText(id==='rudram-complete'?'words as printed':'Pronunciation help');
  await expect(verse.locator(':scope > :nth-child(3) .verse-meaning')).not.toBeEmpty();
  await expect(verse.locator('.verse-pronunciation')).toBeHidden();
  const help=page.locator('.book-sound-help:visible'),scriptAids=help.getByRole('checkbox');
  await expect(help).toHaveCount(1);
  await help.locator(':scope > summary').click();
  await scriptAids.check();
  await expect(verse.locator('.verse-pronunciation [lang=sa-Latn]')).toBeVisible();
  await expect(verse.locator('.verse-pronunciation [lang=sa-Gujr]')).toBeVisible();
  if(id==='rudram-complete')await expect(page.locator('#library .chapter-verse-pairs .verse-pronunciation:visible').nth(1)).toBeVisible();
  await scriptAids.uncheck();
  await expect(verse.locator('.verse-pronunciation')).toBeHidden();
  if(id==='rudram-complete'){
   const context=page.locator('#library [data-mantra-id=rudram-complete] .reading-context');
   await context.locator(':scope > summary').click();
   await expect(context.locator('.chapter-meaning')).toBeVisible();
   await expect(context.locator('.chapter-meaning')).not.toBeEmpty();
  }
  if(id==='gayatri'){
   const source=page.locator('#library .reading-context:visible');await source.locator('summary').click();
   await expect(source.locator('p')).toBeVisible();await expect(source).toContainText('Ṛgveda');
   await expect(page.locator('#library .library-audio>summary:visible')).toBeVisible();
  }
  await page.locator('.book-settings-panel button').click();await expect(size).toHaveValue('26');await expect(spacing).toHaveValue('2.05');await expect(text).toHaveCSS('font-size','26px');
  await size.selectOption('22');await spacing.selectOption('1.9');await settings.locator(':scope>summary').click();await page.locator('.platform-back').click();
 }
 await page.locator('#mantra-search').fill('Mahamrityunjaya');await openGuide(page,'mahamrityunjaya');
 const analysis=page.locator('#library .connected-reader');
 await analysis.locator(':scope > summary').click();
 await expect(analysis.locator('.connected-sanskrit').first()).toHaveAttribute('lang','sa-Deva');
 await analysis.locator('.connected-word').first().click();
 await expect(analysis.locator('.connected-gloss:visible')).not.toBeEmpty();
 await expect(analysis).toContainText('review pending');
 await page.reload();await page.locator('[data-tab=learn]').click();await openGuide(page,'puja-ratna-abhimantran');await page.locator('.book-reading-settings>summary').click();await expect(page.locator('.book-settings-panel select').first()).toHaveValue('22');await expect(page.locator('.book-settings-panel select').last()).toHaveValue('1.9');await expect(page.locator('#library .ratna-step .mantra')).toHaveCSS('font-size','22px');await expect(page.locator('#library .ratna-step .mantra')).toHaveCSS('line-height','41.8px');
 await page.emulateMedia({reducedMotion:'no-preference'});
 const nextPage=page.locator('.book-page-navigation button').last();
 await nextPage.evaluate(node=>node.addEventListener('click',()=>{for(const animation of document.querySelector('.book-turn-leaf')?.getAnimations()||[])animation.pause();},{once:true}));
 await nextPage.click();await expect(page.locator('.book-turn-leaf')).toHaveCount(1);
 await page.locator('.book-settings-panel select').first().selectOption('30');await expect(page.locator('.book-turn-leaf,.book-turn-fold')).toHaveCount(0);await expect(page.locator('#library .ratna-step .mantra')).toHaveCSS('font-size','30px');
 await page.screenshot({path:'.publish/japseva-reading-settings-mobile.png'});expect(await page.locator('.book-reader-scroll').evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);expect(errors).toEqual([]);
});
test('book has one navigation pair and corner-driven page turns for chapters and Ratna',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.goto(base+'/japseva');await page.locator('[data-tab=learn]').click();await page.locator('#mantra-search').fill('Complete Namakam');await openGuide(page,'rudram-complete');
 const nav=page.locator('.book-page-navigation'),corner=page.locator('.book-page-corner'),chapter=page.locator('#library .chapter-reader>label select').first();
 await expect(nav.locator('button:visible')).toHaveCount(2);await expect(page.locator('.book-navigation:visible,.chapter-navigation:visible,.ratna-navigation:visible')).toHaveCount(0);
 const pauseTurnOnClick=locator=>locator.evaluate(button=>button.addEventListener('click',()=>{
  for(const overlay of document.querySelectorAll('.book-turn-leaf,.book-turn-fold')){
   for(const animation of overlay.getAnimations()){animation.pause();animation.currentTime=220;}
  }
 },{once:true}));
 await expect.poll(()=>page.locator('.book-turn-leaf').count()).toBe(0);
 await pauseTurnOnClick(corner);
 await corner.click();await expect(chapter).toHaveValue('1');
 const effect=await page.locator('.book-turn-leaf').evaluate(n=>({clip:getComputedStyle(n).clipPath,frames:n.getAnimations()[0].effect.getKeyframes(),inert:n.inert,hidden:n.getAttribute('aria-hidden')}));expect(effect.clip).toContain('polygon');expect(effect.frames[1].clipPath).toContain('82%');expect(effect.inert).toBe(true);expect(effect.hidden).toBe('true');
 await page.screenshot({path:'.publish/japseva-corner-turn-mobile.png'});await page.locator('.book-turn-leaf').evaluate(n=>{for(const a of n.parentElement.getAnimations({subtree:true}))a.finish();});await expect(page.locator('.book-turn-leaf,.book-turn-fold')).toHaveCount(0);
 await nav.locator('button').first().click();await expect(chapter).toHaveValue('0');await expect(page.locator('.book-turn-back.book-turn-leaf')).toHaveCount(1);await expect.poll(()=>page.locator('.book-turn-leaf').count()).toBe(0);
 await nav.locator('button').last().click();await nav.locator('button').last().click();await expect(chapter).toHaveValue('2');await expect.poll(()=>page.locator('.book-turn-leaf,.book-turn-fold').count()).toBe(0);
 await page.emulateMedia({reducedMotion:'reduce'});await corner.click();await expect(chapter).toHaveValue('3');await expect(page.locator('.book-turn-leaf,.book-turn-fold')).toHaveCount(0);
 await page.locator('.platform-back').click();await page.locator('#mantra-search').fill('Ratna');await openGuide(page,'puja-ratna-abhimantran');await page.locator('#library .ratna-grid button').first().click();await expect(nav.locator('button:visible')).toHaveCount(2);await expect(page.locator('.ratna-navigation:visible,.book-navigation:visible')).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'no-preference'});await pauseTurnOnClick(corner);await corner.click();await expect(page.locator('#library .ratna-step')).toContainText('2 / 5');await expect(page.locator('.book-turn-leaf')).toHaveCount(1);await page.locator('.platform-back').click();await expect(page.locator('.book-turn-leaf,.book-turn-fold')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('Contents and the reader share a bound book at mobile and desktop sizes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/japseva');await page.locator('[data-tab=learn]').click();
 const book=page.locator('.mantra-book'),search=page.locator('#mantra-search'),nav=book.locator('.book-page-navigation');
 for(const [width,height] of [[320,640],[1280,900]]){
  await page.setViewportSize({width,height});await search.fill('Gayatri');
  const cover=await book.boundingBox(),paper=await book.evaluate(n=>getComputedStyle(n).backgroundImage);
  expect(paper).toContain('linear-gradient');await expect(book.locator('.book-index-number:visible').first()).toBeVisible();
  await openGuide(page,'gayatri');const reading=await book.boundingBox(),footer=await nav.boundingBox();
  expect(reading.width).toBeCloseTo(cover.width);await expect(book).toHaveCSS('background-image',paper);
  expect(footer.y+footer.height).toBeLessThanOrEqual(reading.y+reading.height);
  expect(await book.locator('.book-reader-scroll').evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);
  await book.locator('.book-contents').click();
  await expect(book.locator('[data-mantra-id=gayatri] .library-guide>summary')).toBeFocused();
  await expect(search).toHaveValue('Gayatri');
 }
});
test('the book turns continuously from a short mantra through Rudram into Puja',async({page})=>{
 await page.setViewportSize({width:390,height:700});await page.goto(base+'/japseva');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-tab=learn]').click();
 await openGuide(page,'rudram-namakam-opening');
 const nav=page.locator('.book-page-navigation'),scroll=page.locator('.book-reader-stage>.book-reader-scroll');
 const visibleEntry=id=>page.locator('#library [data-mantra-id='+id+']:visible');
 await nav.getByRole('button',{name:'Next reading',exact:true}).click();
 const rudram=visibleEntry('rudram-complete').locator('.chapter-reader>label select');
 await expect(rudram).toHaveValue('0');await expect.poll(()=>scroll.evaluate(n=>n.scrollTop)).toBe(0);
 await rudram.selectOption('21');await page.locator('.book-page-corner').click();
 const puja=visibleEntry('puja-rudrabhishek').locator('.chapter-reader>label select');
 await expect(puja).toHaveValue('0');await expect.poll(()=>scroll.evaluate(n=>n.scrollTop)).toBe(0);
 await nav.getByRole('button',{name:'Previous reading',exact:true}).click();await expect(rudram).toHaveValue('21');
 await page.keyboard.press('ArrowLeft');await expect(rudram).toHaveValue('20');
 await page.keyboard.press('ArrowLeft');await expect(rudram).toHaveValue('19');
 await page.screenshot({path:'.publish/japseva-continuous-reading.png'});
 await page.locator('.book-contents').click();await expect(page.locator('#library [data-mantra-id=rudram-complete] .library-guide>summary')).toBeFocused();
 await page.screenshot({path:'.publish/japseva-continuous-contents.png'});
});
test('Devanagari leads every library reading and practice selector; alternate scripts remain optional',async({page})=>{
 test.setTimeout(480000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/japseva');await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-tab=new]').click();
 const records=await page.evaluate(async()=>{const {mantras}=await import('/japseva/library.mjs');return mantras.map(m=>({id:m.id,en:m.names.en,hi:m.names.hi,chapters:!!m.chapters}));});
 const labels=await page.locator('#sankalp-form [name=mantraId] option').allTextContents();expect(labels.slice(0,-1)).toEqual(records.map(m=>m.hi));
 await page.locator('[data-tab=learn]').click();
 for(const m of records){await page.locator('#mantra-search').fill(m.en);await openGuide(page,m.id);await expect(page.locator('.book-toolbar>h2')).toHaveText(m.hi);await page.locator('.reading-mode input').check();const row=page.locator('#library [data-mantra-id="'+m.id+'"]');
  if(!m.chapters){await expect(row.locator('.verse-text').first()).toHaveAttribute('lang','sa-Deva');await expect(row.locator('.verse-pronunciation').first()).toBeHidden();}
  else if(m.id!=='puja-ratna-abhimantran'){const select=row.locator('.chapter-reader>label select').first(),count=await select.locator('option').count();for(let i=0;i<count;i++){await select.selectOption(String(i));const text=row.locator('.verse-text:visible,.chapter-text:visible').first();if(await text.count())await expect(text).toHaveAttribute('lang','sa-Deva');await expect(row.locator('.chapter-reader>h4').first()).toContainText(/[\u0900-\u097f]/);}}
  await page.locator('.platform-back').click();
 }
 await page.locator('#mantra-search').fill('Gayatri');await openGuide(page,'gayatri');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.publish/japseva-devanagari-mobile.png'});
 for(const language of ['en','hi','gu']){await page.evaluate(v=>SynapseLanguage.set(v),language);await expect(page.locator('#library [data-mantra-id=gayatri] .verse-text')).toHaveAttribute('lang','sa-Deva');expect(await page.locator('.book-reader-scroll').evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);}
 expect(errors).toEqual([]);
});
test('Ratna nine-gem guide keeps connected steps, personal counter and mobile resume',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/japseva');
 await page.locator('[data-tab=learn]').click();await openGuide(page,'puja-ratna-abhimantran');await page.locator('.reading-mode input').check();
 const root=page.locator('#library .ratna-reader');await expect(root.locator('.ratna-grid button')).toHaveCount(9);
 for(let i=0;i<9;i++){
  await root.locator('.ratna-grid button').nth(i).click();await expect(root.locator('.ratna-step')).toContainText('1 / 5');
  await page.locator('.book-page-navigation button').last().click();await expect(root.locator('.ratna-fields input')).toHaveCount(5);
  await root.locator('.ratna-fields input').first().fill('Test reader');await expect(root.locator('.ratna-step')).toContainText('Test reader');
  await page.locator('.book-page-navigation button').last().click();await expect(root.locator('.ratna-step .mantra')).toHaveCount(1);await expect(root.locator('.ratna-step')).toContainText('Salutations to');
  await page.locator('.book-page-navigation button').last().click();await root.locator('.ratna-counter button').first().click();await expect(root.locator('output')).toHaveText('1');
  await page.locator('.book-page-navigation button').last().click();await expect(root.locator('.ratna-step')).toContainText('5 / 5');
  expect(await root.evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);await root.getByRole('button',{name:'All gemstones',exact:false}).click();
 }
 await root.locator('.ratna-grid button').first().click();for(let i=0;i<3;i++)await page.locator('.book-page-navigation button').last().click();
 await page.reload();await page.locator('[data-tab=learn]').click();await openGuide(page,'puja-ratna-abhimantran');await expect(root.locator('.ratna-step')).toContainText('4 / 5');await expect(root.locator('output')).toHaveText('1');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:844});await page.evaluate(v=>document.documentElement.dataset.theme=v,theme);expect(await root.evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.publish/ratna-guide-mobile.png'});
 await page.evaluate(()=>SynapseLanguage.set('hi'));await expect(root.locator('.ratna-step')).toContainText('चुना मंत्र');
 await page.evaluate(()=>SynapseLanguage.set('gu'));await expect(root).toContainText('હિન્દી પાઠ');
 expect(errors).toEqual([]);
});
test('shared themes match Hisabio and all practice/learning layouts fit the platform shell',async({page})=>{
 test.setTimeout(90000); // 21 viewport/theme combinations, two pages and full-page captures.
 await create(page);await page.evaluate(async()=>{const {read,write}=await import('/japseva/storage.mjs');const s=await read(),version=s.version,now=new Date().toISOString();s.clients[0].name='A'.repeat(120);Object.assign(s.sankalps[0],{target:100000000,count:99999999,history:[{at:now,day:new Date(Date.parse(now)+19800000).toISOString().slice(0,10),amount:99999999}]});s.version++;await write(s,version);});await page.reload();const reference=await page.context().newPage();await reference.goto(base+'/rozhisab');await expect(reference.locator('.platform-shell')).toBeVisible();const results=[];
 const signature=p=>p.evaluate(()=>{const b=getComputedStyle(document.body),button=getComputedStyle(document.querySelector('.platform-shell [data-theme-toggle]'));return {background:b.backgroundColor,ink:b.color,button:{background:button.backgroundColor,color:button.color,border:button.borderColor,font:button.fontSize,width:button.width,height:button.height}};});
 try{for(const theme of ['light','dark','deep'])for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});await reference.setViewportSize({width,height:900});await reference.evaluate(t=>SynapseTheme.write(t),theme);await page.evaluate(t=>SynapseTheme.write(t),theme);await expect.poll(async()=>JSON.stringify(await signature(page))===JSON.stringify(await signature(reference))).toBe(true);
  await page.getByRole('button',{name:'Ongoing',exact:true}).click();await page.evaluate(()=>scrollTo(0,0));const practice=await page.evaluate(()=>{const shell=document.querySelector('.platform-shell').getBoundingClientRect(),title=document.querySelector('#main h1').getBoundingClientRect();return {fits:document.documentElement.scrollWidth<=innerWidth,belowHeader:title.top>=shell.bottom+12,controls:[...document.querySelectorAll('#main button')].filter(b=>b.checkVisibility()).every(b=>b.getBoundingClientRect().height>=44)};});expect(practice).toEqual({fits:true,belowHeader:true,controls:true});
  await page.getByRole('button',{name:'Mantra library',exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('#library .library-guide>summary').first().evaluate(a=>a.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  if([390,1440].includes(width)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`.publish/japseva-layout-${theme}-${width}.png`,fullPage:true});}results.push({theme,width,...practice});
 }}finally{await reference.close();}fs.mkdirSync('.publish',{recursive:true});fs.writeFileSync('.publish/japseva-layout-checks.json',JSON.stringify(results,null,2));
});
test.beforeAll(async()=>{if(base)return;dir=fs.mkdtempSync(path.join(os.tmpdir(),'japseva-browser-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test',PORT:'0',DATA_DIR:dir,SETUP_TOKEN:''},stdio:['ignore','pipe','pipe'],windowsHide:true});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timeout')),20000);child.stdout.on('data',data=>{out+=data;const m=out.match(/localhost:(\d+)/);if(m){base='http://127.0.0.1:'+m[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill();});if(dir){const resolved=fs.realpathSync(dir);if(!resolved.startsWith(fs.realpathSync(os.tmpdir())+path.sep))throw Error('Unsafe fixture cleanup');fs.rmSync(resolved,{recursive:true,force:true});}});
async function create(page,target=108){await page.goto(base+'/japseva');await expect(page.locator('#workspace')).toBeVisible();await page.locator('[data-tab=new]').click();if(await page.locator('#client-create').getAttribute('open')===null)await page.locator('#client-create summary').click();await page.locator('#client-form [name=name]').fill('Meera Shah');await page.locator('#client-form button').click();await expect(page.locator('#sankalp-form [name=clientId]')).toContainText('Meera Shah');await page.locator('[name=practitioner]').fill('Test Practitioner');await page.locator('[name=target]').fill(String(target));await page.locator('#sankalp-form button').click();await expect(page.locator('.practice-card')).toHaveCount(1);}
test('practice repeat audio survives counting and language changes without altering japa eligibility',async({page})=>{
 await page.setViewportSize({width:390,height:844});await create(page,1080);
 const panel=page.locator('#practice-audio'),audio=panel.locator('audio');await expect(audio).toHaveCount(1);await expect(page.locator('audio')).toHaveCount(1);
 await panel.locator('.practice-audio-settings>summary').click();await panel.getByLabel('Audio repeat target').fill('2');await audio.evaluate(a=>{window.practicePlayer=a;a.playbackRate=4;});
 await panel.getByRole('button',{name:'Play mantra on repeat',exact:true}).click();await expect.poll(()=>audio.evaluate(a=>a.currentTime)).toBeGreaterThan(.2);
 await page.getByRole('button',{name:'\uff0b 1',exact:true}).click();await expect(page.locator('.practice-dial .count')).toHaveText('1 / 1,080');
 expect(await audio.evaluate(a=>a===window.practicePlayer&&!a.paused)).toBe(true);
 await page.evaluate(()=>SynapseLanguage.set('gu'));expect(await audio.evaluate(a=>a===window.practicePlayer&&!a.paused)).toBe(true);await page.evaluate(()=>SynapseLanguage.set('en'));
 await expect(panel.locator('output')).toHaveText('2 / 2 audio plays',{timeout:30000});expect(await audio.evaluate(a=>a.paused)).toBe(true);await expect(page.locator('.practice-dial .count')).toHaveText('1 / 1,080');await expect(page.locator('#certificate')).toBeHidden();
 await panel.getByLabel('Audio repeat target').fill('3');await panel.getByRole('button',{name:'Play mantra on repeat',exact:true}).click();await expect.poll(()=>audio.evaluate(a=>!a.paused)).toBe(true);
 await page.locator('[data-tab=history]').click();expect(await page.evaluate(()=>window.practicePlayer.paused)).toBe(true);await expect(page.locator('#library audio')).toHaveCount(0);await expect(panel).toBeHidden();
});
test('separate request, ongoing and history views remain usable on phones with reduced motion',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.emulateMedia({reducedMotion:'reduce'});await create(page,1);
 await expect(page.locator('#setup')).toBeHidden();await expect(page.locator('.practice-card')).toHaveCount(1);
 await page.locator('[data-tab=history]').click();await expect(page.locator('.practice-card')).toHaveCount(0);await expect(page.getByText('No completed requests yet.',{exact:true})).toBeVisible();
 await page.locator('[data-tab=practice]').click();await page.locator('.request-open').click();await page.getByRole('button',{name:'＋ 1',exact:true}).click();
 await expect(page.locator('[data-tab=history]')).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'View completion certificate'})).toBeVisible();
 await page.locator('[data-tab=practice]').click();await expect(page.locator('.practice-card')).toHaveCount(0);
 await page.locator('[data-tab=new]').click();await expect(page.locator('#sankalp-form')).toBeVisible();await expect(page.locator('#sankalps')).toBeHidden();
 expect(await page.locator('#workspace').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'.publish/japseva-new-request-mobile.png',fullPage:true});
 await page.locator('[data-tab=history]').click();await page.screenshot({path:'.publish/japseva-history-mobile.png',fullPage:true});
});

test('counted practice audio repeats to target, survives reload and never changes chanting certificates',async({page})=>{
 await create(page);const panel=page.locator('#practice-audio .audio-practice'),audio=page.locator('#practice-audio audio'),count=panel.locator('output');
 await page.locator('#practice-audio .practice-audio-settings>summary').click();await expect(count).toContainText('0 / 108');await panel.getByLabel('Audio repeat target').fill('2');await audio.evaluate(a=>a.playbackRate=4);await panel.getByRole('button',{name:'Play mantra on repeat',exact:true}).click();await expect(panel.locator('p[role="status"]')).toHaveText('Audio target complete.',{timeout:30000});await expect(count).toHaveText('2 / 2 audio plays');expect(await audio.evaluate(a=>a.paused)).toBe(true);
 const saved=await page.evaluate(async()=>await(await import('/japseva/storage.mjs')).read());expect(saved.audioPlays.gayatri.count).toBe(2);expect(saved.sankalps[0].count).toBe(0);expect(saved.sankalps[0].completedAt).toBeNull();
 await page.reload();await page.locator('.request-open').first().click();await expect(count).toHaveText('2 / 2 audio plays');await page.locator('#practice-audio .practice-audio-settings>summary').click();await panel.getByLabel('Audio repeat target').fill('3');await panel.getByRole('button',{name:'Play mantra on repeat',exact:true}).click();await expect.poll(()=>audio.evaluate(a=>a.currentTime)).toBeGreaterThan(.3);await panel.getByRole('button',{name:'Pause mantra',exact:true}).click();await expect(count).toHaveText('2 / 3 audio plays');
 await panel.getByRole('button',{name:'Play mantra on repeat',exact:true}).click();await expect.poll(()=>audio.evaluate(a=>a.currentTime)).toBeGreaterThan(.3);await audio.evaluate(a=>a.currentTime=a.duration-.1);await expect(panel.locator('p[role="status"]')).toContainText('Skipped audio was not counted');await expect(count).toHaveText('2 / 3 audio plays');
 page.once('dialog',d=>d.accept());await panel.getByRole('button',{name:'Reset audio count',exact:true}).click();await expect(count).toHaveText('0 / 3 audio plays');
 for(const key of ['shiva','vasudeva']){await page.locator('[data-tab=learn]').click();await openGuide(page,key,true);await page.locator('[data-mantra-id='+key+'] .library-use').click();await page.locator('#sankalp-form button').click();await page.locator('#practice-audio .practice-audio-settings>summary').click();await panel.getByLabel('Audio repeat target').fill('1');await audio.evaluate(a=>a.playbackRate=4);await panel.getByRole('button',{name:'Play mantra on repeat',exact:true}).click();await expect(count).toHaveText('1 / 1 audio plays',{timeout:15000});expect(await audio.evaluate(a=>a.paused)).toBe(true);}
 const separate=await page.evaluate(async()=>await(await import('/japseva/storage.mjs')).read());expect(separate.audioPlays.gayatri.count).toBe(0);expect(separate.audioPlays.shiva.count).toBe(1);expect(separate.audioPlays.vasudeva.count).toBe(1);expect(separate.sankalps.every(s=>s.count===0&&!s.completedAt)).toBe(true);
 await page.reload();await page.locator('[data-tab=learn]').click();await expect(page.locator('#learn audio')).toHaveCount(0);await expect(page.locator('#learn .library-audio-badge')).toHaveCount(0);
});

test('no-login journey saves across reload, produces PDF and transfers backup to a fresh browser',async({page,browser})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/japseva'))requests.push(r.url());});await create(page);
 await page.getByRole('button',{name:'＋ 1 mala · 108',exact:true}).click();await expect(page.getByRole('button',{name:'View completion certificate'})).toBeVisible();await page.reload();await page.locator('[data-tab=history]').click();await expect(page.locator('.count')).toContainText('108');await page.getByRole('button',{name:'View completion certificate'}).click();await expect(page.locator('#certificate')).toBeVisible();expect(await page.locator('#certificate-canvas').evaluate(c=>[c.width,c.height])).toEqual([3508,2480]);
 let pending=page.waitForEvent('download');await page.locator('#save-pdf').click();const pdf=await pending;const pdfStream=await pdf.createReadStream(),chunks=[];for await(const c of pdfStream)chunks.push(c);expect(Buffer.concat(chunks).subarray(0,8).toString()).toBe('%PDF-1.4');
 await page.getByText('Browser storage & backups',{exact:true}).click();pending=page.waitForEvent('download');await page.locator('#export-backup').click();const backup=await pending,stream=await backup.createReadStream(),parts=[];for await(const c of stream)parts.push(c);const bytes=Buffer.concat(parts);expect(JSON.parse(bytes).sankalps[0].count).toBe(108);
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser);try{const other=await context.newPage();await other.goto(base+'/japseva');await expect(other.locator('.practice-card')).toHaveCount(0);await other.getByText('Browser storage & backups',{exact:true}).click();other.once('dialog',d=>d.accept());await other.locator('#import-backup').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:bytes});await other.locator('[data-tab=history]').click();await expect(other.locator('.count')).toContainText('108');await other.reload();await other.locator('[data-tab=history]').click();await expect(other.locator('.count')).toContainText('108');await other.getByRole('button',{name:'View completion certificate'}).click();await expect(other.locator('#certificate')).toBeVisible();}finally{await context.close();}
 expect(errors).toEqual([]);expect(requests).toEqual([]);await page.locator('#certificate-canvas').screenshot({path:'.publish/japseva-certificate.png'});
});
test('stale tabs and malformed imports cannot overwrite saved counts',async({page})=>{
 await create(page,3);const other=await page.context().newPage();await other.goto(base+'/japseva');await expect(other.locator('.count')).toContainText('0');await other.evaluate(async()=>{window.old=await(await import('/japseva/storage.mjs')).read();});await page.getByRole('button',{name:'＋ 1',exact:true}).click();await expect(page.locator('.count')).toContainText('1');
 const message=await other.evaluate(async()=>{const {write,command}=await import('/japseva/storage.mjs');try{await write(command(window.old,'/'+window.old.sankalps[0].id+'/count',{amount:1}),window.old.version);return 'saved';}catch(e){return e.message;}});expect(message).toContain('another tab');await other.close();await page.reload();await expect(page.locator('.count')).toContainText('1');
 await page.getByText('Browser storage & backups',{exact:true}).click();await page.locator('#import-backup').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":"not-japseva"}')});await expect(page.locator('#notice')).toContainText('Could not import');await page.reload();await expect(page.locator('.count')).toContainText('1');
});
test('storage denial gives an honest error without a false saved workspace',async({page})=>{await page.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:undefined}));await page.goto(base+'/japseva');await expect(page.locator('#notice')).toContainText('Browser storage is unavailable');await expect(page.locator('#workspace')).toBeHidden();});
test('existing version 2 browser records upgrade without resetting clients or practice',async({page})=>{
 await page.goto(base+'/privacy');await page.evaluate(async()=>{const {empty,command}=await import('/japseva/storage.mjs');let s=command(empty(),'/clients',{name:'Existing client'});s=command(s,'/sankalps',{clientId:s.clients[0].id,mantra:'Om',target:108,practitioner:'Existing practitioner'});s=command(s,'/'+s.sankalps[0].id+'/count',{amount:7});s.schemaVersion=1;delete s.sankalps[0].corrections;await new Promise((resolve,reject)=>{const r=indexedDB.open('synapse-japseva',2);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const tx=r.result.transaction('workspace','readwrite');tx.objectStore('workspace').put(s,'state');tx.oncomplete=()=>{r.result.close();resolve();};};});});
 await page.goto(base+'/japseva');await expect(page.locator('.practice-card h3')).toHaveText('Existing client');await expect(page.locator('.count')).toContainText('7');expect(await page.evaluate(async()=>{const {open,read}=await import('/japseva/storage.mjs');return {version:(await open()).version,plays:(await read()).audioPlays};})).toEqual({version:3,plays:{}});
});
test('library reading stays uncluttered and practice retains licensed audio across phone themes',async({page})=>{
 await create(page);await page.locator('[data-tab=learn]').click();await expect(page.locator('#library article')).toHaveCount(109);await expect(page.locator('#learn audio')).toHaveCount(0);await expect(page.locator('.library-audio-badge')).toHaveCount(0);await expect(page.locator('.library-text-references')).toHaveCount(0);await page.locator('.library-help>summary').click();await expect(page.locator('.sound-guide')).toContainText('Teacher pronunciation review is pending');await expect(page.locator('.sound-guide dt')).toHaveCount(6);await openGuide(page,'ganesha',true);await expect(page.locator('[data-mantra-id=ganesha]')).not.toContainText('Audio unavailable');
 for(const [key,licence]of [['shiva','CC BY-SA 4.0'],['vasudeva','CC BY-SA 3.0']]){await openGuide(page,key,true);await page.locator('[data-mantra-id='+key+'] .library-use').click();await page.locator('#sankalp-form button').click();const panel=page.locator('#practice-audio');await panel.locator('.practice-audio-settings>summary').click();await expect(panel.getByRole('link',{name:licence,exact:true})).toBeVisible();const response=await page.request.get(new URL(await panel.locator('audio').getAttribute('src'),base).href);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toMatch(key==='shiva'?/audio\/wav/:/audio\/ogg/);await panel.getByLabel('Playback speed').selectOption('0.75');expect(await panel.locator('audio').evaluate(a=>a.playbackRate)).toBe(.75);await page.locator('[data-tab=learn]').click();}
 for(const theme of ['light','dark','deep'])for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.publish/japseva-library-clean-reading.png'});
});

test('focused practice, search, mala setup and audited correction work on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await create(page,2);
 await page.locator('.platform-back').click();await expect(page.locator('.request-open')).toBeVisible();await expect(page.locator('.counter-actions')).toHaveCount(0);
 await page.getByRole('searchbox').fill('missing client');await expect(page.getByText('No matching requests.',{exact:true})).toBeVisible();await page.getByRole('searchbox').fill('Meera');await page.locator('.request-open').click();
 await page.getByRole('button',{name:'\uff0b 1',exact:true}).click();await page.getByRole('button',{name:'\uff0b 1',exact:true}).click();await expect(page.locator('[data-tab=history]')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'View completion certificate',exact:true}).click();await expect(page.locator('#certificate')).toBeVisible();await page.getByText('Correct an accidental count',{exact:true}).click();await page.getByLabel('Repetitions to remove').fill('1');await page.getByLabel('Reason for correction').fill('Accidental tap');page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Confirm correction'}).click();await expect(page.locator('.count')).toContainText('1 / 2');await expect(page.locator('#certificate')).toBeHidden();await expect(page.getByRole('button',{name:'View completion certificate'})).toHaveCount(0);
 await page.getByText('Count corrections',{exact:true}).click();await expect(page.locator('.history').first()).toContainText('Accidental tap');await page.reload();await page.locator('.request-open').click();await expect(page.locator('.count')).toContainText('1 / 2');
 for(const theme of ['light','dark']){await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/japseva-focus-'+theme+'.png',fullPage:true});}
 await page.locator('[data-tab=new]').click();await page.locator('#target-unit').selectOption('malas');await page.locator('[name=target]').fill('2');await page.locator('#sankalp-form button').click();await expect(page.locator('.count')).toContainText('216');
});


test('Navagraha guides translate, filter and create a persistent client practice',async({page})=>{
 await page.setViewportSize({width:320,height:800});await create(page);
 await page.locator('[data-tab=learn]').click();
 await page.locator('.library-category-chips [data-value=gayatri]').click();
 await expect(page.locator('#library article:visible')).toHaveCount(62);
 await expect(page.locator('[data-mantra-id=gayatri]')).toBeVisible();await expect(page.locator('[data-mantra-id=reading-surya-gayatri]')).toBeVisible();
 await page.locator('.library-filter-trigger').click();await expect(page.locator('#library-filter-dialog')).toBeVisible();await page.locator('#mantra-filter-topic').selectOption('navagraha');await page.locator('.library-filter-done').click();await expect(page.locator('#library article:visible')).toHaveCount(10);
 await expect(page.locator('.library-filter-trigger')).toBeFocused();await page.getByRole('button',{name:'Remove Deity / topic: Navagraha',exact:true}).click();await expect(page.locator('#library article:visible')).toHaveCount(62);await page.locator('#mantra-search').fill('Dhanvantari');
 await expect(page.locator('#library article:visible')).toHaveCount(1);await openGuide(page,'gayatri-dhanvantari');
 const gayatri=page.locator('[data-mantra-id=gayatri-dhanvantari]');await expect(gayatri.locator('audio')).toHaveCount(0);
 await expect(gayatri.locator('.library-pronunciation')).toBeHidden();await page.locator('.reading-mode input').check();await expect(gayatri.locator('.verse-pairs')).toBeVisible();await expect(gayatri.locator('.library-pronunciation')).toBeHidden();
 for(const language of ['en','hi','gu']){await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(gayatri.locator('.reading-aid')).not.toBeEmpty();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.evaluate(()=>SynapseLanguage.set('en'));await page.locator('.platform-back').click();await page.locator('.library-category-chips [data-value=""]').click();
 for(const query of ['navgrah','nav grah','Navagraha']){await page.locator('#mantra-search').fill(query);await expect(page.locator('#library article:visible')).toHaveCount(20);}
 await openGuide(page,'navagraha-surya');const card=page.locator('[data-mantra-id=navagraha-surya]');
 for(const language of ['en','hi','gu']){await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(page.locator('#pronunciation-script')).toBeHidden();await expect(card.locator('.verse-pairs')).toBeVisible();await expect(card.locator('.reading-aid')).not.toBeEmpty();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.evaluate(()=>SynapseLanguage.set('en'));await card.locator('.library-use').click();await expect(page.locator('[name=mantraId]')).toHaveValue('navagraha-surya');await page.locator('#sankalp-form button').click();await page.getByRole('button',{name:'\uff0b 1',exact:true}).click();await page.reload();
 const saved=await page.evaluate(async()=>await(await import('/japseva/storage.mjs')).read());const request=saved.sankalps.find(s=>s.mantraId==='navagraha-surya');expect(request.count).toBe(1);expect(request.mantra).toContain('सूर्याय');expect(saved.sankalps).toHaveLength(2);
 await page.locator('[data-tab=learn]').click();await page.locator('#mantra-search').fill('Dhanvantari');await openGuide(page,'gayatri-dhanvantari');
 await page.locator('[data-mantra-id=gayatri-dhanvantari] .library-use').click();await expect(page.locator('[name=mantraId]')).toHaveValue('gayatri-dhanvantari');
 await page.locator('#sankalp-form button').click();await page.getByRole('button',{name:'\uff0b 1',exact:true}).click();await page.reload();
 const expanded=await page.evaluate(async()=>await(await import('/japseva/storage.mjs')).read());const newPractice=expanded.sankalps.find(s=>s.mantraId==='gayatri-dhanvantari');expect(newPractice.count).toBe(1);expect(newPractice.mantra).toContain('अमृतकलशहस्ताय');expect(expanded.sankalps).toHaveLength(3);
 await page.locator('[data-tab=learn]').click();await page.locator('#mantra-search').fill('Rudrabhishek');await expect(page.locator('#library article:visible')).toHaveCount(5);
 await openGuide(page,'rudram-namakam-opening');await expect(page.locator('[data-mantra-id=rudram-namakam-opening]')).toContainText('not the complete Shri Rudram');
 await openGuide(page,'rudra-invocation');const rudra=page.locator('[data-mantra-id=rudra-invocation]');
 for(const language of ['en','hi','gu']){await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(rudra.locator('.reading-aid')).not.toBeEmpty();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.evaluate(()=>SynapseLanguage.set('en'));await rudra.locator('.library-use').click();await expect(page.locator('[name=mantraId]')).toHaveValue('rudra-invocation');
 await page.locator('#sankalp-form button').click();await page.getByRole('button',{name:'\uff0b 1',exact:true}).click();await page.reload();
 const rudraState=await page.evaluate(async()=>await(await import('/japseva/storage.mjs')).read());expect(rudraState.sankalps.find(s=>s.mantraId==='rudra-invocation').count).toBe(1);expect(rudraState.sankalps).toHaveLength(4);
});

test('complete Rudram reader covers both books, preserves chapter selection and saves complete-recitation practice',async({page})=>{
 await page.setViewportSize({width:320,height:800});await create(page);await page.locator('[data-tab=learn]').click();await page.locator('#mantra-search').fill('Complete Namakam & Chamakam');await expect(page.locator('[data-mantra-id=rudram-complete]')).toBeVisible();await openGuide(page,'rudram-complete');
 const card=page.locator('[data-mantra-id=rudram-complete]'),reader=card.locator('.chapter-reader'),chapter=reader.getByLabel('Anuvaka',{exact:true});await expect(chapter.locator('option')).toHaveCount(22);await expect(page.locator('.book-page-navigation').getByRole('button',{name:'Previous reading',exact:true})).toBeDisabled();
 const expected=await page.evaluate(async()=>{const {fullRudram:m}=await import('/japseva/rudram-full.mjs');return m.chapters.map(c=>({start:c.text.slice(0,30),end:c.text.slice(-30)}));});
 for(let index=0;index<22;index++){await chapter.selectOption(String(index));await expect(reader.locator('.chapter-text')).toContainText(expected[index].start);await expect(reader.locator('.chapter-text')).toContainText(expected[index].end);await expect(page.locator('.book-page-navigation [role=status]>span')).toHaveText((index+1)+' / 22');}
 await expect(page.locator('.book-page-navigation').getByRole('button',{name:'Next reading',exact:true})).toBeDisabled();await chapter.selectOption('7');await page.locator('.book-page-navigation').getByRole('button',{name:'Next chapter',exact:true}).click();await expect(chapter).toHaveValue('8');await page.locator('.book-page-navigation').getByRole('button',{name:'Previous chapter',exact:true}).click();
 for(const language of ['en','hi','gu']){await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(reader.locator('select').first()).toHaveValue('7');await expect(reader.locator('.chapter-meaning')).toHaveAttribute('lang',language);await page.locator('.book-control-row select').selectOption(language);await expect(reader.locator('.chapter-text')).toHaveAttribute('lang',language==='en'?'sa-Latn':language==='hi'?'sa-Deva':'sa-Gujr');}
 for(const theme of ['light','dark','deep']){await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.evaluate(()=>{SynapseLanguage.set('en');SynapseTheme.write('light');});await chapter.selectOption('0');await page.locator('.book-control-row select').selectOption('hi');await page.screenshot({path:'.publish/japseva-full-rudram-mobile.png',fullPage:true});
 const before=await page.evaluate(async()=>await(await import('/japseva/storage.mjs')).read());expect(before.sankalps).toHaveLength(1);expect(before.sankalps[0].count).toBe(0);
 await card.locator('.library-use').click();await expect(page.locator('[name=mantraId]')).toHaveValue('rudram-complete');await expect(page.locator('[name=mantra]')).toHaveJSProperty('readOnly',true);await expect(page.locator('[name=target]')).toHaveValue('1');await expect(page.locator('#target-unit option[value=malas]')).toHaveJSProperty('disabled',true);await page.locator('[name=target]').fill('2');await page.locator('#sankalp-form button').click();
 await expect(page.locator('.practice-card')).toContainText('2 complete recitations remaining');await expect(page.getByRole('button',{name:'＋ 1 mala · 108',exact:true})).toHaveCount(0);await page.locator('.mantra-disclosure>summary').click();await page.locator('.mantra-disclosure .chapter-reader select').first().selectOption('15');
 await page.getByRole('button',{name:'＋ 1',exact:true}).click();await expect(page.locator('.mantra-disclosure .chapter-reader select').first()).toHaveValue('15');await page.reload();
 const saved=await page.evaluate(async()=>await(await import('/japseva/storage.mjs')).read());const practice=saved.sankalps.find(s=>s.mantraId==='rudram-complete');expect(practice.count).toBe(1);expect(practice.mantra.length).toBeLessThan(1000);expect(practice.mantra).toContain('चमकम्');
 await page.locator('.request-row').filter({hasText:'नमकम्'}).locator('.request-open').click();await page.getByRole('button',{name:'＋ 1',exact:true}).click();await page.getByRole('button',{name:'View completion certificate',exact:true}).click();await expect(page.locator('#certificate-canvas')).toBeVisible();
 const cert=await page.evaluate(async()=>{const {read,certificate}=await import('/japseva/storage.mjs');const state=await read();return certificate(state,state.sankalps.find(s=>s.mantraId==='rudram-complete').id);});expect(cert.count).toBe(2);expect(cert.mantra).toContain('नमकम्');
});

async function openGuide(page,id,audio=false){const row=page.locator('[data-mantra-id='+id+']');if(await page.locator('.book-reading').count()&&await row.locator('.library-guide').getAttribute('open')===null)await page.locator('.platform-back').click();const group=row.locator('xpath=ancestor::details[contains(@class,"library-index-group")]');if(await group.count()&&await group.getAttribute('open')===null)await group.locator(':scope>summary').click();if(await row.locator('.library-guide').getAttribute('open')===null)await row.locator('.library-guide>summary').click();}
