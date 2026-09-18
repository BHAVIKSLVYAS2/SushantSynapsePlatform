const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {Store}=require('../apps/advocate/backend/store');
const {createNewsRepository,validDate}=require('../apps/news/backend/repository');
const {createNews}=require('../apps/news/backend/routes');
const {edition}=require('../apps/news/tests/fixtures');
test('News additive migration, atomic immutable editions, pagination, restart and full SQL restore',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-store-'));let store=new Store(dir);
 try{
  store.create('clients',{name:'Preserved client'});store.addFile('preserved','sample.bin','application/octet-stream',Buffer.from([0,1,255]));
  const original=store.all('clients');const repo=createNewsRepository(store);
  const saved=repo.publish(edition('2025-01-02'));assert.equal(saved.author,'Bhavik');assert.equal(saved.stories.length,10);
  assert.deepEqual(repo.publish({...edition('2025-01-02'),satire:{}}),saved);
  for(const date of ['2025-02-29','2025-13-01','2025-1-01','2025-01-01junk'])assert.throws(()=>validDate(date));
  const bad=edition('2025-01-03');bad.stories[9].url='javascript:alert(1)';assert.throws(()=>repo.publish(bad),/source URL/);assert.equal(repo.get(bad.date),null);
  assert.throws(()=>repo.publish({...edition('2025-01-03'),stories:[]}),/ten stories/);
  const duplicate=edition('2025-01-03');duplicate.stories[9].url=duplicate.stories[0].url;assert.throws(()=>repo.publish(duplicate),/Duplicate/);
  const stale=edition('2025-01-03');stale.stories[0].publishedAt='2025-01-01T00:00:00Z';assert.throws(()=>repo.publish(stale),/news window/);
  store.sql.exec("CREATE TEMP TRIGGER fail_news_insert BEFORE INSERT ON news_stories WHEN NEW.position=5 BEGIN SELECT RAISE(ABORT,'test atomic failure'); END;");
  assert.throws(()=>repo.publish(edition('2025-01-03')),/test atomic failure/);assert.equal(repo.get('2025-01-03'),null);
  assert.equal(store.sql.prepare("SELECT count(*) n FROM news_stories WHERE editionDate='2025-01-03'").get().n,0);store.sql.exec('DROP TRIGGER fail_news_insert');
  for(let i=1;i<=31;i++)repo.publish(edition('2024-12-'+String(i).padStart(2,'0')));
  const first=repo.list();assert.equal(first.editions.length,30);assert.equal(repo.list(first.nextBefore).editions.length,2);
  const restored=new DatabaseSync(':memory:');restored.exec(store.exportSql());assert.equal(restored.prepare('SELECT count(*) n FROM news_editions').get().n,32);assert.equal(restored.prepare('SELECT count(*) n FROM news_stories').get().n,320);assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');restored.close();
  store.sql.close();store=new Store(dir);const reopened=createNewsRepository(store);assert.deepEqual(reopened.get('2025-01-02'),saved);assert.deepEqual(store.all('clients'),original);assert.deepEqual(Buffer.from(store.file('preserved').content),Buffer.from([0,1,255]));assert.equal(store.sql.prepare('SELECT count(*) n FROM news_migrations').get().n,2);
 }finally{store.sql.close();if(path.dirname(dir)===path.resolve(os.tmpdir()))fs.rmSync(dir,{recursive:true,force:true});}
});
test('News archive routes validate dates, deny writes and enforce preview access before reading',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-api-'));const store=new Store(dir);
 try{
  let user={role:'Owner'},allowed=true;
  const handler=createNews({store,auth:{hasAppAccess:()=>allowed,owner(u){if(u.role!=='Owner'){const e=Error('Owner only');e.status=403;throw e;}}}});
  const call=async(route,method='GET',query='')=>{let result;await handler({route,method,user,req:{url:'/api/'+route+query},json:(status,data)=>{result={status,data};}});return result;};
  assert.deepEqual((await call('news/editions')).data,{editions:[],nextBefore:null});
  await assert.rejects(call('news/editions/2025-01-01'),e=>e.status===404);
  await assert.rejects(call('news/editions/2025-02-30'),e=>e.status===400);
  await assert.rejects(call('news/editions','GET','?before=invalid'),e=>e.status===400);
  await assert.rejects(call('news/editions','POST'),e=>e.status===405);
  createNewsRepository(store).publish(edition('2025-01-01'));
  assert.equal((await call('news/editions/2025-01-01')).data.stories.length,10);
  allowed=false;await assert.rejects(call('news/editions/2025-01-01'),e=>e.status===403);
  allowed=true;user={role:'Clerk'};await assert.rejects(call('news/editions'),e=>e.status===403);
  user=null;await assert.rejects(call('news/editions'),e=>e.status===401);
 }finally{store.sql.close();if(path.dirname(dir)===path.resolve(os.tmpdir()))fs.rmSync(dir,{recursive:true,force:true});}
});
