const {test}=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
test('P12 periods, factors, templates and cache agree with actual local workerd',{timeout:60000},async t=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs');
 const requireTools=createRequire(require.resolve('wrangler/package.json')),{Miniflare,convertV4MiniflareOptions}=requireTools('miniflare');
 const bundle=await require('esbuild').build({stdin:{resolveDir:process.cwd(),contents:`import {createRashifalService} from './apps/rashifal-kundli/frontend/rashifal-service.mjs';export default {async fetch(r){const x=await r.json(),s=createRashifalService();return Response.json(x.map(i=>s.getReading(i.input,i.context)))}};`},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',minify:true});
 const script=bundle.outputFiles[0].text;assert.ok(Buffer.byteLength(script)<200000,'Rashifal bundle must exclude birth/place data');
 const options={workers:[{name:'isolated-vedic-rashifal',modules:true,script,compatibilityDate:'2026-10-01',outboundService:()=>new Response('Offline',{status:503})}]};const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const base={view:'weekly',language:'en',ruleVersion:'rashifal-reflections-1',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
 const inputs=Array.from({length:12},(_,i)=>({input:{...base,rashi:i+1,language:['en','hi','gu'][i%3]},context:{now:Date.parse('2026-10-24T12:00Z')}}));inputs.push(inputs[0]);
 const service=createRashifalService(),expected=inputs.map(i=>service.getReading(i.input,i.context));
 const response=await mf.dispatchFetch('http://vedic.test/',{method:'POST',body:JSON.stringify(inputs)});assert.equal(response.status,200);const actual=await response.json();let numbers=0,maxDifference=0;
 function compare(a,b){if(typeof b==='number'){numbers++;maxDifference=Math.max(maxDifference,Math.abs(a-b));assert.ok(Math.abs(a-b)<1e-9);}else if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a),Object.keys(b));for(const key of Object.keys(b))compare(a[key],b[key]);}else assert.equal(a,b);}
 compare(actual,expected);console.log(JSON.stringify({fixture:'P12-workerd-rashifal',requests:inputs.length,numbers,maxDifference,bundleBytes:Buffer.byteLength(script)}));
});
