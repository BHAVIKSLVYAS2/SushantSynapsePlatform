const {test}=require('node:test'),assert=require('node:assert/strict');
test('all 128 library sections have exact complete Hindi mappings or no Sanskrit to translate',async()=>{
 const {mantras}=await import('../apps/japseva/frontend/library.mjs'),{chapterMeaningPairs}=await import('../apps/japseva/frontend/chapter-meanings.mjs');let sections=0,empty=0;const unique=new Set();
 for(const m of mantras)for(const c of m.chapters||[]){sections++;const before=c.text,pairs=chapterMeaningPairs(c);if(!c.text){empty++;assert.equal(pairs,null);continue;}assert(pairs,m.id+':'+(c.id||c.book+':'+c.number));assert.equal(pairs.map(p=>p.sanskrit).join(''),before);assert(pairs.every(p=>p.meaning.hi.trim()&&p.reviewStatus==='ai-assisted'));assert.equal(c.text,before);unique.add(c.text);}
 assert.equal(mantras.length,110);assert.equal(sections,128);assert.equal(empty,2);assert.equal(unique.size,66);
});
test('source revisions, gaps, overlap, missing Hindi and invalid offsets cannot acquire translations',async()=>{
 const {default:data}=await import('../apps/japseva/frontend/chapter-meanings-data.mjs'),{validateChapterMapping}=await import('../apps/japseva/frontend/chapter-meanings.mjs'),entry=Object.values(data)[0],chapter={text:entry.sourceText};assert(validateChapterMapping(chapter,entry));
 for(const mutate of [e=>e.sourceText+='x',e=>e.pairs[0].start=1,e=>e.pairs[0].end=0,e=>e.pairs[0].end=1.5,e=>e.pairs[0].hi='',e=>e.pairs.pop(),e=>e.pairs[0].end=999999]){const edited=structuredClone(entry);mutate(edited);assert.equal(validateChapterMapping(chapter,edited),false);}
});
test('display cleanup removes imported image markup without changing Sanskrit records',async()=>{
 const {mantras}=await import('../apps/japseva/frontend/library.mjs'),{cleanReadingText}=await import('../apps/japseva/frontend/chapter-meanings.mjs'),c=mantras.find(m=>m.id==='puja-navchandi').chapters.find(c=>c.id==='saptashati-8');assert(c.text.includes('thumb|'));const clean=cleanReadingText(c.text);assert(!clean.includes('thumb|'));assert.equal(clean,c.text.split('\n').filter(line=>!line.startsWith('thumb|')).join('\n'));
});
