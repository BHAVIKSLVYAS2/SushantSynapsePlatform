const {test}=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
test('P14 interval classifications and windows agree with actual workerd',{timeout:60000},async t=>{
 const {analyzeSensitivityInterval}=await import('../packages/vedic/sensitivity.mjs');
 const requireTools=createRequire(require.resolve('wrangler/package.json')),{Miniflare,convertV4MiniflareOptions}=requireTools('miniflare');
 const bundle=await require('esbuild').build({stdin:{resolveDir:process.cwd(),contents:`import {analyzeSensitivityInterval} from './packages/vedic/sensitivity.mjs';export default {async fetch(r){return Response.json((await r.json()).map(analyzeSensitivityInterval))}};`},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',minify:true});
 const script=bundle.outputFiles[0].text;assert.ok(Buffer.byteLength(script)<180000);
 const options={workers:[{name:'isolated-vedic-sensitivity',modules:true,script,compatibilityDate:'2026-10-01',outboundService:()=>new Response('Offline',{status:503})}]};
 const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const inputs=[['2000-01-01T06:45:00Z','2000-01-01T06:46:00Z',false],['2000-01-01T06:35:00Z','2000-01-01T06:55:00Z',true]].map(([startUtc,endUtc,endInclusive])=>({startUtc,endUtc,endInclusive,latitude:28.62137,longitude:77.2148,elevationMetres:0,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'}));
 const expected=inputs.map(analyzeSensitivityInterval),response=await mf.dispatchFetch('http://vedic.test/',{method:'POST',body:JSON.stringify(inputs)});assert.equal(response.status,200);const actual=await response.json();let numbers=0,maxDifference=0;
 function compare(a,b){if(typeof b==='number'){numbers++;maxDifference=Math.max(maxDifference,Math.abs(a-b));assert.ok(Math.abs(a-b)<=1e-8);}else if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const key of Object.keys(b))compare(a[key],b[key]);}else assert.equal(a,b);}
 compare(actual,expected);console.log(JSON.stringify({fixture:'P14-workerd-intervals',intervals:inputs.length,numbers,maxDifference,bundleBytes:Buffer.byteLength(script)}));
});
