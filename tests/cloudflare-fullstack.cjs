const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createRequire}=require('node:module');
const wranglerRequire=createRequire(process.env.SYNAPSE_WRANGLER_PACKAGE||require.resolve('wrangler/package.json'));
const {Miniflare,convertV4MiniflareOptions}=wranglerRequire('miniflare');
const {statements}=require('../infrastructure/cloudflare/sql-statements.cjs');
let mf,db,cookie='',ownerId;
const password='Cloudflare test password 2026!',setupToken='isolated-test-setup-token-abcdefghijklmnopqrstuvwxyz';
const origin='http://localhost',today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
const mime=p=>p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':p.endsWith('.js')||p.endsWith('.mjs')?'text/javascript':p.endsWith('.png')?'image/png':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.json')?'application/json':'text/plain';
async function raw(route,method='GET',body,headers={}){return mf.dispatchFetch(origin+route,{method,headers:{'Content-Type':'application/json',Cookie:cookie,...headers},body:body===undefined?undefined:JSON.stringify(body)});}
async function api(route,method='GET',body,headers={}){const r=await raw('/api/'+route,method,body,headers);return {status:r.status,data:await r.json(),headers:r.headers};}
async function create(kind,body){const r=await api(kind,'POST',body);assert.equal(r.status,201,JSON.stringify(r.data));return r.data;}
before(async()=>{
 const worker={name:'api',modules:true,scriptPath:path.resolve('infrastructure/cloudflare/.publish/fullstack-dryrun/fullstack-worker.js'),compatibilityDate:'2026-10-01',compatibilityFlags:['nodejs_compat'],d1Databases:{PLATFORM_DB:'isolated-platform'},r2Buckets:{PRIVATE_FILES:'isolated-files'},bindings:{PUBLIC_ORIGIN:origin,SETUP_TOKEN:setupToken,ARENA_COOKIE_SECRET:'isolated-arena-secret-abcdefghijklmnopqrstuvwxyz'},ratelimits:Object.fromEntries(['AUTH','SAMAJ','CALENDAR','NEWS','FUND','ARENA'].map((name,i)=>[name+'_LIMITER',{namespace_id:String(i+1),simple:{limit:10000,period:60}}])),serviceBindings:{ASSETS:async request=>{const p=new URL(request.url).pathname,target=path.resolve('infrastructure/cloudflare/dist','.'+p);if(!target.startsWith(path.resolve('infrastructure/cloudflare/dist')+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())return new Response('Not found',{status:404});return new Response(fs.readFileSync(target),{headers:{'Content-Type':mime(p)}});}}};
 const options={workers:[worker]};mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);db=await mf.getD1Database('PLATFORM_DB');await db.batch(statements(fs.readFileSync('infrastructure/cloudflare/d1-migrations/0001-platform.sql','utf8')).map(s=>db.prepare(s)));
});
after(async()=>{await mf?.dispose();});
test('native Worker integration with D1 and private R2',async t=>{
 await t.test('static routes, hidden source, setup protection and host/origin checks',async()=>{
  for(const route of ['/','/advocate','/platform.js','/app.js','/shared/theme.js'])assert.equal((await raw(route)).status,200,route);
  for(const route of ['/server/index.js','/data/chambers.sqlite','/_pages/home.html','/_edge/functionality-ledger.md','/%5Fedge/functionality-ledger.md','/%5Fpages/home.html'])assert.equal((await raw(route)).status,404,route);
  assert.equal((await raw('/','POST',{})).status,405);assert.equal((await raw('/healthz')).status,200);
  assert.equal((await api('state')).status,401);assert.equal((await api('auth/status')).data.setupProtected,true);
  assert.equal((await api('auth/setup','POST',{name:'Owner',email:'owner@example.test',password})).status,403);
  const setup=await api('auth/setup','POST',{name:'Test Owner',email:'owner@example.test',firmName:'Cloud Chambers',password,setupToken});assert.equal(setup.status,201,JSON.stringify(setup.data));ownerId=setup.data.user.id;cookie=setup.headers.get('Set-Cookie').split(';')[0];assert.match(setup.headers.get('Set-Cookie'),/Secure; SameSite=Strict/);
  assert.equal((await api('auth/setup','POST',{})).status,409);assert.equal((await api('state','GET',undefined,{Origin:'https://example.org'})).status,403);
  assert.equal((await mf.dispatchFetch('http://evil.test/api/state')).status,403);assert.equal((await api('ledger')).status,200);
 });
 let client,caseRecord,invoice,document;
 await t.test('Chambers validation, revisions and atomic hearing outcome',async()=>{
  client=await create('clients',{name:'D1 Client'});caseRecord=await create('cases',{title:'D1 Matter',clientId:client.id,court:'Delhi High Court',cnr:'DLCT010000012026'});
  assert.equal((await api('cases','POST',{title:'Duplicate',clientId:client.id,court:'Delhi',cnr:caseRecord.cnr})).status,409);
  const patch=await api('cases/'+caseRecord.id,'PATCH',{version:caseRecord.version,stage:'Evidence'});assert.equal(patch.status,200);assert.equal((await api('cases/'+caseRecord.id,'PATCH',{version:caseRecord.version,stage:'Arguments'})).status,409);
  const hearing=await create('hearings',{caseId:caseRecord.id,date:today,time:'10:30',purpose:'Arguments'});
  const input={version:hearing.version,status:'Adjourned',outcome:'Next evidence date',nextTime:'11:00',nextPurpose:'Evidence'};
  assert.equal((await api('hearings/'+hearing.id+'/outcome','POST',{...input,nextDate:'2099-02-30'})).status,400);
  assert.equal((await api('state')).data.hearings.find(r=>r.id===hearing.id).status,'Scheduled');
  assert.equal((await api('hearings/'+hearing.id+'/outcome','POST',{...input,nextDate:'2099-10-02'})).status,200);
  assert.equal((await api('state')).data.cases.find(r=>r.id===caseRecord.id).nextDate,'2099-10-02');
 });
 await t.test('concurrent payments cannot exceed the invoice balance',async()=>{
  invoice=await create('invoices',{clientId:client.id,caseId:caseRecord.id,description:'Fees',amount:1000,date:'2026-01-01',due:today});
  const responses=await Promise.all([1,2].map(()=>api('payments','POST',{invoiceId:invoice.id,amount:600,date:today,method:'UPI'})));
  assert.equal(responses.filter(r=>r.status===201).length,1,JSON.stringify(responses));assert.ok(responses.some(r=>[400,409].includes(r.status)));
  const current=(await api('state')).data.invoices.find(r=>r.id===invoice.id);assert.equal(current.balance,400);
 });
 await t.test('private documents in R2 preserve bytes, backups and permissions',async()=>{
  const content=Buffer.from('Private court document \0 ₹').toString('base64');document=await create('documents',{caseId:caseRecord.id,name:'Order',category:'Order',content,originalName:'order.txt'});
  let r=await raw('/api/documents/'+document.id+'/download');assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),Buffer.from(content,'base64'));
  assert.equal((await raw('/api/documents/'+document.id+'/download','GET',undefined,{Cookie:''})).status,401);
  assert.equal((await db.prepare('SELECT content FROM files WHERE id=?').bind(document.id).first()).content,null);
  const meta=await db.prepare('SELECT * FROM edge_objects WHERE id=?').bind(document.id).first();assert.equal(meta.size,Buffer.from(content,'base64').length);
  const backup=await api('backup');assert.equal(backup.data.files[0].content,content);assert.equal((await api('backup.sql')).status,409);
  const clerk=await create('users',{name:'Clerk',email:'clerk@example.test',role:'Clerk',password});const login=await api('auth/login','POST',{email:clerk.email,password});const cc=login.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await api('invoices','POST',{}, {Cookie:cc})).status,403);assert.equal((await api('users/'+ownerId,'PATCH',{active:false})).status,400);
  assert.equal((await api('users/'+clerk.id,'PATCH',{active:false})).status,200);assert.equal((await api('state','GET',undefined,{Cookie:cc})).status,401);
 });
 await t.test('BatchFee idempotency and tournament privacy',async()=>{
  let state=(await api('batchfee-lite')).data;
  const command=async(type,input,requestId=crypto.randomUUID())=>{const r=await api('batchfee-lite/command','POST',{type,input,requestId,revision:state.revision});assert.equal(r.status,200,JSON.stringify(r.data));state=r.data;return r;};
  await command('profile',{name:'Academy',owner:'Owner',mobile:'9876543210',dueDay:5,sessionMonth:4,currency:'INR'});
  const id=crypto.randomUUID(),input={name:'Maths',fee:'1500',frequency:'Monthly',dueDay:5,active:true};await command('batch',input,id);const rev=state.revision;await command('batch',input,id);assert.equal(state.revision,rev);
  const tr=await api('tournament-lite','POST',{name:'Cloud Cup',sport:'Chess',mode:'Singles',format:'Knockout',contact:'Private contact'});assert.equal(tr.status,200,JSON.stringify(tr.data));
  assert.equal((await api('tournament-lite/public/'+tr.data.publicToken,'GET',undefined,{Cookie:''})).status,404);
 });
 await t.test('Samaj staged registration, photo upload and rollback in real D1',async()=>{
  const community=await create('digital-samaj',{name:'Cloud Samaj'}),base='digital-samaj/'+community.id;
  const p=await create(base+'/persons',{data:{englishName:'Person',state:'Gujarat'}});assert.equal((await api(base+'/persons/'+p.id)).data.englishName,'Person');
  const draft=await create(base+'/drafts',{}),photo={name:'portrait.png',mime:'image/png',content:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='};
  const data={formVersion:2,family:{name:'Family'},head:{englishName:'Head'},headPhoto:photo,members:[{data:{englishName:'Child',dob:'2025-02-30'},type:'BirthFamily',relationship:'Child'}],privacy:{}};
  assert.equal((await api(base+'/drafts/'+draft.id,'PATCH',{revision:1,step:4,data})).status,200);
  assert.equal((await api(base+'/drafts/'+draft.id+'/submit','POST',{revision:2,consent:true})).status,400);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM samaj_families').first()).n,0);
  data.members[0].data.dob='2020-02-29';assert.equal((await api(base+'/drafts/'+draft.id,'PATCH',{revision:2,step:4,data})).status,200);
  const submitted=await api(base+'/drafts/'+draft.id+'/submit','POST',{revision:3,consent:true});assert.equal(submitted.status,201,JSON.stringify(submitted.data));
  const family=await api(base+'/families/'+submitted.data.familyId);assert.equal(family.data.members.length,2);assert.equal((await db.prepare("SELECT COUNT(*) n FROM edge_objects WHERE scope='samaj'").first()).n,1);
 });
 await t.test('watchlists remain account-owned and calendar runs without filesystem',async()=>{
  const list=await create('fund-overlap/watchlists',{name:'My plans',plans:[{code:'119551',name:'Example Direct Growth'}]});assert.equal((await api('fund-overlap/watchlists')).data.watchlists[0].id,list.id);
  assert.equal((await api('fund-overlap/portfolio')).data.revision,0);assert.equal((await api('fund-overlap/portfolio','GET',undefined,{Cookie:''})).status,401);
  const core=require('../apps/fund-overlap/frontend/portfolio-core'),{createHash}=require('node:crypto'),purchase={schemeCode:'118955',date:'2023-01-01',type:'BUY',units:100,amount:1000,reference:'seeded purchase'},fingerprint=createHash('sha256').update(JSON.stringify(core.clean(purchase))).digest('hex');
  await db.prepare('INSERT INTO fund_lens_portfolios VALUES(?,1)').bind(ownerId).run();await db.prepare('INSERT INTO fund_lens_transactions VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),ownerId,purchase.schemeCode,'Verified existing plan',purchase.date,purchase.type,purchase.units,purchase.amount,purchase.reference,fingerprint).run();
  assert.equal((await api('fund-overlap/portfolio/transactions','POST',{revision:1,transactions:[{...purchase,type:'SELL',units:101,amount:1200,date:'2024-01-01',reference:'oversell'}]})).status,400);
  const redemption=await api('fund-overlap/portfolio/transactions','POST',{revision:1,transactions:[{...purchase,type:'SELL',units:25,amount:350,date:'2024-01-01',reference:'redemption'}]});assert.equal(redemption.status,200,JSON.stringify(redemption.data));assert.equal(redemption.data.revision,2);assert.equal(redemption.data.transactions.length,2);
  assert.equal((await api('fund-overlap/portfolio/transactions','POST',{revision:1,transactions:[purchase]})).status,409);
  const r=await api('ritual-assist/calendar','POST',{date:'2025-10-01',time:'12:00',pincode:'110001'});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.result.calculation.stored,false);assert.equal(r.data.result.upcomingAnnual.length,10);
 });
 await t.test('cached verified news publishes atomically and remains publicly readable',async()=>{
  const cutoff='2025-01-01T12:00:00.000Z',stories=Array.from({length:10},(_,i)=>({title:'Public works update '+i,description:'The department published a programme update and described the areas discussed at the meeting.',source:'PIB',provider:'PIB',url:'https://www.pib.gov.in/PressReleasePage.aspx?PRID='+i,publishedAt:'2025-01-01T11:30:00.000Z'}));
  await db.prepare("INSERT INTO news_runs(date,cutoff,state,attempts,sourceJson,createdAt,updatedAt) VALUES(?,?,'pending',1,?,?,?)").bind('2025-01-01',cutoff,JSON.stringify(stories),cutoff,cutoff).run();
  const result=await api('news/fetch','POST',{date:'2025-01-01'}, {Cookie:''});assert.equal(result.status,200,JSON.stringify(result.data));assert.equal(result.data.edition.stories.length,10);
  assert.equal((await api('news/fetch','POST',{date:'2025-01-01'},{Cookie:''})).data.cached,true);assert.equal((await api('news/editions/2025-01-01','GET',undefined,{Cookie:''})).status,200);
 });
 await t.test('public Arena keeps signed ballot cookies and updates one reaction atomically',async()=>{
  const first=await api('satire-arena','GET',undefined,{Cookie:''});assert.equal(first.status,200,JSON.stringify(first.data));const arenaCookie=first.headers.get('Set-Cookie').split(';')[0],round=first.data.round,character=first.data.characters[0].id;
  const r=await raw('/api/satire-arena/'+character+'/vote','PUT',{round,reaction:'garland'},{Cookie:arenaCookie,Origin:origin});assert.equal(r.status,204,await r.text());
  const saved=await api('satire-arena','GET',undefined,{Cookie:arenaCookie});assert.equal(saved.data.characters.find(c=>c.id===character).selected,'garland');assert.equal(saved.data.characters.find(c=>c.id===character).garland,1);
 });
 await t.test('Chrome mobile Chambers UI saves to D1 and preserves theme on reload',async()=>{
  const {createServer}=require('node:http'),{chromium,expect}=require('@playwright/test');
  const proxy=createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const headers={...req.headers};if(headers.origin?.startsWith('http://localhost:'))headers.origin=origin;delete headers.host;delete headers['content-length'];const r=await mf.dispatchFetch(origin+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch(e){res.writeHead(500);res.end(e.message);}});
  await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));const base='http://localhost:'+proxy.address().port;let browser;
  try{browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});await context.route('https://pagead2.googlesyndication.com/**',r=>r.abort());await context.addCookies([{name:'chambers_session',value:cookie.split('=')[1],url:base,httpOnly:true,sameSite:'Strict'}]);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/advocate');await expect(page.getByRole('heading',{name:'Chambers overview'})).toBeVisible();
   await page.getByRole('button',{name:'More',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Clients',exact:true}).click();await page.getByRole('button',{name:'Add client',exact:true}).first().click();await page.getByLabel('Client name').fill('Cloudflare Browser Client');await page.getByRole('button',{name:'Save client',exact:true}).click();await expect(page.getByRole('button',{name:'Cloudflare Browser Client',exact:true})).toBeVisible();
   assert.equal((await db.prepare("SELECT COUNT(*) n FROM records WHERE kind='clients' AND json_extract(data,'$.name')=?").bind('Cloudflare Browser Client').first()).n,1);
   await require('./browser-theme').setTheme(page,'dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'.publish/cloudflare-mobile-chambers.png',fullPage:true});assert.deepEqual(errors,[]);
  }finally{await browser?.close();await new Promise(resolve=>proxy.close(resolve));}
 });
});
