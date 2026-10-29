const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');

test('booking interface copy covers actionable app errors in Hindi and Gujarati',async()=>{
 const {copy,text}=await import('../apps/pandit-booking/frontend/copy.mjs');
 const {translateMessage,canonical}=await import('../apps/pandit-booking/frontend/locale.mjs');
 for(const file of ['engine.mjs','service.mjs','routes.cjs']){
  const source=fs.readFileSync('apps/pandit-booking/backend/'+file,'utf8');
  for(const match of source.matchAll(/(?:fail\(\d+,|Error\()'([^']+)'/g)){
   assert.ok(copy[match[1]],'Missing error translation: '+match[1]);
   for(const language of ['hi','gu'])assert.notEqual(translateMessage(match[1],language),match[1]);
  }
 }
 for(const [source,translations]of Object.entries(copy)){
  assert.equal(translations.length,2,source);
  assert.match(translations[0],/[\u0900-\u097f]/,source+' Hindi');
  assert.match(translations[1],/[\u0a80-\u0aff]/,source+' Gujarati');
 }
 for(const language of ['hi','gu']){
  for(const value of ['Customer','Pandit','pending','done'])assert.equal(canonical(text(value,language)),value);
  assert.notEqual(translateMessage('Contact: use 5–150 characters',language),'Contact: use 5–150 characters');
  assert.ok(translateMessage('Please sign in Open My account to sign in again.',language).includes(text('Open My account to sign in again.',language)));
 }
 assert.equal(canonical('Flowers / fruit | keep as entered'),'Flowers / fruit | keep as entered');
 assert.equal(text('Untranslated customer text','hi'),'Untranslated customer text');
});
