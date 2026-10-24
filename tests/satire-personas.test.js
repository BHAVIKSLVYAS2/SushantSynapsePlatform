const {test}=require('node:test'),assert=require('node:assert/strict');

test('fictional display identities retain all existing ballot/link IDs and have distinct original comedy',async()=>{
 const {cast}=await import('../apps/satire-arena/frontend/catalogue.mjs');
 const expected=['roar-nab','ravish-reflection','sudhir-studio','anjana-awaaz','rajat-ruling','rubika-rapid','king-khanvas','salman-slowmo','aamir-again','akshay-action','deepika-drama','alia-encore','mukesh-megaplan','gautam-grandplan','elon-launchpad','sundar-slidechai','satya-synergy','indra-boardroom','ghanta-guru','sunday-seth','mileage-maharaj'];
 const people=cast.filter(c=>c.arena!=='politicians');assert.deepEqual(people.map(c=>c.id),expected);assert.equal(new Set(people.map(c=>c.name)).size,21);assert.equal(cast.length,34);
 for(const c of people){
  assert.doesNotMatch(c.name,/\b(Arnab|Ravish|Sudhir|Anjana|Rajat|Rubika|Salman|Aamir|Akshay|Deepika|Alia|Mukesh|Gautam|Elon|Sundar|Satya|Indra|Khan)\b/i,c.id);
  assert.equal(c.persona[5].length,3);assert.equal(c.backstage.encore.length,3);assert.equal(new Set([...c.persona[5],...c.backstage.encore]).size,6,c.name);assert.equal(c.backstage.scene.length,2);assert.ok(c.persona[1].length>200,c.name);
 }
 assert.equal(cast.find(c=>c.id==='roar-nab').name,'Decibel Dada');assert.equal(cast.find(c=>c.id==='mukesh-megaplan').name,'Launch Lalaji');
});

test('all character pages render the new dossier and server-readable punchline without unsafe embedded markup',async()=>{
 const {cast}=await import('../apps/satire-arena/frontend/catalogue.mjs'),{publicPage}=await import('../apps/satire-arena/backend/public-pages.mjs');
 for(const c of cast){
  const response=publicPage(new Request('https://example.test/satire-arena/characters/'+c.id),{posts:[],characters:[]});assert.equal(response.status,200);const html=await response.text();
  assert.ok(html.includes('data-character="'+c.id+'"'));assert.ok(html.includes('<title>'+c.name));assert.match(html,/data-comedy-lines="[^"<>]*"/);assert.match(html,/data-comedy-controls hidden/);assert.match(html,/THE UNOFFICIAL DOSSIER/);assert.equal((html.match(/class="file-dialogue/g)||[]).length,2);assert.equal((html.match(/class="file-note-number"/g)||[]).length,3);
 }
});
