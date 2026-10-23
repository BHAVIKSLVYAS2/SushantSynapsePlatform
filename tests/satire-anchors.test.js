const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('../apps/satire-arena/tests/fixture.cjs');
const origin='https://apps.sushantsynapse.com';

test('news-anchor choices coexist with legacy politics, change, export and remove atomically',async()=>{
 const {arena}=await import('../apps/satire-arena/backend/edge.mjs');
 const {cast}=await import('../apps/satire-arena/frontend/catalogue.mjs');
 const {env,sqlite}=fixture(),now=new Date('2026-10-23T12:00:00Z');
 try{
  sqlite.prepare('INSERT INTO arena_votes VALUES(?,?,?,?,?)').run('legacy','namo-nimbus','2026-01-01','garland',now.toISOString());
  const initial=await arena(new Request(origin+'/api/satire-arena'),env,{now});
  const cookie=initial.headers.get('set-cookie').split(';')[0];
  const request=(path='',method='GET',body)=>arena(new Request(origin+'/api/satire-arena'+path,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-Arena-Confirm':'DELETE'},...(body?{body:JSON.stringify(body)}:{})}),env,{now});
  const anchors=cast.filter(c=>c.arena==='news-anchors');assert.equal(anchors.length,6);
  for(const c of anchors)assert.equal((await request('/'+c.id+'/vote','PUT',{round:'2026-01-01',reaction:'applause'})).status,204);
  assert.equal((await request('/'+anchors[0].id+'/vote','PUT',{round:'2026-01-01',reaction:'laugh'})).status,204);
  const scores=await(await request()).json();assert.equal(scores.characters.find(c=>c.id==='namo-nimbus').garland,1);
  const changed=scores.characters.find(c=>c.id===anchors[0].id);assert.equal(changed.applause,0);assert.equal(changed.laugh,1);assert.equal(changed.selected,'laugh');
  const exported=await(await request('/mine')).json();assert.equal(exported.votes.length,6);assert.ok(exported.votes.every(v=>anchors.some(c=>c.id===v.character)));
  assert.equal((await request('/mine','DELETE')).status,204);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_anchors_votes').get().n,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_votes').get().n,1);
 }finally{sqlite.close();}
});

test('anchor details stay within their lineup and provide the full voting and biography surface',async()=>{
 const {publicPage}=await import('../apps/satire-arena/backend/public-pages.mjs');
 const {cast}=await import('../apps/satire-arena/frontend/catalogue.mjs');
 for(const c of cast.filter(c=>c.arena==='news-anchors')){
  const response=publicPage(new Request(origin+'/satire-arena/characters/'+c.id),{posts:[],characters:[]});assert.equal(response.status,200);
  const html=await response.text();assert.match(html,/BEHIND THE PUNCHLINE/);assert.match(html,/STRAIGHT FROM THE SCRIPT/);assert.match(html,/\/satire-arena\/news-anchors/);
  assert.equal((html.match(/data-reaction=/g)||[]).length,6);assert.ok(!html.includes('/characters/namo-nimbus'));
 }
});
