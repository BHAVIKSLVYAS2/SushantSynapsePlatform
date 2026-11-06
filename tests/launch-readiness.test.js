const {test}=require('node:test'),assert=require('node:assert/strict');
test('edge protections preserve CSP, cookies and public caching while errors and APIs stay private',async()=>{
 const {secureResponse}=await import('../infrastructure/cloudflare/response-security.mjs');
 for(const [route,status,cache]of [['/_static/asset.css',200,'public, max-age=31536000, immutable'],['/_static/missing.css',404,'no-store'],['/api/auth/status',200,'no-store']]){
  const request=new Request('https://example.test'+route),response=secureResponse(request,new Response('fixture',{status,headers:{'Cache-Control':'public, max-age=31536000, immutable','Content-Security-Policy':"connect-src 'none'",'Referrer-Policy':'no-referrer','Set-Cookie':'fixture=1; Secure; HttpOnly; SameSite=Strict'}}));
  assert.equal(response.headers.get('cache-control'),cache);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('x-frame-options'),'DENY');assert.equal(response.headers.get('strict-transport-security'),'max-age=31536000');assert.match(response.headers.get('permissions-policy'),/geolocation=\(self\)/);assert.equal(response.headers.get('content-security-policy'),"connect-src 'none'");assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.match(response.headers.get('set-cookie'),/HttpOnly/);assert.equal(await response.text(),'fixture');
 }
 const head=secureResponse(new Request('http://localhost/test',{method:'HEAD'}),new Response('body'));assert.equal(await head.text(),'');assert.equal(head.headers.get('strict-transport-security'),null);
});
test('shared legal composition adds its stylesheet and language runtime only once',()=>{
 const {legalHtml}=require('../packages/ui/legal-html.cjs');let html='<html><head><script src="/shared/platform-shell.js"></script></head><body data-ui-app="fixture"></body></html>';html=legalHtml(legalHtml(html));assert.equal((html.match(/href="\/shared\/legal-footer.css"/g)||[]).length,1);assert.equal((html.match(/src="\/shared\/language.js/g)||[]).length,1);assert.equal((html.match(/class="synapse-legal-footer"/g)||[]).length,1);
});
test('edge entry blocks encoded internal build paths before consulting assets',async()=>{
 const {default:worker}=await import('../infrastructure/cloudflare/fullstack-worker.mjs');let calls=0;
 for(const path of ['/_pages/home.html','/%5fpages/home.html','/%5fedge/functionality-ledger.md','/%5forganisations/account.html','/%ZZ']){
  const response=await worker.fetch(new Request('https://example.test'+path),{ASSETS:{fetch(){calls++;throw Error('Internal asset leak');}}});assert.equal(response.status,404);assert.equal(response.headers.get('cache-control'),'no-store');
 }assert.equal(calls,0);
});
