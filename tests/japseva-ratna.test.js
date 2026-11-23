const {test}=require('node:test'),assert=require('node:assert/strict');
test('nine Ratna guides keep graha mapping, differentiated care and honest ritual provenance',async()=>{
 const {gemstones,grahaMantra,ritualSteps,ratnaSources}=await import('../apps/japseva/frontend/ratna-content.mjs');
 assert.equal(gemstones.length,9);assert.equal(new Set(gemstones.map(g=>g.graha)).size,9);
 assert.deepEqual(gemstones.map(g=>g.graha),['surya','chandra','mangala','budha','brihaspati','shukra','shani','rahu','ketu']);
 for(const field of ['introduction','materials','care','devotionalAction','wearing'])assert.equal(new Set(gemstones.map(g=>g[field].en)).size,9,field);
 const {expandedMantras}=await import('../apps/japseva/frontend/expanded-mantras.mjs');
 for(const gem of gemstones){
  const m=grahaMantra(gem);assert.equal(m.text,expandedMantras.find(m=>m.id===gem.mantraId).text);assert.ok(m.meanings.hi);assert.ok(m.transliteration);
  const steps=ritualSteps(gem);assert.equal(steps.length,5);assert.equal(steps[3].japaCount,null);
  for(const step of steps){assert.ok(step.action.en&&step.action.hi);if(step.mantraId)assert.equal(step.mantraId,gem.mantraId);for(const id of step.sourceIds)assert.ok(ratnaSources.find(s=>s.id===id),id);}
  assert.ok(gem.claims.every(c=>c.verificationStatus&&c.confidence&&c.sourceIds.length));
 }
 assert.match(gemstones.find(g=>g.id==='pearl').care.en,/Do not immerse/);
 assert.match(gemstones.find(g=>g.id==='emerald').care.en,/fracture filling/);
 assert.match(gemstones.find(g=>g.id==='hessonite').devotionalAction.en,/not automatically/);
});
