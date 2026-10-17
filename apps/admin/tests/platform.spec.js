const {test,expect}=require('@playwright/test');
const {startPreview}=require('../../../tests/organisation-preview-fixture.cjs');
let fixture;

test('platform audit is Super Admin only and clears on expiry',async({page})=>{
 await login(page,'master');await page.goto(fixture.base+'/platform-audit');await expect(page.getByRole('status')).toHaveText('Super Admin required');await expect(page.locator('#workspace')).toBeEmpty();
 await login(page,'super');await page.goto(fixture.base+'/super-admin');await page.getByRole('link',{name:'Review platform audit',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Audit ready.');
 await expect(page.locator('#workspace')).toContainText('Platform-wide events');
 await page.getByRole('combobox',{name:'Action',exact:true}).selectOption('PlatformRecoveryExportCreated');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.locator('#workspace')).toContainText('No matching events.');
 const exported=await page.request.post(fixture.base+'/api/organisation-admin/recovery-export',{data:{password:fixture.password,confirmation:'EXPORT ALL ORGANISATIONS',reason:'Browser recovery audit review'}});expect(exported.status()).toBe(200);
 await page.getByRole('button',{name:'Refresh latest',exact:true}).click();await expect(page.locator('#workspace')).toContainText('Platform Recovery Export Created');await expect(page.locator('#workspace')).toContainText('Browser recovery audit review');await expect(page.locator('#workspace')).toContainText('Includes account hashes');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('light');await page.screenshot({path:'.publish/platform-audit-mobile.png',fullPage:true});
 await page.request.post(fixture.base+'/api/auth/logout',{data:{}});await page.getByRole('button',{name:'Refresh latest',exact:true}).click();await expect(page.getByRole('status')).toContainText('Session expired');await expect(page.locator('#workspace')).toBeEmpty();
});

test('organisation audit supports scoped pagination, action filtering and mobile themes',async({page})=>{
 const cookie=await fixture.login('super'),endpoint=fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId;
 let version=(await(await fetch(endpoint,{headers:{Cookie:cookie}})).json()).organisation.version;
 for(let i=0;i<25;i++){
  const response=await fetch(endpoint+'/limits',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({version,staffLimit:5,clientLimit:2,reason:'Audit review '+i})});expect(response.status).toBe(200);version=(await response.json()).version;
 }
 await login(page,'master');await page.goto(fixture.base+'/admin');await page.getByRole('link',{name:'Review organisation audit',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Audit ready.');
 await page.getByRole('combobox',{name:'Action',exact:true}).selectOption('OrganisationLimitsUpdated');await page.getByRole('button',{name:'Apply filter',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Audit ready.');await expect(page.locator('#workspace article')).toHaveCount(20);
 await page.getByRole('button',{name:'Older events',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Audit ready.');await expect(page.locator('#workspace article')).toHaveCount(5);await expect(page.getByRole('button',{name:'Older events',exact:true})).toBeHidden();
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('light');await page.screenshot({path:'.publish/organisation-audit-mobile.png',fullPage:true});
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
 await page.locator('form[data-command="status"]').locator('..').locator('summary').click();
 let form=page.locator('form[data-command="status"]');
 await form.getByLabel('Type organisation name to confirm').fill('Wrong organisation');await form.getByLabel('Reason for change').fill('Suspend pending review');
 await form.getByRole('button',{name:'Update organisation status',exact:true}).click();await expect(page.getByRole('status')).toContainText('Type the organisation name exactly');
 await form.getByLabel('Type organisation name to confirm').fill('First Chambers');
 await form.getByRole('button',{name:'Update organisation status',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('#summary')).toContainText('Suspended');
 const context=await browser.newContext();
 try{
  const member=await context.newPage();await login(member,'master');await member.goto(fixture.base+'/account');await expect(member.getByRole('status')).toHaveText('Account ready.');
  const own=member.locator('#panels section').filter({has:member.getByRole('heading',{name:'First Chambers',exact:true})});
  await expect(own.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(0);await expect(own.getByRole('link',{name:'Manage this organisation'})).toHaveCount(0);
  await page.locator('form[data-command="status"]').locator('..').locator('summary').click();form=page.locator('form[data-command="status"]');
  await form.getByLabel('Type organisation name to confirm').fill('First Chambers');await form.getByLabel('Reason for change').fill('Review completed');
  await page.setViewportSize({width:390,height:844});await form.screenshot({path:'.publish/organisation-lifecycle-mobile.png'});
  await form.getByRole('button',{name:'Update organisation status',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('#summary')).toContainText('Active');
  await member.getByRole('button',{name:'Refresh',exact:true}).click();await expect(member.getByRole('status')).toHaveText('Account ready.');await expect(own.getByRole('link',{name:'Open Chambers',exact:true})).toBeVisible();
 }finally{await context.close();}
});
test.beforeEach(async()=>{fixture=await startPreview({chambers:true,multi:true});});
test.afterEach(async()=>{await fixture.stop();});
async function login(page,id){expect((await page.request.post(fixture.base+'/api/auth/login',{data:{email:id+'@example.com',password:fixture.password}})).status()).toBe(200);}
test('account separates two memberships, scoped app links and primary administration',async({page})=>{
 await login(page,'master');await page.goto(fixture.base+'/account');await expect(page.getByRole('status')).toHaveText('Account ready.');
 await expect(page.locator('#panels section')).toHaveCount(2);await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(2);
 await expect(page.getByRole('link',{name:'Manage this organisation'})).toHaveCount(1);
 expect(await page.getByRole('link',{name:'Manage this organisation'}).getAttribute('href')).toBe('/admin?organisation='+fixture.organisationId);
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('light');await page.screenshot({path:'.publish/organisation-account-mobile.png',fullPage:true});
 await page.getByRole('link',{name:'Manage this organisation'}).click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.locator('#organisation')).toHaveValue(fixture.organisationId);
 await page.goto(fixture.base+'/admin?organisation='+fixture.otherOrganisationId);await expect(page.getByRole('status')).toContainText('unavailable');await expect(page.locator('#workspace')).toBeHidden();
 await page.goto(fixture.base+'/account');await expect(page.getByRole('status')).toHaveText('Account ready.');
 await page.getByRole('link',{name:'Open Chambers',exact:true}).last().click();await expect(page).toHaveURL(new RegExp('/advocate\\?organisation='+fixture.otherOrganisationId));
});
test('account sign-in, client portal and Super Admin navigation stay distinct',async({page})=>{
 await page.goto(fixture.base+'/account');await expect(page.locator('#signin')).toBeVisible();
 const signin=page.locator('#admin-login');await signin.getByLabel('Account email').fill('client@example.com');await signin.getByLabel('Password',{exact:true}).fill(fixture.password);await signin.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Account ready.');await expect(page.locator('#panels')).toContainText('No organisation memberships');
 const cookie=await fixture.login('master'),org=fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId;
 const view=await(await fetch(org,{headers:{Cookie:cookie}})).json();
 const invited=await(await fetch(org+'/invite',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({email:'client@example.com',role:'Client',version:view.organisation.version,reason:'Client navigation check'})})).json();
 await page.locator('#accept [name="token"]').fill(invited.invitation.token);await page.getByRole('button',{name:'Accept invitation',exact:true}).click();
 await expect(page.locator('#panels')).toContainText('Client portal unavailable');await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await login(page,'super');await page.goto(fixture.base+'/account');await expect(page.getByRole('status')).toHaveText('Account ready.');
 await expect(page.getByRole('link',{name:'Open Super Admin'})).toBeVisible();await expect(page.locator('#panels')).toContainText('No organisation memberships');
});
test('account refresh removes app links after assignment revocation',async({page})=>{
 await login(page,'member');await page.goto(fixture.base+'/account');await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toBeVisible();
 const cookie=await fixture.login('master'),org=fixture.base+'/api/organisation-admin/organisations/'+fixture.organisationId;
 const view=await(await fetch(org,{headers:{Cookie:cookie}})).json();
 expect((await fetch(org+'/assignment',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({userId:'member',role:'Clerk',status:'Inactive',version:view.organisation.version,reason:'Revoke app access'})})).status).toBe(200);
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.getByRole('link',{name:'Open Chambers',exact:true})).toHaveCount(0);await expect(page.locator('#panels')).toContainText('No app assignment');
 await expect(page.getByRole('link',{name:'Manage this organisation'})).toHaveCount(0);
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
