const {test}=require('node:test'),assert=require('node:assert/strict');
const profile='IN_LAHIRI_DEFAULT_V1',day=86400000,start=Date.parse('2026-10-25T00:00Z');
const normalize=v=>(v%360+360)%360;

test('bounded crossing search refines forward/reverse zodiac wrap and both screening edges',async()=>{
 const {findTransitCrossings:f}=await import('../packages/vedic/transit-crossings.mjs');
 for(const direction of [1,-1]){const result=f({startMs:start,endMs:start+day,guardDegrees:61/3600,longitudeAt:t=>normalize(direction*(.2*(t-start)/day-.1))});
  assert.equal(result.events.length,3);const ingress=result.events.find(e=>e.kind==='ingress');
  assert.equal(ingress.angle,0);assert.equal(ingress.direction,direction===1?'forward':'reverse');
  assert.ok(ingress.lowerMs<=start+day/2&&ingress.upperMs>=start+day/2);
  for(const e of result.events)assert.ok(e.upperMs-e.lowerMs<=500);
 }
});

test('station split finds a pair of return crossings hidden between identical endpoint signs',async()=>{
 const {findTransitCrossings:f}=await import('../packages/vedic/transit-crossings.mjs'),end=start+1800000,center=start+900000;
 const result=f({startMs:start,endMs:end,guardDegrees:61/3600,longitudeAt:t=>30+.0001-((t-center)/120000)**2*.0001});
 const crossings=result.events.filter(e=>e.kind==='ingress');assert.equal(crossings.length,2);assert.equal(result.stations.length,1);
 for(const [i,expected]of [center-120000,center+120000].entries()){assert.ok(crossings[i].lowerMs<=expected&&crossings[i].upperMs>=expected);}
 assert.equal(crossings[0].direction,'forward');assert.equal(crossings[1].direction,'reverse');
});

test('a stationary boundary contact is withheld and an excessive motion rate fails closed',async()=>{
 const {findTransitCrossings:f}=await import('../packages/vedic/transit-crossings.mjs');
 const center=start+900000,result=f({startMs:start,endMs:start+1800000,guardDegrees:61/3600,longitudeAt:t=>30-((t-center)/120000)**2*.0001});
 assert.equal(result.events.filter(e=>e.kind==='ingress').length,0);assert.ok(result.contacts.length>0);
 assert.throws(()=>f({startMs:start,endMs:start+day,guardDegrees:61/3600,longitudeAt:t=>normalize((t-start)/day*100)}),e=>e.code==='COMPUTATION_LIMIT');
});

test('real Moon ingress agrees with the separately implemented Panchang transition and all twelve rule evaluations',async()=>{
 const {transitEventsForDate,timelineForRashi}=await import('../packages/vedic/rashifal-timeline.mjs'),{panchangSnapshot}=await import('../packages/vedic/panchang.mjs'),{evaluateTransitSample}=await import('../packages/vedic/rashifal-transits.mjs');
 const sky=transitEventsForDate({localDate:'2026-10-25',calculationProfileId:profile});assert.equal(sky.status,'available');assert.ok(sky.evaluations<500);
 const ingress=sky.changes.find(e=>e.body==='Moon'&&e.kind==='ingress');assert.equal(ingress.fromRashi,12);assert.equal(ingress.toRashi,1);
 const p=panchangSnapshot({timeScale:'UTC',utcInstant:sky.startUtc,calculationProfileId:profile});assert.ok(Math.abs(Date.parse(p.nextTransitions.nakshatra.utcInstant)-Date.parse(ingress.utcInstant))<1000);
 for(let rashi=1;rashi<=12;rashi++){const timeline=timelineForRashi({days:[sky],rashi});assert.equal(timeline.events.length,3);
  for(const [i,event]of timeline.events.entries()){const source=sky.changes[i],before=evaluateTransitSample({positions:source.beforePositions,rashi}),after=evaluateTransitSample({positions:source.afterPositions,rashi});
   assert.equal(event.fromHouse,(source.fromRashi-rashi+12)%12+1);assert.equal(event.toHouse,(source.toRashi-rashi+12)%12+1);
   for(const change of event.affected){assert.equal(change.fromStatus,before.find(r=>r.body===change.body).status);assert.equal(change.toStatus,after.find(r=>r.body===change.body).status);}
   for(const row of after)if(['Rahu','Ketu'].includes(row.body)&&row.favorable&&!row.nearBoundary)assert.equal(row.status,'rule-unresolved');
  }
 }
});

test('timeline admission, half-open edges, no-change days and unavailable periods remain explicit',async()=>{
 const {findTransitCrossings:f}=await import('../packages/vedic/transit-crossings.mjs'),{transitEventsForDate,timelineForRashi}=await import('../packages/vedic/rashifal-timeline.mjs');
 assert.throws(()=>transitEventsForDate({localDate:'2026-10-25',calculationProfileId:profile,name:'private'}));
 const none=f({startMs:start,endMs:start+day,guardDegrees:61/3600,longitudeAt:()=>15});assert.equal(none.events.length,0);
 const edge=f({startMs:start,endMs:start+day,guardDegrees:61/3600,longitudeAt:t=>normalize(29.9+.1*(t-start)/day)}).events.find(e=>e.kind==='ingress');assert.equal(edge.intervalMembership,'boundary-uncertain');
 assert.equal(timelineForRashi({days:[{localDate:'2026-10-25',status:'unavailable',diagnostic:'COMPUTATION_LIMIT',changes:[],contacts:[],evaluations:0}],rashi:1}).status,'unavailable');
});
