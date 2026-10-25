const {test}=require('node:test');const assert=require('node:assert/strict');
const now=Date.parse('2026-10-25T00:00:00Z');
const details={name:'Example',input:{localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',calculationProfileId:'IN_LAHIRI_DEFAULT_V1',timeAccuracy:'exact'}};
test('browser Kundli store persists only validated inputs, updates and deletes without affecting other preferences',async()=>{
 const {kundliStore,savedKundliKey}=await import('../frontend/saved-kundli.mjs');const map=new Map([['synapse-language','gu']]);const storage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};const store=kundliStore({storage:()=>storage,now:()=>now});
 const saved=store.save({...details,report:{secret:'never store'},input:{...details.input,positions:[1,2,3],language:'en'}});assert.deepEqual(store.read()[0],{id:saved.id,...details});assert.equal(map.get(savedKundliKey).includes('positions'),false);assert.equal(map.get(savedKundliKey).includes('report'),false);
 store.save({...details,name:'Updated'},saved.id);assert.equal(store.read().length,1);assert.equal(store.read()[0].name,'Updated');store.remove(saved.id);assert.equal(map.has(savedKundliKey),false);assert.equal(map.get('synapse-language'),'gu');
});
test('malformed, unsupported and denied storage never gets overwritten; invalid birth details are rejected',async()=>{
 const {kundliStore}=await import('../frontend/saved-kundli.mjs');let writes=0;for(const raw of ['broken','{"version":2,"records":[]}','{"version":1,"records":[{"id":"bad","name":"X","input":{}}]}']){const store=kundliStore({storage:()=>({getItem:()=>raw,setItem:()=>writes++}),now:()=>now});assert.throws(()=>store.read());assert.throws(()=>store.save(details));}assert.equal(writes,0);
 const store=kundliStore({storage:()=>({getItem:()=>null,setItem:()=>writes++}),now:()=>now});assert.throws(()=>store.save({...details,input:{...details.input,localDate:'2000-02-30'}}));assert.throws(()=>store.save({...details,name:'\u0000'}));assert.equal(writes,0);
 assert.throws(()=>kundliStore({storage:()=>{throw Error('denied');}}).read());
});
