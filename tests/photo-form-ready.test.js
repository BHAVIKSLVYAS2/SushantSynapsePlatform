const {test}=require('node:test'),assert=require('node:assert/strict');
const load=import('../apps/photo-resize/frontend/engine.mjs');
test('image geometry preserves full-image ratios or explicit exact crop without silent enlargement',async()=>{
 const {geometry}=await load,raw={width:600,height:200,kb:20},image={width:1800,height:1200};
 const fit=geometry(image,raw);assert.deepEqual([fit.outputWidth,fit.outputHeight],[300,200]);
 const crop=geometry(image,{...raw,fit:'crop'});assert.deepEqual([crop.outputWidth,crop.outputHeight,crop.width,crop.height],[600,200,1800,600]);assert.equal(crop.y,300);
 assert.equal(geometry(image,{...raw,fit:'crop',y:100}).y,600);
 assert.equal(geometry(image,{...raw,fit:'crop',rotation:90}).width,1200);
 assert.throws(()=>geometry({width:100,height:50},{...raw,fit:'crop'}),/smaller/);
 assert.equal(geometry({width:100,height:50},{...raw,fit:'crop',upscale:true}).upscaled,true);
 assert.throws(()=>geometry({width:8000,height:8000},raw),/24 megapixels/);
});
test('byte-range and format checks fail honestly below minimum, above maximum or at wrong exact pixels',async()=>{
 const {checkOutput,options}=await load,raw={width:600,height:200,kb:20,minKb:10,maxBytes:20000,fit:'crop',dpi:254};
 const result={blob:new Blob([new Uint8Array(15000)],{type:'image/jpeg'}),width:600,height:200,dpi:254,quality:1};assert.equal(checkOutput(result,raw).valid,true);assert.match(checkOutput(result,raw).checks.at(-1).detail,/6.00.*2.00 cm/);
 for(const patch of [{blob:new Blob([new Uint8Array(9000)],{type:'image/jpeg'})},{blob:new Blob([new Uint8Array(20001)],{type:'image/jpeg'})},{width:599},{dpi:96},{blob:new Blob([new Uint8Array(15000)],{type:'image/png'})}])assert.equal(checkOutput({...result,...patch},raw).valid,false);
 assert.match(checkOutput({...result,blob:new Blob(['small'],{type:'image/jpeg'})},raw).warnings.join(),/below the minimum/);
 for(const patch of [{width:0},{height:4097},{kb:9},{minKb:21},{fit:'stretch'},{format:'image/gif'},{rotation:45},{zoom:500},{x:101},{dpi:254,format:'image/png'},{maxBytes:30000}])assert.throws(()=>options({...raw,...patch}));
});
test('JPEG density writes and updates real JFIF dimensions without changing input bytes',async()=>{
 const {jpegDensity}=await load,source=Uint8Array.of(255,216,255,217),inserted=jpegDensity(source,254);assert.deepEqual([...source],[255,216,255,217]);assert.equal(inserted.length,22);assert.equal(String.fromCharCode(...inserted.slice(6,11)),'JFIF\0');assert.equal(inserted[13],1);assert.equal((inserted[14]<<8)|inserted[15],254);
 const changed=jpegDensity(inserted,300);assert.equal(changed.length,inserted.length);assert.equal((changed[14]<<8)|changed[15],300);assert.equal((inserted[14]<<8)|inserted[15],254);assert.throws(()=>jpegDensity(Uint8Array.of(1,2,3),254));
});
test('official profiles are document-scoped with source dates and conservative limits',async()=>{
 const {profiles,profileOptions}=await import('../apps/photo-resize/frontend/profiles.mjs');const {options}=await load;
 for(const [id,p]of Object.entries(profiles)){assert.ok(options(p));if(id==='custom')continue;assert.match(p.source,/^https:\/\/(indianvisaonline\.gov\.in|ssc\.gov\.in)\//);assert.equal(p.checked,'2026-10-31');}
 assert.equal(profiles['india-evisa'].maxBytes,1000000);assert.throws(()=>profileOptions('ssc-cht-2026'));assert.throws(()=>profileOptions('upsc-universal'));
 const {staticAssets}=require('../server/static-assets');for(const file of ['profiles.mjs','style.css'])assert.ok(staticAssets['/photo-resize/'+file]);
});
test('root sitemap discovers useful public tools and excludes private/noindex/alias routes',async()=>{
 const {publicPage}=await import('../apps/satire-arena/backend/public-pages.mjs'),{publicUtilityPaths}=await import('../packages/app-registry/public-seo.mjs');
 const xml=await publicPage(new Request('https://example.test/sitemap.xml'),{posts:[]}).text();for(const route of publicUtilityPaths())assert.ok(xml.includes('<loc>https://example.test'+route+'</loc>'));
 for(const route of ['/admin','/account','/super-admin','/advocate','/pandit-booking','/digital-samaj','/batchfee-lite','/tournament-lite','/rashifal-kundli','/moment-studio/certificates','/daily-spark'])assert.ok(!xml.includes('<loc>https://example.test'+route+'</loc>'));
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);assert.equal(new Set(urls).size,urls.length);const scoped=await publicPage(new Request('https://example.test/satire-arena/sitemap.xml'),{posts:[]}).text();assert.doesNotMatch(scoped,/photo-resize/);assert.match(scoped,/characters/);
});

test('photo and signature discovery copy matches the generated home and shared navigation',()=>{
 const fs=require('node:fs'),registry=require('../packages/app-registry'),{navigationBundle}=require('../infrastructure/build-catalogue.cjs');const photo=registry.apps.find(app=>app.id==='photo-resize');assert.match(registry.appSearchText(photo),/signature/);assert.match(photo.description,/exact crop/i);assert.ok(fs.readFileSync('apps/portal/frontend/index.html','utf8').includes(photo.homeDescription));assert.equal(fs.readFileSync('packages/ui/platform-shell.bundle.js','utf8'),navigationBundle());
});
