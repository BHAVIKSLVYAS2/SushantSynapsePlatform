const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {DatabaseSync}=require('node:sqlite'),engine=require('../apps/news/frontend/engine');
test('edge retry advances an incomplete cutoff, publishes verified stories and preserves the saved edition',async()=>{
 const {news}=await import('../apps/news/backend/edge.mjs'),db=new DatabaseSync(':memory:');
 db.exec(fs.readFileSync('apps/news/database/001-editions.sql','utf8'));db.exec(fs.readFileSync('apps/news/database/002-fetch-budget.sql','utf8'));
 const now=new Date(),date=engine.indiaDate(now),oldCutoff=new Date(date+'T00:00:00+05:30').toISOString(),oldAt=new Date(now-120000).toISOString();
 db.prepare("INSERT INTO news_runs(date,cutoff,state,attempts,createdAt,updatedAt) VALUES(?,?,'failed',1,?,?)").run(date,oldCutoff,oldAt,oldAt);
 const repo={first:async(sql,...args)=>db.prepare(sql).get(...args),all:async(sql,...args)=>db.prepare(sql).all(...args),statement:(sql,...args)=>({sql,args}),begin:async()=>{},commit:async writes=>{db.exec('BEGIN');try{for(const w of writes)db.prepare(w.sql).run(...w.args);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}};
 const titles=['Railway opens mountain connection','Singer releases acoustic album','Hockey squad wins championship','Telescope maps distant planets','Bank reports savings growth','Island election chooses leader','Painter opens river exhibition','Schools introduce music lessons','Film trailer delights fans','Runner breaks national record'];
 const xml='<rss>'+titles.map((title,i)=>`<item><title>${title}</title><link>https://www.bbc.com/news/articles/item${i}</link><pubDate>${new Date(now-1000).toUTCString()}</pubDate><description>Verified publication description for this source report.</description></item>`).join('')+'</rss>';
 const originalFetch=globalThis.fetch;let calls=0;globalThis.fetch=async url=>{calls++;return new URL(url).hostname==='indianexpress.com'?new Response('',{status:403}):new Response(xml);};
 const invoke=()=>news({repo,route:'news/fetch',request:new Request('https://test.example/api/news/fetch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date})}),user:null,env:{NEWS_LIMITER:{limit:async()=>({success:true})}}});
 try{const result=await (await invoke()).json();assert.equal(result.state,'published');assert.equal(result.edition.stories.length,10);assert.ok(Date.parse(result.edition.cutoff)>Date.parse(oldCutoff));assert.equal(db.prepare('SELECT cutoff FROM news_runs WHERE date=?').get(date).cutoff,result.edition.cutoff);const count=calls;const again=await(await invoke()).json();assert.equal(again.cached,true);assert.deepEqual(again.edition,result.edition);assert.equal(calls,count);}finally{globalThis.fetch=originalFetch;db.close();}
});
