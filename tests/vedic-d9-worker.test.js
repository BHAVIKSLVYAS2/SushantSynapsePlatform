const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
test('actual local workerd matches all D9 boundaries and nominal D1/D9 pairs',{timeout:60000},async t=>{
 const {divisionalChartsAtInstant,navamsaForLongitude}=await import('../packages/vedic/d9.mjs');
 const toolsRequire=createRequire(require.resolve('wrangler/package.json')),{Miniflare,convertV4MiniflareOptions}=toolsRequire('miniflare');
 const bundle=await require('esbuild').build({stdin:{resolveDir:process.cwd(),contents:`
 import {divisionalChartsAtInstant,navamsaForLongitude} from './packages/vedic/d9.mjs';
 export default {async fetch(r){const x=await r.json();return Response.json({pairs:x.inputs.map(divisionalChartsAtInstant),angles:x.angles.map(navamsaForLongitude)})}};`},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',minify:true,conditions:['workerd','worker','browser']});
 const script=bundle.outputFiles[0].text;assert.ok(Buffer.byteLength(script)<200000);assert.match(script,/NumFOCUS/);
 const options={workers:[{name:'isolated-vedic-d9',modules:true,script,compatibilityDate:'2026-10-01',outboundService:()=>new Response('Offline',{status:503})}]};
 const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const angles=[];
 for(let i=0;i<108;i++){const a=i*360/108,v=new DataView(new ArrayBuffer(8));v.setFloat64(0,a);
  const bits=v.getBigUint64(0);v.setBigUint64(0,a===0?1n:bits-1n);const before=a===0?-Number.MIN_VALUE:v.getFloat64(0);
  v.setBigUint64(0,bits+1n);angles.push(before,a,v.getFloat64(0));}
 const inputs=['1950-01-01T00:00:00Z','2000-01-01T06:30:00Z','2026-10-24T12:00:00Z','2098-12-31T12:00:00Z'].map(utcInstant=>({timeScale:'UTC',utcInstant,latitude:28.6139,longitude:77.209,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'}));
 const response=await mf.dispatchFetch('http://vedic.test/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({inputs,angles})});
 assert.equal(response.status,200);const actual=await response.json(),expected={pairs:inputs.map(divisionalChartsAtInstant),angles:angles.map(navamsaForLongitude)};
 let numbers=0,maxNumberDifference=0;
 function compare(a,b){if(typeof b==='number'){numbers++;maxNumberDifference=Math.max(maxNumberDifference,Math.abs(a-b));assert.ok(Math.abs(a-b)<=1e-8);}
  else if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const k of Object.keys(b))compare(a[k],b[k]);}else assert.equal(a,b);}
 compare(actual,expected);console.log(JSON.stringify({fixture:'local-workerd-d9-parity',pairs:inputs.length,boundaryInputs:angles.length,numbers,maxNumberDifference,bundleBytes:Buffer.byteLength(script)}));
});
