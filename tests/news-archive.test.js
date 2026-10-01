const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Store}=require('../apps/advocate/backend/store');
const {createNewsRepository}=require('../apps/news/backend/repository');
const {createFetchService}=require('../apps/news/backend/fetch-service');
const {createPublicationService,draftEdition}=require('../apps/news/backend/publication');
const {createArchiveProvider,parseArticle,selectDiverse,duplicate}=require('../apps/news/backend/archive-provider');
const cutoff='2025-01-01T18:29:59.999Z';
const sections=['india','entertainment','sports','technology','business','world','lifestyle','education','entertainment','sports'];
const titles=['Railway connects mountain villages','Film trailer delights cinema fans','Hockey squad wins championship','Digital telescope maps distant stars','Bank reports household savings growth','Island election selects new leader','Painter opens riverfront exhibition','Schools introduce music lessons','Singer releases acoustic album','Runner breaks national record'];
const candidates=titles.map((title,i)=>({title,url:`https://indianexpress.com/article/${sections[i]}/story-${i}/`}));
const html='<meta property="article:published_time" content="2025-01-01T12:00:00+05:30"><meta name="description" content="A dated source excerpt explains this news headline and its background for interested readers.">';
test('historical provider verifies source dates, balances topics and bounds fixed-host requests',async()=>{
 let calls=0;
 const provider=createArchiveProvider({fetchImpl:async(url,options)=>{calls++;assert.equal(new URL(url).hostname,'indianexpress.com');assert.equal(options.redirect,'manual');return new Response(url.includes('/archive/')?'<div class="article-list"><ul>'+candidates.map(s=>`<li><a href="${s.url}">${s.title}</a></li>`).join('')+'</ul>':html);}});
 const stories=await provider.fetchStories(cutoff);assert.equal(stories.length,10);assert.ok(calls<=28);assert.equal(stories.filter(s=>s.category.includes('Masala')).length,2);
 assert.equal(parseArticle(html,candidates[0],'2025-01-02T18:29:59.999Z'),null);
 assert.equal(parseArticle(html.replace('2025-01-01','2025-01-02'),candidates[0],cutoff),null);
 assert.equal(parseArticle('<meta name="description" content="Missing timestamp">',candidates[0],cutoff),null);
 assert.ok(duplicate({title:'Film trailer delights cinema fans',url:'a'},{title:'New film trailer delights cinema fans today',url:'b'}));
 assert.equal(selectDiverse([...stories,...stories]).length,10);
 assert.equal(selectDiverse(candidates.map((s,i)=>({...s,url:`https://indianexpress.com/article/india/unique-${i}/`}))).length,10);
 await assert.rejects(createArchiveProvider({fetchImpl:async()=>new Response('Unavailable',{status:503})}).fetchStories(cutoff),/No edition was saved/);
 const draft=draftEdition({date:'2025-01-01',cutoff,stories});assert.match(draft.satire.title,/cinema/);assert.match(draft.satire.body,/Panel 3/);assert.ok(draft.satire.body.includes(stories[draft.satire.storyPosition-1].title));
});
test('past date publishes at IST day end, persists and future requests consume no budget',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-history-'));const store=new Store(dir);let calls=0;
 try{
  const repository=createNewsRepository(store),fetching=createFetchService({store,repository,clock:()=>new Date('2025-01-03T20:00:00Z'),provider:{fetchStories:async c=>{calls++;assert.equal(c,cutoff);return candidates.map(s=>parseArticle(html,s,c));}}});
  const publication=createPublicationService({repository,fetching});
  await assert.rejects(publication.fetchDate('2025-01-05'),e=>e.status===400&&/Future/.test(e.message));
  assert.equal(store.sql.prepare('SELECT COUNT(*) n FROM news_fetch_budget').get().n,0);
  const result=await publication.fetchDate('2025-01-01');assert.equal(result.edition.cutoff,cutoff);assert.equal(result.edition.stories.length,10);
  assert.equal((await publication.fetchDate('2025-01-01')).cached,true);assert.equal(calls,1);
  await assert.rejects(publication.fetchDate('2025-02-30'),e=>e.status===400);
 }finally{store.sql.close();fs.rmSync(dir,{recursive:true,force:true});}
});
