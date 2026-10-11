const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module'),{generateKeyPairSync,sign}=require('node:crypto');
const {statements}=require('../infrastructure/cloudflare/sql-statements.cjs');
const toolsRequire=createRequire(process.env.SYNAPSE_WRANGLER_PACKAGE||require.resolve('wrangler/package.json'));
const {Miniflare,convertV4MiniflareOptions}=toolsRequire('miniflare');
const issuer='https://isolated-free.cloudflareaccess.com',audience='isolated-audience',origin='http://localhost';
const mime=p=>p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.png')?'image/png':p.endsWith('.json')?'application/json':'text/javascript';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'isolated-key',alg:'RS256',use:'sig'};
function jwt(overrides={},key=privateKey){const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const input=encode({alg:'RS256',kid:jwk.kid})+'.'+encode({iss:issuer,aud:[audience],sub:'isolated-identity',type:'app',email:'owner@example.test',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+600,...overrides});return input+'.'+sign('RSA-SHA256',Buffer.from(input),key).toString('base64url');}
test('Access authentication verifies identity instead of trusting email headers',async()=>{
 const {accessSession}=await import('../packages/auth/access.mjs');
 const previous=global.fetch;global.fetch=async url=>{assert.equal(url,issuer+'/cdn-cgi/access/certs');return Response.json({keys:[jwk]});};
 const repo={first:async(sql,email)=>email==='owner@example.test'?{id:'owner',name:'Owner',email,role:'Clerk',active:1}:null,access:async()=>['advocate']},env={ACCESS_TEAM_DOMAIN:issuer,ACCESS_AUD:audience};
 try{
  assert.equal(await accessSession(new Request(origin,{headers:{'Cf-Access-Authenticated-User-Email':'owner@example.test'}}),repo,env),null);
  const user=await accessSession(new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':jwt({role:'Owner'})}}),repo,env);assert.equal(user.role,'Clerk');
  assert.equal((await accessSession(new Request(origin,{headers:{Cookie:'CF_Authorization='+jwt()}}),repo,env)).id,'owner');
  for(const claims of [{aud:['wrong']},{iss:'https://evil.test'},{exp:0},{iat:Date.now()/1000+1000},{nbf:'bad'},{type:'service'}])await assert.rejects(()=>accessSession(new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':jwt(claims)}}),repo,env),error=>error.status===401);
  const wrong=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey;
  await assert.rejects(()=>accessSession(new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':jwt({},wrong)}}),repo,env),error=>error.status===401);
  await assert.rejects(()=>accessSession(new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':jwt({email:'stranger@example.test'})}}),repo,env),error=>error.status===403);
 }finally{global.fetch=previous;}
});
test('query budget rejects an oversized atomic batch before database execution',async()=>{
 const {FreeD1Repository}=await import('../packages/database/d1-free.mjs');let batches=0;
 const repo=new FreeD1Repository({batch:async()=>{batches++;},prepare:()=>({bind(){return this;}})});
 repo.remaining=4;await assert.rejects(()=>repo.commit([{},{}]),error=>error.status===413);assert.equal(batches,0);
});
test('SQL document quota stops new blobs at 100 MB and allows smaller replacement',()=>{
 const {DatabaseSync}=require('node:sqlite'),{schema}=require('../infrastructure/cloudflare/build-d1.cjs'),db=new DatabaseSync(':memory:');
 try{
  db.exec(schema());db.exec(fs.readFileSync('infrastructure/cloudflare/d1-free-migrations/0003-document-blobs.sql','utf8'));
  db.exec('BEGIN');for(let i=0;i<101;i++)db.prepare('INSERT INTO files VALUES(?,?,?,NULL)').run('quota-'+i,'fixture.bin','application/octet-stream');
  const insert=db.prepare('INSERT INTO edge_document_blobs VALUES(?,?,?,1000000,?,zeroblob(1000000),?)');for(let i=0;i<100;i++)insert.run('quota-'+i,'fixture.bin','application/octet-stream','0'.repeat(64),'2026-10-11');db.exec('COMMIT');
  assert.throws(()=>insert.run('quota-100','fixture.bin','application/octet-stream','0'.repeat(64),'2026-10-11'),/free_document_capacity/);
  db.prepare('UPDATE edge_document_blobs SET size=1,content=X\'00\' WHERE id=?').run('quota-0');
  db.prepare('INSERT INTO edge_document_blobs VALUES(?,?,?,1,?,X\'00\',?)').run('quota-100','one.bin','application/octet-stream','0'.repeat(64),'2026-10-11');
  assert.equal(db.prepare('SELECT SUM(size) bytes FROM edge_document_blobs').get().bytes,99000002);
 }finally{db.close();}
});
test('D1-only SQL recovery preserves binary documents, hashes and text containing SQL punctuation',()=>{
 const {schema}=require('../infrastructure/cloudflare/build-d1.cjs'),{prepareRecovery}=require('../infrastructure/cloudflare/free-recovery.cjs'),{DatabaseSync}=require('node:sqlite'),{createHash}=require('node:crypto'),root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'synapse-d1-recovery-'));
 const bytes=Buffer.alloc(70000);for(let i=0;i<bytes.length;i++)bytes[i]=i%256;const hash=createHash('sha256').update(bytes).digest('hex');
 const text="Semi;colon -- notes CREATE TRIGGER BEGIN END नमस्ते \0",encoded=Buffer.from(JSON.stringify(text)).toString('hex');
 const dump=schema()+'\n'+fs.readFileSync('infrastructure/cloudflare/d1-free-migrations/0003-document-blobs.sql','utf8')+`\nINSERT INTO users VALUES('owner','Owner','owner@example.test','Owner','original-hash',1);INSERT INTO settings VALUES('punctuation',CAST(X'${encoded}' AS TEXT));INSERT INTO files VALUES('doc','private.bin','application/octet-stream',NULL);INSERT INTO edge_document_blobs VALUES('doc','private.bin','application/octet-stream',${bytes.length},'${hash}',X'${bytes.toString('hex')}','2026-10-11');`;
 try{
  const file=path.join(root,'snapshot.sql');fs.writeFileSync(file,dump);const result=prepareRecovery(file,path.join(root,'verified'));assert.equal(result.documents,1);
  const sql=fs.readFileSync(path.join(root,'verified/d1-restore.sql'),'utf8');assert.ok(statements(sql).every(s=>Buffer.byteLength(s)<100000));
  const db=new DatabaseSync(':memory:');try{db.exec(schema());db.exec(fs.readFileSync('infrastructure/cloudflare/d1-free-migrations/0003-document-blobs.sql','utf8'));db.exec(sql);assert.deepEqual(Buffer.from(db.prepare('SELECT content FROM edge_document_blobs').get().content),bytes);assert.equal(JSON.parse(db.prepare("SELECT data FROM settings WHERE id='punctuation'").get().data),text);assert.equal(db.prepare('SELECT password FROM users').get().password,'original-hash');}finally{db.close();}
  fs.writeFileSync(path.join(root,'unsafe.sql'),"ATTACH DATABASE 'outside.sqlite' AS other;");assert.throws(()=>prepareRecovery(path.join(root,'unsafe.sql'),path.join(root,'rejected')),/Unsupported/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('free import preserves the full recovery bundle and refuses excess records',()=>{
 const {DatabaseSync}=require('node:sqlite'),{schema}=require('../infrastructure/cloudflare/build-d1.cjs'),{tables}=require('../packages/database/catalog'),{createBundle,validateBundle}=require('../infrastructure/cloudflare/transfer.cjs'),{prepareFreeImport}=require('../infrastructure/cloudflare/free-import.cjs');
 const root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'synapse-free-import-')),db=new DatabaseSync(':memory:');
 try{
  db.exec(schema());db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run('owner','Owner','owner@example.test','Owner','existing-password-hash');
  db.prepare('INSERT INTO files VALUES(?,?,?,?)').run('doc','order.txt','text/plain',Buffer.from('original private file'));
  db.prepare('INSERT INTO records(rowid,kind,id,data) VALUES(?,?,?,?)').run(19,'clients','existing-client',JSON.stringify({id:'existing-client',name:'Existing client'}));
  const reader=meta=>db.prepare('SELECT *'+(meta.name==='records'?',rowid AS __rowid':'')+' FROM '+meta.name).all().map(row=>meta.name==='records'?{...row,__rowid:String(row.__rowid)}:row);
  const bundle=path.join(root,'full');createBundle(reader,bundle,'isolated-test');const before=fs.readFileSync(path.join(bundle,'manifest.json'));
  const report=prepareFreeImport(bundle,path.join(root,'free'));assert.equal(report.localOnlyObjects,0);assert.equal(report.accounts,1);assert.equal(report.documentsAvailable,true);assert.equal(report.importedDocuments,1);assert.deepEqual(fs.readFileSync(path.join(bundle,'manifest.json')),before);validateBundle(bundle);
  const restored=new DatabaseSync(':memory:');try{restored.exec(schema());restored.exec(fs.readFileSync('infrastructure/cloudflare/d1-free-migrations/0003-document-blobs.sql','utf8'));restored.exec(fs.readFileSync(path.join(root,'free/d1-free-import.sql'),'utf8'));assert.equal(restored.prepare('SELECT password FROM users').get().password,'existing-password-hash');assert.equal(restored.prepare('SELECT content FROM files').get().content,null);assert.deepEqual(Buffer.from(restored.prepare('SELECT content FROM edge_document_blobs').get().content),Buffer.from('original private file'));assert.equal(restored.prepare('SELECT COUNT(*) n FROM edge_objects').get().n,0);}finally{restored.close();}
  for(let i=0;i<251;i++)db.prepare('INSERT INTO records VALUES(?,?,?)').run('clients','client-'+i,JSON.stringify({id:'client-'+i,name:'Client'}));
  const excess=path.join(root,'excess');createBundle(reader,excess,'isolated-test');assert.throws(()=>prepareFreeImport(excess,path.join(root,'rejected')),/exceeds free workspace capacity/);assert.equal(fs.existsSync(path.join(root,'rejected')),false);
 }finally{db.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('native free Worker keeps Chambers secure and stops atomic writes at capacity',async t=>{
 const worker={name:'free',modules:true,scriptPath:path.resolve(process.env.SYNAPSE_FREE_BUNDLE||'infrastructure/cloudflare/.publish/fullstack-dryrun/fullstack-worker.js'),compatibilityDate:'2026-10-01',compatibilityFlags:['nodejs_compat'],d1Databases:{PLATFORM_DB:'isolated-free'},bindings:{PUBLIC_ORIGIN:origin,FREE_MODE:'true',ACCESS_TEAM_DOMAIN:issuer,ACCESS_AUD:audience},outboundService:async request=>{assert.equal(new URL(request.url).origin,issuer);return Response.json({keys:[jwk]});},serviceBindings:{ASSETS:async request=>{const p=new URL(request.url).pathname,target=path.resolve('infrastructure/cloudflare/dist','.'+p);return fs.existsSync(target)?new Response(fs.readFileSync(target),{headers:{'Content-Type':mime(p)}}):new Response('Not found',{status:404});}}};
 const options={workers:[worker]},mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);
 const api=async(route,method='GET',body,token=jwt())=>{const r=await mf.dispatchFetch(origin+'/api/'+route,{method,headers:{'Content-Type':'application/json',...(token?{'Cf-Access-Jwt-Assertion':token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 try{
  const db=await mf.getD1Database('PLATFORM_DB');
  for(const file of ['0001-platform.sql','0002-free-guards.sql','0003-document-blobs.sql'])await db.batch(statements(fs.readFileSync('infrastructure/cloudflare/d1-free-migrations/'+file,'utf8')).map(s=>db.prepare(s)));
  await db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').bind('owner','Owner','owner@example.test','Owner','legacy-hash-preserved').run();
  await t.test('no R2 binding, no password login, no unauthorized access',async()=>{
   assert.equal((await mf.dispatchFetch(origin+'/healthz')).status,200);
   assert.equal((await api('auth/status','GET',undefined,'')).data.authMethod,'access');
   assert.equal((await api('state','GET',undefined,'')).status,401);
   assert.equal((await api('auth/login','POST',{password:'do not hash'})).status,409);
   for(const route of ['backup','restore','ritual-assist/calendar','digital-samaj','batchfee-lite'])assert.equal((await api(route)).status,503,route);
   assert.equal((await api('documents/id/download','GET',undefined,'')).status,401);
  });
  await t.test('D1 documents preserve binary bytes and enforce upload/capacity/role boundaries',async()=>{
   const client=await api('clients','POST',{name:'Document client'}),matter=await api('cases','POST',{title:'Document matter',clientId:client.data.id,court:'Delhi High Court'}),caseId=matter.data.id;
   const content=Buffer.alloc(1000000);for(let i=0;i<content.length;i++)content[i]=i%256;
   const document=await api('documents','POST',{caseId,name:'Private binary',category:'Order',originalName:'order.pdf',content:content.toString('base64')});assert.equal(document.status,201,JSON.stringify(document));
   const response=await mf.dispatchFetch(origin+'/api/documents/'+document.data.id+'/download',{headers:{'Cf-Access-Jwt-Assertion':jwt()}});assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),content);assert.match(response.headers.get('Content-Disposition'),/attachment/);
   assert.equal((await api('state')).data.capabilities.maxFileBytes,1000000);
   const tooLarge=await api('documents','POST',{caseId,name:'Oversized',category:'Order',originalName:'large.pdf',content:Buffer.alloc(1000001).toString('base64')});assert.equal(tooLarge.status,413);
   assert.equal((await db.prepare('SELECT COUNT(*) n FROM edge_document_blobs').first()).n,1);
   // Stand-in quota trigger exercises the same abort path without filling 100 MB.
   await db.prepare("CREATE TRIGGER isolated_document_capacity BEFORE INSERT ON edge_document_blobs BEGIN SELECT RAISE(ABORT,'free_document_capacity'); END").run();
   const failed=await api('documents','POST',{caseId,name:'At capacity',category:'Order',originalName:'cap.txt',content:Buffer.from('bytes').toString('base64')});assert.equal(failed.status,409);assert.equal((await db.prepare("SELECT COUNT(*) n FROM records WHERE kind='documents'").first()).n,1);
   await db.prepare('DROP TRIGGER isolated_document_capacity').run();
   await db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').bind('no-access','No access','no-access@example.test','Clerk','preserved-hash').run();assert.equal((await api('documents/'+document.data.id+'/download','GET',undefined,jwt({email:'no-access@example.test'}))).status,403);
   await db.prepare('UPDATE users SET active=0 WHERE id=?').bind('no-access').run();assert.equal((await api('documents/'+document.data.id+'/download','GET',undefined,jwt({email:'no-access@example.test'}))).status,403);
  });
  await t.test('mobile email-code sign-in and account screens omit password controls',async()=>{
   const {chromium}=require('@playwright/test'),browser=await chromium.launch({headless:true,channel:'chrome'});
   try{
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];let signedIn=false;page.on('pageerror',e=>errors.push(e.message));
    await page.route('http://free-ui.test/**',async route=>{const req=route.request(),url=new URL(req.url());const response=await mf.dispatchFetch(origin+url.pathname+url.search,{method:req.method(),headers:{...req.headers(),...(signedIn?{'Cf-Access-Jwt-Assertion':jwt()}:{})},body:['GET','HEAD'].includes(req.method())?undefined:req.postData()});await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});});
    await page.goto('http://free-ui.test/signin');await page.getByRole('heading',{name:'Sign in with your email'}).waitFor();assert.equal(await page.locator('input[type=password]').count(),0);assert.equal(await page.getByRole('link',{name:'Continue to email-code sign-in'}).getAttribute('href'),'/access-login');
    assert.equal(await page.locator('.primary.wide').evaluate(el=>getComputedStyle(el).display),'inline-flex');
    await page.goto('http://free-ui.test/');await page.locator('.workspace-card').first().waitFor();assert.equal(await page.locator('.workspace-card a[href]').count(),1);
    signedIn=true;await page.goto('http://free-ui.test/signin?section=profile');await page.getByRole('heading',{name:'Sign-in and security'}).waitFor();assert.equal(await page.locator('input[type=password]').count(),0);
    await page.locator('[data-section=team]:visible').first().click();await page.getByRole('button',{name:'Add member'}).click();assert.equal(await page.locator('#platform-dialog input[name=password]').count(),0);await page.getByRole('button',{name:'Close dialog',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.screenshot({path:'.publish/cloudflare-free-account-mobile.png',fullPage:true});
   }finally{await browser.close();}
  });
  await t.test('Chambers access, payments and hearing outcome remain atomic',async()=>{
   const client=await api('clients','POST',{name:'Free Client'});assert.equal(client.status,201,JSON.stringify(client));
   const matter=await api('cases','POST',{title:'Free matter',clientId:client.data.id,court:'Delhi High Court'});assert.equal(matter.status,201);
   const invoice=await api('invoices','POST',{clientId:client.data.id,description:'Fee',amount:1000,date:'2026-01-01',due:'2026-12-31'});assert.equal(invoice.status,201);
   const payments=await Promise.all([1,2].map(()=>api('payments','POST',{invoiceId:invoice.data.id,amount:600,date:'2026-10-11',method:'UPI'})));assert.equal(payments.filter(r=>r.status===201).length,1);
   const hearing=await api('hearings','POST',{caseId:matter.data.id,date:'2026-10-11',time:'10:30',purpose:'Arguments'});assert.equal(hearing.status,201);
   const count=(await db.prepare('SELECT COUNT(*) n FROM records').first()).n;
   for(let i=count;i<250;i++)await db.prepare('INSERT INTO records VALUES(?,?,?)').bind('clients','filler-'+i,JSON.stringify({id:'filler-'+i,name:'Filler'})).run();
   const rejected=await api('hearings/'+hearing.data.id+'/outcome','POST',{version:hearing.data.version,status:'Adjourned',outcome:'Next date',nextDate:'2026-12-01',nextTime:'11:00',nextPurpose:'Evidence'});assert.equal(rejected.status,409,JSON.stringify(rejected));
   const original=JSON.parse((await db.prepare('SELECT data FROM records WHERE id=?').bind(hearing.data.id).first()).data);assert.equal(original.status,'Scheduled');assert.equal(original.version,hearing.data.version);
   assert.equal((await api('clients','POST',{name:'Too many'})).status,409);
   assert.equal((await api('platform/apps/digital-samaj/launch','POST',{})).status,404);
   assert.equal((await api('platform')).data.apps.find(a=>a.id==='digital-samaj').status,'Unavailable');
   await db.prepare('UPDATE users SET active=0 WHERE id=?').bind('owner').run();assert.equal((await api('state')).status,403);
  });
 }finally{await mf.dispose();}
});
