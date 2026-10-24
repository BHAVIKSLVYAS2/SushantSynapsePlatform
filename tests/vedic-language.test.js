const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Every emitted calculation notice has English, Hindi and Gujarati explanation',async()=>{
 const {diagnosticTranslations,diagnosticText}=await import('../apps/rashifal-kundli/frontend/diagnostic-text.mjs');
 const codes=new Set();for(const file of fs.readdirSync('packages/vedic').filter(f=>f.endsWith('.mjs')))for(const match of fs.readFileSync('packages/vedic/'+file,'utf8').matchAll(/'([A-Z][A-Z0-9_]{4,})'/g))if(!/_V\d+$/.test(match[1])&&!/^IAU\d+$/.test(match[1]))codes.add(match[1]);
 for(const code of codes){assert.ok(diagnosticTranslations[code],code);for(const language of ['en','hi','gu']){const text=diagnosticText(code,language);assert.ok(text.includes(code));if(language==='hi')assert.match(text,/[\u0900-\u097f]/);if(language==='gu')assert.match(text,/[\u0a80-\u0aff]/);}}
});
test('Classical terminology and sourced place labels localise without changing place identity',async()=>{
 const {term,limbText,nakshatraName}=await import('../apps/rashifal-kundli/frontend/display-text.mjs'),{placeLabel,stateTranslations}=await import('../apps/rashifal-kundli/frontend/place-text.mjs'),{getPlace}=await import('../packages/vedic/places.mjs');
 const place=getPlace('geonames:1261481'),before=JSON.stringify(place);
 assert.match(placeLabel(place,'hi'),/नई दिल्ली.*New Delhi.*दिल्ली.*भारत/);assert.match(placeLabel(place,'gu'),/દિલ્હી.*ભારત/);assert.equal(JSON.stringify(place),before);
 for(const p of require('../packages/vedic/data/india-places.json').places)assert.ok(stateTranslations[p.state],p.state);
 assert.equal(term('Saturday','hi'),'शनिवार');assert.equal(term('Saturday','gu'),'શનિવાર');assert.equal(term('Chaitra','hi'),'चैत्र');assert.equal(nakshatraName(1,'gu'),'અશ્વિની (1)');
 assert.match(limbText('karana',{halfTithiIndex:5,name:'Bava'},'hi'),/करण: बव/);
 assert.equal(term('IN_LAHIRI_DEFAULT_V1','hi'),'IN_LAHIRI_DEFAULT_V1');
});
test('Localised calendar uses UTF-8 folding and redacted summaries in each language',async()=>{
 const {candidateCalendar,traditionLabels}=await import('../apps/rashifal-kundli/frontend/tradition-view.mjs');
 const value={adhikaPolicy:'regular-only',occurrences:[{status:'single-sunrise',selectedDate:'2027-12-23'}]};
 for(const language of ['en','hi','gu']){const ics=candidateCalendar(value,language);assert.ok(ics.split('\r\n').every(line=>Buffer.byteLength(line)<=75));assert.ok(ics.replaceAll('\r\n ','').includes('SUMMARY:'+traditionLabels[language].candidate));assert.match(ics,/DTSTART;VALUE=DATE:20271223/);assert.doesNotMatch(ics,/geonames|2000-01-01|New Delhi/);}
});
test('Shared language and presentation catalogues cover all three languages',async()=>{
 const {pageLabels}=await import('../apps/rashifal-kundli/frontend/language-shell.mjs'),{displayTranslations}=await import('../apps/rashifal-kundli/frontend/display-text.mjs');
 for(const language of ['hi','gu'])assert.deepEqual(Object.keys(pageLabels[language]),Object.keys(pageLabels.en));
 for(const row of Object.values(displayTranslations)){assert.ok(row.en);assert.match(row.hi,/[\u0900-\u097f]/);assert.match(row.gu,/[\u0a80-\u0aff]/);}
});
