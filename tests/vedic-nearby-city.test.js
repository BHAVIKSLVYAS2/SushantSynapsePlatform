const {test}=require('node:test'),assert=require('node:assert/strict');
test('nearest supported city uses validated transient coordinates and rejects remote matches',async()=>{
 const {getPlace,nearestPlace}=await import('../packages/vedic/places.mjs');
 for(const id of ['geonames:1261481','geonames:1275339']){const city=getPlace(id),result=nearestPlace(city.latitude,city.longitude);assert.equal(result.place.id,id);assert.equal(result.distanceKm,0);}
 assert.equal(nearestPlace(51.5,-.12),null);assert.equal(nearestPlace(0,0),null);
 for(const pair of [[NaN,72],[91,72],[19,181],['19',72]])assert.throws(()=>nearestPlace(...pair));
});
