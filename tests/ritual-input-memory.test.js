const {test}=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../apps/ritual-assist/frontend/calendar-input-memory.mjs');
function fixture(){const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};return {data,storage};}

test('calendar memory restores only canonical fields and keeps forms and checklists separate',async()=>{
 const {createCalendarInputMemory}=await load(),{data,storage}=fixture(),remember=createCalendarInputMemory('remembrance',()=>storage),dates=createCalendarInputMemory('observances',()=>storage);
 data.set('synapse-ritual-checklists-v1','existing checklists');
 assert.equal(remember.save({date:'2025-10-01',time:'23:59',placeId:'geonames:1261481',calendar:'purnimanta',counting:'sunrise',confirmedTithi:'30',include13:false,latitude:28.6,longitude:77.2,query:'Free text',result:{private:true}}),true);
 assert.deepEqual(createCalendarInputMemory('remembrance',()=>storage).values,{date:'2025-10-01',time:'23:59',placeId:'geonames:1261481',calendar:'purnimanta',counting:'sunrise',confirmedTithi:'30',include13:false});
 dates.save({placeId:'geonames:1275339',month:'2026-11',calendar:'amanta'});remember.clear();
 assert.deepEqual(createCalendarInputMemory('remembrance',()=>storage).values,{});assert.equal(createCalendarInputMemory('observances',()=>storage).values.month,'2026-11');assert.equal(data.get('synapse-ritual-checklists-v1'),'existing checklists');
 assert.ok(![...data.values()].some(value=>value.includes('latitude')||value.includes('Free text')));
});

test('invalid stored field values cannot restore impossible dates, unsupported months or arbitrary locations',async()=>{
 const {createCalendarInputMemory}=await load(),{storage}=fixture();
 const remember=createCalendarInputMemory('remembrance',()=>storage);remember.save({date:'2025-02-30',time:'25:00',placeId:'<script>',confirmedTithi:'31',calendar:'unknown',counting:'guess',include13:'true'});assert.deepEqual(remember.values,{});
 remember.save({date:'2024-02-29',time:'00:00',placeId:'',confirmedTithi:''});assert.equal(createCalendarInputMemory('remembrance',()=>storage).values.date,'2024-02-29');
 remember.save({date:'',time:'',placeId:''});assert.deepEqual(remember.values,{date:'',time:'',placeId:''});
 const dates=createCalendarInputMemory('observances',()=>storage);dates.save({month:'2031-01'});assert.deepEqual(dates.values,{});
 assert.throws(()=>createCalendarInputMemory('other',()=>storage));
});

test('unreadable saved data is preserved until an explicit scoped clear',async()=>{
 const {createCalendarInputMemory,calendarMemoryCopy}=await load(),{data,storage}=fixture(),key='synapse-ritual-remembrance-inputs-v1';
 for(const raw of ['{bad',JSON.stringify({version:2,fields:{}}),JSON.stringify({version:1,fields:[]}), 'x'.repeat(4097)]){
  data.set(key,raw);const memory=createCalendarInputMemory('remembrance',()=>storage);assert.equal(memory.status,'invalid');assert.equal(memory.save({date:'2025-10-01'}),false);assert.equal(data.get(key),raw);assert.match(calendarMemoryCopy('en',memory.status),/kept unchanged/);assert.equal(memory.clear(),true);assert.equal(data.has(key),false);assert.equal(memory.save({date:'2025-10-01'}),true);
 }
});

test('storage failures leave existing data intact and never claim successful saving or clearing',async()=>{
 const {createCalendarInputMemory,calendarMemoryCopy}=await load(),{data,storage}=fixture(),key='synapse-ritual-remembrance-inputs-v1';
 const original=JSON.stringify({version:1,fields:{date:'2025-10-01'}});data.set(key,original);
 const denied={...storage,setItem(){throw Error('Quota exceeded');},removeItem(){throw Error('Denied');}};
 const memory=createCalendarInputMemory('remembrance',()=>denied);assert.equal(memory.values.date,'2025-10-01');assert.equal(memory.save({date:'2025-10-02'}),false);assert.equal(memory.status,'unavailable');assert.equal(memory.clear(),false);assert.equal(data.get(key),original);assert.match(calendarMemoryCopy('hi',memory.status),/उपलब्ध नहीं/);
 const blocked=createCalendarInputMemory('observances',()=>{throw Error('Denied');});assert.equal(blocked.status,'unavailable');assert.deepEqual(blocked.values,{});
});
