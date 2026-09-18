const {fail}=require('../../../server/http');
const ENDPOINT='https://api.gdeltproject.org/api/v2/doc/doc';
const QUERY='(India OR sourcecountry:India) sourcelang:english';
function seenDate(value){
  if(typeof value!=='string'||!/^\d{8}T\d{6}Z$/.test(value))return null;
  const iso=value.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z');
  const time=Date.parse(iso);return Number.isFinite(time)&&new Date(time).toISOString().slice(0,19)===iso.slice(0,19)?new Date(time).toISOString():null;
}
function cleanText(value,max){return typeof value==='string'?value.replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';}
function normalize(item,cutoff){
  if(!item||item.language!=='English')return null;
  const title=cleanText(item.title,300),observedAt=seenDate(item.seendate);
  if(!title||!observedAt||Date.parse(observedAt)>Date.parse(cutoff)||Date.parse(observedAt)<Date.parse(cutoff)-86400000)return null;
  let url;try{url=new URL(item.url);}catch{return null;}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.href.length>2000||!url.hostname.includes('.')||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname))return null;
  url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))url.searchParams.delete(key);
  url.searchParams.sort();
  return {title,url:url.href,source:url.hostname.replace(/^www\./,''),observedAt,publishedAt:null,provider:'GDELT',description:''};
}
const words=title=>new Set(title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>2));
function similar(a,b){const x=words(a),y=words(b);const same=[...x].filter(w=>y.has(w)).length;return same/Math.max(1,new Set([...x,...y]).size)>=0.75;}
function selectStories(items,cutoff){
  const selected=[],sources=new Map();
  for(const item of items){
    const story=normalize(item,cutoff);if(!story)continue;
    if(selected.some(s=>s.url===story.url||similar(s.title,story.title))||(sources.get(story.source)||0)>=3)continue;
    selected.push(story);sources.set(story.source,(sources.get(story.source)||0)+1);if(selected.length===10)break;
  }
  return selected;
}
async function boundedJson(response){
  if(Number(response.headers.get('content-length'))>2*1024*1024)fail(502,'News provider response is too large');
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>2*1024*1024)fail(502,'News provider response is too large');chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail(502,'News provider returned an invalid response. Please retry later.');}
}
function createNewsProvider({fetchImpl=fetch}={}){
  return {name:'GDELT',async fetchStories(cutoff){
    const url=new URL(ENDPOINT),stamp=date=>new Date(date).toISOString().replace(/[-:T]/g,'').slice(0,14);
    for(const [key,value] of Object.entries({query:QUERY,mode:'ArtList',format:'json',maxrecords:'100',sort:'HybridRel',startdatetime:stamp(Date.parse(cutoff)-86400000),enddatetime:stamp(cutoff)}))url.searchParams.set(key,value);
    let response;
    try{response=await fetchImpl(url,{signal:AbortSignal.timeout(25000),redirect:'error',headers:{Accept:'application/json'}});}catch{fail(502,'News provider is unavailable. Please retry later.');}
    if(response.status===429){await response.body?.cancel();fail(429,'News provider is busy. Please wait at least one minute before retrying.');}
    if(!response.ok){await response.body?.cancel();fail(502,'News provider is unavailable. Please retry later.');}
    let data;try{data=await boundedJson(response);}catch(error){if(error.status)throw error;fail(502,'News provider response could not be read. Please retry later.');}
    if(!Array.isArray(data.articles)||data.articles.length>250)fail(502,'News provider returned an invalid article list');
    const stories=selectStories(data.articles,cutoff);
    if(stories.length!==10)fail(502,`Only ${stories.length} distinct recent stories were available. No preview was saved; retry later.`);
    return stories;
  }};
}
module.exports={createNewsProvider,selectStories,seenDate};
