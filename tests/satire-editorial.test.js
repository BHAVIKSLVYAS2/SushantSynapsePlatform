const {test}=require('node:test'),assert=require('node:assert/strict');
const base='https://apps.sushantsynapse.com';

test('sample edition is valid original preview content without publications or character overrides',async()=>{
 const {sampleEdition}=await import('../apps/satire-arena/backend/sample-edition.mjs'),{validate,empty,published}=await import('../apps/satire-arena/backend/editorial.mjs'),{publicPage}=await import('../apps/satire-arena/backend/public-pages.mjs');
 const samples=sampleEdition();assert.equal(validate({...samples,version:0}).posts.length,7);assert.equal(new Set(samples.posts.map(p=>p.category)).size,5);assert.deepEqual(new Set(samples.posts.map(p=>p.language)),new Set(['en','hi']));assert.deepEqual(samples.characters,[]);assert.ok(samples.posts.every(p=>p.status==='draft'));
 const library=empty(),before=JSON.stringify(library),data=published(library);assert.equal(data.posts.length,0);assert.equal(data.featured,null);
 const html=await publicPage(new Request(base+'/satire-arena/daily'),data).text();assert.match(html,/PREVIEW EDITION/);assert.match(html,/noindex,follow/);assert.match(html,/sample-meeting-to-end-meetings\?sample=1/);assert.doesNotMatch(html,/Published satire/);assert.equal(JSON.stringify(library),before);
 assert.equal(publicPage(new Request(base+'/satire-arena/posts/sample-meeting-to-end-meetings'),data).status,404);
 const article=await publicPage(new Request(base+'/satire-arena/posts/sample-meeting-to-end-meetings?sample=1'),data).text();assert.match(article,/The meeting to shorten meetings/);assert.match(article,/\/categories\/office\?sample=1/);assert.match(article,/canonical.*sample=1/);assert.doesNotMatch(article,/<time datetime/);
 const xml=await publicPage(new Request(base+'/sitemap.xml?sample=1'),data).text();assert.doesNotMatch(xml,/sample-meeting|sample=1/);
 const character=await publicPage(new Request(base+'/satire-arena/characters/namo-nimbus?sample=1'),data).text();assert.doesNotMatch(character,/PREVIEW EDITION/);
});
test('advertising readiness never enables political or unreviewed placements',async()=>{const {eligiblePlacements}=await import('../apps/satire-arena/backend/ad-policy.mjs'),config={enabled:true,placements:[{slot:'1234567890',position:'after-article',reviewed:true}]};assert.deepEqual(eligiblePlacements({status:'published',category:'political-parody'},config),[]);assert.deepEqual(eligiblePlacements({status:'published',category:'office'}),[]);assert.equal(eligiblePlacements({status:'published',category:'office'},config).length,1);assert.deepEqual(eligiblePlacements({status:'draft',category:'office'},config),[]);});
const post=(overrides={})=>({slug:'office-overtime',title:'The meeting',punchline:'The agenda requested a shorter meeting.',story:'An original fictional office joke.',category:'office',language:'en',status:'draft',publishAt:'2026-10-16T00:00:00+05:30',image:'',...overrides});
test('optional aggregate analytics has no visitor identity, validates inputs and protects reporting',async()=>{
 const {metrics}=await import('../apps/satire-arena/backend/metrics.mjs');let rows=[],writes=0;const options={enabled:true,read:async()=>rows,write:async next=>{rows=next;writes++;},limit:async()=>({success:true}),now:new Date('2026-10-15T18:30:00Z')};
 const req=(input,origin=base)=>new Request(base+'/api/arena-metrics',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input)}),input={event:'share_selected',content:'office-overtime',method:'whatsapp',source:'social'};
 assert.equal((await metrics(req(input),{...options,enabled:false})).status,204);assert.equal(writes,0);
 await assert.rejects(()=>metrics(req(input,'https://evil.invalid'),options),e=>e.status===403);await assert.rejects(()=>metrics(req({...input,email:'private@example.com'}),options),e=>e.status===400);await assert.rejects(()=>metrics(req(input),{...options,limit:async()=>({success:false})}),e=>e.status===429);
 assert.equal((await metrics(req(input),options)).status,204);assert.equal(rows[0].day,'2026-10-16');assert.equal(rows[0].counts['share_selected:office-overtime:whatsapp:social'],1);assert.doesNotMatch(JSON.stringify(rows),/cookie|email|voter|IP/);
 await assert.rejects(()=>metrics(new Request(base+'/api/arena-metrics'),options),e=>e.status===401);const report=await(await metrics(new Request(base+'/api/arena-metrics'),{...options,user:{role:'Owner'}})).json();assert.match(report.measurement,/not unique people/);assert.equal(report.days.length,1);
});
test('editorial validates bounded original content, dates, artwork and revision conflicts',async()=>{
 const {validate,empty}=await import('../apps/satire-arena/backend/editorial.mjs');const input={...empty(),posts:[post()]};const next=validate(input);assert.equal(next.version,1);assert.equal(next.posts[0].publishAt,'2026-10-15T18:30:00.000Z');assert.equal(input.version,0);
 for(const bad of [post({slug:'../unsafe'}),post({image:'https://remote.invalid/tracker.png'}),post({publishAt:'2026-10-16T12:00'}),post({category:'bogus'}),post({punchline:'x'.repeat(281)})])assert.throws(()=>validate({...empty(),posts:[bad]}),e=>e.status===400);
 assert.throws(()=>validate(input,next),e=>e.status===409);assert.throws(()=>validate({...empty(),posts:[post(),post()]}),e=>e.status===400);assert.equal(validate(next,next).version,2);
});
test('only eligible publications and elapsed character punchlines appear at IST boundaries',async()=>{
 const {published,validate,empty}=await import('../apps/satire-arena/backend/editorial.mjs');const library=validate({...empty(),posts:[post({status:'published'}),post({slug:'draft'}),post({slug:'hidden',status:'hidden'}),post({slug:'tomorrow',status:'published',publishAt:'2026-10-17T00:00:00+05:30'})],characters:[{id:'namo-nimbus',bio:'Fictional showman.',tagline:'Drumroll please.',punchlines:[{day:'2026-10-16',text:'The applause requested overtime.'},{day:'2026-10-17',text:'Tomorrow is rehearsing.'}]}]});
 const before=published(library,new Date('2026-10-15T18:29:59Z'));assert.equal(before.posts.length,0);assert.equal(before.characters[0].daily,'Drumroll please.');
 const today=published(library,new Date('2026-10-15T18:30:00Z'));assert.deepEqual(today.posts.map(p=>p.slug),['office-overtime']);assert.equal(today.featured.slug,'office-overtime');assert.equal(today.characters[0].daily,'The applause requested overtime.');assert.equal(today.characters[0].punchlines.length,1);
 assert.equal(published(library,new Date('2026-10-16T18:30:00Z')).posts.length,2);
});
test('editorial authorization, same-origin writes and stale saves protect persistent content',async()=>{
 const {editorial,empty}=await import('../apps/satire-arena/backend/editorial.mjs');let saved=empty(),writes=0;const options={read:async()=>saved,write:async next=>{writes++;saved=next;}};const request=(path='',method='GET',input,origin=base)=>new Request(base+'/api/arena-editorial'+path,{method,headers:{Origin:origin,'Content-Type':'application/json'},...(input?{body:JSON.stringify(input)}:{})});
 await assert.rejects(()=>editorial(request(),options),e=>e.status===401);await assert.rejects(()=>editorial(request(),{...options,user:{role:'Clerk'}}),e=>e.status===403);
 const owner={...options,user:{role:'Owner'}};await assert.rejects(()=>editorial(request('','PUT',empty(),'https://evil.invalid'),owner),e=>e.status===403);
 const r=await editorial(request('','PUT',{...empty(),posts:[post()]}),owner);assert.equal(r.status,200);assert.equal(writes,1);
 await assert.rejects(()=>editorial(request('','PUT',empty()),owner),e=>e.status===409);assert.equal(writes,1);
 assert.equal((await(await editorial(request('/public'),options)).json()).posts.length,0);
 const today=await(await editorial(request('/today'),options)).json();assert.equal(today.featured,null);assert.ok(!('posts' in today));
});
test('public satire pages render escaped metadata, real canonical URLs and published-only sitemap',async()=>{
 const {publicPage}=await import('../apps/satire-arena/backend/public-pages.mjs');const data={posts:[post({title:'<script>alert(1)</script>',status:'published'})],characters:[],featured:null};
 const r=publicPage(new Request(base+'/satire-arena/posts/office-overtime?tracking=ignored'),data),html=await r.text();assert.equal(r.status,200);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>alert/);assert.match(html,/rel="canonical" href="https:\/\/apps.sushantsynapse.com\/satire-arena\/posts\/office-overtime"/);assert.match(html,/property="og:title"/);assert.match(html,/twitter:image/);
 assert.equal(publicPage(new Request(base+'/satire-arena/posts/draft'),data).status,404);
 const xml=await publicPage(new Request(base+'/sitemap.xml'),data).text();assert.match(xml,/office-overtime/);assert.doesNotMatch(xml,/draft|editor/);
 assert.equal((await publicPage(new Request(base+'/satire-arena/daily',{method:'HEAD'}),data).text()),'');
});
test('historical results count only genuine retained ballots across IST and privacy removal',async()=>{
 const {fixture}=require('../apps/satire-arena/tests/fixture.cjs'),{arena}=await import('../apps/satire-arena/backend/edge.mjs');const {env,sqlite}=fixture();try{
 sqlite.prepare('INSERT INTO arena_cast_votes VALUES(?,?,?,?,?)').run('private-voter','namo-nimbus','2026-10-15','applause','2026-10-15T12:00:00Z');
 const r=await arena(new Request(base+'/api/satire-arena/results'),env,{now:new Date('2026-10-15T18:30:00Z')}),data=await r.json();assert.equal(data.days.length,30);assert.equal(data.days[0].round,'2026-10-16');assert.equal(data.days[0].total,0);assert.equal(data.days[1].total,1);assert.equal(data.days[1].characters[0].applause,1);assert.doesNotMatch(JSON.stringify(data),/private-voter|selected|updated_at/);assert.equal(r.headers.get('set-cookie'),null);
 sqlite.prepare('DELETE FROM arena_cast_votes WHERE voter=?').run('private-voter');assert.equal((await(await arena(new Request(base+'/api/satire-arena/results'),env,{now:new Date('2026-10-15T18:30:00Z')})).json()).days[1].total,0);
 }finally{sqlite.close();}
});
test('D1 editorial adapter publishes server-rendered pages and guards stale owner saves',async()=>{
 const {DatabaseSync,localD1}=require('./helpers/local-d1.cjs'),{schema}=require('../infrastructure/cloudflare/build-d1.cjs'),{D1Repository}=await import('../packages/database/d1.mjs'),{editorial,editorialKey,empty}=await import('../apps/satire-arena/backend/editorial.mjs'),{cloudPages}=await import('../apps/satire-arena/backend/cloud-pages.mjs');const db=new DatabaseSync(':memory:');db.exec(schema());const binding=localD1(db);
 try{const repo=await new D1Repository(binding).begin(),context={user:{role:'Owner'},read:()=>repo.setting(editorialKey),write:next=>repo.commit([repo.settingWrite(editorialKey,next)])};const save=await editorial(new Request(base+'/api/arena-editorial',{method:'PUT',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({...empty(),posts:[post({status:'published',publishAt:'2026-01-01T09:00:00+05:30'})]})}),context);assert.equal(save.status,200);
 const api=request=>editorial(request,context),page=await cloudPages(new Request(base+'/satire-arena/posts/office-overtime'),api);assert.equal(page.status,200);assert.match(await page.text(),/The agenda requested/);const other=await new D1Repository(binding).begin(),stale=await new D1Repository(binding).begin();await other.commit([other.settingWrite('unrelated',true)]);await assert.rejects(()=>stale.commit([stale.settingWrite(editorialKey,empty())]),e=>e.status===409);assert.equal((await repo.setting(editorialKey)).posts.length,1);
 assert.equal((await cloudPages(new Request(base+'/satire-arena/daily'),async()=>new Response(null,{status:503}))).status,503);
 }finally{db.close();}
});
