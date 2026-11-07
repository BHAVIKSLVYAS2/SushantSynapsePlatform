const {test}=require('node:test'),assert=require('node:assert/strict');
test('public message templates round-trip locales without translating captured user content',async()=>{
 const {localizePublicMessage:t}=await import('../packages/ui/public-interface-templates.mjs');
 for(const source of ['6 EQUAL CHOICES','Person 12','0 of 7 items arranged','Level 2 / 3 · 4 × 4','Selected date · 2026-11-07','Shared by Home, Options','Picksy picked: Home.']){
  const hi=t(source,'hi'),gu=t(hi,'gu');assert.notEqual(hi,source);assert.notEqual(gu,source);assert.equal(t(gu,'en'),source);
 }
 assert.equal(t('Home','gu'),'Home');assert.equal(t('My Person 1 notes','hi'),'My Person 1 notes');assert.equal(t('Person 1<script>','gu'),'Person 1<script>');
 assert.equal(t('Shared by Home, Options','gu'),'આ લોકો વચ્ચે વહેંચાયેલું: Home, Options');
 assert.equal(t('Warm-up puzzle complete','gu'),'સરળ શરૂઆત કોયડો પૂરો');
 const {parseOptions}=await import('../apps/decision-wheel/frontend/engine.mjs');assert.throws(()=>parseOptions('Home\nHome'),error=>{assert.deepEqual(error.duplicateOptions,[{value:'Home',lines:[1,2]}]);return true;});
});
test('new public copy always supplies both locales and keeps source strings intact',async()=>{
 const {publicInterfaceCopy:copy}=await import('../packages/ui/public-interface-copy.mjs');
 for(const [source,values]of Object.entries(copy)){assert.ok(source);assert.equal(values.length,2);assert.match(values[0],/[\u0900-\u097f]/);assert.match(values[1],/[\u0a80-\u0aff]/);}
 assert.deepEqual(copy.Options,['विकल्प','વિકલ્પો']);
});
