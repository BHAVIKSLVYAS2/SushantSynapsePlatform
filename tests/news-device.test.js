const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../apps/news/frontend/engine');
const base='https://preview.workers.dev/api/news/sources';
const titles=['Railway connects mountain villages','Film trailer delights cinema fans','Hockey squad wins championship','Digital telescope maps distant stars','Bank reports household savings growth','Island election selects new leader','Painter opens riverfront exhibition','Schools introduce music lessons','Singer releases acoustic album','Runner breaks national record'];
const listing='<div class="article-list"><ul>'+titles.map((title,i)=>`<a href="https://indianexpress.com/article/india/story-${i}/">${title}</a>`).join('')+'</ul>';
const article='<meta property="article:published_time" content="2025-01-01T12:00:00+05:30"><meta name="description" content="A short dated source description for this headline.">';
test('independent source service validates before fetching and never reaches arbitrary URLs',async()=>{
  const {newsSources}=await import('../infrastructure/cloudflare/news-sources.mjs');
  let calls=0;
  const env={NEWS_LIMITER:{limit:async()=>{calls++;return {success:true};}}};
  for(const query of ['','?date=2025-02-30','?date=2099-01-01','?date=2025-01-01&url=https://evil.test','?date=2025-01-01&date=2025-01-02']){
    assert.equal((await newsSources(new Request(base+query),env)).status,400);
  }
  assert.equal((await newsSources(new Request(base+'?date=2025-01-01',{method:'POST'}),env)).status,405);
  assert.equal(calls,0);
  assert.equal((await newsSources(new Request(base+'?date=2025-01-01'),{})).status,503);
  assert.equal((await newsSources(new Request(base+'?date=2025-01-01'),{NEWS_LIMITER:{limit:async()=>({success:false})}})).status,429);
});
test('source metadata is cached independently; browser drafts use the same editorial rules without publication',async()=>{
  const {newsSources}=await import('../infrastructure/cloudflare/news-sources.mjs');
  let calls=0,limits=0;const entries=new Map();
  const cache={match:async key=>entries.get(key.url)?.clone(),put:async(key,response)=>entries.set(key.url,response.clone())};
  const env={NEWS_LIMITER:{limit:async()=>{limits++;return {success:true};}}};
  const options={cache,now:new Date('2025-01-02T10:00:00Z'),fetchImpl:async(url,init)=>{
    calls++;assert.equal(new URL(url).origin,'https://indianexpress.com');assert.equal(init.redirect,'manual');assert.equal(init.headers,undefined);
    return new Response(url.includes('/archive/')?listing:article);
  }};
  const request=new Request(base+'?date=2025-01-01',{headers:{Cookie:'private=secret'}});
  const response=await newsSources(request,env,options);assert.equal(response.status,200);
  const preview=await response.json();assert.equal(preview.cutoff,'2025-01-01T18:29:59.999Z');assert.equal(preview.stories.length,10);
  assert.equal(calls,14);assert.equal(limits,1);
  assert.deepEqual(await (await newsSources(request,env,options)).json(),preview);assert.equal(calls,14);assert.equal(limits,1);
  const draft=engine.draftEdition(preview);assert.equal(draft.stories.length,10);assert.match(draft.satire.body,/Panel 3/);assert.equal(draft.promptVersion,'news-comic-v2');
});
test('unavailable, oversized and redirected sources never produce partial editions',async()=>{
  const {newsSources}=await import('../infrastructure/cloudflare/news-sources.mjs');
  const request=new Request(base+'?date=2025-01-01'),env={NEWS_LIMITER:{limit:async()=>({success:true})}};
  for(const fetchImpl of [async()=>new Response('down',{status:503}),async()=>new Response('x'.repeat(2000001)),async()=>new Response(null,{status:302,headers:{Location:'https://evil.test/'}})]){
    const response=await newsSources(request,env,{fetchImpl});assert.equal(response.status,502);assert.equal((await response.json()).stories,undefined);
  }
});

test('BBC feed fallback verifies dates, source links, deduplication, limits and explicit attribution',async()=>{
  const {newsSources}=await import('../infrastructure/cloudflare/news-sources.mjs');
  const xml='<rss><channel>'+titles.map((title,i)=>`<item><title><![CDATA[${title}]]></title><link>https://www.bbc.com/news/articles/item${i}?source=rss</link><pubDate>Wed, 01 Jan 2025 12:00:00 GMT</pubDate><description><![CDATA[A brief <b>source</b> description.]]></description></item>`).join('')+'</channel></rss>';
  const cutoff='2025-01-01T18:29:59.999Z';
  assert.equal(engine.parseFeed(xml,cutoff,'World').length,10);
  assert.equal(engine.parseFeed(xml,'2024-12-31T18:29:59.999Z').length,0);
  assert.equal(engine.parseFeed(xml,'2025-01-02T18:29:59.999Z').length,0);
  assert.equal(engine.parseFeed(xml.replaceAll('https://www.bbc.com','https://evil.test'),cutoff).length,0);
  let calls=0;
  const fetchImpl=async(url,options)=>{calls++;assert.equal(options.redirect,'manual');return new URL(url).hostname==='indianexpress.com'?new Response(null,{status:403}):new Response(xml);};
  const response=await newsSources(new Request(base+'?date=2025-01-01'),{NEWS_LIMITER:{limit:async()=>({success:true})}},{fetchImpl});
  assert.equal(response.status,200);const preview=await response.json();assert.equal(preview.stories.length,10);assert.equal(calls,9);
  assert.ok(preview.stories.every(s=>s.provider==='BBC'&&s.source==='BBC News'&&!s.url.includes('?')));
  assert.match(engine.draftEdition(preview).stories[0].brief,/Source excerpt/);
});
