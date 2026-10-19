const {test,expect}=require('../../../../tests/browser-fixture.js');
const {startPreview}=require('../../../../tests/organisation-preview-fixture.cjs');
let f,cookies,clientId;
const post=(path,body,actor='master')=>fetch(f.base+'/api/'+path,{method:'POST',headers:{Cookie:cookies[actor],'Content-Type':'application/json'},body:JSON.stringify(body)});
const admin=()=>`organisation-admin/organisations/${f.organisationId}`;
const overview=async()=>await(await fetch(f.base+'/api/'+admin(),{headers:{Cookie:cookies.super}})).json();
async function login(page,id='master'){expect((await page.request.post(f.base+'/api/auth/login',{data:{email:id+'@example.com',password:f.password}})).status()).toBe(200);}
test.beforeEach(async()=>{
 f=await startPreview({chambers:true,multi:true});cookies={};for(const id of ['master','super','client','outsider'])cookies[id]=await f.login(id);
 const created=await post(`chambers/${f.organisationId}/clients`,{name:'Private client',notes:'Hidden internal note'});expect(created.status).toBe(201);clientId=(await created.json()).id;
 await post(`chambers/${f.otherOrganisationId}/clients`,{name:'Other private client'},'outsider');
 const v=await overview(),invited=await(await post(admin()+'/invite',{email:'client@example.com',role:'Client',version:v.organisation.version,reason:'Client link UI fixture'})).json();
 expect((await post('organisation-admin/accept',{primary:false,token:invited.invitation.token},'client')).status).toBe(200);
});
test.afterEach(async()=>{await f.stop();});
test('primary Owner grants and revokes scoped links with mobile and theme support',async({page})=>{
 await login(page);await page.goto(f.base+'/account');await page.getByRole('link',{name:'Manage client record links'}).click();await expect(page.getByRole('status')).toHaveText('Links ready.');
 await expect(page.locator('body')).not.toContainText('Hidden internal note');await expect(page.locator('body')).not.toContainText('Other private client');await expect(page.locator('#grant [name="clientId"] option')).toHaveCount(1);
 await page.getByLabel('Reason for grant').fill('Client confirmed ownership');await page.getByRole('button',{name:'Grant link',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Link saved.');await expect(page.locator('article')).toContainText('Link status: Active');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.getByLabel('Theme',{exact:true}).selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.getByLabel('Theme',{exact:true}).selectOption('light');await page.screenshot({path:'.publish/client-links-mobile.png',fullPage:true});
 await page.getByLabel('Reason for revocation').fill('Approval withdrawn');await page.getByRole('button',{name:'Revoke link',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Link saved.');await expect(page.locator('article')).toContainText('Revoked');await expect(page.getByRole('button',{name:'Revoke link',exact:true})).toHaveCount(0);
});
test('stale changes preserve the reason until an explicit refresh',async({page})=>{
 await login(page);await page.goto(f.base+'/client-access?organisation='+f.organisationId);await expect(page.getByRole('status')).toHaveText('Links ready.');await page.getByLabel('Reason for grant').fill('Preserve this reason');
 const v=await overview();expect((await post(admin()+'/limits',{version:v.organisation.version,staffLimit:6,clientLimit:2,reason:'Concurrent update'},'super')).status).toBe(200);
 await page.getByRole('button',{name:'Grant link',exact:true}).click();await expect(page.getByRole('status')).toContainText('Refresh links before retrying');await expect(page.getByLabel('Reason for grant')).toHaveValue('Preserve this reason');
 await page.getByRole('button',{name:'Refresh links',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Links ready.');await expect(page.getByLabel('Reason for grant')).toHaveValue('');
});
test('private links reject Super Admin bypass and grace disables changes',async({page})=>{
 await login(page,'super');await page.goto(f.base+'/client-access?organisation='+f.organisationId);await expect(page.getByRole('status')).toContainText('Chambers staff access');await expect(page.locator('#workspace')).toBeHidden();
 await login(page);await page.goto(f.base+'/client-access?organisation='+f.otherOrganisationId);await expect(page.getByRole('status')).toContainText('Organisation administration unavailable');await expect(page.locator('#workspace')).toBeHidden();
 const v=await overview(),l=v.organisation.licences[0],body=Object.fromEntries(['appId','startsAt','staffLimit','clientLimit'].map(key=>[key,l[key]]));
 expect((await post(admin()+'/licence',{...body,status:'Expired',endsAt:new Date(Date.now()-86400000).toISOString(),readOnlyUntil:new Date(Date.now()+86400000).toISOString(),version:v.organisation.version,licenceVersion:l.version,reason:'Grace controls'},'super')).status).toBe(200);
 await page.goto(f.base+'/client-access?organisation='+f.organisationId);await expect(page.getByRole('status')).toHaveText('Links ready.');await expect(page.locator('#workspace')).toContainText('Read-only licence grace');await expect(page.getByRole('button',{name:'Grant link',exact:true})).toBeDisabled();
});

test('administrator enables a licensed client portal, client sees only approved fields, and revocation clears it',async({page,browser})=>{
 expect((await post(`chambers/${f.organisationId}/cases`,{title:'Secret case title',clientId,court:'Delhi',number:'CASE-1',notes:'Secret case note'})).status).toBe(201);
 await login(page);await page.goto(f.base+'/client-access?organisation='+f.organisationId);await expect(page.getByRole('status')).toHaveText('Links ready.');
 await page.getByLabel('Reason for grant').fill('Client record verified');await page.getByRole('button',{name:'Grant link',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Link saved.');
 await page.getByLabel('Reason for portal access change').fill('Approve read-only case access');await page.getByRole('button',{name:'Save portal access',exact:true}).click();await expect(page.getByRole('status')).toContainText('client seat limit');
 const v=await overview(),l=v.organisation.licences[0],body=Object.fromEntries(['appId','status','startsAt','endsAt','readOnlyUntil','staffLimit'].map(key=>[key,l[key]]));
 expect((await post(admin()+'/licence',{...body,clientLimit:1,version:v.organisation.version,licenceVersion:l.version,reason:'Allocate client seat'},'super')).status).toBe(200);
 await page.getByRole('button',{name:'Refresh links',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Links ready.');
 await page.getByLabel('Reason for portal access change').fill('Approve read-only case access');await page.getByRole('button',{name:'Save portal access',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Portal access saved.');
 const context=await require('../../../../tests/browser-fixture.js').acknowledgedContext(browser);
 try{
  const client=await context.newPage();await login(client,'client');await client.goto(f.base+'/account');await client.getByRole('link',{name:'Open client portal',exact:true}).click();await expect(client.getByRole('status')).toHaveText('Portal ready.');
  await expect(client.locator('#workspace')).toContainText('Private client');await expect(client.locator('#workspace')).toContainText('CASE-1');await expect(client.locator('#workspace')).toContainText('Delhi');
  for(const secret of ['Hidden internal note','Other private client','Secret case title','Secret case note'])await expect(client.locator('body')).not.toContainText(secret);
  await expect(client.locator('form')).toHaveCount(0);
  for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await client.setViewportSize({width,height:900});await client.getByLabel('Theme',{exact:true}).selectOption(theme);expect(await client.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await client.setViewportSize({width:390,height:844});await client.getByLabel('Theme',{exact:true}).selectOption('light');await client.screenshot({path:'.publish/client-portal-mobile.png',fullPage:true});
  let release,arrived;const gate=new Promise(resolve=>release=resolve),waiting=new Promise(resolve=>arrived=resolve);let first=true;
  await client.route('**/api/client-portal/*',async route=>{if(!first)return route.continue();first=false;const response=await route.fetch();arrived();await gate;await route.fulfill({response});});
  await client.getByRole('button',{name:'Refresh portal',exact:true}).click();await waiting;
  await page.getByRole('combobox',{name:'Portal access',exact:true}).selectOption('Inactive');await page.getByLabel('Reason for portal access change').fill('Withdraw portal access');await page.getByRole('button',{name:'Save portal access',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Portal access saved.');
  await client.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect(client.getByRole('status')).toContainText('unavailable');
  const completed=client.waitForResponse(response=>response.url().includes('/api/client-portal/')&&response.status()===200);release();await completed;await client.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await expect(client.locator('#workspace')).toBeEmpty();await expect(client.locator('body')).not.toContainText('CASE-1');
 }finally{await context.close();}
});

for(const actor of ['master','client'])test(`${actor} changes only their password and expired sessions can sign in again`,async({page,browser})=>{
 await login(page,actor);await page.goto(f.base+'/account');await expect(page.getByRole('status')).toHaveText('Account ready.');
 const context=await require('../../../../tests/browser-fixture.js').acknowledgedContext(browser);
 try{
  const other=await context.newPage();await login(other,actor);await other.goto(f.base+'/account');await expect(other.getByRole('status')).toHaveText('Account ready.');
  await page.locator('#account-security summary').click();const form=page.locator('#own-password');
  if(actor==='client'){
   for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
   await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('light');await page.locator('#account-security').screenshot({path:'.publish/account-password-mobile.png'});
  }
  await form.getByLabel('Current password',{exact:true}).fill('Incorrect current password!');await form.getByLabel('New password',{exact:true}).fill('New account password 2026!');await form.getByLabel('Confirm new password',{exact:true}).fill('New account password 2026!');
  await form.getByRole('button',{name:'Change password',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Current password is incorrect');
  for(const name of ['currentPassword','newPassword','confirmation'])await expect(form.locator(`[name="${name}"]`)).toHaveValue('');
  await form.getByLabel('Current password',{exact:true}).fill(f.password);await form.getByLabel('New password',{exact:true}).fill('New account password 2026!');await form.getByLabel('Confirm new password',{exact:true}).fill('Another account password 2026!');
  await form.getByRole('button',{name:'Change password',exact:true}).click();await expect(page.getByRole('status')).toHaveText('New passwords do not match');
  await form.getByLabel('Current password',{exact:true}).fill(f.password);await form.getByLabel('New password',{exact:true}).fill('New account password 2026!');await form.getByLabel('Confirm new password',{exact:true}).fill('New account password 2026!');
  await form.getByRole('button',{name:'Change password',exact:true}).click();await expect(page.getByRole('status')).toContainText('Password changed. Other sessions are signed out');await expect(page.locator('#workspace')).toBeVisible();
  await other.getByRole('button',{name:'Refresh',exact:true}).click();await expect(other.getByRole('status')).toHaveText('Session expired. Sign in again.');await expect(other.locator('#panels')).toBeEmpty();await expect(other.locator('#own-password')).toHaveCount(0);
  const signin=other.locator('#admin-login');await signin.getByLabel('Account email').fill(actor+'@example.com');await signin.getByLabel('Password',{exact:true}).fill('New account password 2026!');await signin.getByRole('button',{name:'Sign in',exact:true}).click();await expect(other.getByRole('status')).toHaveText('Account ready.');
 }finally{await context.close();}
});

test('client selects separate licensed organisations without mixing case data',async({page})=>{
 for(const [org,owner,name,number,recordId]of [[f.organisationId,'master','Private client','CASE-1',clientId],[f.otherOrganisationId,'outsider','Second client','CASE-2',null]]){
  let v=await(await fetch(f.base+'/api/organisation-admin/organisations/'+org,{headers:{Cookie:cookies.super}})).json();
  if(owner==='outsider'){
   const invited=await(await post('organisation-admin/organisations/'+org+'/invite',{email:'client@example.com',role:'Client',version:v.organisation.version,reason:'Second client membership'},owner)).json();expect((await post('organisation-admin/accept',{primary:false,token:invited.invitation.token},'client')).status).toBe(200);
  }
  const id=recordId||(await(await post(`chambers/${org}/clients`,{name},owner)).json()).id;
  expect((await post(`chambers/${org}/cases`,{title:'Internal '+number,court:'Delhi',number,clientId:id},owner)).status).toBe(201);
  v=await(await fetch(f.base+'/api/organisation-admin/organisations/'+org,{headers:{Cookie:cookies.super}})).json();const l=v.organisation.licences[0],fields=Object.fromEntries(['appId','status','startsAt','endsAt','readOnlyUntil','staffLimit'].map(key=>[key,l[key]]));
  expect((await post('organisation-admin/organisations/'+org+'/licence',{...fields,clientLimit:1,version:v.organisation.version,licenceVersion:l.version,reason:'Client seat'},'super')).status).toBe(200);
  for(const [operation,body]of [['client-access',{clientId:id,status:'Active'}],['client-entitlement',{status:'Active'}]]){
   v=await(await fetch(f.base+'/api/organisation-admin/organisations/'+org,{headers:{Cookie:cookies.super}})).json();expect((await post(`chambers/${org}/${operation}`,{...body,userId:'client',version:v.organisation.version,reason:'Explicit client scope'},owner)).status).toBe(200);
  }
 }
 await login(page,'client');
 for(const [org,name,own,hidden]of [[f.organisationId,'First Chambers','CASE-1','CASE-2'],[f.otherOrganisationId,'Other Chambers','CASE-2','CASE-1']]){
  await page.goto(f.base+'/account');await expect(page.getByRole('link',{name:'Open client portal',exact:true})).toHaveCount(2);
  await page.locator('#panels section').filter({has:page.getByRole('heading',{name,exact:true})}).getByRole('link',{name:'Open client portal',exact:true}).click();
  await expect(page).toHaveURL(new RegExp('/client-portal\\?organisation='+org));await expect(page.getByRole('status')).toHaveText('Portal ready.');await expect(page.locator('#workspace')).toContainText(own);await expect(page.locator('#workspace')).not.toContainText(hidden);
 }
 expect((await page.request.post(f.base+'/api/auth/logout',{data:{}})).status()).toBe(200);
 await page.getByRole('button',{name:'Refresh portal',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Session expired. Open My account to sign in again.');await expect(page.locator('#workspace')).toBeEmpty();
 await page.getByRole('link',{name:'My account',exact:true}).click();await expect(page.locator('#signin')).toBeVisible();
});
