const {test}=require('node:test'),assert=require('node:assert/strict');
test('shared city API bounds input, resolves canonical cities and never accepts GPS',async()=>{
 const {placeLookup,placeResponse}=await import('../packages/vedic/place-api.mjs');
 const url=query=>new URL('https://example.test/api/places?'+query);
 const result=placeLookup(url('q=New%20Delhi&limit=8'));
 assert.equal(result.status,200);assert.equal(result.body.matches[0].id,'geonames:1261481');
 assert.ok(result.body.matches.length<=8);
 assert.deepEqual(placeLookup(url('id=geonames:1261481')).body.place,result.body.matches[0]);
 for(const query of ['q=a','q='+'a'.repeat(101),'q=Delhi&limit=21','q=Delhi&limit=-1','q=Delhi&lat=28','q=Delhi&q=Mumbai','id=bad','id=geonames:1261481&q=Delhi','q=%00Delhi'])assert.equal(placeLookup(url(query)).status,400,query);
 assert.equal(placeLookup(url('q=Delhi'),'POST').status,405);
 const response=placeResponse(new Request(url('q=Delhi'),{method:'HEAD'}));
 assert.equal(response.status,200);assert.equal(await response.text(),'');assert.match(response.headers.get('Cache-Control'),/max-age=86400/);
});
test('public city API works at the edge without opening private storage, and enforces its limiter',async()=>{
 const {edgeApi}=await import('../server/edge-index.mjs');
 const request=new Request('https://example.test/api/places?q=Mumbai');
 const env={PUBLIC_ORIGIN:'https://example.test',CITY_LIMITER:{limit:async()=>({success:true})}};
 const response=await edgeApi(request,env);assert.equal(response.status,200);assert.equal((await response.json()).matches[0].name,'Mumbai');
 assert.equal((await edgeApi(request,{...env,CITY_LIMITER:{limit:async()=>({success:false})}})).status,429);
 assert.equal((await edgeApi(new Request('https://example.test/api/places?q=Mumbai',{headers:{Origin:'https://other.test'}}),env)).status,403);
});
