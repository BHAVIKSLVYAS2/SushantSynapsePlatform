const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('../apps/satire-arena/tests/fixture.cjs');
const base='https://apps.sushantsynapse.com';

test('actor and corporate ballots replace independently, retain legacy/anchor data and support private export/removal',async()=>{
 const {arena}=await import('../apps/satire-arena/backend/edge.mjs'),{cast}=await import('../apps/satire-arena/frontend/catalogue.mjs');
 const {env,sqlite}=fixture(),now=new Date('2026-10-23T12:00:00Z');
 try{
  sqlite.prepare('INSERT INTO arena_cast_votes VALUES(?,?,?,?,?)').run('legacy','namo-nimbus','2026-01-01','garland',now.toISOString());
  sqlite.prepare('INSERT INTO arena_anchors_votes VALUES(?,?,?,?,?)').run('anchor','roar-nab','2026-01-01','applause',now.toISOString());
  const initial=await arena(new Request(base+'/api/satire-arena'),env,{now}),cookie=initial.headers.get('set-cookie').split(';')[0];
  const send=(path='',method='GET',body)=>arena(new Request(base+'/api/satire-arena'+path,{method,headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json','X-Arena-Confirm':'DELETE'},...(body?{body:JSON.stringify(body)}:{})}),env,{now});
  const people=cast.filter(c=>['actors','corporates'].includes(c.arena));assert.equal(people.length,15);
  for(const c of people)assert.equal((await send('/'+c.id+'/vote','PUT',{round:'2026-01-01',reaction:'garland'})).status,204);
  assert.equal((await send('/king-khanvas/vote','PUT',{round:'2026-01-01',reaction:'laugh'})).status,204);
  assert.equal((await send('/mukesh-megaplan/vote','PUT',{round:'2026-01-01',reaction:'tomato'})).status,204);
  const scores=(await(await send()).json()).characters;
  assert.deepEqual(scores.find(c=>c.id==='king-khanvas'),{id:'king-khanvas',garland:0,applause:0,shoe:0,finger:0,tomato:0,laugh:1,selected:'laugh'});
  assert.equal(scores.find(c=>c.id==='mukesh-megaplan').tomato,1);assert.equal(scores.find(c=>c.id==='namo-nimbus').garland,1);assert.equal(scores.find(c=>c.id==='roar-nab').applause,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_spotlight_votes').get().n,12);
  const exported=await(await send('/mine')).json();assert.equal(exported.votes.length,15);assert.ok(!JSON.stringify(exported).includes('voter'));
  assert.equal((await send('/invented-ceo/vote','PUT',{round:'2026-01-01',reaction:'laugh'})).status,400);
  assert.throws(()=>sqlite.prepare('INSERT INTO arena_spotlight_votes VALUES(?,?,?,?,?)').run('x','roar-nab','2026-01-01','laugh',now.toISOString()),/CHECK/);
  assert.equal((await send('/mine','DELETE')).status,204);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_spotlight_votes').get().n,0);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_all_votes').get().n,2);
 }finally{sqlite.close();}
});

test('all actor and corporate profiles have their own content, six reactions, same-arena navigation and correct share artwork',async()=>{
 const {publicPage}=await import('../apps/satire-arena/backend/public-pages.mjs'),{cast,portraitArt}=await import('../apps/satire-arena/frontend/catalogue.mjs');
 for(const c of cast.filter(c=>['actors','corporates'].includes(c.arena))){
  const response=publicPage(new Request(base+'/satire-arena/characters/'+c.id),{posts:[],characters:[]});assert.equal(response.status,200);const html=await response.text();
  assert.match(html,new RegExp('/satire-arena/'+c.arena));assert.match(html,/BEHIND THE PUNCHLINE/);assert.equal((html.match(/data-reaction=/g)||[]).length,6);assert.equal((html.match(/<blockquote>/g)||[]).length,3);
  assert.ok(!html.includes('/characters/roar-nab'));assert.ok(!html.includes('/characters/namo-nimbus'));
  const art=portraitArt(c);assert.equal(art.file,c.portrait>=31?'corporate-workweek-fast.webp':c.arena+'-fast.webp');assert.equal(art.columns,3);assert.ok(art.column>=0&&art.column<3&&art.row>=0&&art.row<2);assert.ok(html.includes('/satire-arena/'+art.file));
 }
});
