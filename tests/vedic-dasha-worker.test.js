const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
test('actual local workerd matches Dasha balances, nested dates, active periods and unavailable local projections',{timeout:60000},async t=>{
 const {vimshottariTimeline,vimshottariBirthBalance}=await import('../packages/vedic/dasha.mjs');
 const toolsRequire=createRequire(require.resolve('wrangler/package.json')),{Miniflare,convertV4MiniflareOptions}=toolsRequire('miniflare');
 const bundle=await require('esbuild').build({stdin:{resolveDir:process.cwd(),contents:`
  import {vimshottariTimeline,vimshottariBirthBalance} from './packages/vedic/dasha.mjs';
  export default {async fetch(r){const x=await r.json();return Response.json({balances:x.angles.map(vimshottariBirthBalance),timelines:x.inputs.map(vimshottariTimeline)})}};`},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',minify:true,conditions:['workerd','worker','browser']});
 const script=bundle.outputFiles[0].text;assert.ok(Buffer.byteLength(script)<50000,'Arithmetic-only bundle must exclude astronomy and places');
 const options={workers:[{name:'isolated-vedic-dasha',modules:true,script,compatibilityDate:'2026-10-01',outboundService:()=>new Response('Offline',{status:503})}]};
 const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const angles=[];
 for(let i=0;i<27;i++){
  const a=i*360/27,v=new DataView(new ArrayBuffer(8));v.setFloat64(0,a);const bits=v.getBigUint64(0);
  v.setBigUint64(0,a===0?1n:bits-1n);const before=a===0?-Number.MIN_VALUE:v.getFloat64(0);v.setBigUint64(0,bits+1n);
  angles.push(before,a,v.getFloat64(0));
 }
 const base={birthUtcInstant:'2000-01-01T00:00:00Z',moonSiderealLongitude:20/3,calculationProfileId:'IN_LAHIRI_DEFAULT_V1',yearConventionId:'VIMSHOTTARI_365_25_DAY_V1',timeZoneId:'Asia/Kolkata'};
 const inputs=Array.from({length:9},(_,i)=>({...base,moonSiderealLongitude:(2*i+1)*20/3,atUtcInstant:'2026-10-24T12:00:00Z'}));
 inputs.push({...base,birthUtcInstant:'1949-12-31T18:30:00Z'},
  {...base,birthUtcInstant:'2098-06-15T06:30:00Z',atUtcInstant:'2200-01-01T00:00:00Z'},
  {...base,atUtcInstant:vimshottariTimeline(base).cycle.end.utcInstant});
 const response=await mf.dispatchFetch('http://vedic.test/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({angles,inputs})});
 assert.equal(response.status,200);const actual=await response.json(),expected={balances:angles.map(vimshottariBirthBalance),timelines:inputs.map(vimshottariTimeline)};
 let numbers=0,maxNumberDifference=0;
 function compare(a,b,key=''){
  if(typeof b==='number'){
   numbers++;maxNumberDifference=Math.max(maxNumberDifference,Math.abs(a-b));
   if(key==='rawElapsedMilliseconds')assert.ok(Math.abs(a-b)<=0.001);
   else if(Number.isInteger(b))assert.equal(a,b);else assert.ok(Math.abs(a-b)<=1e-10);
  }else if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const k of Object.keys(b))compare(a[k],b[k],k);}
  else assert.equal(a,b);
 }
 compare(actual,expected);console.log(JSON.stringify({fixture:'local-workerd-dasha-parity',timelines:inputs.length,boundaryBalances:angles.length,numbers,maxNumberDifference,bundleBytes:Buffer.byteLength(script)}));
});
