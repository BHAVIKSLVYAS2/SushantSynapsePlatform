const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=import('../apps/take-a-break/frontend/chaos-engine.mjs');
test('chaos is deterministic across frame sizes and ends at sixty seconds',async()=>{const {createRound,advance}=await engine,a=createRound(73),b=createRound(73);advance(a,60000);for(let i=0;i<600;i++)advance(b,100);assert.deepEqual(a,b);assert.equal(a.done,true);assert.equal(a.elapsed,60000);const score=a.score;advance(a,1000);assert.equal(a.score,score);});
test('chai rewards, meeting penalties and alarms resolve only once',async()=>{const {createRound,advance,silence}=await engine,s=createRound();s.next=10000;s.objects=[{id:1,type:'chai',lane:2,end:100},{id:2,type:'meeting',lane:0,end:200},{id:3,type:'alarm',end:300}];advance(s,200);assert.equal(s.score,12);assert.equal(s.caught,1);assert.equal(s.dodged,1);assert.equal(silence(s,3),true);assert.equal(silence(s,3),false);assert.equal(s.score,17);s.objects=[{id:4,type:'meeting',lane:2,end:400},{id:5,type:'alarm',end:500}];advance(s,300);assert.equal(s.score,0);assert.equal(s.hits,1);assert.equal(s.missed,1);});
test('calmer rounds spawn fewer objects; movement and invalid time stay bounded',async()=>{const {createRound,advance,move}=await engine,a=createRound(21),b=createRound(21,true);advance(a,59000);advance(b,59000);assert.ok(a.serial>b.serial);move(a,99);assert.equal(a.lane,4);move(a,-99);assert.equal(a.lane,0);move(a,NaN);assert.equal(a.lane,0);advance(a,NaN);assert.equal(a.elapsed,59000);});

test('streak rewards increase and missed chai breaks the multiplier with feedback',async()=>{
 const {createRound,advance}=await engine,s=createRound();s.next=10000;
 for(let i=1;i<=10;i++){s.objects=[{id:i,type:'chai',lane:2,end:i*100}];advance(s,100);}
 assert.equal(s.combo,10);assert.equal(s.score,170);assert.match(s.feedback,/30/);
 s.objects=[{id:11,type:'chai',lane:0,end:1100}];advance(s,100);assert.equal(s.combo,0);assert.match(s.feedback,/Missed chai/);
});
test('many generated rounds keep opposing arrivals separated and escalate spawn pressure',async()=>{
 const {createRound,advance}=await engine;
 let early=0,late=0;
 for(let seed=1;seed<=100;seed++)for(const calm of [false,true]){
  const s=createRound(seed,calm);let first,last;
  for(let t=0;t<59000;t+=100){advance(s,100);if(t===19900)first=s.serial;if(t===39900)last=s.serial;
   const falling=s.objects.filter(o=>o.type!=='alarm');
   for(const a of falling)for(const b of falling)if(a.type!==b.type)assert.ok(Math.abs(a.end-b.end)>=500*(calm?1.35:1));
  }
  early+=first;late+=s.serial-last;
 }
 assert.ok(late>early,'final stage introduces more objects than the opening');
});
