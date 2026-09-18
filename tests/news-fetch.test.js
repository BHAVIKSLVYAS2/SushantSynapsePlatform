const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Store}=require('../apps/advocate/backend/store');
const {createNewsRepository}=require('../apps/news/backend/repository');
const {createNewsProvider,selectStories}=require('../apps/news/backend/provider');
const {createFetchService}=require('../apps/news/backend/fetch-service');
const {createNews}=require('../apps/news/backend/routes');
const {Readable}=require('node:stream');
const titles=['Parliament debates transport infrastructure','Scientists discover new ocean species','India wins international hockey final','Monsoon rainfall boosts rice harvest','Central bank reviews inflation forecast','Space mission reaches lunar orbit','New railway opens mountain route','Schools introduce regional language classes','National park reports tiger population rise','Technology exports expand this quarter'];
const cutoff='2025-01-01T18:29:00.000Z';
const articles=titles.map((title,i)=>({title,language:'English',url:`https://source${i}.example/item?utm_source=tracking`,seendate:'20250101T180000Z'}));
test('GDELT adapter filters malformed/stale/duplicate stories, validates responses and bounds requests',async()=>{
 const raw=[{...articles[0],url:'javascript:alert(1)'},{...articles[0],seendate:'20240101T180000Z'},...articles,articles[0]];
 assert.equal(selectStories(raw,cutoff).length,10);assert.equal(selectStories(raw,cutoff)[0].url,'https://source0.example/item');assert.equal(selectStories(raw,cutoff)[0].publishedAt,null);
 assert.equal(selectStories(articles.map(x=>({...x,url:'https://one.example/'+x.title})),cutoff).length,3);
 let calls=0;const provider=createNewsProvider({fetchImpl:async(url,opts)=>{calls++;assert.equal(url.hostname,'api.gdeltproject.org');assert.equal(url.searchParams.get('startdatetime'),'20241231182900');assert.equal(url.searchParams.get('enddatetime'),'20250101182900');assert.equal(opts.redirect,'error');return new Response(JSON.stringify({articles:raw}));}});
 assert.equal((await provider.fetchStories(cutoff)).length,10);assert.equal(calls,1);
 for(const [response,status] of [[new Response('busy',{status:429}),429],[new Response('not-json'),502],[new Response(JSON.stringify({articles:[]})),502],[new Response('{}',{headers:{'content-length':'9000000'}}),502]])await assert.rejects(createNewsProvider({fetchImpl:async()=>response}).fetchStories(cutoff),e=>e.status===status);
 await assert.rejects(createNewsProvider({fetchImpl:async()=>{throw Error('sensitive request information');}}).fetchStories(cutoff),e=>!e.message.includes('sensitive'));
});
test('news fetch lease, stored preview, retry cutoff, restart cache, SQL export and persisted quotas',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-fetch-'));let store=new Store(dir);let now=new Date(cutoff),calls=0,release;
 try{
  let repository=createNewsRepository(store);const stories=selectStories(articles,cutoff);
  const provider={fetchStories:async()=>{calls++;await new Promise(resolve=>{release=resolve;});return stories;}};
  let service=createFetchService({store,repository,provider,clock:()=>now});
  const first=service.fetchDate();await assert.rejects(service.fetchDate(),e=>e.status===409);release();const fetched=await first;assert.equal(fetched.state,'ready');assert.equal(fetched.cached,false);
  assert.equal((await service.fetchDate()).cached,true);assert.equal(calls,1);assert.equal(repository.get('2025-01-01'),null);
  store.sql.close();store=new Store(dir);repository=createNewsRepository(store);service=createFetchService({store,repository,provider:{fetchStories:()=>{throw Error('must not call');}},clock:()=>now});
  assert.equal((await service.fetchDate()).stories.length,10);assert.match(store.exportSql(),/INSERT INTO news_fetch_budget/);
  now=new Date('2025-01-02T18:29:00Z');let failOnce=true;const cutoffs=[];
  service=createFetchService({store,repository,provider:{fetchStories:async(c)=>{cutoffs.push(c);if(failOnce){failOnce=false;throw Error('secret URL');}return stories;}},clock:()=>now});
  await assert.rejects(service.fetchDate(),/News fetch failed/);assert.equal(service.preview('2025-01-02').state,'failed');assert.doesNotMatch(service.preview('2025-01-02').error,/secret/);
  await assert.rejects(service.fetchDate(),e=>e.status===429);now=new Date('2025-01-02T18:31:00Z');
  assert.equal((await service.fetchDate('2025-01-02')).state,'ready');assert.equal(cutoffs[0],cutoffs[1]);
  await assert.rejects(service.fetchDate('2020-01-01'),e=>e.status===400);
  now=new Date('2025-01-03T18:31:00Z');store.sql.prepare('INSERT INTO news_fetch_budget VALUES(?,20)').run('2025-01-03');
  await assert.rejects(service.fetchDate(),e=>e.status===429);assert.equal(service.preview('2025-01-04').state,'empty');
  now=new Date('2025-01-04T12:00:00Z');service=createFetchService({store,repository,provider:{fetchStories:async()=>stories},clock:()=>now});
  store.sql.prepare("INSERT INTO news_runs(date,cutoff,state,attempts,leaseToken,leaseUntil,createdAt,updatedAt) VALUES(?,?,'running',1,'expired',?,?,?)").run('2025-01-04',now.toISOString(),'2025-01-04T11:00:00Z','2025-01-04T10:00:00Z','2025-01-04T10:00:00Z');
  assert.equal(service.preview('2025-01-04').state,'interrupted');assert.equal((await service.fetchDate()).state,'ready');
 }finally{store.sql.close();if(path.dirname(dir)===path.resolve(os.tmpdir()))fs.rmSync(dir,{recursive:true,force:true});}
});
test('fetch API rejects unauthorized and malformed writes before provider calls',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-fetch-api-'));const store=new Store(dir);let user=null,calls=0;
 try{
  const handler=createNews({store,auth:{hasAppAccess:()=>true,owner(u){if(u.role!=='Owner'){const e=Error('Owner required');e.status=403;throw e;}}},provider:{fetchStories:async()=>{calls++;return [];}}});
  const call=body=>{const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.headers={'content-type':'application/json'};return handler({route:'news/fetch',method:'POST',user,req,json(){}});};
  await assert.rejects(call({}),e=>e.status===401);user={role:'Clerk'};await assert.rejects(call({}),e=>e.status===403);user={role:'Owner'};
  for(const body of [{url:'https://attacker.example'},{date:123},{date:''},{date:'invalid'}])await assert.rejects(call(body),e=>e.status===400);assert.equal(calls,0);
 }finally{store.sql.close();if(path.dirname(dir)===path.resolve(os.tmpdir()))fs.rmSync(dir,{recursive:true,force:true});}
});
