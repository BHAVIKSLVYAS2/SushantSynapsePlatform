const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {DatabaseSync}=require('node:sqlite'),{fixture}=require('../apps/satire-arena/tests/fixture.cjs');
const addition=fs.readFileSync('apps/satire-arena/database/008-workweek-corporates.sql','utf8');
test('workweek migration preserves every old ballot and extends only the aggregate view',()=>{
 const db=new DatabaseSync(':memory:');try{
  for(const file of ['001-arena','002-expanded-arena','003-nine-character-arena','004-highway-budget','005-speakers','006-news-anchors','007-spotlight-arenas'])db.exec(fs.readFileSync('apps/satire-arena/database/'+file+'.sql','utf8'));
  const tables=['arena_votes','arena_expanded_votes','arena_cast_votes','arena_additions_votes','arena_speakers_votes','arena_anchors_votes','arena_spotlight_votes'],ids=['namo-nimbus','namo-nimbus','namo-nimbus','highway-hari','rally-raja','roar-nab','mukesh-megaplan'];
  for(let i=0;i<tables.length;i++)db.prepare('INSERT INTO '+tables[i]+' VALUES(?,?,?,?,?)').run('retained-'+i,ids[i],'2026-01-01','garland','2026-10-24T10:00:00.000Z');
  const before=tables.map(t=>db.prepare('SELECT * FROM '+t).all()),view=db.prepare('SELECT * FROM arena_all_votes ORDER BY voter').all();db.exec(addition);db.exec(addition);
  assert.deepEqual(tables.map(t=>db.prepare('SELECT * FROM '+t).all()),before);assert.deepEqual(db.prepare('SELECT * FROM arena_all_votes ORDER BY voter').all(),view);
  db.prepare('INSERT INTO arena_boardroom_votes VALUES(?,?,?,?,?)').run('new','ghanta-guru','2026-01-01','laugh','2026-10-24T10:01:00.000Z');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM arena_all_votes').get().n,view.length+1);
  assert.throws(()=>db.prepare('INSERT INTO arena_boardroom_votes VALUES(?,?,?,?,?)').run('bad','mukesh-megaplan','2026-01-01','laugh','2026-10-24T10:01:00.000Z'),/CHECK/);
  for(const dir of ['d1-free-migrations','d1-migrations'])assert.equal(fs.readFileSync('infrastructure/cloudflare/'+dir+'/0009-workweek-corporates.sql','utf8'),addition);
 }finally{db.close();}
});
test('new corporate choices replace, appear in summaries and remove only the current browser ballots',async()=>{
 const {arena}=await import('../apps/satire-arena/backend/edge.mjs'),{env,sqlite}=fixture(),origin='https://example.test',now=new Date('2026-10-24T10:00:00Z');
 try{sqlite.prepare('INSERT INTO arena_spotlight_votes VALUES(?,?,?,?,?)').run('someone-else','mukesh-megaplan','2026-01-01','applause',now.toISOString());const initial=await arena(new Request(origin+'/api/satire-arena'),env,{now}),cookie=initial.headers.get('set-cookie').split(';')[0];
  const send=(path='',method='GET',body)=>arena(new Request(origin+'/api/satire-arena'+path,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-Arena-Confirm':'DELETE'},...(body?{body:JSON.stringify(body)}:{})}),env,{now});
  for(const id of ['ghanta-guru','sunday-seth','mileage-maharaj']){for(const reaction of ['garland','tomato'])assert.equal((await send('/'+id+'/vote','PUT',{round:'2026-01-01',reaction})).status,204);}
  const summary=await(await send('?arena=corporates&summary=1')).json();assert.equal(summary.characters.length,9);assert.equal(summary.days[0].total,4);for(const c of summary.characters.filter(c=>c.id.endsWith('guru')||c.id==='sunday-seth'||c.id==='mileage-maharaj')){assert.equal(c.tomato,1);assert.equal(c.garland,0);}
  assert.equal((await(await send('/mine')).json()).votes.length,3);assert.equal((await send('/mine','DELETE')).status,204);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_boardroom_votes').get().n,0);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM arena_spotlight_votes').get().n,1);
 }finally{sqlite.close();}
});
