const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('production city-module delivery preserves offline city search without native JSON module imports',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ritual-city-delivery-'));
 try{
  fs.mkdirSync(path.join(directory,'shared'));fs.writeFileSync(path.join(directory,'shared/premium.css'),'');fs.mkdirSync(path.join(directory,'ritual-assist'));
  fs.copyFileSync('packages/vedic/places.mjs',path.join(directory,'ritual-assist/places.mjs'));
  const {prepareDelivery}=require('../infrastructure/cloudflare/build-delivery.cjs');prepareDelivery(directory,new Map([['/ritual-assist/places.mjs','packages/vedic/places.mjs']]));
  const output=fs.readFileSync(path.join(directory,'ritual-assist/places.mjs'),'utf8');assert.doesNotMatch(output,/\bimport\s/);
  const delivered=await import('data:text/javascript;base64,'+Buffer.from(output).toString('base64'));
  assert.equal(delivered.getPlace('geonames:1261481').name,'New Delhi');assert.equal(delivered.searchPlaces('New Delhi').matches[0].id,'geonames:1261481');assert.equal(delivered.nearestPlace(28.6139,77.209).place.id,'geonames:1261481');assert.equal(delivered.nearestPlace(51.5074,-.1278),null);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
