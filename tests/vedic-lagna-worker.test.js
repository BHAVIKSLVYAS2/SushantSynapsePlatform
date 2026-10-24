const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRequire}=require('node:module'),{performance}=require('node:perf_hooks');
test('actual local workerd matches numeric D1, horizon geometry and whole-sign boundary mappings',{timeout:60000},async t=>{
 const {d1ChartAtInstant,wholeSignHouses,wholeSignHouseForLongitude}=await import('../packages/vedic/d1.mjs');
 const {ascendantGeometry}=await import('../packages/vedic/lagna.mjs');
 const toolsRequire=createRequire(require.resolve('wrangler/package.json'));
 const {Miniflare,convertV4MiniflareOptions}=toolsRequire('miniflare');
 const bundle=await require('esbuild').build({stdin:{resolveDir:process.cwd(),contents:`
  import {d1ChartAtInstant,wholeSignHouses,wholeSignHouseForLongitude} from './packages/vedic/d1.mjs';
  import {ascendantGeometry} from './packages/vedic/lagna.mjs';
  const methods={d1ChartAtInstant,wholeSignHouses,wholeSignHouseForLongitude,ascendantGeometry};
  export default {async fetch(request){const cases=await request.json();return Response.json(cases.map(({method,input})=>{
   try{return methods[method](input)}catch(error){return error.toJSON()}}));}};`},bundle:true,write:false,
  format:'esm',platform:'neutral',target:'es2022',minify:true,conditions:['workerd','worker','browser']});
 const script=bundle.outputFiles[0].text;assert.ok(Buffer.byteLength(script)<200000);assert.match(script,/NumFOCUS/);
 const options={workers:[{name:'isolated-vedic-lagna',modules:true,script,compatibilityDate:'2026-10-01',
  outboundService:()=>new Response('Offline model',{status:503})}]};
 const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const cases=[],profile='IN_LAHIRI_DEFAULT_V1';
 for(const utcInstant of ['1950-01-01T00:00:00Z','1972-01-01T00:00:00Z','2000-01-01T06:30:00Z',
  '2026-10-24T12:00:00Z','2098-12-31T12:00:00Z'])for(const [latitude,longitude] of [[28.6139,77.209],[-28.6139,-77.209]])
  cases.push({method:'d1ChartAtInstant',input:{timeScale:'UTC',utcInstant,latitude,longitude,calculationProfileId:profile}});
 for(let rising=1;rising<=12;rising++){
  cases.push({method:'wholeSignHouses',input:(rising-1)*30+17});
  for(let sign=1;sign<=12;sign++)cases.push({method:'wholeSignHouseForLongitude',input:{lagnaSiderealLongitude:(rising-1)*30+17,siderealLongitude:(sign-1)*30}});
 }
 cases.push({method:'ascendantGeometry',input:{localApparentDegrees:270,latitude:90,trueObliquityDegrees:23.4}});
 const methods={d1ChartAtInstant,wholeSignHouses,wholeSignHouseForLongitude,ascendantGeometry};
 const expected=cases.map(({method,input})=>{try{return methods[method](input)}catch(e){return e.toJSON()}});
 const started=performance.now();const response=await mf.dispatchFetch('http://vedic.test/',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cases)});
 assert.equal(response.status,200);const actual=await response.json();let maxNumberDifference=0,numbers=0;
 function compare(a,b){
  if(typeof b==='number'){assert.equal(typeof a,'number');numbers++;maxNumberDifference=Math.max(maxNumberDifference,Math.abs(a-b));assert.ok(Math.abs(a-b)<=1e-8);}
  else if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const key of Object.keys(b))compare(a[key],b[key]);}
  else assert.equal(a,b);
 }
 compare(actual,expected);assert.equal(actual.at(-1).code,'LAGNA_UNAVAILABLE');
 console.log(JSON.stringify({fixture:'local-workerd-lagna-parity',cases:cases.length,numbers,maxNumberDifference,
  bundleBytes:Buffer.byteLength(script),batchWallMs:Math.round(performance.now()-started),
  timingMeaning:'local wall time; not production CPU or astronomical accuracy certification'}));
});
