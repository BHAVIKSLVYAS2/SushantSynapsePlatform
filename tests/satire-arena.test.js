const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('../apps/satire-arena/tests/fixture.cjs');
const base='https://apps.sushantsynapse.com';

test('annual voting retains midnight choices, carries latest legacy ballots and resets only at New Year IST',async()=>{
 const {arena,annualRoundAt}=await import('../apps/satire-arena/backend/edge.mjs'),{env,sqlite}=fixture();
 try{
  let now=new Date('2026-10-18T18:29:59Z');
  const read=async cookie=>await(await arena(new Request(base+'/api/satire-arena',{headers:cookie?{Cookie:cookie}:{}}),env,{now})).json();
  const initial=await arena(new Request(base+'/api/satire-arena'),env,{now}),cookie=initial.headers.get('set-cookie').split(';')[0];
  const vote=async(reaction,round='2026-01-01')=>arena(new Request(base+'/api/satire-arena/namo-nimbus/vote',{method:'PUT',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({round,reaction})}),env,{now});
  assert.equal((await vote('shoe')).status,204);
  const voter=sqlite.prepare('SELECT voter FROM arena_cast_votes').get().voter;
  sqlite.prepare('INSERT INTO arena_votes VALUES(?,?,?,?,?)').run(voter,'namo-nimbus','2026-10-17','garland','2026-10-17T12:00:00Z');
  sqlite.prepare('INSERT INTO arena_votes VALUES(?,?,?,?,?)').run('legacy-only','namo-nimbus','2026-10-16','shoe','2026-10-16T12:00:00Z');
  sqlite.prepare('INSERT INTO arena_cast_votes VALUES(?,?,?,?,?)').run('legacy-only','namo-nimbus','2026-10-17','laugh','2026-10-17T12:00:00Z');
  now=new Date('2026-10-18T18:30:00Z');let result=await read(cookie);
  assert.equal(result.round,'2026-01-01');assert.equal(result.resetsAt,'2026-12-31T18:30:00.000Z');assert.equal(result.characters[0].selected,'shoe');assert.equal(result.characters[0].shoe,1);assert.equal(result.characters[0].laugh,1);assert.equal(result.characters[0].garland,0);
  assert.equal((await vote('applause')).status,204);result=await read(cookie);assert.equal(result.characters[0].shoe,0);assert.equal(result.characters[0].applause,1);
  const history=await(await arena(new Request(base+'/api/satire-arena/results'),env,{now})).json();assert.equal(history.days[0].characters[0].applause,1);
  now=new Date('2026-12-31T18:29:59Z');assert.equal((await read(cookie)).characters[0].selected,'applause');
  now=new Date('2026-12-31T18:30:00Z');result=await read(cookie);assert.equal(result.round,'2027-01-01');assert.equal(result.characters[0].selected,null);assert.equal(result.characters[0].laugh,0);assert.equal(result.characters[0].applause,0);assert.equal((await vote('shoe')).status,409);assert.equal((await vote('shoe','2027-01-01')).status,204);
  assert.equal(annualRoundAt(new Date('2028-12-31T18:29:59Z')),'2028-01-01');assert.equal(annualRoundAt(new Date('2028-12-31T18:30:00Z')),'2029-01-01');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_all_votes').get().n,5);
 }finally{sqlite.close();}
});
test('nine-character migration retains older tables, deduplicates overlaps and removes all storage generations',async()=>{
 const {arena}=await import('../apps/satire-arena/backend/edge.mjs'),{env,sqlite}=fixture(),now=new Date('2026-10-10T12:00:00Z');
 const initial=await arena(new Request(base+'/api/satire-arena'),env,{now}),cookie=initial.headers.get('set-cookie').split(';')[0];
 const ballot=await arena(new Request(base+'/api/satire-arena/saffron-sage/vote',{method:'PUT',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({round:'2026-01-01',reaction:'laugh'})}),env,{now});assert.equal(ballot.status,204);
 const voter=sqlite.prepare('SELECT voter FROM arena_cast_votes').get().voter;
 sqlite.prepare('INSERT INTO arena_votes VALUES(?,?,?,?,?)').run(voter,'namo-nimbus','2026-10-10','shoe',now.toISOString());
 sqlite.prepare('INSERT INTO arena_expanded_votes VALUES(?,?,?,?,?)').run(voter,'namo-nimbus','2026-10-10','garland',now.toISOString());
 sqlite.prepare('INSERT INTO arena_cast_votes VALUES(?,?,?,?,?)').run(voter,'namo-nimbus','2026-10-10','applause',now.toISOString());
 sqlite.exec(require('node:fs').readFileSync('apps/satire-arena/database/003-nine-character-arena.sql','utf8'));sqlite.exec(require('node:fs').readFileSync('apps/satire-arena/database/004-highway-budget.sql','utf8'));sqlite.exec(require('node:fs').readFileSync('apps/satire-arena/database/005-speakers.sql','utf8'));
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_votes').get().n,1);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_expanded_votes').get().n,1);
 assert.equal(sqlite.prepare("SELECT reaction FROM arena_all_votes WHERE character='namo-nimbus'").get().reaction,'applause');
 assert.equal((await arena(new Request(base+'/api/satire-arena/mine',{method:'DELETE',headers:{Origin:base,Cookie:cookie,'X-Arena-Confirm':'DELETE'}}),env,{now})).status,204);
 for(const table of ['arena_votes','arena_expanded_votes','arena_cast_votes','arena_additions_votes','arena_speakers_votes'])assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM '+table).get().n,0);sqlite.close();
});
test('expanded choices preserve legacy ballots and neutral laughter never changes fan/critic totals',async()=>{
 const {arena}=await import('../apps/satire-arena/backend/edge.mjs'),{cast,reactions,tally}=await import('../apps/satire-arena/frontend/catalogue.mjs'),{env,sqlite}=fixture();const now=new Date('2026-10-10T12:00:00Z');sqlite.prepare('INSERT INTO arena_votes VALUES(?,?,?,?,?)').run('legacy-private-identity','namo-nimbus','2026-10-10','garland',now.toISOString());const initial=await arena(new Request(base+'/api/satire-arena'),env,{now}),cookie=initial.headers.get('set-cookie').split(';')[0];assert.equal((await initial.json()).characters[0].garland,1);
 for(const c of cast)for(const r of reactions){const response=await arena(new Request(base+'/api/satire-arena/'+c.id+'/vote',{method:'PUT',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({round:'2026-01-01',reaction:r.id})}),env,{now});assert.equal(response.status,204);}
 const result=await(await arena(new Request(base+'/api/satire-arena',{headers:{Cookie:cookie}}),env,{now})).json();assert.equal(result.characters.length,cast.length);assert.deepEqual(tally(result.characters),{fans:1,critics:0,amused:cast.length});assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_all_votes').get().n,cast.length+1);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_votes').get().n,1);sqlite.close();
});
test('cloud ballots are unique, changeable, private, exportable and removable',async()=>{
 const {arena}=await import('../apps/satire-arena/backend/edge.mjs'),{env,sqlite}=fixture();const now=new Date('2026-10-10T12:00:00Z');let cookie='';const request=(path='',method='GET',body,extra={})=>new Request(base+'/api/satire-arena'+path,{method,headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json',...extra},...(body?{body:JSON.stringify(body)}:{})});let response=await arena(request(),env,{now});cookie=response.headers.get('set-cookie').split(';')[0];assert.match(cookie,/__Host-arena=/);const baseline=await response.json();assert.equal(baseline.characters[0].garland,0);
 const cast=reaction=>arena(request('/namo-nimbus/vote','PUT',{reaction,round:baseline.round}),env,{now});const repeated=await Promise.all(Array.from({length:12},()=>cast('garland')));assert.ok(repeated.every(r=>r.status===204));assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_all_votes').get().n,1);let score=await (await arena(request(),env,{now})).json();assert.equal(score.characters[0].garland,1);assert.equal(score.characters[0].selected,'garland');await cast('shoe');score=await (await arena(request(),env,{now})).json();assert.equal(score.characters[0].garland,0);assert.equal(score.characters[0].shoe,1);
 const stranger=await (await arena(new Request(base+'/api/satire-arena'),env,{now})).json();assert.equal(stranger.characters[0].shoe,1);assert.equal(stranger.characters[0].selected,null);assert.ok(!JSON.stringify(stranger).includes('voter'));const exported=await (await arena(request('/mine'),env,{now})).json();assert.equal(exported.votes.length,1);assert.ok(!JSON.stringify(exported).includes('voter'));assert.equal((await arena(request('/mine','DELETE',null,{'X-Arena-Confirm':'DELETE'}),env,{now})).status,204);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_all_votes').get().n,0);sqlite.close();
});
test('IST rollover, invalid/cross-origin ballots, unsigned cookies and unavailable cloud fail safely',async()=>{
 const {arena,roundAt}=await import('../apps/satire-arena/backend/edge.mjs'),{env,sqlite}=fixture();assert.equal(roundAt(new Date('2026-10-10T18:29:59Z')),'2026-10-10');assert.equal(roundAt(new Date('2026-10-10T18:30:00Z')),'2026-10-11');let r=await arena(new Request(base+'/api/satire-arena'),env);const cookie=r.headers.get('set-cookie').split(';')[0],send=(body,headers={})=>arena(new Request(base+'/api/satire-arena/namo-nimbus/vote',{method:'PUT',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json',...headers},body:JSON.stringify(body)}),env);
 assert.equal((await send({reaction:'garland',round:'2000-01-01'})).status,409);assert.equal((await send({reaction:'bogus'})).status,400);assert.equal((await send({reaction:'garland'},{Origin:'https://evil.example'})).status,403);assert.equal((await send({reaction:'garland'},{Cookie:'__Host-arena=forged'})).status,428);env.ARENA_LIMITER.limit=async()=>({success:false});assert.equal((await send({reaction:'garland'})).status,429);assert.equal((await arena(new Request(base+'/api/satire-arena'),{})).status,503);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_all_votes').get().n,0);sqlite.close();
});
test('Arena page stays static while SQL API uses origin; preview cannot reach production votes',async()=>{
 const {handle}=await import('../infrastructure/cloudflare/worker.mjs');let origins=0;const env={ASSETS:{fetch:async()=>new Response('<html>Arena</html>',{headers:{'Content-Type':'text/html'}})}};const origin=async()=>{origins++;throw Error('Origin offline');};assert.equal((await handle(new Request(base+'/satire-arena'),env,origin)).status,200);assert.equal((await handle(new Request(base+'/api/satire-arena'),env,origin)).status,503);assert.equal(origins,1);
 assert.equal((await handle(new Request('https://preview.example/api/satire-arena'),env,origin)).status,503);assert.equal(origins,1);
 const config=JSON.parse(require('node:fs').readFileSync('infrastructure/cloudflare/wrangler.jsonc'));assert.equal(config.env.production.d1_databases,undefined);assert.equal(config.env.preview.d1_databases,undefined);
});
test('SQL Arena proxy retains managed write limits, identity cookies and explicit legacy isolation',async()=>{
 const {handle}=await import('../infrastructure/cloudflare/worker.mjs');let calls=0;const env={ARENA_LIMITER:{limit:async()=>({success:true})}};
 const req=new Request(base+'/api/satire-arena/namo-nimbus/vote',{method:'PUT',headers:{Cookie:'__Host-arena=existing',Origin:base,'Content-Type':'application/json'},body:JSON.stringify({reaction:'laugh',round:'2026-01-01'})});
 const response=await handle(req,env,async forwarded=>{calls++;assert.equal(forwarded.headers.get('Cookie'),'__Host-arena=existing');assert.equal((await forwarded.json()).reaction,'laugh');return new Response(null,{status:204,headers:{'Set-Cookie':'__Host-arena=retained; Secure; HttpOnly','Cache-Control':'no-store'}});});assert.equal(response.status,204);assert.match(response.headers.get('Set-Cookie'),/retained/);assert.equal(calls,1);
 env.ARENA_LIMITER.limit=async()=>({success:false});assert.equal((await handle(req,env,async()=>{throw Error('Must not forward');})).status,429);
 const legacy=fixture();try{assert.equal((await handle(new Request('https://preview.example/api/satire-arena'),{ARENA_STORAGE:'d1',...legacy.env},async()=>{throw Error('Must not forward');})).status,503);}finally{legacy.sqlite.close();}
});
