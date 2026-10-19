const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {cacheStaticAssets}=require('../infrastructure/cloudflare/build-static-cache.cjs');

test('asset dependency fingerprints preserve imports and isolate unrelated changes',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-static-cache-'));
 try{
  function build(change='',childChange=''){
   const sources={'/entry.js':"import './child.mjs';fetch('/api/private');const image='/icon.svg#mark';"+change,'/child.mjs':"export const value=1",'/style.css':"body{background:url('/icon.svg#mark')}",'/icon.svg':'<svg/>','/_pages/home.html':'<script src="/entry.js?v=old"></script><link href="/style.css"><a href="/account">Account</a><img src="https://example.test/icon.svg">','/_edge/private.json':'private'};
   sources['/child.mjs']="import './entry.js';export const value=1"+childChange;
   const files=new Map();for(const [url,text]of Object.entries(sources)){const filename=path.join(dir,url);fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,text);files.set(url,url.endsWith('.html')?'apps/portal/frontend/index.html':'apps/portal/frontend'+url);}
   const result=cacheStaticAssets(dir,files);return {...result,read:url=>fs.readFileSync(path.join(dir,url),'utf8')};
  }
  const first=build(),second=build();assert.deepEqual(first.urls,second.urls);assert.equal(first.count,4);
  const html=first.read('/_pages/home.html');assert.ok(html.includes(first.urls.get('/entry.js')+'?v=old'));assert.ok(html.includes('href="/account"'));assert.ok(html.includes('https://example.test/icon.svg'));
  const script=first.read(first.urls.get('/entry.js'));assert.ok(script.includes("import '"+first.urls.get('/child.mjs')+"'"));assert.ok(script.includes("fetch('/api/private')"));assert.ok(script.includes(first.urls.get('/icon.svg')+'#mark'));
  assert.ok(first.read('/entry.js').includes("const image='/icon.svg#mark'"));
  assert.ok(first.read(first.urls.get('/child.mjs')).includes(first.urls.get('/entry.js')));assert.ok(first.read(first.urls.get('/style.css')).includes(first.urls.get('/icon.svg')+'#mark'));
  assert.equal(fs.existsSync(path.join(dir,first.prefix,'_edge/private.json')),false);
  const changed=build('// changed');assert.notEqual(changed.urls.get('/entry.js'),first.urls.get('/entry.js'));
  assert.notEqual(changed.urls.get('/child.mjs'),first.urls.get('/child.mjs'));
  assert.equal(changed.urls.get('/style.css'),first.urls.get('/style.css'));
  assert.equal(changed.urls.get('/icon.svg'),first.urls.get('/icon.svg'));
  const childChanged=build('','// changed dependency');
  assert.notEqual(childChanged.urls.get('/entry.js'),first.urls.get('/entry.js'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('Chambers organisation bootstrap precedes either original or versioned controller; pages remain no-store',async()=>{
 const {default:worker}=await import('../infrastructure/cloudflare/fullstack-worker.mjs');
 for(const src of ['/app.js','/_static/'+'a'.repeat(32)+'/app.js']){
  const env={ORGANISATIONS_ENABLED:'true',ASSETS:{fetch:async()=>new Response('<html><head></head><body><script src="'+src+'"></script></body></html>',{headers:{'Cache-Control':'no-cache','Content-Type':'text/html'}})}};
  const response=await worker.fetch(new Request('https://example.test/advocate'),env),html=await response.text();
  assert.equal(response.headers.get('Cache-Control'),'no-store');assert.ok(html.includes('/advocate/organisation-preview.css'));
  assert.ok(html.includes('<script src="/advocate/organisation-preview.js"></script><script src="'+src+'"></script>'));
 }
});

test('versioned static responses preserve validators and never cache missing assets or writes',async()=>{
 const {default:worker}=await import('../infrastructure/cloudflare/fullstack-worker.mjs');
 for(const status of [200,206,304,404,500]){
  const env={ASSETS:{fetch:async()=>new Response(status===304?null:'asset',{status,headers:{'Cache-Control':'public, max-age=31536000, immutable',ETag:'"fixture"'}})}};
  const response=await worker.fetch(new Request('https://example.test/_static/version/file.js'),env);
  assert.equal(response.status,status);assert.equal(response.headers.get('ETag'),'"fixture"');
  assert.equal(response.headers.get('Cache-Control'),status<400?'public, max-age=31536000, immutable':'no-store');
  const head=await worker.fetch(new Request('https://example.test/_static/version/file.js',{method:'HEAD'}),env);assert.equal(await head.text(),'');
 }
 const denied=await worker.fetch(new Request('https://example.test/_static/version/file.js',{method:'POST'}),{});assert.equal(denied.status,405);assert.equal(denied.headers.get('Cache-Control'),'no-store');
});
