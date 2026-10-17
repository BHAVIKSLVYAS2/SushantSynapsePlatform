const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module'),{scryptSync}=require('node:crypto');
const toolsRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare,convertV4MiniflareOptions}=toolsRequire('miniflare');
const {statements}=require('../infrastructure/cloudflare/sql-statements.cjs');
const origin='http://localhost',password='Isolated organisation D1 password!';
test('production D1 organisations enforce provisioning, atomic capacity, tenant records and role revocation',async t=>{
 const bundled=await require('esbuild').build({stdin:{contents:"export {default} from './infrastructure/cloudflare/fullstack-worker.mjs';",resolveDir:process.cwd()},bundle:true,write:false,banner:{js:"import {createRequire} from 'node:module'; const require=createRequire('/worker.js');"},format:'esm',platform:'neutral',external:['node:*'],conditions:['workerd','worker','browser']});
 const assets=require('../apps/admin/backend/preview-assets.cjs'),manifest=require('../infrastructure/cloudflare/organisation-pages.json'),publicAssets=require('../server/static-assets').staticAssets,publicPages=require('../infrastructure/cloudflare/pages.json');
 const assetFetch=async request=>{const p=new URL(request.url).pathname,orgEntry=Object.entries(manifest).find(([,target])=>target===p),publicEntry=Object.entries(publicPages).find(([,target])=>target===p);const source=orgEntry?assets[orgEntry[0]]:publicEntry?publicAssets[publicEntry[0]]:publicAssets[p];if(!source)return new Response('Not found',{status:404});if(/\.(png|ico|woff2?)$/.test(source))return new Response(fs.readFileSync(source),{headers:{'Content-Type':source.endsWith('.png')?'image/png':'application/octet-stream'}});let text=fs.readFileSync(source,'utf8');if(orgEntry&&source.endsWith('.html'))text=text.replace('<html lang="en">','<html lang="en" data-runtime="cloud">').replace(/Local preview[^<]*/g,'Organisation workspace');return new Response(text,{headers:{'Content-Type':source.endsWith('.html')?'text/html':source.endsWith('.css')?'text/css':'text/javascript'}});};
 const worker={name:'organisation-d1',modules:true,...(process.env.SYNAPSE_ORGANISATION_BUNDLE?{scriptPath:path.resolve(process.env.SYNAPSE_ORGANISATION_BUNDLE)}:{script:bundled.outputFiles[0].text}),compatibilityDate:'2026-10-01',compatibilityFlags:['nodejs_compat'],d1Databases:{PLATFORM_DB:'isolated-organisations'},bindings:{PUBLIC_ORIGIN:origin,FREE_MODE:'true',FULL_APPS:'true',AUTH_METHOD:'password',ORGANISATIONS_ENABLED:'true'},serviceBindings:{ASSETS:assetFetch},ratelimits:{AUTH_LIMITER:{namespace_id:'73',simple:{limit:10000,period:60}}}};
 const options={workers:[worker]},mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const db=await mf.getD1Database('PLATFORM_DB');
 for(const sql of statements(require('../infrastructure/cloudflare/build-d1.cjs').schema()))await db.prepare(sql).run();
 for(const file of ['0002-free-guards.sql','0003-document-blobs.sql','0004-samaj-blobs.sql','0005-organisations.sql'])for(const sql of statements(fs.readFileSync(path.join('infrastructure/cloudflare/d1-free-migrations',file),'utf8')))await db.prepare(sql).run();
 const salt='0123456789abcdef0123456789abcdef',hash=salt+':'+scryptSync(password,salt,64).toString('hex');
 for(const id of ['super','master','other','member','client'])await db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').bind(id,id,id+'@example.test','Clerk',hash).run();
 await db.prepare('INSERT INTO platform_super_admins VALUES(?,1,?)').bind('super',Date.now()).run();
 const cookies={};
 const api=async(route,{actor='super',method='GET',body,cookie,headers={}}={})=>{
  const response=await mf.dispatchFetch(origin+'/api/'+route,{method,headers:{Cookie:cookie??cookies[actor]??'',...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
  const data=response.headers.get('content-type')?.includes('json')?await response.json():Buffer.from(await response.arrayBuffer());return {response,status:response.status,data};
 };
 for(const id of ['super','master','other','member','client']){const r=await api('auth/login',{method:'POST',body:{email:id+'@example.test',password}});assert.equal(r.status,200,JSON.stringify(r.data));cookies[id]=r.response.headers.get('set-cookie').split(';')[0];}
 const licence={appId:'advocate',status:'Active',startsAt:'2020-01-01T00:00:00.000Z',endsAt:'2099-01-01T00:00:00.000Z',readOnlyUntil:null,staffLimit:4,clientLimit:1};
 const createOrg=async(name,actor)=>{const r=await api('organisation-admin/provision',{method:'POST',body:{name,type:'Legal',timezone:'Asia/Kolkata',masterAdminEmail:actor+'@example.test',staffLimit:3,clientLimit:1,licences:[licence]}});assert.equal(r.status,201,JSON.stringify(r.data));assert.equal((await api('organisation-admin/accept',{actor,method:'POST',body:{primary:true,token:r.data.invitation.token}})).status,200);return r.data.organisationId;};
 const first=await createOrg('First D1 Chambers','master'),second=await createOrg('Other D1 Chambers','other');
 const admin=org=>'organisation-admin/organisations/'+org;
 const view=async org=>(await api(admin(org))).data;
 const change=async(org,command,body,actor='super')=>api(admin(org)+'/'+command,{actor,method:'POST',body:{version:(await view(org)).organisation.version,reason:'D1 isolated verification',...body}});
 for(const [org,actor]of [[first,'master'],[second,'other']]){const r=await change(org,'assignment',{userId:actor,role:'Owner',status:'Active'});assert.equal(r.status,200,JSON.stringify(r.data));}
 const create=async(org,actor,kind,body)=>{const r=await api(`chambers/${org}/${kind}`,{actor,method:'POST',body});assert.equal(r.status,201,JSON.stringify(r.data));return r.data;};
 const client=await create(first,'master','clients',{name:'First D1 private client'}),other=await create(second,'other','clients',{name:'Other D1 private client'});
 const matter=await create(first,'master','cases',{title:'Private D1 matter',clientId:client.id,court:'Delhi',cnr:'DLCT010000012026'});
 const document=await create(first,'master','documents',{name:'Private D1 document',caseId:matter.id,originalName:'bytes.bin',content:Buffer.from([0,127,255]).toString('base64')});
 const download=await api(`chambers/${first}/documents/${document.id}/download`,{actor:'master'});assert.equal(download.status,200);assert.deepEqual(download.data,Buffer.from([0,127,255]));
 const state=await api(`chambers/${first}/state`,{actor:'master'});assert.equal(state.status,200);assert.equal(state.data.organisation.id,first);assert.equal(state.data.clients.some(c=>c.id===other.id),false);
 for(const actor of ['super','other','client'])assert.equal((await api(`chambers/${first}/state`,{actor})).status,403);
 assert.equal((await api(`chambers/${second}/documents/${document.id}/download`,{actor:'other'})).status,404);
 for(const route of ['state','users','auth/setup','digital-samaj/state'])assert.equal((await api(route)).status,409,route);
 assert.equal((await api(admin(first),{actor:'other'})).status,403);
 assert.equal((await api('organisation-admin/platform-audit',{actor:'master'})).status,403);
 assert.equal((await api('backup.sql')).status,503);
 const invitation=await change(first,'invite',{email:'member@example.test',role:'Staff'},'master');assert.equal(invitation.status,201,JSON.stringify(invitation.data));assert.equal((await api('organisation-admin/accept',{actor:'member',method:'POST',body:{primary:false,token:invitation.data.invitation.token}})).status,200);
 assert.equal((await change(first,'assignment',{userId:'member',role:'Clerk',status:'Active'},'master')).status,200);
 assert.equal((await api(`chambers/${first}/state`,{actor:'member'})).status,200);
 assert.equal((await change(first,'member',{userId:'member',role:'Staff',status:'Inactive'},'master')).status,200);
 assert.equal((await api(`chambers/${first}/state`,{actor:'member'})).status,403);
 assert.equal((await api('organisation-admin/account',{actor:'master'})).data.memberships[0].apps[0].available,true);
 const invitedClient=await change(first,'invite',{email:'client@example.test',role:'Client'},'master');assert.equal(invitedClient.status,201);
 assert.equal((await api('organisation-admin/accept',{actor:'client',method:'POST',body:{primary:false,token:invitedClient.data.invitation.token}})).status,200);
 const clientCommand=async(command,fields)=>api(`chambers/${first}/${command}`,{actor:'master',method:'POST',body:{userId:'client',version:(await view(first)).organisation.version,reason:'Explicit D1 client release',status:'Active',...fields}});
 const link=await clientCommand('client-access',{clientId:client.id});assert.equal(link.status,200,JSON.stringify(link.data));
 const entitlement=await clientCommand('client-entitlement',{});assert.equal(entitlement.status,200,JSON.stringify(entitlement.data));
 const portal=await api('client-portal/'+first,{actor:'client'});assert.equal(portal.status,200,JSON.stringify(portal.data));assert.equal(portal.data.clients[0].id,client.id);assert.equal(JSON.stringify(portal.data).includes('Private D1 matter'),false);
 const clientAccount=await api('organisation-admin/account',{actor:'client'});assert.equal(clientAccount.data.memberships.find(m=>m.id===first).clientPortal,'Available');
 const newMember=await change(first,'invite',{newAccount:true,email:'new-member@example.test',role:'Staff'},'master');assert.equal(newMember.status,201,JSON.stringify(newMember.data));
 const activatedMember=await api('organisation-admin/activate-new-member',{cookie:'',method:'POST',body:{token:newMember.data.invitation.token,email:'new-member@example.test',name:'New D1 member',password}});assert.equal(activatedMember.status,200,JSON.stringify(activatedMember.data));
 const invoice=await create(first,'master','invoices',{clientId:client.id,caseId:matter.id,description:'Fees',amount:100,date:'2020-01-01',due:'2020-01-01'});
 const payments=await Promise.all([60,60].map(amount=>api(`chambers/${first}/payments`,{actor:'master',method:'POST',body:{invoiceId:invoice.id,amount,date:'2020-01-02'}})));
 assert.equal(payments.filter(r=>r.status===201).length,1);assert.ok(payments.some(r=>[400,409].includes(r.status)));
 const hearing=await create(first,'master','hearings',{caseId:matter.id,date:'2027-01-01',time:'10:00',purpose:'Evidence'});
 const before=(await api(`chambers/${first}/state`,{actor:'master'})).data.hearings.length;
 assert.equal((await api(`chambers/${first}/hearings/${hearing.id}/outcome`,{actor:'master',method:'POST',body:{version:hearing.version,status:'Adjourned',outcome:'Invalid next date',nextDate:'2026-01-01',nextTime:'10:00',nextPurpose:'Evidence'}})).status,400);
 assert.equal((await api(`chambers/${first}/state`,{actor:'master'})).data.hearings.length,before);
 const newOrg=await api('organisation-admin/provision',{method:'POST',body:{newAccount:true,name:'New identity D1',type:'Legal',timezone:'Asia/Kolkata',masterAdminEmail:'new-master@example.test',staffLimit:2,clientLimit:0,licences:[licence]}});assert.equal(newOrg.status,201,JSON.stringify(newOrg.data));
 const activated=await api('organisation-admin/activate-new-master',{cookie:'',method:'POST',body:{token:newOrg.data.invitation.token,email:'new-master@example.test',name:'New D1 Master',password}});assert.equal(activated.status,200,JSON.stringify(activated.data));
 const badLicence=await api('organisation-admin/provision',{method:'POST',body:{name:'Unsupported app',type:'Legal',masterAdminEmail:'client@example.test',staffLimit:2,clientLimit:0,licences:[{...licence,appId:'batchfee-lite'}]}});assert.equal(badLicence.status,400);
 const current=(await view(first)).organisation.licences[0];assert.equal((await change(first,'licence',{...licence,status:'Suspended',licenceVersion:current.version})).status,200);
 assert.equal((await api(`chambers/${first}/state`,{actor:'master'})).status,403);
 assert.equal((await api(`chambers/${second}/state`,{actor:'other'})).status,200);
 assert.equal((await api('organisation-admin/account',{actor:'master'})).data.memberships[0].apps[0].available,false);
 assert.equal((await api('organisation-admin',{headers:{Origin:'https://foreign.test'}})).status,403);
 const integrity=await db.prepare('PRAGMA foreign_key_check').all();assert.equal(integrity.results.length,0);
 await t.test('D1 Super Admin browser signs in, provisions an organisation and supports mobile themes',async()=>{
  const normalEntry=await mf.dispatchFetch(origin+'/signin',{redirect:'manual'});assert.equal(normalEntry.status,302);assert.equal(normalEntry.headers.get('location'),origin+'/account');
  const {chromium,expect}=require('@playwright/test'),browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
   const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://organisation-ui.test/**',async route=>{
    const req=route.request(),url=new URL(req.url()),headers={...req.headers()};if(headers.origin)headers.origin=origin;
    const r=await mf.dispatchFetch(origin+url.pathname+url.search,{method:req.method(),headers,body:['GET','HEAD'].includes(req.method())?undefined:req.postData()});
    await route.fulfill({status:r.status,headers:Object.fromEntries(r.headers),body:Buffer.from(await r.arrayBuffer())});
   });
   // Browser routing starts at the HTTP redirect target; intercepted synthetic
   // hosts cannot follow a fulfilled 302 through the real network.
   await page.goto('https://organisation-ui.test/account');
   await page.locator('#admin-login [name="email"]').fill('super@example.test');await page.locator('#admin-login [name="password"]').fill(password);await page.locator('#admin-login button').click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');
   await expect(page.getByRole('heading',{name:'Super Admin',exact:true})).toBeVisible();await expect(page.locator('form[data-command="recovery-export"]')).toHaveCount(0);
   const form=page.locator('form[data-command="provision"]');await form.locator('..').locator('summary').click();
   await form.getByLabel('Organisation name',{exact:true}).fill('Browser D1 Chambers');await form.getByLabel('Master Admin account email').fill('client@example.test');await form.getByLabel('Reason for change').fill('D1 browser verification');await form.getByRole('button',{name:'Create organisation',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Change saved.');await expect(page.locator('#summary')).toContainText('Browser D1 Chambers');await expect(page.locator('#secret')).toHaveValue(/^[a-f0-9]{64}$/);
   await page.getByRole('button',{name:'Clear secret'}).click();await expect(page.locator('#secret')).toHaveValue('');
   for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
   await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption('light');await page.screenshot({path:'.publish/organisation-d1-superadmin-mobile.png',fullPage:true});
   await page.goto('https://organisation-ui.test/account');await expect(page.getByRole('status')).toHaveText('Account ready.');await page.locator('#admin-signout').click();await expect(page.getByRole('status')).toHaveText('Please sign in');
   await page.locator('#admin-login [name="email"]').fill('other@example.test');await page.locator('#admin-login [name="password"]').fill(password);await page.locator('#admin-login button').click();await expect(page.getByRole('status')).toHaveText('Account ready.');
   await page.getByRole('link',{name:'Open Chambers',exact:true}).click();await expect(page.getByRole('heading',{name:'Chambers overview',exact:true})).toBeVisible();
   await page.goto('https://organisation-ui.test/advocate?organisation='+second+'#clients');await expect(page.getByRole('button',{name:'Other D1 private client',exact:true})).toBeVisible();await expect(page.locator('#app')).not.toContainText('First D1 private client');
   await page.goto('https://organisation-ui.test/advocate?organisation='+second+'#settings');await expect(page.getByRole('link',{name:'Download organisation backup',exact:true})).toHaveCount(0);
   await page.goto('https://organisation-ui.test/super-admin');await expect(page.getByRole('status')).toContainText('Super Admin access is required');await expect(page.locator('#workspace')).toBeHidden();await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect(page.locator('#admin-login')).toBeVisible();
   await page.locator('#admin-login [name="email"]').fill('super@example.test');await page.locator('#admin-login [name="password"]').fill(password);await page.locator('#admin-login button').click();await expect(page.getByRole('status')).toHaveText('Workspace ready.');await expect(page.getByRole('heading',{name:'Super Admin',exact:true})).toBeVisible();assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 });
});
