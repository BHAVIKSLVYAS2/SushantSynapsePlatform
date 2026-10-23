const {test,expect}=require('../../../tests/browser-fixture.js'),{spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');let child,base,dir;

test('native arena reserves shared header space before a delayed shell mounts',async({page})=>{
 let release;const gate=new Promise(resolve=>release=resolve);await page.route('**/shared/platform-shell.js*',async route=>{await gate;await route.continue();});
 try{await page.goto(base+'/satire-arena/news-anchors',{waitUntil:'commit'});await expect(page.locator('.hero')).toBeVisible();await expect(page.locator('body')).toHaveClass(/platform-shell-pending/);const before=await page.locator('.hero').evaluate(e=>({top:e.getBoundingClientRect().top,padding:getComputedStyle(document.body).paddingTop}));expect(before.padding).toBe('72px');release();await expect(page.locator('.platform-shell')).toHaveCount(1);expect(await page.locator('.hero').evaluate(e=>e.getBoundingClientRect().top)).toBeCloseTo(before.top,0);}finally{release();}
});

test('lean arena renders once, loads one metadata module and keeps daily results current after votes and polling',async({page})=>{
 const requests=[];page.on('request',r=>requests.push(r.url()));await page.addInitScript(()=>{window.layoutRemovals=0;new MutationObserver(records=>{for(const record of records)for(const node of record.removedNodes)if(node.nodeType===1&&node.matches('.portrait-stage,.card-meta,.portrait,.card-body'))window.layoutRemovals++;}).observe(document,{childList:true,subtree:true});});
 await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+10000));await page.goto(base+'/satire-arena/news-anchors');await expect(page.locator('#today-results')).toContainText(/Today · \d+ reactions/);
 expect(requests.filter(u=>/\/cast\.mjs(?:\?|$)/.test(u))).toHaveLength(1);expect(requests.filter(u=>/\/(catalogue|personas|spotlight)\.mjs|applause\.mp3/.test(u))).toEqual([]);expect(await page.evaluate(()=>window.layoutRemovals)).toBe(0);await expect(page.locator('.portrait-stage,.card-meta,.synapse-header')).toHaveCount(0);await expect(page.locator('.platform-shell')).toHaveCount(1);
 const total=Number((await page.locator('#today-results').textContent()).match(/Today · (\d+)/)[1]);
 try{await page.locator('.arena-settings summary').click();await page.locator('#reaction-sound').uncheck();await page.locator('[data-character=roar-nab] [data-reaction=laugh]').click();await expect(page.locator('#today-results')).toContainText('Today · '+(total+1)+' reactions');expect(requests.filter(u=>u.includes('applause.mp3'))).toEqual([]);const results=requests.filter(u=>u.endsWith('/api/satire-arena/results')).length,editorial=requests.filter(u=>u.endsWith('/api/arena-editorial/today')).length;await page.clock.fastForward(30000);await expect.poll(()=>requests.filter(u=>u.endsWith('/api/satire-arena/results')).length).toBeGreaterThan(results);expect(requests.filter(u=>u.endsWith('/api/arena-editorial/today')).length).toBe(editorial);}finally{await page.evaluate(()=>fetch('/api/satire-arena/mine',{method:'DELETE',headers:{'X-Arena-Confirm':'DELETE'}}));}
});

test('spotlight detail reactions change faces only after saving and restore the base portraits',async({page})=>{
 test.setTimeout(120000);const expressions={garland:'happy',applause:'happy',shoe:'annoyed',finger:'annoyed',tomato:'startled',laugh:'laughing'};
 await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+10000));
 try{for(const [id,sheet]of [['roar-nab','anchors'],['king-khanvas','actors'],['mukesh-megaplan','corporates']]){
  await page.goto(base+'/satire-arena/characters/'+id);const hero=page.locator('.file-hero');
  for(const [reaction,expression]of Object.entries(expressions)){await page.locator('[data-reaction='+reaction+']').click();await expect(page.locator('#character-vote-status')).toContainText('Saved!');await expect(hero).toHaveAttribute('data-expression',expression);expect(await hero.locator('.portrait').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('/'+sheet+'-expressions-fast.webp');expect(await hero.locator('.portrait').evaluate(e=>getComputedStyle(e).backgroundSize)).toBe('600% 400%');if(reaction==='finger')await expect(hero.locator('.ink-splash')).toBeVisible();await page.clock.fastForward(2000);await expect(hero).not.toHaveAttribute('data-expression');expect(await hero.locator('.portrait').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('/'+sheet+'-fast.webp');}
  await page.route('**/api/satire-arena/'+id+'/vote',r=>r.fulfill({status:503,json:{error:'Detail save unavailable'}}));await page.locator('[data-reaction=shoe]').click();await expect(page.locator('#character-vote-status')).toContainText('Detail save unavailable');await expect(hero).not.toHaveAttribute('data-expression');await expect(hero.locator('.reaction-effect')).toHaveCount(0);await expect(page.locator('[data-reaction=laugh]')).toHaveAttribute('aria-pressed','true');await page.unroute('**/api/satire-arena/'+id+'/vote');
 }}finally{await page.evaluate(()=>fetch('/api/satire-arena/mine',{method:'DELETE',headers:{'X-Arena-Confirm':'DELETE'}}));}
});

test('fictional personas have attractive dossiers and encore/copy interactions that never change a ballot',async({page,browser})=>{
 test.setTimeout(180000);
 const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET'&&/\/api\/satire-arena\//.test(r.url()))writes.push(r.url());});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copiedPunchline=text},configurable:true}));
 for(const [id,name]of [['roar-nab','Decibel Dada'],['king-khanvas','Baahon Badshah'],['elon-launchpad','Rocket Raees']]){
  await page.goto(base+'/satire-arena/characters/'+id);await expect(page.locator('#character-name')).toHaveText(name);await expect(page.locator('.file-notes article')).toHaveCount(3);await expect(page.locator('.file-dialogue')).toHaveCount(2);
  const laugh=page.locator('[data-reaction=laugh]');await expect(laugh).toBeEnabled();await laugh.click();await expect(laugh).toHaveAttribute('aria-pressed','true');const count=await page.locator('#character-total').textContent(),before=writes.length;
  const initial=await page.locator('[data-comedy-line]').textContent();await page.getByRole('button',{name:'Encore!'}).click();await expect(page.locator('[data-comedy-line]')).not.toHaveText(initial);await expect(page.locator('[data-comedy-take]')).toHaveText('02');
  await page.getByRole('button',{name:'Copy punchline',exact:true}).click();await expect(page.locator('[data-comedy-status]')).toHaveText('Punchline copied. Pass the laugh along.');expect(await page.evaluate(()=>window.copiedPunchline)).toContain(name);expect(await page.evaluate(()=>window.copiedPunchline)).toContain('Fictional satire');
  await page.getByRole('button',{name:'Encore!'}).click();await page.getByRole('button',{name:'Encore!'}).click();await expect(page.locator('[data-comedy-line]')).toHaveText(initial);await expect(laugh).toHaveAttribute('aria-pressed','true');await expect(page.locator('#character-total')).toHaveText(count);expect(writes.length).toBe(before);
  for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:900});await page.locator('.file-comedy').scrollIntoViewIfNeeded();await page.screenshot({path:'.publish/persona-'+id+'-comedy.png'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/persona-'+id+'-hero.png'});
 }
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true});document.execCommand=()=>false;});await page.getByRole('button',{name:'Copy punchline',exact:true}).click();await expect(page.getByRole('textbox',{name:'Copy this fictional punchline'})).toHaveValue(/Rocket Raees/);await page.getByRole('button',{name:'Encore!'}).click();await expect(page.locator('.file-copy-field')).toHaveCount(0);
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser,{javaScriptEnabled:false});try{const p=await context.newPage();await p.goto(base+'/satire-arena/characters/roar-nab');await expect(p.locator('[data-comedy-line]')).toBeVisible();await expect(p.locator('[data-comedy-controls]')).toBeHidden();await expect(p.locator('.file-notes article')).toHaveCount(3);}finally{await context.close();}
 // Remove this test browser's disposable ballots before the shared-fixture count checks.
 expect(await page.evaluate(async()=>{const r=await fetch('/api/satire-arena/mine',{method:'DELETE',headers:{'X-Arena-Confirm':'DELETE'}});return r.ok;})).toBe(true);
 expect(errors).toEqual([]);
});

test('actors and corporates retain separate saved choices, profile votes, image shares and mobile layouts',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(navigator,'canShare',{value:undefined,configurable:true});window.portraitDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){if(args[0]?.src?.includes('/satire-arena/'))window.portraitDraws.push({src:args[0].src,crop:args.slice(1,5)});return draw.apply(this,args);};});
 for(const [arena,id]of [['actors','king-khanvas'],['corporates','mukesh-megaplan']]){
  const images=[];const watch=r=>{if(/\.webp/.test(r.url()))images.push(r.url());};page.on('request',watch);
  await page.goto(base+'/satire-arena/'+arena);await expect(page.locator('.arena-card')).toHaveCount(6);await expect(page.locator('.arena-navigation [aria-current]')).toHaveText(arena==='actors'?'Actors':'Corporates');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://apps.sushantsynapse.com/satire-arena/'+arena);
  expect(images.some(url=>/\/(anchors|cast|corporates|actors)-fast\.webp/.test(url)&&!url.includes('/'+arena+'-fast.webp'))).toBe(false);page.off('request',watch);
  const card=page.locator('[data-character='+id+']'),laugh=card.locator('[data-reaction=laugh]');await expect(laugh).toBeEnabled();await laugh.click();await expect(laugh).toHaveAttribute('aria-pressed','true');await expect(page.locator('#amused')).toHaveText('1');
  await page.reload();await expect(page.locator('[data-character='+id+'] [data-reaction=laugh]')).toHaveAttribute('aria-pressed','true');
  const download=page.waitForEvent('download');await page.locator('#share-arena').click();expect((await download).suggestedFilename()).toContain('standings');
  expect(await page.evaluate(arena=>window.portraitDraws.every(d=>d.src.includes('/'+arena+'-fast.webp')),arena)).toBe(true);
  await page.locator('[data-character='+id+'] .character-hero').click();await expect(page.locator('[data-reaction=laugh]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.file-cast nav a')).toHaveCount(6);
  await page.locator('[data-reaction=applause]').click();await expect(page.locator('[data-reaction=applause]')).toHaveAttribute('aria-pressed','true');
  for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:850});await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  const image=page.waitForEvent('download');await page.getByRole('button',{name:'Download image',exact:true}).click();expect((await image).suggestedFilename()).toBe('satire-arena.png');
  await page.setViewportSize({width:390,height:850});await page.screenshot({path:'.publish/'+arena+'-profile-mobile.png'});
  await page.getByRole('link',{name:'Back to the Arena',exact:false}).click();await expect(page.locator('#fans')).toHaveText('1');await expect(page.locator('#amused')).toHaveText('0');
  await page.screenshot({path:'.publish/'+arena+'-arena-mobile.png'});
 }
 await page.goto(base+'/satire-arena/news-anchors');await expect(page.locator('#fans')).toHaveText('0');
 for(const arena of ['actors','corporates']){await page.goto(base+'/satire-arena/'+arena);await expect(page.locator('#fans')).toHaveText('1');}
 expect(errors).toEqual([]);
});

test('arena entry is a lightweight chooser with native routes, no voting downloads and no-JavaScript access',async({page,browser})=>{
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/satire-arena');
 await expect(page.getByRole('heading',{name:'Pick your arena'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Big egos. Bigger laughs.'})).toBeVisible();
 await expect(page.locator('.entry-card-art svg')).toHaveCount(4);
 await expect(page.locator('.entry-card-joke')).toHaveCount(4);
 await page.getByRole('link',{name:'Find your front-row seat'}).click();await expect(page).toHaveURL(/#choose-arena$/);
 await expect(page.locator('.entry-card[href]')).toHaveCount(4);await expect(page.locator('.entry-card[href="/satire-arena/actors"]')).toBeVisible();
 await expect(page.locator('.entry-card[href="/satire-arena/corporates"]')).toBeVisible();
 for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:850});await page.evaluate(t=>SynapseTheme.write(t),theme);
  const overflow=await page.evaluate(()=>({fits:document.documentElement.scrollWidth<=innerWidth,items:[...document.querySelectorAll('.satire-entry *')].filter(e=>e.getBoundingClientRect().right>innerWidth).map(e=>e.className?.baseVal||e.className)}));expect(overflow.fits,JSON.stringify({theme,width,items:overflow.items})).toBe(true);
 }
 expect(requests.filter(url=>/\/api\/(satire-arena|arena-editorial|arena-metrics)|\/satire-arena\/(app\.js|style\.css|catalogue\.mjs|sound\.mjs|feedback\.mjs|enhancements\.js|.*\.(webp|png))/.test(url))).toEqual([]);
 for(const theme of ['light','dark']){await page.evaluate(t=>SynapseTheme.write(t),theme);for(const width of [390,1440]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/creative-entry-'+theme+'-'+width+'.png',fullPage:true});}}
 await page.setViewportSize({width:390,height:850});
 await page.locator('.entry-card[href="/satire-arena/news-anchors"]').click();await expect(page.locator('.arena-card')).toHaveCount(6);
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://apps.sushantsynapse.com/satire-arena/news-anchors');
 expect(requests.filter(url=>/\/satire-arena\/cast-fast\.webp/.test(url))).toEqual([]);
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser,{javaScriptEnabled:false});
 try{const p=await context.newPage();await p.goto(base+'/satire-arena');await expect(p.locator('.entry-card[href]')).toHaveCount(4);await p.locator('.entry-card[href="/satire-arena/politicians"]').click();await expect(p).toHaveURL(/\/satire-arena\/politicians$/);}finally{await context.close();}
 expect(errors).toEqual([]);
});

test('old character links choose the right arena and still require ballot confirmation',async({page})=>{
 await page.goto(base+'/satire-arena?character=roar-nab&reaction=laugh');
 await expect(page).toHaveURL(/\/satire-arena\/news-anchors\?character=roar-nab&reaction=laugh#character-roar-nab$/);
 await expect(page.locator('#pending')).toBeVisible();await expect(page.locator('[data-character=roar-nab] [data-reaction=laugh]')).toHaveAttribute('aria-pressed','false');
 await page.goto(base+'/satire-arena#character-namo-nimbus');await expect(page).toHaveURL(/\/satire-arena\/politicians#character-namo-nimbus$/);
 await page.goto(base+'/satire-arena?character=https://example.com&reaction=laugh');await expect(page.getByRole('heading',{name:'Pick your arena'})).toBeVisible();
});

test('news-anchor arena keeps scores separate, retains choices on detail pages and fits phone themes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/satire-arena/news-anchors');
 await expect(page.locator('.arena-card')).toHaveCount(6);
 await expect(page.locator('.arena-navigation a[aria-current]')).toHaveText('News Anchors');
 await expect(page.locator('.arena-navigation a[href="/satire-arena/actors"]')).toHaveText('Actors');await expect(page.locator('.arena-navigation a[href="/satire-arena/corporates"]')).toHaveText('Corporates');
 const card=page.locator('.arena-card').first(),id=await card.getAttribute('data-character');
 const laugh=card.locator('[data-reaction=laugh]');await expect(laugh).toBeEnabled();await laugh.click();await expect(laugh).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#amused')).toHaveText('1');
 await card.locator('.character-hero').click();await expect(page).toHaveURL(new RegExp('/characters/'+id+'$'));
 await expect(page.locator('[data-reaction=laugh]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-reaction=applause]').click();await expect(page.locator('[data-reaction=applause]')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('link',{name:'Back to the Arena',exact:false}).click();await expect(page).toHaveURL(/\/satire-arena\/news-anchors$/);
 await expect(page.locator('#fans')).toHaveText('1');await expect(page.locator('#amused')).toHaveText('0');
 for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:850});await page.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme+' '+width).toBe(true);
 }
 await page.setViewportSize({width:390,height:850});await page.screenshot({path:'.publish/news-anchors-mobile.png'});
 await page.locator('.arena-navigation').getByRole('link',{name:'Politicians',exact:true}).click();
 await expect(page.locator('.arena-card')).toHaveCount(13);await expect(page.locator('#fans')).toHaveText('0');
 await page.locator('.arena-navigation').getByRole('link',{name:'News Anchors',exact:true}).click();await expect(page.locator('#fans')).toHaveText('1');
 expect(errors).toEqual([]);
});
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-satire-editor-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test',PUBLIC_ORIGIN:'',ARENA_COOKIE_SECRET:'isolated-editor-browser-secret',ARENA_ANALYTICS_ENABLED:'true'},stdio:['ignore','pipe','pipe'],windowsHide:true});await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Startup timeout: '+output)),20000);child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.stderr.on('data',data=>output+=data);child.on('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('sample edition visualises posts without changing saved data or thirteen-character Arena',async({page,browser})=>{
 const errors=[],metrics=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/arena-metrics'))metrics.push(r.url());});
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.sampleCopied=text},configurable:true}));
 const before=await(await page.request.get(base+'/api/arena-editorial/public')).json();expect(before.posts).toEqual([]);
 await page.goto(base+'/satire-arena/daily');await expect(page.locator('.sample-edition-note')).toContainText('Seven original sample posts');await expect(page.locator('article.notice')).toHaveCount(8);await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex,follow');
 await page.locator('article.notice h2 a').first().click();await expect(page).toHaveURL(/sample=1/);await expect(page.locator('h1')).toHaveText('The meeting to shorten meetings');await expect(page.locator('main')).toContainText('fictional Office of Better Mondays');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const theme of ['light','dark']){await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/satire-sample-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Copy link',exact:true}).click();expect(await page.evaluate(()=>window.sampleCopied)).toContain('?sample=1');expect(metrics).toEqual([]);
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser,{javaScriptEnabled:false});try{const p=await context.newPage();await p.goto(base+'/satire-arena/categories/technology?sample=1');await expect(p.locator('article.notice')).toHaveCount(2);await expect(p.locator('main')).toContainText('पासवर्ड');}finally{await context.close();}
 expect((await page.request.get(base+'/satire-arena/posts/sample-meeting-to-end-meetings')).status()).toBe(404);expect((await(await page.request.get(base+'/api/arena-editorial/public')).json())).toEqual(before);
 await page.goto(base+'/satire-arena/politicians');await expect(page.locator('.arena-card')).toHaveCount(13);await expect(page.locator('.reactions button')).toHaveCount(78);await expect(page.locator('#daily-joke')).toHaveText('Original jokes, fictional characters and genuine yearly reactions.');
 const {cast}=await import('../frontend/catalogue.mjs');for(const c of cast.filter(c=>c.arena==='politicians'))await expect(page.locator('[data-character="'+c.id+'"] .daily-punchline')).toHaveText(c.copy);expect(errors).toEqual([]);
});

test('owner publishes satire, edits character personality, verifies SEO and mobile sharing',async({page,browser})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const setup=await page.request.post(base+'/api/auth/setup',{headers:{Origin:base},data:{name:'Editorial Owner',email:'editor@example.com',password:'Editorial-test-pass-2026',firmName:'Test workspace'}});expect(setup.status()).toBe(201);
 await page.goto(base+'/satire-arena/editor');await expect(page.locator('#editor')).toBeVisible();
 const form=page.locator('#post-form');await form.locator('[name=title]').fill('The meeting that needed a meeting');await form.locator('[name=slug]').fill('meeting-about-meetings');await form.locator('[name=punchline]').fill('The agenda asked to work from home.');await form.locator('[name=story]').fill('A fictional office comedy.');await form.locator('[name=category]').selectOption('office');await form.locator('[name=publishTime]').fill('2026-01-01T09:00');await form.getByRole('button',{name:'Save post'}).click();await expect(page.locator('#editor-status')).toContainText('Saved.');
 expect((await page.request.get(base+'/satire-arena/posts/meeting-about-meetings')).status()).toBe(404);
 await form.locator('[name=status]').selectOption('published');await form.locator('[name=featured]').check();await form.getByRole('button',{name:'Save post'}).click();await expect(page.locator('#editor-status')).toContainText('Saved.');
 const profile=page.locator('#character-form');await profile.locator('[name=bio]').fill('A fictional showman who rehearses his entrances.');await profile.locator('[name=tagline]').fill('Applause has a calendar appointment.');await profile.getByRole('button',{name:'Save character'}).click();await expect(page.locator('#editor-status')).toContainText('Saved.');
 const other=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser,{javaScriptEnabled:false});try{const visitor=await other.newPage();await visitor.goto(base+'/satire-arena/posts/meeting-about-meetings');await expect(visitor.getByRole('heading',{level:1})).toHaveText('The meeting that needed a meeting');await expect(visitor.locator('meta[property="og:description"]')).toHaveAttribute('content','The agenda asked to work from home.');await expect(visitor.locator('link[rel=canonical]')).toHaveAttribute('href',base+'/satire-arena/posts/meeting-about-meetings');await visitor.goto(base+'/satire-arena/characters/namo-nimbus');await expect(visitor.locator('.punchline')).toHaveText('Applause has a calendar appointment.');}finally{await other.close();}
 await page.goto(base+'/satire-arena/posts/meeting-about-meetings');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download image'}).click();expect((await download).suggestedFilename()).toBe('satire-arena.png');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const theme of ['light','dark']){await page.evaluate(t=>window.SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
 await page.goto(base+'/satire-arena/politicians');await expect(page.locator('#daily-joke')).toContainText('The agenda asked to work from home.');await expect(page.locator('[data-character=namo-nimbus] .daily-punchline')).toHaveText('Applause has a calendar appointment.');await expect(page.locator('#yesterday-results')).toHaveText('Yesterday · No reactions recorded.');await page.getByRole('link',{name:'Biography and punchlines for Namo Nimbus'}).click();await expect(page).toHaveURL(base+'/satire-arena/characters/namo-nimbus');await expect(page.locator('main')).toContainText('Applause has a calendar appointment.');
 const xml=await(await page.request.get(base+'/sitemap.xml')).text();expect(xml).toContain('/satire-arena/posts/meeting-about-meetings');expect(xml).not.toContain('/editor');
 await page.goto(base+'/');await expect(page.locator('[data-home-satire]')).toContainText('The agenda asked to work from home.');await expect(page.getByRole('link',{name:'Daily Satire',exact:true})).toBeVisible();expect(errors).toEqual([]);
});
test('anonymous editor writes fail and aggregate reporting stays owner-only',async({page})=>{
 expect((await page.request.get(base+'/api/arena-editorial')).status()).toBe(401);expect((await page.request.put(base+'/api/arena-editorial',{headers:{Origin:base},data:{version:0,posts:[],characters:[]}})).status()).toBe(401);expect((await page.request.get(base+'/api/arena-metrics')).status()).toBe(401);
 await page.goto(base+'/satire-arena/editor');await expect(page.locator('#editor')).toBeHidden();await expect(page.locator('#editor-status')).toContainText('sign in');await page.goto(base+'/satire-arena/results');await expect(page.getByRole('heading',{level:1})).toHaveText('Daily Arena results');await expect(page.locator('main')).toContainText('No reactions recorded.');
});
test('public character shares use its canonical link and download genuine artwork',async({page})=>{
 await page.addInitScript(()=>{window.shareCalls=[];Object.defineProperty(navigator,'share',{value:async data=>window.shareCalls.push(data),configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copiedLink=text},configurable:true});window.open=(url)=>{window.openedShare=url;return null;};window.artworkDraws=0;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){window.artworkDraws++;return draw.apply(this,args);};});
 await page.goto(base+'/satire-arena/characters/namo-nimbus');await page.getByRole('button',{name:'Share',exact:true}).click();await expect(page.locator('#share-status')).toContainText('handed to your device');expect(await page.evaluate(()=>window.shareCalls[0].url)).toBe(base+'/satire-arena/characters/namo-nimbus');await page.getByRole('button',{name:'Copy link'}).click();await expect(page.locator('#share-status')).toHaveText('Link copied.');expect(await page.evaluate(()=>window.copiedLink)).toBe(base+'/satire-arena/characters/namo-nimbus');await page.getByRole('button',{name:'WhatsApp'}).click();expect(await page.evaluate(()=>window.openedShare)).toContain('https://wa.me/?text=');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download image'}).click();expect((await download).suggestedFilename()).toBe('satire-arena.png');expect(await page.evaluate(()=>window.artworkDraws)).toBeGreaterThan(0);
});

test('all cast files fit phones and desktops in both themes',async({page})=>{
 test.setTimeout(480000);
 const {cast}=await import('../frontend/catalogue.mjs'),errors=[];page.on('pageerror',error=>errors.push(error.message));
 fs.mkdirSync('.publish/character-review',{recursive:true});
 for(const c of cast){
  await page.goto(base+'/satire-arena/characters/'+c.id);await expect(page.locator('#character-name')).toHaveText(c.name);await expect(page.locator('.file-voting [data-reaction]')).toHaveCount(6);await expect(page.locator('.file-signatures blockquote')).toHaveCount(3);await expect(page.locator('.file-cast [aria-current=page]')).toContainText(c.name);await expect(page.locator('#character-sound')).toBeChecked();
  await expect(page.locator('.file-hero .portrait')).toHaveAttribute('aria-label',c.name+', a fictional parody cartoon');
  for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>window.SynapseTheme.write(t),theme);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),c.id+' '+theme+' '+width).toBe(true);
   const boxes=await page.locator('.file-voting [data-reaction]').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return {top:Math.round(r.top),width:r.width,height:r.height};}));expect(new Set(boxes.map(r=>r.top)).size).toBe(1);expect(boxes.every(r=>r.width>=44&&r.height>=44),c.id+' tap targets at '+width).toBe(true);
   expect(await page.locator('#character-name').evaluate(el=>el.scrollWidth<=el.clientWidth+1),c.id+' title at '+width).toBe(true);
   const portrait=page.locator('.file-hero .portrait'),hero=page.locator('.file-hero');
   const fiveRows=c.portrait>=9;
   for(const expression of ['', 'happy','startled','annoyed','laughing']){
    await hero.evaluate((el,value)=>{if(value)el.dataset.expression=value;else delete el.dataset.expression;},expression);
    const crop=await portrait.evaluate(async el=>{const css=getComputedStyle(el),image=new Image();image.src=css.backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];await image.decode();return {size:css.backgroundSize,x:parseFloat(css.backgroundPositionX),y:parseFloat(css.backgroundPositionY),ratio:image.naturalWidth/image.naturalHeight};});
    if(c.portrait>=13){
     const start=c.portrait>=25?25:c.portrait>=19?19:13;
     expect(crop.size).toBe(expression?'600% 400%':'300% 200%');expect(crop.x).toBe(expression?(c.portrait-start)*20:(c.portrait-start)%3*50);expect(crop.y).toBeCloseTo(expression?['happy','startled','annoyed','laughing'].indexOf(expression)*100/3:Math.floor((c.portrait-start)/3)*100,4);expect(crop.ratio).toBeCloseTo(1.5,2);continue;
    }
    expect(crop.size,c.id+' '+expression+' crop').toBe(fiveRows?'200% 500%':expression?'300% 400%':'300% 100%');
    expect(crop.x).toBe(fiveRows?(c.portrait%2===1?0:100):(c.portrait%3)*50);
    const row=expression?['happy','startled','annoyed','laughing'].indexOf(expression):0;
    expect(crop.y).toBeCloseTo(fiveRows?(expression?(row+1)*25:0):expression?row*100/3:50,4);
    expect(crop.ratio).toBeCloseTo(fiveRows?2/5:expression?3/4:3,1);
   }
   await hero.evaluate(el=>delete el.dataset.expression);
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/character-review/'+c.id+'-mobile.png',fullPage:true});
  if(c.id==='namo-nimbus'){await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.publish/character-review/namo-nimbus-desktop.png',fullPage:true});}
 }
 expect(errors).toEqual([]);
});

test('character detail votes persist, replace one annual choice and reconcile failures',async({page})=>{
 await page.goto(base+'/satire-arena/characters/namo-nimbus');const garland=page.getByRole('button',{name:'Garland for Namo Nimbus'}),laugh=page.getByRole('button',{name:'Just laughing for Namo Nimbus'}),shoe=page.getByRole('button',{name:'Shoe for Namo Nimbus'});
 await expect(garland).toBeEnabled();await garland.click();await expect(page.locator('#character-vote-status')).toContainText('Saved!');await page.reload();await expect(garland).toHaveAttribute('aria-pressed','true');const total=await page.locator('#character-total').innerText();await laugh.click();await expect(page.locator('#character-vote-status')).toContainText('Saved!');await expect(garland).toHaveAttribute('aria-pressed','false');await expect(laugh).toHaveAttribute('aria-pressed','true');await expect(page.locator('#character-total')).toHaveText(total);
 const data=await(await page.request.get(base+'/api/satire-arena')).json();expect(data.characters.find(c=>c.id==='namo-nimbus').selected).toBe('laugh');expect(data.round).toMatch(/^\d{4}-01-01$/);
 await page.route('**/api/satire-arena/namo-nimbus/vote',route=>route.fulfill({status:503,json:{error:'Save unavailable.'}}));await shoe.click();await expect(page.locator('#character-vote-status')).toContainText('Save unavailable');await expect(laugh).toHaveAttribute('aria-pressed','true');await expect(shoe).toHaveAttribute('aria-pressed','false');
 await page.locator('#character-sound').uncheck();await expect(page.locator('.file-vote-footer label')).toContainText('Sound off');
 await page.route('**/api/satire-arena',route=>route.fulfill({status:503,json:{error:'Scores offline.'}}));await page.getByRole('button',{name:'Refresh scores'}).click();await expect(page.locator('#character-vote-status')).toContainText('Showing last synced scores');await expect(laugh).toBeDisabled();await page.unroute('**/api/satire-arena');await page.getByRole('button',{name:'Refresh scores'}).click();await expect(laugh).toBeEnabled();await expect(laugh).toHaveAttribute('aria-pressed','true');
});
