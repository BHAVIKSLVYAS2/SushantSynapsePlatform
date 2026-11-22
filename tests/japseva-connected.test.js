const {test}=require('node:test'),assert=require('node:assert/strict');
test('canonical adaptation preserves every legacy string, chapter order and stable identities',async()=>{
 const {mantras,canonicalMantras}=await import('../apps/japseva/frontend/library.mjs');
 const {validateCanonical,createCanonical,structureText}=await import('../apps/japseva/frontend/canonical-content.mjs');
 assert.equal(canonicalMantras.length,110);assert.deepEqual(validateCanonical(canonicalMantras).errors,[]);
 for(const m of mantras){const r=m.canonical;assert.equal(r.legacy,m);assert.equal(createCanonical(m).version,r.version);assert.equal(r.units.length,m.chapters?.length||1);for(const u of r.units)assert.equal(u.lines.map(l=>l.text).join(''),u.source.text);assert.doesNotThrow(()=>JSON.stringify(m));}
 const accented='अ॒ग्निं मी॑ळे ।\nॐ हँ हः क्त्रीँ ॥';const lines=structureText(accented,'test');assert.equal(lines.map(l=>l.text).join(''),accented);assert.deepEqual(structureText(accented,'test'),lines);
});
test('pilot keeps sandhi intact and every draft interpretation maps to exact surface words',async()=>{
 const {canonicalMantras}=await import('../apps/japseva/frontend/library.mjs');const r=canonicalMantras.find(r=>r.id==='mahamrityunjaya');
 assert.equal(r.units[0].lines.length,3);assert.equal(r.audio,null);assert.equal(r.source.verification.status,'source-checked');assert.equal(r.verification.status,'draft');
 for(const l of r.units[0].lines){assert.equal(l.padaccheda,null);assert.equal(l.annotations.length,3);for(const a of l.annotations){assert.equal(a.verification.status,'ai-assisted');assert.equal(a.lineId,l.id);assert.equal(a.mantraVersion,r.version);}for(const w of l.words){assert.ok(w.meanings[0].text);assert.equal(w.grammar,null);}}
 assert.match(r.units[0].lines[2].text,/बन्धनान्मृत्योर्मुक्षीय/);
});
test('recording revision bindings match the actual licensed local assets',async()=>{
 const {canonicalMantras}=await import('../apps/japseva/frontend/library.mjs');const {createHash}=require('node:crypto'),{readFileSync}=require('node:fs'),{resolve}=require('node:path');
 for(const r of canonicalMantras.filter(r=>r.audio)){assert.equal(createHash('sha256').update(readFileSync(resolve('apps/japseva/frontend',r.audio.asset.replace('/japseva/','')))).digest('hex'),r.audio.recordingVersion);assert.equal(r.audio.alignment,null);assert.equal(r.audio.verification.status,'draft');}
});
test('validation rejects corrupted spans, false expert claims and stale annotation/audio versions',async()=>{
 const {canonicalMantras}=await import('../apps/japseva/frontend/library.mjs');const {validateCanonical,usableAlignment}=await import('../apps/japseva/frontend/canonical-content.mjs');
 const pilot=canonicalMantras.find(r=>r.pilot),clone=()=>structuredClone(pilot);
 for(const alter of [r=>r.units[0].lines[0].text+='x',r=>r.units[0].lines[0].words[0].end++,r=>r.verification.status='expert-reviewed',r=>r.units[0].lines[0].annotations[0].wordIds=['bad'],r=>r.units[0].lines[0].annotations[0].mantraVersion='old',r=>r.source.verification.evidence=null]){const r=clone();alter(r);assert(validateCanonical([r]).errors.length);}
 const r=structuredClone(canonicalMantras.find(r=>r.audio));assert.equal(usableAlignment(r),null);r.audio.duration=10;r.audio.alignment={status:'expert-reviewed',review:{reviewer:'test fixture',evidence:'fixture'},mantraVersion:r.version,recordingVersion:r.audio.recordingVersion,segments:[{lineId:r.units[0].lines[0].id,start:0,end:2}]};assert(usableAlignment(r));r.audio.alignment.recordingVersion='changed';assert.equal(usableAlignment(r),null);assert(validateCanonical([r]).errors.length);
});
