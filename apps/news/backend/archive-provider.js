const {fail}=require('../../../server/http');
const {clean}=require('./pib-provider');
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
  for(const item of items){const key=desk(item.url);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
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
function createArchiveProvider({fetchImpl=global.fetch}={}){
  return {async fetchStories(cutoff){
    const date=indiaDate(cutoff),signal=AbortSignal.timeout(90000);
    async function read(url){
      const response=await fetchImpl(url,{signal,redirect:'error'});
      if(!response.ok)throw Error('Source unavailable');
      const chunks=[];let size=0;
      for await(const chunk of response.body){size+=chunk.length;if(size>2000000)fail(502,'News source response was too large.');chunks.push(Buffer.from(chunk));}
      return Buffer.concat(chunks).toString('utf8');
    }
    const archive=ORIGIN+'/archive/'+date.replaceAll('-','/')+'/';
    const pages=await Promise.allSettled([archive,archive+'page/2/',archive+'page/3/',archive+'page/4/'].map(read));
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
module.exports={createArchiveProvider,parseListing,parseArticle,selectDiverse,duplicate,desk};
