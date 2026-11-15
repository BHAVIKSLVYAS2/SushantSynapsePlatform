const {test}=require('node:test'),assert=require('node:assert/strict');
test('Shloki admits only source-reviewed PDF entries and retains complete four-verse groups',async()=>{
 const {shlokas,shlokaById}=await import('../apps/ritual-assist/frontend/shloki-content.mjs');
 assert.equal(shlokas.length,19);assert.equal(new Set(shlokas.map(s=>s.id)).size,19);
 assert.deepEqual(shlokas.map(s=>s.pdfNumber),[1,2,3,4,5,6,7,8,9,10,12,13,14,15,16,17,18,19,20]);
 assert.equal(shlokaById('shiva-purana'),undefined);assert.equal(shlokaById('garuda-purana'),undefined);
 assert.deepEqual(shlokaById('gita-four').verses.map(v=>v.locator),['10.8','10.9','10.10','10.11']);
 assert.deepEqual(shlokaById('bhagavata-four').verses.map(v=>v.locator),['2.9.33','2.9.34','2.9.35','2.9.36']);
 for(const item of shlokas){assert.equal(new URL(item.source.url).protocol,'https:');assert.ok(item.source.title);for(const lang of ['en','hi']){assert.ok(item.title[lang]);for(const verse of item.verses){assert.ok(verse.meaning[lang]);assert.match(verse.sanskrit,/\p{Script=Devanagari}/u);assert.doesNotMatch(verse.sanskrit,/[\u0000\uFFFD]|\?\?\?/);assert.match(verse.sanskrit,/॥/);}}}
});
test('corrected PDF omissions and titles are not silently restored',async()=>{
 const {shlokaById}=await import('../apps/ritual-assist/frontend/shloki-content.mjs');
 assert.match(shlokaById('ganesh-dhyana').verses[0].sanskrit,/दन्ताघातविदारितारिरुधिरैः/);
 assert.match(shlokaById('mahabharata').verses[0].sanskrit,/लीलागोग्रहणं/);
 assert.match(shlokaById('bhagavata').verses[0].sanskrit,/ह्येतद्भागवतं पुराणकथितं/);
 assert.match(shlokaById('mahamrityunjaya').verses[0].sanskrit,/उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्/);
 assert.doesNotMatch(shlokaById('hanuman-kirtan').title.en,/Ekashloki Sundar/i);
 assert.doesNotMatch(shlokaById('surya-gayatri').title.en,/Purana/i);
 assert.match(shlokaById('ganapati-atharvashirsha').title.en,/excerpt/);
});
test('each shloka exports Sanskrit, meaning and a recoverable source without mixing checklist state',async()=>{
 const {shlokas,shlokaText}=await import('../apps/ritual-assist/frontend/shloki-content.mjs');
 for(const item of shlokas)for(const lang of ['en','hi']){const output=shlokaText(item,lang);for(const verse of item.verses){assert.ok(output.includes(verse.sanskrit));assert.ok(output.includes(verse.meaning[lang]));assert.ok(output.includes(verse.locator));}assert.ok(output.includes(item.source.url));assert.doesNotMatch(output,/arranged|arranger|checkmarks/i);}
});
test('reviewed collection is owned by JapSeva and no longer mounted in Ritual Prep',async()=>{
 const fs=require('node:fs'),{staticAssets}=require('../server/static-assets');
 assert.equal(staticAssets['/japseva/shloki-content.mjs'],'apps/japseva/frontend/shloki-content.mjs');
 for(const file of ['shloki.mjs','shloki-view.mjs','shloki-content.mjs'])assert.equal(staticAssets['/ritual-assist/'+file],undefined);
 assert.doesNotMatch(fs.readFileSync('apps/ritual-assist/frontend/app.js','utf8'),/mountShloki|shloki\.restore/);
 const {mantras}=await import('../apps/japseva/frontend/library.mjs'),{shlokas}=await import('../apps/japseva/frontend/shloki-content.mjs'),{migratedReadingId}=await import('../apps/japseva/frontend/reading-mantras.mjs');
 assert.equal(mantras.length,40);
 for(const s of shlokas){const m=mantras.find(m=>m.id===migratedReadingId(s.id));assert.ok(m,s.id);if(!['mahamrityunjaya','purnamadah'].includes(s.id)){assert.equal(m.text,s.verses.map(v=>v.sanskrit).join('\n\n'));assert.equal(m.sourceUrl,s.source.url);assert.equal(m.verseCount,s.verses.length);}}
 assert.equal(mantras.filter(m=>m.id==='mahamrityunjaya').length,1);assert.equal(mantras.filter(m=>m.id==='purnamadah').length,1);
});
