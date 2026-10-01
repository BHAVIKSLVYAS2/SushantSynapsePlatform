'use strict';
// Shared source parsing and editorial rules; no persistence or Node dependencies.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SynapseNews=factory();
})(globalThis,()=>{
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
function clean(value){
  const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',ndash:'–',mdash:'—'};
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(m,key)=>{if(key[0]!=='#')return entities[key]??m;const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();
}
const ORIGIN='https://indianexpress.com';
const indiaDate=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(date));
function desk(url){
  if(/\/entertainment\//.test(url))return 'Masala · Entertainment';
  if(/\/sports\//.test(url))return 'Sport';
  if(/\/technology\//.test(url))return 'Tech';
  if(/\/business\//.test(url))return 'Money';
  if(/\/(lifestyle|trending)\//.test(url))return 'Life & culture';
  if(/\/world\//.test(url))return 'World';
  if(/\/(education|health)\//.test(url))return 'Learning & health';
  return 'India';
}
const tokens=s=>new Set(s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>2&&!['the','and','for','with','from','that','this','says','after','india','new'].includes(w)));
function duplicate(a,b){
  if(a.url===b.url)return true;
  const x=tokens(a.title),y=tokens(b.title),overlap=[...x].filter(w=>y.has(w)).length;
  return overlap/Math.max(1,Math.min(x.size,y.size))>=0.65;
}
function selectDiverse(items,limit=10){
  const groups=new Map();
  for(const item of items){const key=item.category||desk(item.url);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
  const selected=[];
  // Two entertainment slots when available, then round-robin desks. Never pad with duplicates.
  const order=['India','Masala · Entertainment','Sport','Tech','Money','World','Life & culture','Learning & health'];
  for(let round=0;round<limit&&selected.length<limit;round++)for(const key of order){
    const queue=groups.get(key)||[];
    while(queue.length){const item=queue.shift();if(selected.some(s=>duplicate(s,item)))continue;selected.push(item);break;}
    if(selected.length===limit)break;
  }
  return selected;
}
function parseListing(html){
  const section=html.match(/<div class="article-list">([\s\S]*?)<\/ul>/)?.[1]||'';
  return [...section.matchAll(/<a\b[^>]*href=["'](https:\/\/indianexpress\.com\/article\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({url:clean(m[1]),title:clean(m[2])})).filter(s=>s.title&&s.title.length<=300);
}
function parseArticle(html,candidate,cutoff){
  const meta={};
  for(const tag of html.matchAll(/<meta\b[^>]*>/gi)){
    const attrs={};for(const m of tag[0].matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g))attrs[m[1].toLowerCase()]=m[3];
    meta[attrs.property||attrs.name]=attrs.content;
  }
  const at=Date.parse(meta['article:published_time']);
  if(!Number.isFinite(at)||at>Date.parse(cutoff)||indiaDate(at)!==indiaDate(cutoff))return null;
  const description=clean(meta['og:description']||meta.description||'').split(/\s+/).slice(0,25).join(' ');
  if(!description)return null;
  return {...candidate,source:'The Indian Express',provider:'IndianExpress',publishedAt:new Date(at).toISOString(),observedAt:cutoff,description,category:desk(candidate.url)};
}
function createArchiveProvider({fetchImpl=globalThis.fetch,timeoutMs=90000}={}){
  return {async fetchStories(cutoff){
    const date=indiaDate(cutoff),signal=AbortSignal.timeout(timeoutMs);
    async function read(url){
      const target=new URL(url);
      if(target.origin!==ORIGIN||target.username||target.password)fail(400,'Invalid news source');
      // Workers supports manual redirects; reject non-2xx without following them.
      const response=await fetchImpl(target.href,{signal,redirect:'manual'});
      if(!response.ok){await response.body?.cancel();throw Error('Source unavailable (HTTP '+response.status+')');}
      const decoder=new TextDecoder();let contents='',size=0;
      for await(const chunk of response.body){size+=chunk.length;if(size>2000000)fail(502,'News source response was too large.');contents+=decoder.decode(chunk,{stream:true});}
      return contents+decoder.decode();
    }
    const archive=ORIGIN+'/archive/'+date.replaceAll('-','/')+'/';
    const pages=await Promise.allSettled([archive,archive+'page/2/',archive+'page/3/',archive+'page/4/'].map(read));
    if(pages.every(p=>p.status==='rejected'))fail(502,'Source archive unavailable: '+pages[0].reason.message+'. No edition was saved.');
    const candidates=selectDiverse(pages.flatMap(p=>p.status==='fulfilled'?parseListing(p.value):[]),24);
    const stories=[];
    for(let i=0;i<candidates.length;i+=4){
      const batch=await Promise.allSettled(candidates.slice(i,i+4).map(async s=>parseArticle(await read(s.url),s,cutoff)));
      for(const result of batch)if(result.status==='fulfilled'&&result.value)stories.push(result.value);
    }
    const selected=selectDiverse(stories);
    if(selected.length<10)fail(502,`Only ${selected.length} distinct dated stories were available for ${date}. No edition was saved. Try again later; archive coverage varies by date.`);
    return selected;
  }};
}
function draftEdition(preview){
  if(preview.stories?.length!==10)fail(502,'Ten source stories are required before publication.');
  const stories=preview.stories.map(s=>{
    if(!['PIB','IndianExpress','BBC'].includes(s.provider)||!s.publishedAt||typeof s.description!=='string'||!s.description.trim())fail(502,'These source stories do not contain verified publication times and reusable excerpts.');
    return {...s,brief:s.provider!=='PIB'?`${s.category||'News'} · Source excerpt: ${s.description}…`:s.description};
  });
  const safe=stories.filter(s=>!/death|killed|rape|assault|suicide|attack|disaster|murder|war|victim|arrest|accus|probe|fraud/i.test(s.title));
  const chosen=safe.find(s=>/film|movie|trailer|cinema|music|festival|technology|digital|launch|cricket|sport/i.test(s.title))||safe[0];
  const storyPosition=chosen?stories.indexOf(chosen)+1:1,subject=stories[storyPosition-1].title;
  const scenes={
    'Masala · Entertainment':['The group chat has entered the cinema','ME: One quick entertainment update. Then I work.','BESTIE: You analysed that harder than your exam syllabus.','ME: This is research. My unfinished assignment is the sequel.'],
    Sport:['The sofa coach is online','ME: I have a complete strategy for this match.','BESTIE: Your fitness watch just asked if you are still alive.','ME: I bring tactical depth. The sofa brings back support.'],
    Tech:['My phone got the upgrade. I did not.','ME: Another tech update. We are living in the future.','PHONE: Great. Please free up storage.','ME: The future can wait. Those 4,000 screenshots are important.'],
    Money:['Budget meeting: me versus my cart','ME: Time to understand the economy.','SHOPPING CART: Start with these twelve things you do not need.','ME: I said understand it. Not take personal feedback.'],
    'Life & culture':['Main character, low battery','ME: This is my sign to go outside and have a life.','BESTIE: Are you coming or making a mood board?','ME: The mood board has excellent attendance.'],
    India:['Big update. Tiny attention span.','ME: Reading the news. Becoming an informed adult.','BESTIE: Can you explain the headline without opening six tabs?','ME: Yes. Right after I close the tab playing music somewhere.'],
    Sensitive:['The scroll needs a tea break','ME: That is a lot to take in.','PHONE: Another notification?','ME: No. Tea first. The endless scroll can wait.']
  };
  const scene=scenes[chosen?(chosen.category||desk(chosen.url)):'Sensitive']||scenes.India;
  const satire={storyPosition,title:scene[0],body:['In the news: '+subject,'Panel 1: '+scene[1],'Panel 2: '+scene[2],'Panel 3: '+scene[3],'This is fictional humour: imaginary readers reacting to a real headline, not real quotes or events.'].join('\n\n')};
  return {date:preview.date,cutoff:preview.cutoff,publishedAt:new Date().toISOString(),stories,satire,model:'local-editorial-template',promptVersion:'news-comic-v2'};
}

function parseFeed(xml,cutoff,category='World'){
  const stories=[];
  for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
    const field=name=>clean((match[1].match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1'));
    const title=field('title'),link=field('link'),at=Date.parse(field('pubDate')),description=field('description').split(/\s+/).slice(0,25).join(' ');
    let url;try{url=new URL(link);}catch{continue;}
    if(!['https://www.bbc.co.uk','https://www.bbc.com'].includes(url.origin)||url.username||url.password||!title||title.length>300||!description||!Number.isFinite(at)||at>Date.parse(cutoff)||indiaDate(at)!==indiaDate(cutoff))continue;
    url.search='';url.hash='';
    stories.push({title,url:url.href,source:'BBC News',provider:'BBC',publishedAt:new Date(at).toISOString(),observedAt:cutoff,description,category});
  }
  return stories;
}
async function fetchFeedStories(cutoff,fetchImpl=globalThis.fetch){
  const signal=AbortSignal.timeout(25000);
  const feeds=[['world/asia/india/','India'],['world/','World'],['business/','Money'],['technology/','Tech'],['entertainment_and_arts/','Life & culture']];
  const results=await Promise.allSettled(feeds.map(async ([path,category])=>{
    const response=await fetchImpl('https://feeds.bbci.co.uk/news/'+path+'rss.xml',{signal,redirect:'manual'});
    if(!response.ok){await response.body?.cancel();fail(502,'News feed unavailable (HTTP '+response.status+')');}
    let xml='',size=0;const decoder=new TextDecoder();
    for await(const chunk of response.body){size+=chunk.length;if(size>2000000)fail(502,'News feed too large');xml+=decoder.decode(chunk,{stream:true});}
    return parseFeed(xml+decoder.decode(),cutoff,category);
  }));
  const stories=selectDiverse(results.flatMap(r=>r.status==='fulfilled'?r.value:[]));
  if(stories.length<10)fail(502,'Ten dated feed stories unavailable. '+(results.find(r=>r.status==='rejected')?.reason.message||''));
  return stories;
}
return {createArchiveProvider,parseListing,parseArticle,selectDiverse,duplicate,desk,draftEdition,indiaDate,parseFeed,fetchFeedStories};
});
