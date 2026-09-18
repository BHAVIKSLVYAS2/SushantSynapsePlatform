const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Store}=require('../apps/advocate/backend/store');
const {createNewsRepository}=require('../apps/news/backend/repository');
const {createFetchService}=require('../apps/news/backend/fetch-service');
const {createPibProvider,parseRelease}=require('../apps/news/backend/pib-provider');
const {draftEdition,createPublicationService}=require('../apps/news/backend/publication');
const cutoff='2025-01-01T12:00:00.000Z';
const article=id=>`<h2 id="Titleh2">Public works update ${id} &amp; review</h2><div>Posted On: 1 JAN 2025 5:00PM by PIB Delhi</div><p>The department has published an update on its programme, with details of the next review and the areas discussed at the meeting.</p>`;
test('PIB adapter validates actual dates and bounded fixed-host excerpts',async()=>{
 let calls=0;
 const provider=createPibProvider({fetchImpl:async(url,options)=>{calls++;assert.equal(new URL(url).hostname,'www.pib.gov.in');assert.equal(options.redirect,'error');return new Response(url.includes('Allrel')?Array.from({length:12},(_,i)=>`<a href='/PressReleaseDetail.aspx?PRID=${i+1}'>x</a>`).join(''):article(new URL(url).searchParams.get('PRID')));}});
 const stories=await provider.fetchStories(cutoff);assert.equal(stories.length,10);assert.equal(calls,13);assert.equal(stories[0].publishedAt,'2025-01-01T11:30:00.000Z');assert.match(stories[0].title,/& review/);
 assert.equal(parseRelease(article(1),'https://www.pib.gov.in/', '2025-01-01T10:00:00Z'),null);
 assert.equal(parseRelease(article(1),'https://www.pib.gov.in/', '2025-01-03T12:00:00Z'),null);
 await assert.rejects(createPibProvider({fetchImpl:async()=>new Response('No releases')}).fetchStories(cutoff),/Fewer than ten/);
 await assert.rejects(createPibProvider({fetchImpl:async()=>new Response('x'.repeat(2000001))}).fetchStories(cutoff),/too large/);
});
test('publication is atomic, source-grounded, reusable after failure and cached across restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-publish-'));let store=new Store(dir),calls=0;
 try{
  let repository=createNewsRepository(store);
  const stories=Array.from({length:10},(_,i)=>parseRelease(article(i),'https://www.pib.gov.in/PressReleasePage.aspx?PRID='+i,cutoff));
  const preview={date:'2025-01-01',cutoff,stories};const draft=draftEdition(preview);
  assert.deepEqual(draft.stories.map(s=>s.brief),stories.map(s=>s.description));assert.match(draft.satire.body,/fictional humour/);assert.ok(draft.satire.body.includes(stories[draft.satire.storyPosition-1].title));
  assert.throws(()=>draftEdition({...preview,stories:stories.slice(1)}),/Ten source/);
  assert.throws(()=>draftEdition({...preview,stories:stories.map(s=>({...s,publishedAt:null}))}),/verified publication/);
  const fetching=createFetchService({store,repository,clock:()=>new Date(cutoff),provider:{fetchStories:async()=>{calls++;return stories;}}});
  const service=createPublicationService({repository,fetching});
  store.sql.exec("CREATE TEMP TRIGGER stop_publication BEFORE INSERT ON news_stories WHEN NEW.position=5 BEGIN SELECT RAISE(ABORT,'interruption'); END;");
  await assert.rejects(service.fetchDate(),/interruption/);assert.equal(repository.get(preview.date),null);assert.equal(fetching.preview(preview.date).state,'ready');
  store.sql.exec('DROP TRIGGER stop_publication');
  const result=await service.fetchDate();assert.equal(result.state,'published');assert.equal(result.edition.stories.length,10);assert.equal(calls,1);
  assert.equal((await service.fetchDate()).cached,true);assert.equal(calls,1);
  store.sql.close();store=new Store(dir);repository=createNewsRepository(store);
  const reopened=createPublicationService({repository,fetching:createFetchService({store,repository,clock:()=>new Date(cutoff),provider:{fetchStories:()=>{throw Error('must not fetch');}}})});
  assert.deepEqual((await reopened.fetchDate()).edition,result.edition);
 }finally{store.sql.close();fs.rmSync(dir,{recursive:true,force:true});}
});
