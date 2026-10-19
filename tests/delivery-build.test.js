const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {prepareDelivery}=require('../infrastructure/cloudflare/build-delivery.cjs');

test('delivery filters app CSS while preserving public-script globals and source files',()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-delivery-'));
 try{
  const sources={
   '/shared/premium.css':'body[data-ui-app=news] .news {color:red} body[data-ui-app=advocate] .case {color:blue} .shared {display:block}',
   '/entry.js':'// source comment\n var SharedContract = {value: 1 + 2}; function readContract() {return SharedContract.value;}',
   '/_pages/news.html':'<body data-ui-app="news"><link href="/shared/premium.css?v=old"></body>',
   '/_pages/unknown.html':'<body><link href="/shared/premium.css"></body>',
   '/_organisations/admin.mjs':'// private adapter stays unchanged\n export const value = 1;'
  },files=new Map();
  for(const [url,text]of Object.entries(sources)){
   const filename=path.join(output,url);fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,text);
   files.set(url,url.endsWith('.html')?'page.html':url);
  }
  const result=prepareDelivery(output,files);assert.ok(result.after<result.before);
  const read=url=>fs.readFileSync(path.join(output,url),'utf8');
  assert.ok(read('/_pages/news.html').includes('/shared/premium-news.css?v=old'));
  assert.match(read('/shared/premium-news.css'),/\.news|\.shared/);assert.doesNotMatch(read('/shared/premium-news.css'),/\.case/);
  assert.ok(read('/_pages/unknown.html').includes('/shared/premium.css'));
  assert.equal(read('/_organisations/admin.mjs'),sources['/_organisations/admin.mjs']);
  const context={};vm.runInNewContext(read('/entry.js'),context);assert.equal(context.readContract(),3);assert.equal(context.SharedContract.value,3);
 }finally{fs.rmSync(output,{recursive:true,force:true});}
});
