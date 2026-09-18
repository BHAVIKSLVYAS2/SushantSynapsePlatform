const {fail}=require('../../../server/http');
const ORIGIN='https://www.pib.gov.in';
function clean(value){
  const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',ndash:'–',mdash:'—'};
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(m,key)=>{if(key[0]!=='#')return entities[key]??m;const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();
}
function parseRelease(html,url,cutoff){
  const title=clean(html.match(/<h2\b[^>]*id=["']Titleh2["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1]||'');
  const match=html.match(/Posted On:\s*(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if(!match||!title||title.length>300||/[\u0900-\u097f]/.test(title))return null;
  const month=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].indexOf(match[2].toUpperCase());
  const hour=Number(match[4])%12+(match[6].toUpperCase()==='PM'?12:0);
  if(month<0||Number(match[4])<1||Number(match[4])>12||Number(match[5])>59)return null;
  const at=Date.UTC(Number(match[3]),month,Number(match[1]),hour,Number(match[5]))-19800000;
  if(at>Date.parse(cutoff)||at<Date.parse(cutoff)-86400000)return null;
  const body=html.slice(html.indexOf(match[0])+match[0].length);
  const paragraphs=[...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>clean(m[1])).filter(p=>p.length>=80);
  // Excerpts retain the source's wording and are never silently completed or paraphrased.
  const description=paragraphs.find(p=>p.length<=2500);
  if(!description)return null;
  return {title,url,source:'Press Information Bureau, Government of India',publishedAt:new Date(at).toISOString(),observedAt:cutoff,provider:'PIB',description};
}
function createPibProvider({fetchImpl=global.fetch}={}){
  return {async fetchStories(cutoff){
    const signal=AbortSignal.timeout(90000);
    async function read(url){
      let response;try{response=await fetchImpl(url,{signal,redirect:'error'});}catch{fail(502,'The news source is unavailable. Please retry later.');}
      if(!response.ok)fail(502,'The news source is unavailable. Please retry later.');
      const reader=response.body.getReader();let size=0,chunks=[];
      try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000){await reader.cancel();fail(502,'News source response was too large.');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
      return Buffer.concat(chunks).toString('utf8');
    }
    const listing=await read(ORIGIN+'/Allrel.aspx?lang=1&reg=3');
    const ids=[...new Set([...listing.matchAll(/href=['"]\/?PressReleaseDetail\.aspx\?PRID=(\d+)['"]/gi)].map(m=>m[1]))].sort((a,b)=>Number(b)-Number(a)).slice(0,20);
    const stories=[];
    // At most 21 HTTP requests per attempt, four in flight; one shared 90-second deadline.
    for(let i=0;i<ids.length&&stories.length<10;i+=4){
      const batch=await Promise.allSettled(ids.slice(i,i+4).map(async id=>{const url=ORIGIN+'/PressReleasePage.aspx?PRID='+id+'&reg=3&lang=1';return parseRelease(await read(url),url,cutoff);}));
      for(const item of batch){if(item.status==='fulfilled'&&item.value&&!stories.some(s=>s.title.toLowerCase()===item.value.title.toLowerCase()))stories.push(item.value);}
    }
    stories.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
    if(stories.length<10)fail(502,'Fewer than ten recent English releases are available. Please retry later.');
    return stories.slice(0,10);
  }};
}
module.exports={createPibProvider,parseRelease,clean};
