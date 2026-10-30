const {test,expect,acknowledgedContext}=require('../../../tests/browser-fixture'),{spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');let child,base,dir;
const password='Pandit isolated browser password!';
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-pandit-browser-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test',HOST:'127.0.0.1',PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe'],windowsHide:true});await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Pandit fixture startup timeout: '+output)),20000);child.stdout.on('data',d=>{output+=d;const match=output.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.stderr.on('data',d=>output+=d);child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('operator, Pandit and customer complete booking preparation with private locations and responsive themes',async({page,browser})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const setup=await page.request.post(base+'/api/auth/setup',{data:{name:'Booking Operator',firmName:'Disposable fixture',email:'owner@booking.test',password}});expect(setup.status()).toBe(201);
 for(const [name,email,role]of [['Pandit Test','pandit@booking.test','Advocate'],['Customer Test','customer@booking.test','Clerk']]){const r=await page.request.post(base+'/api/users',{data:{name,email,role,password,appIds:['pandit-booking']}});expect(r.status()).toBe(201);}
 await page.goto(base+'/pandit-booking');await expect(page.locator('#role')).toHaveText('Owner');await page.getByRole('button',{name:'Manage services',exact:true}).click();const service=page.locator('form[data-command=service]');await service.locator('[name=name]').fill('Ganesh Puja');await service.locator('[name=description]').fill('A family puja prepared with care.');await service.locator('[name=preparation]').fill('Prepare a clean space.');await service.locator('[name=samagri]').fill('Customer supplies flowers; Pandit supplies the guide.');await service.locator('[name=terms]').fill('Discuss changes with the operator before the ceremony.');await service.locator('[name=priceNote]').fill('Agree the scope before confirmation.');await service.getByRole('button',{name:'Save service',exact:true}).click();await expect(page.locator('#notice')).toHaveText('Saved.');
 const pContext=await acknowledgedContext(browser),p=await pContext.newPage();p.on('pageerror',e=>errors.push(e.message));expect((await p.request.post(base+'/api/auth/login',{data:{email:'pandit@booking.test',password}})).status()).toBe(200);await p.goto(base+'/pandit-booking');await p.getByRole('button',{name:'My profile & availability',exact:true}).click();const profile=p.locator('form[data-command=profile]');await profile.locator('[name=name]').fill('Pandit Test');await profile.locator('[name=city]').fill('Ahmedabad');await profile.locator('[name=areas]').fill('Paldi, Satellite');await profile.locator('[name=bio]').fill('Experienced in family puja ceremonies.');await profile.locator('[name=serviceIds]').check();await profile.getByRole('button',{name:'Submit profile for review'}).click();await expect(p.locator('#notice')).toHaveText('Saved.');
 const day=new Date(Date.now()+10*86400000).toISOString().slice(0,10);await p.locator('[name=windowStart]').fill(`${day}T09:00`);await p.locator('[name=windowEnd]').fill(`${day}T18:00`);await p.getByRole('button',{name:'Save availability',exact:true}).click();await expect(p.locator('#notice')).toHaveText('Saved.');
 await page.locator('#refresh').click();await page.getByRole('button',{name:'Profile & review approval',exact:true}).click();const approval=page.locator('form[data-command=approve]');await approval.locator('[name=reason]').fill('Profile and contact manually reviewed for pilot.');await approval.getByRole('button',{name:'Save decision'}).click();await expect(page.locator('#notice')).toHaveText('Saved.');
 const cContext=await acknowledgedContext(browser),c=await cContext.newPage();c.on('pageerror',e=>errors.push(e.message));expect((await c.request.post(base+'/api/auth/login',{data:{email:'customer@booking.test',password}})).status()).toBe(200);await c.goto(base+'/pandit-booking');await c.getByRole('button',{name:'Find a Pandit',exact:true}).first().click();await c.getByRole('button',{name:'Request a booking'}).click();const request=c.locator('form[data-command=request]');await request.locator('[name=start]').fill(`${day}T10:00`);await request.locator('[name=contact]').fill('customer-private@example.test');await request.locator('[name=address]').fill('Private customer venue, 17 Paldi');await request.locator('[name=acceptTerms]').check();await request.getByRole('button',{name:'Send booking request'}).click();await expect(c.locator('#notice')).toHaveText('Saved.');await c.getByRole('button',{name:'My bookings',exact:true}).click();await expect(c.locator('#content')).toContainText('Requested');
 await p.locator('#refresh').click();await p.getByRole('button',{name:'My bookings',exact:true}).click();await expect(p.locator('#content')).toContainText('Your booking timeline starts here');
 await page.locator('#refresh').click();await page.getByRole('button',{name:'My bookings',exact:true}).click();await page.getByRole('button',{name:'View booking'}).click();const confirm=page.locator('form[data-command=confirm]');await confirm.locator('[name=quote]').fill('Ceremony scope agreed; no payment collection.');await confirm.getByRole('button',{name:'Confirm booking'}).click();await expect(page.locator('#notice')).toHaveText('Saved.');
 await p.locator('#refresh').click();await p.getByRole('button',{name:'View booking'}).click();await expect(p.locator('#detail-content')).toContainText('Private customer venue, 17 Paldi');await p.locator('form[data-command=message] textarea').fill('Please keep the flowers ready.');await p.locator('form[data-command=message] button').click();await expect(p.locator('#notice')).toHaveText('Saved.');await p.locator('#close').click();
 await c.locator('#refresh').click();await c.getByRole('button',{name:'View booking'}).click();await expect(c.locator('#detail-content')).toContainText('Please keep the flowers ready.');await c.locator('form[data-command=checklist] [data-action=add-item]').click();await c.locator('[name=itemText]').fill('Flowers');await c.locator('[name=itemDone]').check();await c.locator('form[data-command=checklist] [data-action=add-item]').click();await c.locator('[name=itemText]').last().fill('Puja guide');await c.locator('[name=responsibility]').last().selectOption('Pandit');await c.locator('form[data-command=checklist] button[type=submit]').click();await expect(c.locator('#notice')).toHaveText('Saved.');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await c.setViewportSize({width,height:900});await c.evaluate(t=>SynapseTheme.write(t),theme);expect(await c.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await c.getByRole('button',{name:'View booking'}).click();expect(await c.evaluate(()=>document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth)).toBe(true);await c.locator('#close').click();}
 for(const colorScheme of ['dark','light']){await c.emulateMedia({colorScheme});await c.evaluate(()=>SynapseTheme.write('system'));await expect(c.locator('html')).toHaveAttribute('data-theme',colorScheme);}
 await c.setViewportSize({width:390,height:844});await c.evaluate(()=>SynapseTheme.write('light'));await c.getByRole('button',{name:'Find a Pandit',exact:true}).click();await c.evaluate(()=>scrollTo(0,0));await c.screenshot({path:'.publish/pandit-booking-mobile.png',fullPage:true});
 const publicResponse=await browser.newContext();const publicData=await (await publicResponse.request.get(base+'/api/pandit-booking/public/local')).json();expect(JSON.stringify(publicData)).not.toContain('customer-private');expect(JSON.stringify(publicData)).not.toContain('Private customer venue');await publicResponse.close();
 await c.getByRole('button',{name:'My bookings',exact:true}).click();await c.getByRole('button',{name:'View booking'}).click();await c.locator('form[data-command=cancel] [name=reason]').fill('Change of family plans');await c.locator('form[data-command=cancel] button').click();await expect(c.locator('#notice')).toHaveText('Saved.');await p.locator('#refresh').click();await expect(p.locator('#content')).toContainText('Your booking timeline starts here');expect(errors).toEqual([]);await pContext.close();await cContext.close();
});
test('private DOM clears on hidden visibility and a held older response cannot restore it',async({page})=>{
 expect((await page.request.post(base+'/api/auth/login',{data:{email:'customer@booking.test',password}})).status()).toBe(200);await page.goto(base+'/pandit-booking');await expect(page.locator('#role')).toHaveText('Customer');await page.getByRole('button',{name:'My bookings',exact:true}).click();await page.getByRole('button',{name:'View booking'}).click();await expect(page.locator('#detail-content')).toContainText('Private customer venue');await page.locator('#close').click();
 let release,started;const gate=new Promise(r=>release=r),pending=new Promise(r=>started=r);await page.route('**/api/pandit-booking/local',async route=>{const response=await route.fetch();started();await gate;await route.fulfill({response});});
 await page.locator('#refresh').click();await pending;await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});release();await expect(page.locator('#content')).toBeEmpty();await expect(page.locator('#detail-content')).toBeEmpty();await expect(page.locator('#role')).toBeEmpty();await page.unroute('**/api/pandit-booking/local');
 await page.route('**/api/pandit-booking/local',route=>route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'Please sign in again'})}));await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('#notice')).toContainText('sign in again');await expect(page.locator('#content')).toBeEmpty();await expect(page.locator('#detail-content')).toBeEmpty();
});
test('visitors browse published puja details and Pandit service areas without private bookings',async({page})=>{
 await page.goto(base+'/pandit-booking');await expect(page.locator('#role')).toHaveText('Visitor · Read-only');await expect(page.locator('#content')).toContainText('Ganesh Puja');await page.getByRole('button',{name:'Find a Pandit',exact:true}).first().click();await expect(page.locator('#pandits')).toContainText('Pandit Test');await expect(page.locator('#pandits')).toContainText('Ahmedabad');await expect(page.getByRole('button',{name:'Request a booking'})).toHaveCount(0);await expect(page.locator('body')).not.toContainText('Private customer venue');await expect(page.locator('body')).not.toContainText('customer-private@example');
});

test('Hindi and Gujarati journeys preserve drafts, user content and canonical booking writes',async({browser})=>{
 test.setTimeout(120000);
 const {copy,text}=await import('../frontend/copy.mjs');
 const untranslated=async page=>page.evaluate(()=>{
  const results=new Set();
  for(const root of document.querySelectorAll('main,#detail')){
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){
    const n=walker.currentNode,p=n.parentElement,value=n.data.trim();
    if(p.closest('[data-language-preserve],input,textarea,time,script,style')||!/[A-Za-z]/.test(value)||/[\u0900-\u097f\u0a80-\u0aff]/.test(value))continue;
    results.add(value);
   }
  }
  return [...results];
 });
 for(const language of ['hi','gu']){
  const contexts=[],pages=[];
  for(const who of ['owner','pandit','customer']){
   const context=await acknowledgedContext(browser);contexts.push(context);
   const page=await context.newPage();pages.push(page);
   await context.addInitScript(lang=>localStorage.setItem('synapse-language',lang),language);
   expect((await page.request.post(base+'/api/auth/login',{data:{email:who+'@booking.test',password}})).status()).toBe(200);
   await page.goto(base+'/pandit-booking');
   await expect(page.locator('html')).toHaveAttribute('lang',language);
   await expect(page.locator('#tabs')).toContainText(text('My bookings',language));
  }
  const [owner,pandit,customer]=pages;
  const label=source=>text(source,language);
  const tab=async(page,name)=>page.getByRole('button',{name:label(name),exact:true}).first().click();
  await expect(customer.locator('h1')).toContainText(label('A meaningful puja.'));
  for(const name of ['Manage services','Concerns','Profile & review approval','Activity & restrictions']){
   await tab(owner,name);expect(await untranslated(owner)).toEqual([]);
  }
  await tab(owner,'Manage services');
  const draft='City <draft> पूजा નોંધ';await owner.locator('[name=name]').fill(draft);
  await owner.evaluate(()=>SynapseLanguage.set('en'));await expect(owner.locator('[name=name]')).toHaveValue(draft);
  await owner.evaluate(lang=>SynapseLanguage.set(lang),language);await expect(owner.locator('[name=name]')).toHaveValue(draft);
  await expect(owner.locator('[name=modes]')).toHaveValue('At venue');
  await expect(owner.locator('[name=modes] option:checked')).toHaveText(label('At venue'));
  await tab(pandit,'My profile & availability');expect(await untranslated(pandit)).toEqual([]);
  await expect(pandit.locator('[name=name]')).toHaveValue('Pandit Test');
  await tab(customer,'Find a Pandit');expect(await untranslated(customer)).toEqual([]);
  await expect(customer.locator('#pandits')).toContainText('Pandit Test');
  await customer.getByRole('button',{name:label('Request a booking'),exact:true}).click();
  expect(await untranslated(customer)).toEqual([]);
  const request=customer.locator('form[data-command=request]');
  const day=new Date(Date.now()+10*86400000).toISOString().slice(0,10);
  await request.locator('[name=start]').fill(`${day}T10:00`);
  await request.locator('[name=contact]').fill('private-languages@example.test');
  // A dictionary-key collision must remain user content, including after reload.
  const address='City';await request.locator('[name=address]').fill(address+' private venue');
  await request.locator('[name=notes]').fill('Description');
  await request.locator('[name=acceptTerms]').check();
  await customer.evaluate(()=>SynapseLanguage.set('en'));
  await expect(request.locator('[name=notes]')).toHaveValue('Description');
  await customer.evaluate(lang=>SynapseLanguage.set(lang),language);
  await expect(request.locator('[name=address]')).toHaveValue(address+' private venue');
  // A validation response stays actionable in the selected language without
  // clearing fields or changing server-owned enum values.
  await customer.route('**/api/pandit-booking/local',route=>route.request().method()==='POST'?route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'Contact: use 5–150 characters'})}):route.continue());
  await request.locator('button[type=submit]').click();
  await expect(customer.locator('#notice')).toContainText(language==='hi'?'संपर्क':'સંપર્ક');
  await expect(request.locator('[name=notes]')).toHaveValue('Description');
  await customer.unroute('**/api/pandit-booking/local');
  await request.locator('button[type=submit]').click();await expect(customer.locator('#notice')).toHaveText(label('Saved.'));
  await tab(owner,'My bookings');await owner.locator('#refresh').click();
  await owner.getByRole('button',{name:label('View booking')}).last().click();expect(await untranslated(owner)).toEqual([]);
  await owner.locator('form[data-command=confirm] [name=quote]').fill('Agreed service; no payment.');
  await owner.locator('form[data-command=confirm] button').click();await expect(owner.locator('#notice')).toHaveText(label('Saved.'));
  await customer.locator('#refresh').click();await tab(customer,'My bookings');
  await customer.getByRole('button',{name:label('View booking')}).last().click();expect(await untranslated(customer)).toEqual([]);
  await expect(customer.locator('#detail-content')).toContainText('Description');
  await expect(customer.locator('#detail-content')).toContainText('City private venue');
  await customer.locator('form[data-command=checklist] [data-action=add-item]').click();
  await customer.locator('[name=itemText]').fill('Flowers');await customer.locator('[name=itemDone]').check();
  await customer.locator('form[data-command=checklist] button[type=submit]').click();await expect(customer.locator('#notice')).toHaveText(label('Saved.'));
  const saved=await (await customer.request.get(base+'/api/pandit-booking/local')).json();
  const booking=saved.bookings.at(-1);expect(booking.mode).toBe('At venue');expect(booking.checklist[0]).toEqual({responsibility:'Customer',done:true,text:'Flowers'});
  await customer.getByRole('button',{name:label('View booking')}).last().click();
  await customer.locator('form[data-command=message] textarea').fill('City');await customer.locator('form[data-command=message] button').click();await expect(customer.locator('#notice')).toHaveText(label('Saved.'));await customer.locator('#close').click();
  await pandit.locator('#refresh').click();await tab(pandit,'My bookings');await pandit.getByRole('button',{name:label('View booking')}).last().click();
  await expect(pandit.locator('.message p')).toHaveText('City');expect(await untranslated(pandit)).toEqual([]);
  await pandit.locator('#close').click();
  await customer.getByRole('button',{name:label('View booking')}).last().click();
  for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
   await customer.setViewportSize({width,height:900});await customer.evaluate(value=>SynapseTheme.write(value),theme);
   expect(await customer.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth)).toBe(true);
  }
  await customer.setViewportSize({width:390,height:844});await customer.evaluate(()=>SynapseTheme.write('light'));
  await customer.screenshot({path:'.publish/pandit-booking-'+language+'.png',fullPage:true});
  await customer.locator('form[data-command=cancel] [name=reason]').fill('End isolated language journey');await customer.locator('form[data-command=cancel] button').click();await expect(customer.locator('#notice')).toHaveText(label('Saved.'));
  for(const context of contexts)await context.close();
 }
 expect(Object.keys(copy).length).toBeGreaterThan(300);
});

test('guided setup and visual slots reject overlaps without losing unsaved input',async({page})=>{
 expect((await page.request.post(base+'/api/auth/login',{data:{email:'pandit@booking.test',password}})).status()).toBe(200);
 await page.goto(base+'/pandit-booking');await expect(page.locator('#setup')).toContainText('Add available time slots');
 await page.getByRole('button',{name:'My profile & availability',exact:true}).click();
 const form=page.locator('form[data-command=availability]');
 const start=await form.locator('[name=windowStart]').inputValue(),end=await form.locator('[name=windowEnd]').inputValue();
 await form.getByRole('button',{name:'Add time slot',exact:true}).click();
 await form.locator('[name=windowStart]').last().fill(start);await form.locator('[name=windowEnd]').last().fill(end);
 await form.getByRole('button',{name:'Save availability',exact:true}).click();
 await expect(page.locator('#notice')).toHaveText('Availability windows overlap');
 await expect(form.locator('[data-window-row]')).toHaveCount(2);
 await expect(form.locator('[name=windowStart]').last()).toHaveValue(start);
 const saved=await (await page.request.get(base+'/api/pandit-booking/local')).json();
 expect(saved.profiles.find(p=>p.id===saved.userId).windows).toHaveLength(1);
 await form.getByRole('button',{name:'Remove time slot',exact:true}).last().click();
 await expect(form.locator('[data-window-row]')).toHaveCount(1);
});

test('chat updates and unread counts preserve drafts; expiry clears private content and stops polling',async({browser})=>{
 test.setTimeout(100000);
 const contexts=[];
 const login=async who=>{const context=await acknowledgedContext(browser);contexts.push(context);const page=await context.newPage();expect((await page.request.post(base+'/api/auth/login',{data:{email:who+'@booking.test',password}})).status()).toBe(200);return page;};
 const owner=await login('owner'),pandit=await login('pandit'),customer=await login('customer');
 const get=async page=>(await page.request.get(base+'/api/pandit-booking/local')).json();
 const command=async(page,action,input)=>{const state=await get(page);const response=await page.request.post(base+'/api/pandit-booking/local',{headers:{Origin:base},data:{version:state.version,action,input}});expect(response.status(),await response.text()).toBe(200);};
 const initial=await get(customer),profile=initial.profiles.find(p=>p.status==='Approved'),service=initial.services[0];
 const start=new Date(Date.now()+10*86400000).toISOString().slice(0,10)+'T04:30:00.000Z';
 await command(customer,'request',{requestKey:'isolated-chat-update-request',serviceId:service.id,panditId:profile.id,start,city:profile.city,area:profile.areas[0],mode:'At venue',attendees:5,language:profile.languages[0],contact:'private-chat@example.test',address:'Isolated private chat venue',notes:'',acceptTerms:true});
 const booking=(await get(customer)).bookings.at(-1);
 await command(owner,'confirm',{id:booking.id,quote:'Isolated chat feature check'});
 await customer.goto(base+'/pandit-booking');await customer.getByRole('button',{name:'My bookings',exact:true}).click();await customer.getByRole('button',{name:'View booking',exact:true}).last().click();
 const composer=customer.locator('form[data-command=message] textarea'),reason=customer.locator('form[data-command=cancel] [name=reason]');
 await composer.fill('Unsent customer draft');await reason.fill('Another unsaved field');
 await customer.locator('form[data-command=checklist] [data-action=add-item]').click();
 await customer.locator('[name=itemText]').fill('An unsaved preparation item');
 await command(pandit,'message',{id:booking.id,text:'An incoming message without a page refresh'});
 await expect(customer.locator('#message-list')).toContainText('An incoming message without a page refresh',{timeout:16000});
 await expect(composer).toHaveValue('Unsent customer draft');await expect(reason).toHaveValue('Another unsaved field');
 // A background update must not silently advance an edited checklist's version.
 await customer.locator('form[data-command=checklist] button[type=submit]').click();
 await expect(customer.locator('#notice')).toContainText('Refresh before saving');
 await expect(customer.locator('[name=itemText]')).toHaveValue('An unsaved preparation item');
 expect((await get(customer)).bookings.at(-1).checklist).toEqual([]);
 await customer.locator('form[data-command=message] button[type=submit]').click();await expect(customer.locator('#notice')).toHaveText('Saved.');
 await expect(customer.locator('#detail')).toBeVisible();await expect(composer).toHaveValue('');await expect(reason).toHaveValue('Another unsaved field');
 await expect(customer.locator('#message-list .own-message')).toContainText('Unsent customer draft');
 // Text entered after pressing Send must not be cleared by its delayed reply.
 let release,started;const gate=new Promise(resolve=>release=resolve),pending=new Promise(resolve=>started=resolve);
 await customer.route('**/api/pandit-booking/local',async route=>{
  if(route.request().method()!=='POST'){await route.continue();return;}
  const response=await route.fetch();started();await gate;await route.fulfill({response});
 });
 await composer.fill('Send this message');await customer.locator('form[data-command=message] button[type=submit]').click();await pending;
 await composer.fill('Keep this newer draft');release();await expect(customer.locator('#message-list')).toContainText('Send this message');await expect(customer.locator('#notice')).toHaveText('Saved.');
 await expect(composer).toHaveValue('Keep this newer draft');await customer.unroute('**/api/pandit-booking/local');
 await customer.locator('#close').click();await command(pandit,'message',{id:booking.id,text:'A new unread message'});
 const badge=customer.locator('#content [data-unread-for="'+booking.id+'"]');
 await expect(badge).toBeVisible({timeout:16000});await expect(badge.locator('b')).toHaveText('1');
 await customer.getByRole('button',{name:'Open conversation',exact:true}).last().click();
 await expect(customer.locator('#detail-content [data-unread-for]')).toBeHidden();
 await expect(customer.locator('#message-list')).toContainText('A new unread message');await composer.fill('Private draft to clear on expiry');
 await customer.route('**/api/pandit-booking/local',route=>route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Booking app access required'})}));
 await expect(customer.locator('#content')).toBeEmpty({timeout:16000});await expect(customer.locator('#setup')).toBeEmpty();
 await expect(customer.locator('#detail-content')).toBeEmpty();await expect(customer.locator('#role')).toBeEmpty();
 await expect(customer.locator('#notice')).toContainText('sign in again');
 let calls=0;customer.on('request',request=>{if(request.url().endsWith('/api/pandit-booking/local'))calls++;});
 await customer.clock.install();await customer.clock.runFor(30000);expect(calls).toBe(0);
 for(const context of contexts)await context.close();
});
