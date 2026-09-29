// Preloaded only by the isolated browser server, never by production.
const path=require('node:path'),os=require('node:os');
if(path.dirname(path.resolve(process.env.DATA_DIR||'.'))!==path.resolve(os.tmpdir())||!path.basename(process.env.DATA_DIR||'').startsWith('synapse-news-'))throw Error('Mock provider requires isolated News DATA_DIR');
const original=global.fetch;
require('../backend/archive-provider').createArchiveProvider=()=>({fetchStories:async cutoff=>{
 const sections=['india','entertainment','sports','technology','business','world','lifestyle','education','entertainment','sports'];
 return sections.map((section,i)=>({title:['Railway route opens in mountains','Film trailer sparks cinema excitement','Hockey final brings a surprise winner','Digital telescope maps distant stars','Bank publishes household savings report','Island election sets a new direction','Artists unveil riverfront exhibition','Schools introduce music lessons','Singer releases acoustic album','Runner sets a national record'][i],url:`https://indianexpress.com/article/${section}/fixture-${i}/`,source:'The Indian Express',provider:'IndianExpress',category:require('../backend/archive-provider').desk(`/article/${section}/`),publishedAt:new Date(Date.parse(cutoff)-60000).toISOString(),description:'This isolated source fixture describes the headline and provides enough context for the saved newspaper.'}));
}});
global.fetch=async(input,options)=>{
 const url=new URL(input);
 if(url.hostname!=='www.pib.gov.in')return original(input,options);
 if(url.pathname==='/Allrel.aspx')return new Response(Array.from({length:12},(_,i)=>`<a href='/PressReleaseDetail.aspx?PRID=${100+i}'>Release</a>`).join(''));
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).formatToParts(new Date(Date.now()-60000));
 const part=type=>parts.find(p=>p.type===type).value;
 const at=`${part('day')} ${part('month')} ${part('year')} ${part('hour')}:${part('minute')}${part('dayPeriod')}`;
 return new Response(`<h2 id="Titleh2">Public infrastructure review ${url.searchParams.get('PRID')}</h2><div>Posted On: ${at} by PIB Delhi</div><p>The department published its daily public update describing infrastructure improvements and the next steps for the programme. This is an isolated test fixture.</p>`);
};
