const {test,expect}=require('../../../tests/browser-fixture.js');
const {setTheme}=require('../../../tests/browser-theme');
const {startPreview}=require('../../../tests/organisation-preview-fixture.cjs');
let fixture;

test('platform audit is Super Admin only and clears on expiry',async({page})=>{
 await login(page,'master');await page.goto(fixture.base+'/platform-audit');await expect(page.getByRole('status')).toHaveText('Super Admin required');await expect(page.locator('#workspace')).toBeEmpty();await expect(page.locator('select[aria-label="Theme"]')).toHaveCount(0);await expect(page.locator('.platform-shell [data-theme-toggle]')).toBeVisible();
 await login(page,'super');await page.goto(fixture.base+'/super-admin');await page.locator('[data-admin-nav="governance"]').click();await page.getByRole('link',{name:'Review platform audit',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Audit ready.');
 await expect(page.locator('#workspace')).toContainText('Platform-wide events');
 await page.getByRole('combobox',{name:'Action',exact:true}).selectOption('PlatformRecoveryExportCreated');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.locator('#workspace')).toContainText('No matching events.');
 const exported=await page.request.post(fixture.base+'/api/organisation-admin/recovery-export',{data:{password:fixture.password,confirmation:'EXPORT ALL ORGANISATIONS',reason:'Browser recovery audit review'}});expect(exported.status()).toBe(200);
 await page.getByRole('button',{name:'Refresh latest',exact:true}).click();await expect(page.locator('#workspace')).toContainText('Platform Recovery Export Created');await expect(page.locator('#workspace')).toContainText('Browser recovery audit review');await expect(page.locator('#workspace')).toContainText('Includes account hashes');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await setTheme(page,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await setTheme(page,'light');await page.screenshot({path:'.publish/platform-audit-mobile.png',fullPage:true});
 await page.request.post(fixture.base+'/api/auth/logout',{data:{}});await page.getByRole('button',{name:'Refresh latest',exact:true}).click();await expect(page.getByRole('status')).toContainText('Session expired');await expect(page.locator('#workspace')).toBeEmpty();
});

test('organisation audit supports scoped pagination, action filtering and mobile themes',async({page})=>{
 const cookie=await fixture.login('super'),endpoint=fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId;
 let version=(await(await fetch(endpoint,{headers:{Cookie:cookie}})).json()).organisation.version;
 for(let i=0;i<25;i++){
  const response=await fetch(endpoint+'/limits',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({version,staffLimit:5,clientLimit:2,reason:'Audit review '+i})});expect(response.status).toBe(200);version=(await response.json()).version;
 }
 await login(page,'master');await page.goto(fixture.base+'/admin');await page.locator('.admin-sections [data-admin-nav="settings"]').click();await page.getByRole('link',{name:'Review organisation audit',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Audit ready.');
 await page.getByRole('combobox',{name:'Action',exact:true}).selectOption('OrganisationLimitsUpdated');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Audit ready.');await expect(page.locator('#workspace article')).toHaveCount(20);
 await page.getByRole('button',{name:'Older events',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Audit ready.');await expect(page.locator('#workspace article')).toHaveCount(5);await expect(page.getByRole('button',{name:'Older events',exact:true})).toBeHidden();
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await setTheme(page,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await setTheme(page,'light');await page.screenshot({path:'.publish/organisation-audit-mobile.png',fullPage:true});
 await page.getByRole('combobox',{name:'Action',exact:true}).selectOption('LicenceUpdated');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.locator('#workspace')).toContainText('No matching events.');
});

test('audit refuses other-org and staff access while Super Admin governance grants no Chambers access',async({page})=>{
 await login(page,'master');await page.goto(fixture.base+'/organisation-audit?organisation='+fixture.otherOrganisationId);await expect(page.getByRole('status')).toContainText('unavailable');await expect(page.locator('#workspace')).toBeEmpty();
 await login(page,'member');await page.goto(fixture.base+'/organisation-audit?organisation='+fixture.organisationId);await expect(page.getByRole('status')).toContainText('unavailable');
 await login(page,'super');await page.goto(fixture.base+'/organisation-audit?organisation='+fixture.otherOrganisationId);await expect(page.getByRole('status')).toHaveText('Audit ready.');
 expect((await page.request.get(fixture.base+'/api/chambers/'+fixture.otherOrganisationId+'/state')).status()).toBe(403);
 await page.request.post(fixture.base+'/api/auth/logout',{data:{}});await page.getByRole('button',{name:'Refresh latest',exact:true}).click();await expect(page.getByRole('status')).toContainText('Session expired');await expect(page.locator('#workspace')).toBeEmpty();
});

test('Super Admin suspends and reactivates an organisation with explicit confirmation',async({page,browser})=>{
 await login(page,'super');await page.goto(fixture.base+'/super-admin');await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 await page.locator('.admin-sections [data-admin-nav="governance"]').click();await page.locator('form[data-command="status"]').locator('..').locator('summary').click();
 let form=page.locator('form[data-command="status"]');
 await form.getByLabel('Type organisation name to confirm').fill('Wrong organisation');await form.getByLabel('Reason for change').fill('Suspend pending review');
 await form.getByRole('button',{name:'Update organisation status',exact:true}).click();await expect(page.getByRole('status')).toContainText('Type the organisation name exactly');
 await form.getByLabel('Type organisation name to confirm').fill('First Chambers');
 await form.getByRole('button',{name:'Update organisation status',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('#summary')).toContainText('Suspended');
 const context=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser);
 try{
  const member=await context.newPage();await login(member,'master');await member.goto(fixture.base+'/account');await expect(member.getByRole('status')).toHaveText('Account ready.');
  const own=member.locator('#panels section').filter({has:member.getByRole('heading',{name:'First Chambers',exact:true})});
  await expect(own.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(0);await expect(own.getByRole('link',{name:'Manage this organisation'})).toHaveCount(0);
  await page.locator('.admin-sections [data-admin-nav="governance"]').click();await page.locator('form[data-command="status"]').locator('..').locator('summary').click();form=page.locator('form[data-command="status"]');
  await form.getByLabel('Type organisation name to confirm').fill('First Chambers');await form.getByLabel('Reason for change').fill('Review completed');
  await page.setViewportSize({width:390,height:844});await form.screenshot({path:'.publish/organisation-lifecycle-mobile.png'});
  await form.getByRole('button',{name:'Update organisation status',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('#summary')).toContainText('Active');
  await member.getByRole('button',{name:'Refresh',exact:true}).click();await expect(member.getByRole('status')).toHaveText('Account ready.');await expect(member.locator('#panels .account-app-card').filter({hasText:'First Chambers'}).getByRole('link',{name:'Open Chambers',exact:true})).toBeVisible();
 }finally{await context.close();}
});
test.beforeEach(async()=>{fixture=await startPreview({chambers:true,multi:true});});
test.afterEach(async()=>{await fixture.stop();});
async function login(page,id){expect((await page.request.post(fixture.base+'/api/auth/login',{data:{email:id+'@example.com',password:fixture.password}})).status()).toBe(200);}

test('sign-in survives switching away to copy credentials and clears after success or navigation',async({page})=>{
 for(const route of ['/account','/admin','/super-admin']){
  await page.goto(fixture.base+route);await expect(page.locator('#signin')).toBeVisible();
  const form=page.locator('#admin-login');
  await form.getByLabel('Account email').fill('super@example.com');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(form.getByLabel('Account email')).toHaveValue('super@example.com');
  await form.getByLabel('Password',{exact:true}).fill(fixture.password);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(form.getByLabel('Account email')).toHaveValue('super@example.com');
  await expect(form.getByLabel('Password',{exact:true})).toHaveValue(fixture.password);
  await form.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Workspace ready.');
  await expect(page.locator('#admin-login [name="password"]')).toHaveValue('');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.locator('#admin-login [name="email"]').fill('unfinished@example.com');
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await expect(page.locator('#admin-login [name="email"]')).toHaveValue('');
 }
});
test('account separates two memberships, scoped app links and primary administration',async({page})=>{
 await login(page,'master');await page.goto(fixture.base+'/account');await expect(page.getByRole('status')).toHaveText('Account ready.');
 await expect(page.locator('#panels section')).toHaveCount(2);await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(2);
 await expect(page.getByRole('link',{name:'Manage this organisation'})).toHaveCount(1);
 expect(await page.getByRole('link',{name:'Manage this organisation'}).getAttribute('href')).toBe('/admin?organisation='+fixture.organisationId);
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await setTheme(page,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});await setTheme(page,'light');await page.screenshot({path:'.publish/organisation-account-mobile.png',fullPage:true});
 await page.getByRole('link',{name:'Manage this organisation'}).click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.locator('#organisation')).toHaveValue(fixture.organisationId);
 await page.goto(fixture.base+'/admin?organisation='+fixture.otherOrganisationId);await expect(page.getByRole('status')).toContainText('unavailable');await expect(page.locator('#workspace')).toBeHidden();
 await page.goto(fixture.base+'/account');await expect(page.getByRole('status')).toHaveText('Account ready.');
 await page.getByRole('link',{name:'Open Chambers',exact:true}).last().click();await expect(page).toHaveURL(new RegExp('/advocate\\?organisation='+fixture.otherOrganisationId));
});
test('account presents each private product and organisation context separately',async({page})=>{
 await login(page,'master');
 const apps=[
  {id:'advocate',name:'Chambers'},
  {id:'tournament-lite',name:'Tournament Lite'},
  {id:'batchfee-lite',name:'BatchFee Lite'},
  {id:'digital-samaj',name:'DIGITAL SAMAJ'},
  {id:'pandit-booking',name:'Pandit Booking'},
  {id:'curio',name:'Curio',public:true}
 ];
 const membership=(id,name,role,administration,appData,clientPortal=null)=>({id,name,status:'Active',role,membershipStatus:'Active',administration,clientAccessManagement:false,clientPortal,apps:appData});
 const staff=[
  {id:'advocate',name:'Chambers',assigned:true,role:'Owner',available:true,mode:'full',reason:null},
  {id:'tournament-lite',name:'Tournament Lite',assigned:false,role:null,available:false,mode:null,reason:'missing-assignment'},
  {id:'batchfee-lite',name:'BatchFee Lite',assigned:true,role:'Viewer',available:true,mode:'read-only',reason:null},
  {id:'digital-samaj',name:'DIGITAL SAMAJ',assigned:true,role:'Member',available:false,mode:null,reason:'community-grant-required'},
  {id:'pandit-booking',name:'Pandit Booking',assigned:false,role:null,available:false,mode:null,reason:'missing-assignment'}
 ];
 const client=[
  {id:'advocate',name:'Chambers',assigned:false,role:null,available:false,mode:null,reason:'client-portal-unavailable'},
  {id:'pandit-booking',name:'Pandit Booking',assigned:true,role:'Customer',available:true,mode:'full',reason:null}
 ];
 await page.route('**/api/organisation-admin/account',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
  identity:{name:'Master Admin',email:'master@example.com'},superAdmin:false,apps,assignmentApps:apps.map(app=>app.id),
  memberships:[membership('org-one','One Organisation','MasterAdmin',true,staff),membership('org-two','Second Organisation','Client',false,client,'Available')]
 })}));
 await page.goto(fixture.base+'/account');await expect(page.getByRole('status')).toHaveText('Account ready.');
 const cards=page.locator('.account-app-card');await expect(cards).toHaveCount(7);
 await expect(cards.filter({has:page.getByRole('heading',{name:'Chambers',exact:true})})).toHaveCount(1);
 await expect(cards.filter({has:page.getByRole('heading',{name:'Chambers client portal',exact:true})})).toContainText('Organisation: Second Organisation');
 await expect(cards.filter({has:page.getByRole('heading',{name:'BatchFee Lite',exact:true})})).toContainText('Read-only access');
 await expect(cards.filter({has:page.getByRole('heading',{name:'DIGITAL SAMAJ',exact:true})})).toContainText('Community permission required');
 const tournament=cards.filter({has:page.getByRole('heading',{name:'Tournament Lite',exact:true})});
 await expect(tournament).toContainText('No app role assigned');await expect(tournament.getByRole('link',{name:/Open Tournament Lite/})).toHaveCount(0);
 const panditCustomer=cards.filter({has:page.getByRole('heading',{name:'Pandit Booking',exact:true})}).filter({hasText:'Organisation: Second Organisation'});
 await expect(panditCustomer).toContainText('Customer');await expect(panditCustomer.getByRole('link',{name:/Open Pandit Booking/})).toHaveAttribute('href','/pandit-booking?organisation=org-two');
 await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toHaveAttribute('href','/advocate?organisation=org-one');
 await expect(page.getByRole('link',{name:'Open Chambers client portal',exact:true})).toHaveAttribute('href','/client-portal?organisation=org-two');
 await expect(page.getByRole('link',{name:'Manage this organisation'})).toHaveAttribute('href','/admin?organisation=org-one');
 await expect(page.locator('.account-organisation-section')).toContainText('Organisation membership and staff/client seat limits are shared');
 expect(await page.locator('.account-app-card h3').allTextContents()).not.toContain('Curio');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark','deep']){
  await page.setViewportSize({width,height:900});await setTheme(page,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('account sign-in, client portal and Super Admin navigation stay distinct',async({page})=>{
 await page.goto(fixture.base+'/account');await expect(page.locator('#signin')).toBeVisible();
 const signin=page.locator('#admin-login');await signin.getByLabel('Account email').fill('client@example.com');await signin.getByLabel('Password',{exact:true}).fill(fixture.password);await signin.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Account ready.');await expect(page.locator('#panels')).toContainText('No organisation memberships');
 const cookie=await fixture.login('master'),org=fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId;
 const view=await(await fetch(org,{headers:{Cookie:cookie}})).json();
 const invited=await(await fetch(org+'/invite',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({email:'client@example.com',role:'Client',version:view.organisation.version,reason:'Client navigation check'})})).json();
 await page.locator('#accept [name="token"]').fill(invited.invitation.token);await page.getByRole('button',{name:'Accept invitation',exact:true}).click();
 await expect(page.locator('#panels')).toContainText('Client portal approval required');await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await login(page,'super');await page.goto(fixture.base+'/account');await expect(page.getByRole('status')).toHaveText('Account ready.');
 await expect(page.getByRole('link',{name:'Open Super Admin'})).toBeVisible();await expect(page.locator('#panels')).toContainText('No organisation memberships');
});
test('account refresh removes app links after assignment revocation',async({page})=>{
 await login(page,'member');await page.goto(fixture.base+'/account');await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toBeVisible();
 const cookie=await fixture.login('master'),org=fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId;
 const view=await(await fetch(org,{headers:{Cookie:cookie}})).json();
 expect((await fetch(org+'/assignment',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({userId:'member',role:'Clerk',status:'Inactive',version:view.organisation.version,reason:'Revoke app access'})})).status).toBe(200);
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(0);await expect(page.locator('#panels')).toContainText('App assignment inactive');
 await expect(page.getByRole('link',{name:'Manage this organisation'})).toHaveCount(0);
});

test('app role choices come from the server and match the selected member without removing revocation',async({page})=>{
 const {assignmentRoles}=await import('../../../packages/auth/app-roles.mjs');
 await login(page,'master');
 const indexResponse=await page.request.get(fixture.base+'/api/organisation-admin');expect(indexResponse.status()).toBe(200);const index=await indexResponse.json();index.assignmentApps=['advocate','batchfee-lite','pandit-booking'];index.apps=index.assignmentApps.map(id=>({id,name:id,roles:assignmentRoles(id)}));
 const viewResponse=await page.request.get(fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId);expect(viewResponse.status()).toBe(200);const view=await viewResponse.json();view.members.push({userId:'demo-client',name:'Demo Client',email:'demo-client@example.test',role:'Client',status:'Active',active:1});view.assignments.push({userId:'demo-client',appId:'pandit-booking',role:'Reviewer',status:'Active'});
 await page.route('**/api/organisation-admin',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(index)}));
 await page.route('**/api/organisation-admin/organisations/'+fixture.organisationId,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(view)}));
 await page.goto(fixture.base+'/admin?organisation='+fixture.organisationId);await expect(page.getByRole('status')).toHaveText('Workspace ready.');
 await page.locator('.admin-sections [data-admin-nav="apps"]').click();
 const form=page.locator('form[data-command="assignment"]');await form.locator('..').locator('summary').click();
 await form.locator('[name=userId]').selectOption('master');await form.locator('[name=appId]').selectOption('batchfee-lite');
 await expect(form.locator('[name=role] option')).toHaveText(['Viewer','Collector','Manager','Owner']);
 await form.locator('[name=role]').selectOption('Collector');await expect(form.locator('#assignment-role-help')).toHaveText('View academy records and record fee payments.');
 await form.locator('[name=userId]').selectOption('demo-client');await expect(form.locator('[name=role]')).toHaveValue('');
 expect(await form.locator('[name=role]').evaluate(el=>el.checkValidity())).toBe(false);
 await form.locator('[name=appId]').selectOption('pandit-booking');await expect(form.locator('[name=role] option')).toHaveText(['Customer']);
 await form.locator('[name=status]').selectOption('Inactive');await expect(form.locator('[name=role] option')).toHaveText(['Customer','Reviewer']);await expect(form.locator('[name=role]')).toHaveValue('Reviewer');
 await form.locator('[name=status]').selectOption('Active');await expect(form.locator('[name=role] option')).toHaveText(['Customer']);
 await form.locator('[name=userId]').selectOption('master');await expect(form.locator('[name=role] option')).toHaveText(['Pandit','Dispatcher','Reviewer','Owner']);
 for(const width of [320,390,768,1440])for(const theme of ['light','dark','deep']){await page.setViewportSize({width,height:900});await setTheme(page,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await setTheme(page,'dark');await form.scrollIntoViewIfNeeded();await page.screenshot({path:'.publish/role-simplification-mobile.png',fullPage:true});
});

test('a delayed account response cannot restore membership data after sign-in expires',async({page})=>{
 await login(page,'member');await page.goto(fixture.base+'/account');await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toBeVisible();
 let release,arrived;const waiting=new Promise(resolve=>arrived=resolve),gate=new Promise(resolve=>release=resolve);
 let first=true;
 await page.route('**/api/organisation-admin/account',async route=>{
  if(!first)return route.continue();first=false;const response=await route.fetch();arrived();await gate;await route.fulfill({response});
 });
 await page.getByRole('button',{name:'Refresh',exact:true}).click();await waiting;
 expect((await page.request.post(fixture.base+'/api/auth/logout',{data:{}})).status()).toBe(200);
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.getByRole('status')).toHaveText('Session expired. Sign in again.');
 const completed=page.waitForResponse(response=>response.url().endsWith('/api/organisation-admin/account')&&response.status()===200);
 release();await completed;await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await expect(page.locator('#workspace')).toBeHidden();await expect(page.locator('#panels')).toBeEmpty();await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(0);
});
