// Preloaded only by the isolated browser server, never by production.
const path=require('node:path'),os=require('node:os');
if(path.dirname(path.resolve(process.env.DATA_DIR||'.'))!==path.resolve(os.tmpdir())||!path.basename(process.env.DATA_DIR||'').startsWith('synapse-news-'))throw Error('Mock provider requires isolated News DATA_DIR');
const original=global.fetch;
global.fetch=async(input,options)=>{
 const url=new URL(input);
 if(url.hostname!=='www.pib.gov.in')return original(input,options);
 if(url.pathname==='/Allrel.aspx')return new Response(Array.from({length:12},(_,i)=>`<a href='/PressReleaseDetail.aspx?PRID=${100+i}'>Release</a>`).join(''));
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).formatToParts(new Date(Date.now()-60000));
 const part=type=>parts.find(p=>p.type===type).value;
 const at=`${part('day')} ${part('month')} ${part('year')} ${part('hour')}:${part('minute')}${part('dayPeriod')}`;
 return new Response(`<h2 id="Titleh2">Public infrastructure review ${url.searchParams.get('PRID')}</h2><div>Posted On: ${at} by PIB Delhi</div><p>The department published its daily public update describing infrastructure improvements and the next steps for the programme. This is an isolated test fixture.</p>`);
};
