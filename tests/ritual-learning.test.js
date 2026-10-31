const {test}=require('node:test'),assert=require('node:assert/strict');
test('every existing ritual has scoped bilingual learning without inventing full ceremony scripts',async()=>{
 const {guides}=await import('../apps/ritual-assist/frontend/guides.mjs'),{learningFor,reviewedOn}=await import('../apps/ritual-assist/frontend/learning-content.mjs');
 assert.equal(reviewedOn,'2026-10-31');
 for(const guide of guides){const result=learningFor(guide);assert.ok(result.steps.length>=4);assert.ok(result.prayers.length>=2);for(const lang of ['en','hi']){for(const value of [result.note,...result.steps.flatMap(s=>[s.title,s.body]),...result.prayers.flatMap(p=>[p.title,p.kind,p.meaning,p.use])]){assert.ok(value[lang]);if(lang==='hi')assert.match(value[lang],/\p{Script=Devanagari}/u);assert.doesNotMatch(value[lang],/\?\?\?/);}}for(const prayer of result.prayers){assert.match(prayer.sanskrit,/\p{Script=Devanagari}/u);assert.ok(prayer.iast);assert.ok(prayer.locator);assert.ok(result.sources.some(s=>s.id===prayer.source));}for(const source of result.sources)assert.equal(new URL(source.url).protocol,'https:');if(guide.category==='ashubh'){assert.equal(result.mode,'remembrance');assert.deepEqual(result.prayers.map(p=>p.id),['self','peace']);}}
 for(const id of ['vivah','havan','namkaran','griha-pravesh','satyanarayan'])assert.equal(learningFor(guides.find(g=>g.id===id)).mode,'guided');
 assert.throws(()=>learningFor({id:'made-up',category:'unknown'}));
});
test('checked Sanskrit formulas keep their deity and offering, and excerpts remain labelled',async()=>{
 const {prayers}=await import('../apps/ritual-assist/frontend/learning-content.mjs');
 assert.equal(prayers['ganesha-flower'].sanskrit,'ॐ गणपतये नमः पुष्पं समर्पयामि।');
 assert.equal(prayers['lakshmi-flower'].sanskrit,'श्रीलक्ष्मी-देव्यै नमः पुष्पं समर्पयामि।');
 assert.equal(prayers['ganesha-close'].sanskrit,'अनेन पूजनेन श्रीगणपतिः प्रीयताम्।');
 assert.equal(prayers.peace.sanskrit,'ॐ शान्तिः शान्तिः शान्तिः॥');assert.match(prayers.peace.kind.en,/excerpt/);
 assert.match(prayers.self.locator,/chapter 2.*verse 20/);assert.match(prayers.offering.locator,/chapter 9.*verse 26/);
 assert.match(prayers.self.use.en,/not a substitute/);assert.match(prayers.offering.use.en,/does not replace/);
});
test('learning downloads retain original script, reading aids, without publisher URLs and ceremony scope in both languages',async()=>{
 const {guideById}=await import('../apps/ritual-assist/frontend/guides.mjs'),{learningText}=await import('../apps/ritual-assist/frontend/learning-view.mjs');
 for(const lang of ['en','hi']){const output=learningText(guideById('ganesh-puja'),lang);assert.match(output,/ॐ गणपतये नमः/);assert.match(output,/oṃ gaṇapataye namaḥ/);assert.doesNotMatch(output,/https?:\/\//);assert.match(output,/2026-10-31/);assert.match(output,/Sushant Synapse/);}
});
test('learning collection uses static local data and is explicitly allowlisted',()=>{
 const fs=require('node:fs'),{staticAssets}=require('../server/static-assets');
 for(const file of ['learning.mjs','learning-view.mjs','learning-content.mjs'])assert.ok(staticAssets['/ritual-assist/'+file]);
 const content=fs.readFileSync('apps/ritual-assist/frontend/learning-content.mjs','utf8');assert.doesNotMatch(content,/\b(fetch|localStorage|sessionStorage|analytics|speechSynthesis)\b/);
});
