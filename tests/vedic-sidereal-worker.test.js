const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRequire}=require('node:module'),{performance}=require('node:perf_hooks');

test('local workerd matches sidereal Node calculations and every floating-point Pada edge', {timeout:60000},async t=>{
 const {siderealSnapshot}=await import('../packages/vedic/sidereal.mjs');
 const {classifySidereal}=await import('../packages/vedic/angles.mjs');
 const toolsRequire=createRequire(require.resolve('wrangler/package.json'));
 const {Miniflare,convertV4MiniflareOptions}=toolsRequire('miniflare');
 const bundle=await require('esbuild').build({stdin:{resolveDir:process.cwd(),contents:`
  import {siderealSnapshot} from './packages/vedic/sidereal.mjs';
  import {classifySidereal} from './packages/vedic/angles.mjs';
  export default {async fetch(request){const input=await request.json();
   return Response.json({snapshots:input.snapshots.map(siderealSnapshot),angles:input.angles.map(classifySidereal)});
  }};`},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',minify:true,
  conditions:['workerd','worker','browser']});
 const script=bundle.outputFiles[0].text;
 assert.ok(Buffer.byteLength(script)<200000,'Sidereal bundle must exclude the place directory');
 assert.match(script,/NumFOCUS/,'Preserve licensed derivative notice in compiled output');
 const options={workers:[{name:'isolated-vedic-sidereal',modules:true,script,compatibilityDate:'2026-10-01',
  outboundService:()=>new Response('No external runtime data',{status:503})}]};
 const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const snapshots=[2433280.5,2435553.5,2451545,2458484.500800741,2461338,2480765,2487706.5]
  .map(julianDay=>({timeScale:'TT',julianDay,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'}));
 for(let m=0;m<12;m++)snapshots.push({timeScale:'TT',julianDay:Date.UTC(2026,m,1,12)/86400000+2440587.5,
  calculationProfileId:'IN_LAHIRI_DEFAULT_V1'});
 const next=(value,up)=>{if(value===0)return up?Number.MIN_VALUE:-Number.MIN_VALUE;
  const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value);
  view.setBigUint64(0,view.getBigUint64(0)+(up?1n:-1n));return view.getFloat64(0);};
 const angles=[];for(let i=0;i<108;i++){const a=i*360/108;angles.push(next(a,false),a,next(a,true));}
 const started=performance.now();
 const response=await mf.dispatchFetch('http://vedic.test/',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({snapshots,angles})});
 const actual=await response.json();assert.equal(response.status,200);
 let maxDifference=0,count=0;
 for(let i=0;i<snapshots.length;i++){
  const a=actual.snapshots[i],b=siderealSnapshot(snapshots[i]);
  assert.equal(a.profile.id,b.profile.id);assert.equal(a.profile.nodeModel,b.profile.nodeModel);
  assert.deepEqual(a.warnings,b.warnings);
  maxDifference=Math.max(maxDifference,Math.abs(a.ayanamsha.meanDegrees-b.ayanamsha.meanDegrees),Math.abs(a.ayanamsha.trueDegrees-b.ayanamsha.trueDegrees));
  for(let k=0;k<b.positions.length;k++){
   const x=a.positions[k],y=b.positions[k];count++;
   for(const key of ['body','rashi','nakshatra','pada','nearBoundary','kind'])assert.equal(x[key],y[key]);
   maxDifference=Math.max(maxDifference,Math.abs(x.siderealLongitude-y.siderealLongitude));
  }
 }
 assert.ok(maxDifference<=1e-9);assert.deepEqual(actual.angles,angles.map(classifySidereal));
 console.log(JSON.stringify({fixture:'local-workerd-sidereal-parity',snapshots:snapshots.length,positions:count,
  boundaryAngles:angles.length,maxDifferenceDegrees:maxDifference,bundleBytes:Buffer.byteLength(script),
  batchWallMs:Math.round(performance.now()-started),timingMeaning:'local wall time, not production CPU evidence'}));
});
