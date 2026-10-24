const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRequire}=require('node:module'),{performance}=require('node:perf_hooks');
test('actual local workerd reproduces Panchang transitions, sunrise and pre-sunrise Vara without place data',{timeout:60000},async t=>{
 const {panchangSnapshot}=await import('../packages/vedic/panchang.mjs');
 const {panchangAtInstant,panchangBySunrise,sunriseOnCivilDay}=await import('../packages/vedic/panchang-observer.mjs');
 const toolsRequire=createRequire(require.resolve('wrangler/package.json'));
 const {Miniflare,convertV4MiniflareOptions}=toolsRequire('miniflare');
 const bundle=await require('esbuild').build({stdin:{resolveDir:process.cwd(),contents:`
  import {panchangSnapshot} from './packages/vedic/panchang.mjs';
  import {panchangAtInstant,panchangBySunrise,sunriseOnCivilDay} from './packages/vedic/panchang-observer.mjs';
  export default {async fetch(request){const data=await request.json();
   const methods={panchangSnapshot,panchangAtInstant,panchangBySunrise,sunriseOnCivilDay};
   return Response.json(data.map(({method,input})=>{try{return methods[method](input)}
    catch(error){return error.toJSON()}}));}};`},bundle:true,write:false,format:'esm',
  platform:'neutral',target:'es2022',conditions:['workerd','worker','browser'],minify:true});
 const script=bundle.outputFiles[0].text;assert.ok(Buffer.byteLength(script)<200000);
 assert.match(script,/NumFOCUS/);
 const options={workers:[{name:'isolated-vedic-panchang',modules:true,script,compatibilityDate:'2026-10-01',
  outboundService:()=>new Response('Offline reference model',{status:503})}]};
 const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const profile='IN_LAHIRI_DEFAULT_V1',site={latitude:28.6139,longitude:77.209,timeZoneId:'Asia/Kolkata'};
 const cases=[];
 for(const utcInstant of ['1950-01-01T06:00:00Z','1972-01-01T06:00:00Z','2026-09-26T01:00:00Z',
  '2026-10-10T01:00:00Z','2098-12-31T06:00:00Z'])cases.push({method:'panchangSnapshot',input:{timeScale:'UTC',utcInstant,calculationProfileId:profile}});
 for(const utcInstant of ['2026-09-25T20:00:00Z','2026-09-26T06:00:00Z'])
  cases.push({method:'panchangAtInstant',input:{...site,utcInstant,calculationProfileId:profile}});
 cases.push({method:'panchangBySunrise',input:{...site,localDate:'2026-09-26',calculationProfileId:profile}});
 cases.push({method:'sunriseOnCivilDay',input:{...site,latitude:90,localDate:'2026-06-21'}});
 const methods={panchangSnapshot,panchangAtInstant,panchangBySunrise,sunriseOnCivilDay};
 const expected=cases.map(({method,input})=>{try{return methods[method](input)}catch(e){return e.toJSON()}});
 const started=performance.now();
 const response=await mf.dispatchFetch('http://vedic.test/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cases)});
 assert.equal(response.status,200);const actual=await response.json();let maxNumberDifference=0,numbers=0;
 function compare(a,b){
  if(typeof b==='number'){assert.equal(typeof a,'number');numbers++;maxNumberDifference=Math.max(maxNumberDifference,Math.abs(a-b));assert.ok(Math.abs(a-b)<=1e-8);}
  else if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const key of Object.keys(b))compare(a[key],b[key]);}
  else assert.equal(a,b);
 }
 compare(actual,expected);assert.equal(actual.at(-1).code,'SUNRISE_UNAVAILABLE');
 console.log(JSON.stringify({fixture:'local-workerd-panchang-parity',cases:cases.length,numbers,
  maxNumberDifference,bundleBytes:Buffer.byteLength(script),batchWallMs:Math.round(performance.now()-started),
  timingMeaning:'local wall time; not production CPU or accuracy certification'}));
});
