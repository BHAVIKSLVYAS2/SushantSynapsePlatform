// Explicit fixed synthetic reference capture only; never invoked by runtime/tests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..','tests','fixtures','vedic-panchang');
const requests=[
 ['usno-delhi-20260926','https://aa.usno.navy.mil/api/rstt/oneday?date=2026-09-26&coords=28.6139,77.209&tz=5.5'],
 ['usno-chennai-20260621','https://aa.usno.navy.mil/api/rstt/oneday?date=2026-06-21&coords=13.0827,80.2707&tz=5.5'],
 ['usno-kolkata-20261221','https://aa.usno.navy.mil/api/rstt/oneday?date=2026-12-21&coords=22.5726,88.3639&tz=5.5'],
 ['publisher-hyderabad-20260926','https://panchangam.org/dailypanchangam.php?date=2026-09-26'],
 ['pac-explanation','https://packolkata.imd.gov.in/panchang/en/explanation']
];
(async()=>{
 if(!process.argv.includes('--capture'))throw Error('Explicit --capture required');
 fs.mkdirSync(root,{recursive:true});const results=[];
 for(const [id,url] of requests){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Synapse-Vedic-reference-audit/0.5'}});
   const raw=Buffer.from(await response.arrayBuffer());
   const result={id,url,status:response.status,contentType:response.headers.get('content-type')};
   if(response.ok){const filename=id+(id.startsWith('usno')?'.json':'.html');fs.writeFileSync(path.join(root,filename),raw);
    Object.assign(result,{filename,bytes:raw.length,sha256:crypto.createHash('sha256').update(raw).digest('hex')});}
   results.push(result);console.log(id,response.status);
  }catch(error){results.push({id,url,error:error.name});console.log(id,error.name);}
 }
 fs.writeFileSync(path.join(root,'capture-manifest.json'),JSON.stringify({capturedUtc:new Date().toISOString(),requests:results},null,2)+'\n');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
