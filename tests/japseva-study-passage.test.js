const {test}=require('node:test'),assert=require('node:assert/strict');

test('every library passage has Sanskrit-first, Roman and Gujarati reading aids in all interface languages',async()=>{
 const {mantras}=await import('../apps/japseva/frontend/library.mjs'),{chapterMeaningPairs}=await import('../apps/japseva/frontend/chapter-meanings.mjs'),{studyPassage}=await import('../apps/japseva/frontend/study-passage.mjs');
 const before=JSON.stringify(mantras);let passages=0;
 for(const m of mantras){const units=m.chapters?m.chapters.flatMap(c=>chapterMeaningPairs(c)||[]):m.verses?.length>1?m.verses:[{sanskrit:m.text,meaning:m.meanings}];
  for(const unit of units){passages++;for(const language of ['hi','en','gu']){const result=studyPassage(unit.sanskrit,unit.meaning,language);assert(result.source.trim(),m.id);assert(result.roman.trim(),m.id);assert(result.gujarati.trim(),m.id);assert(result.meaning.trim(),m.id);assert.doesNotMatch(result.roman,/[\u0900-\u0963\u0966-\u097fꣳ]/u,m.id);assert.doesNotMatch(result.gujarati,/[\u0900-\u0963\u0966-\u097fꣳ]/u,m.id);assert.equal(result.meaningLanguage,m.chapters?'hi':language,m.id);}}
 }
 assert.equal(mantras.length,110);assert(passages>1000);assert.equal(JSON.stringify(mantras),before);
});

test('reading aids preserve long vowels, conjuncts, nasal sounds, visarga and original source strings',async()=>{
 const {studyPassage}=await import('../apps/japseva/frontend/study-passage.mjs');
 const source='ॐ नमः शिवाय। ऋषिः क्षेत्रं श्रीं हँ ꣳ १२॥',unit=studyPassage(source,{hi:'परीक्षण'},'gu');
 assert.equal(unit.source,source);assert.equal(unit.roman,'Om namaḥ śivāya· ṛṣiḥ kṣetraṃ śrīṃ ham̐ ṃ 12॥');assert.equal(unit.meaningLanguage,'hi');assert.equal(unit.meaning,'परीक्षण');
});
