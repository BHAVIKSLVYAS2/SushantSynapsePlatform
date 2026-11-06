const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const canonical=require('../packages/vedic/data/india-places.json'),{packDirectory,browserSource}=require('../infrastructure/build-place-directory.cjs');
test('compact browser data restores every canonical value, field order and provenance without mutation',async()=>{
 const {unpackDirectory}=await import('../packages/vedic/place-directory-codec.mjs'),before=JSON.stringify(canonical),packed=packDirectory(canonical);
 assert.equal(JSON.stringify(unpackDirectory(packed)),before);assert.equal(JSON.stringify(canonical),before);
 const {default:browser}=await import('../packages/vedic/place-directory.browser.mjs');assert.deepEqual(browser,canonical);
 assert.equal(fs.readFileSync('packages/vedic/place-directory.browser.mjs','utf8'),browserSource(canonical));
});
test('browser bundle excludes full JSON while Node retains the canonical directory',async()=>{
 const {buildSync}=require('esbuild'),result=buildSync({entryPoints:['packages/vedic/places.mjs'],bundle:true,write:false,metafile:true,platform:'browser',format:'esm',minify:true,charset:'utf8'});
 assert(!Object.hasOwn(result.metafile.inputs,'packages/vedic/data/india-places.json'));assert(Object.hasOwn(result.metafile.inputs,'packages/vedic/place-directory.browser.mjs'));assert(result.outputFiles[0].contents.length<600000);
 const {default:node}=await import('../packages/vedic/place-directory.mjs');assert.deepEqual(node,canonical);
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const original=await import('../packages/vedic/places.mjs');
 for(const place of canonical.places)assert.deepEqual(api.getPlace(place.id),original.getPlace(place.id));
 for(const query of ['Delhi','Pune','Mumbai','Poonch','Rampur','कानपुर','Surat'])assert.deepEqual(api.searchPlaces(query),original.searchPlaces(query));
 assert.deepEqual(api.nearestPlace(28.6139,77.209),original.nearestPlace(28.6139,77.209));
 assert.throws(()=>api.getPlace('geonames:999999999999'),e=>e.code==='UNKNOWN_PLACE');
});
