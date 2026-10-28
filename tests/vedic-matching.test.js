const {test}=require('node:test'),assert=require('node:assert/strict');
const rulebookId='SYNAPSE_ASHTAKOOTA_COMPOSITE_V1',rulesId='SYNAPSE_GEOMETRIC_RULE_PREVIEW_V1';
const birth={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'},context={now:Date.parse('2026-10-24T12:00Z')};
const center=n=>(n-.5)*360/27;

test('recorded-minute matching admits irrelevant Pada edges and reports relevant edge possibilities',async()=>{
 const {matchingForBirths}=await import('../packages/vedic/birth-matching.mjs');
 const run=(localDate,localTime)=>matchingForBirths({consent:true,personA:birth,personB:{...birth,localDate,localTime},rulebookId},context).matching;
 const pada=run('2000-01-01','11:52');assert.equal(pada.total,28);assert.equal(pada.boundaryScreen,undefined);
 for(const [date,time,boundary]of [['2000-01-01','18:32','nakshatra'],['2000-01-02','14:34','rashi']]){
  const result=run(date,time);assert.equal(result.components.length,8);assert.deepEqual(result.boundaryScreen.people,[{axis:'B',boundaries:[boundary]}]);
  assert.equal(result.total,null);assert.ok(result.totalRange.min<result.totalRange.max);
  const expected=boundary==='rashi'?['varna','vashya','graha-maitri','bhakoot']:['tara','yoni','gana','nadi'];
  for(const c of result.components){assert.ok(c.scoreRange.min>=0&&c.scoreRange.max<=c.maximum);if(!expected.includes(c.id))assert.equal(c.scoreRange.min,c.scoreRange.max);if(c.score===null)assert.ok(expected.includes(c.id));}
  assert.ok(Object.isFrozen(result.boundaryScreen.people));
 }
});

test('matching screen ranges cover dense independent samples around sign, star and zero-crossing edges',async()=>{
 const {screenedMatching}=await import('../packages/vedic/matching-screen.mjs'),{ashtakoota}=await import('../packages/vedic/matching.mjs');
 for(const a of [0,30,40/3,120,360-0.01])for(const b of [0,90,80/3,225]){
  const input={personAMoonLongitude:a,personBMoonLongitude:b,rulebookId},screen=screenedMatching(input);
  for(let i=-5;i<=5;i++)for(let j=-5;j<=5;j++){
   const r=ashtakoota({...input,personAMoonLongitude:a+i/5*121/3600,personBMoonLongitude:b+j/5*121/3600});
   assert.ok(r.total>=screen.totalRange.min&&r.total<=screen.totalRange.max);
   r.components.forEach((c,k)=>assert.ok(c.score>=screen.components[k].scoreRange.min&&c.score<=screen.components[k].scoreRange.max));
  }
 }
});
test('P15 all 108 x 108 quarter pairs have eight bounded components summing to 0..36',async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs');
 for(let a=0;a<108;a++)for(let b=0;b<108;b++){const r=ashtakoota({personAMoonLongitude:(a+.5)*360/108,personBMoonLongitude:(b+.5)*360/108,rulebookId});assert.equal(r.components.length,8);assert.equal(r.components.reduce((sum,c)=>sum+c.score,0),r.total);assert.ok(r.total>=0&&r.total<=36);r.components.forEach((c,i)=>{assert.equal(c.maximum,i+1);assert.ok(c.score>=0&&c.score<=c.maximum);});assert.equal(r.assessment,'withheld-no-marriage-verdict');assert.ok(Object.isFrozen(r.components));}
});
test('P15 independent examples verify same-star, directional Varna/Gana and cyclic Tara/Bhakoot',async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs');const run=(a,b)=>ashtakoota({personAMoonLongitude:a,personBMoonLongitude:b,rulebookId}),scores=r=>Object.fromEntries(r.components.map(c=>[c.id,c.score]));
 assert.deepEqual(Object.values(scores(run(15,15))),[1,2,3,4,5,6,7,0]);
 assert.equal(scores(run(15,105)).varna,0);assert.equal(scores(run(105,15)).varna,1);
 assert.equal(scores(run(center(2),center(1))).gana,5);assert.equal(scores(run(center(1),center(2))).gana,6);
 assert.equal(scores(run(center(1),center(3))).tara,1.5);assert.equal(scores(run(center(27),center(1))).tara,3);
 for(let a=1;a<=12;a++)for(let b=1;b<=12;b++)assert.equal(scores(run(a*30-15,b*30-15)).bhakoot,[1,4,5,7,8,11].includes((a-b+12)%12)?0:7);
});
test('P15 Yoni diagonals, seven hostile pairs and both printed asymmetries are retained',async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs');const stars=[1,2,3,4,6,7,10,12,13,14,17,20,21,23];
 const y=(a,b)=>ashtakoota({personAMoonLongitude:center(stars[a]),personBMoonLongitude:center(stars[b]),rulebookId}).components[3].score;
 for(let i=0;i<14;i++)assert.equal(y(i,i),4);
 for(const [a,b]of [[0,8],[1,13],[2,11],[3,12],[4,10],[5,6],[7,9]]){assert.equal(y(a,b),0);assert.equal(y(b,a),0);}
 assert.equal(y(10,0),3);assert.equal(y(0,10),1);assert.equal(y(13,8),1);assert.equal(y(8,13),2);
});
test('P15 four-group Vashya does not silently apply half-sign variants',async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs');const v=(a,b)=>ashtakoota({personAMoonLongitude:a,personBMoonLongitude:b,rulebookId}).components[1];
 assert.equal(v(241,61).score,.5);assert.equal(v(269,61).score,.5);assert.equal(v(275,105).score,2);assert.equal(v(295,105).score,2);assert.equal(v(225,61).score,1);
});
test('P15 strict consent precedes nested processing; birth admission cannot be bypassed',async()=>{
 const {matchingForBirths}=await import('../packages/vedic/birth-matching.mjs');const nested=new Proxy({},{get(){throw Error('must not read');}});
 for(const consent of [false,undefined,'true',1])assert.throws(()=>matchingForBirths({consent,personA:nested,personB:nested,rulebookId},context),e=>e.code==='CONSENT_REQUIRED');
 const input={consent:true,personA:birth,personB:birth,rulebookId};assert.equal(matchingForBirths(input,context).matching.total,28);
 for(const patch of [{timeAccuracy:'unknown',localTime:undefined},{timeAccuracy:'approximate',precisionOfBirthTimeMinutes:10},{purpose:'exploration'},{localDate:'2030-01-01'},{elevationMetres:undefined}])assert.throws(()=>matchingForBirths({...input,personB:{...birth,...patch}},context),e=>['INVALID_INPUT','OUT_OF_RANGE','UNSTABLE_BIRTH_TIME'].includes(e.code));
 assert.throws(()=>matchingForBirths({...input,rulebookId:'unknown'},context),e=>e.code==='MODEL_UNAVAILABLE');
});
test('P15 geometric bases and three Mangal variants enumerate relative houses without final Dosha labels',async()=>{
 const {geometricTraditionalChecks}=await import('../packages/vedic/traditional-checks.mjs');const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
 for(const [variant,houses]of [['mangal-five-first',[1,4,7,8,12]],['mangal-five-second',[2,4,7,8,12]],['mangal-six',[1,2,4,7,8,12]]])for(let house=1;house<=12;house++){
  const positions=bodies.map(body=>({body,siderealLongitude:body==='Mars'?(house-1)*30+15:body==='Jupiter'?105:15}));const r=geometricTraditionalChecks({positions,lagnaLongitude:15,rulebookId:rulesId,mangalVariant:variant});
  assert.ok(r.yogas.every(y=>y.patternMatches));for(const ref of r.mangal.references){assert.equal(ref.marsFromReference,house);assert.equal(ref.patternMatches,houses.includes(house));}assert.equal(r.mangal.assessment,'withheld-no-final-dosha-label');assert.equal(r.mangal.cancellation,'not-evaluated');
 }
 const r=geometricTraditionalChecks({positions:bodies.map(body=>({body,siderealLongitude:body==='Mercury'||body==='Jupiter'?45:15})),lagnaLongitude:null,rulebookId:rulesId,mangalVariant:'mangal-six'});assert.ok(r.yogas.every(y=>!y.patternMatches));assert.equal(r.mangal.references[0].status,'unavailable');assert.equal(r.mangal.references[1].status,'evaluated-geometric-base');
});
test('P15 rejects unknown variants, duplicate bodies, accessors and payload overrides safely',async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs'),{geometricTraditionalChecks}=await import('../packages/vedic/traditional-checks.mjs'),{traditionalChecksForBirth}=await import('../packages/vedic/birth-matching.mjs');
 for(const value of [NaN,Infinity,undefined,'15'])assert.throws(()=>ashtakoota({personAMoonLongitude:value,personBMoonLongitude:15,rulebookId}));
 assert.throws(()=>ashtakoota({get personAMoonLongitude(){throw Error('private');},personBMoonLongitude:15,rulebookId}),e=>e.code==='INVALID_INPUT');
 assert.throws(()=>geometricTraditionalChecks({positions:Array.from({length:9},()=>({body:'Moon',siderealLongitude:15})),lagnaLongitude:15,rulebookId:rulesId,mangalVariant:'mangal-six'}),e=>e.code==='INVALID_INPUT');
 assert.throws(()=>traditionalChecksForBirth(birth,{rulebookId:rulesId,mangalVariant:'mangal-six',positions:[]},context),e=>e.code==='INVALID_INPUT');
 assert.throws(()=>traditionalChecksForBirth(birth,{rulebookId:rulesId,mangalVariant:'invented'},context),e=>e.code==='MODEL_UNAVAILABLE');
});
test('P15 birth rule checks preserve exact/uncertain gates and expose only geometric previews',async()=>{
 const {traditionalChecksForBirth}=await import('../packages/vedic/birth-matching.mjs');const options={rulebookId:rulesId,mangalVariant:'mangal-six'},r=traditionalChecksForBirth(birth,options,context);
 assert.equal(r.checks.yogas.length,2);assert.ok(r.checks.yogas.every(y=>y.assessment==='withheld-review-and-qualifications-required'));assert.equal(r.checks.mangal.references.length,3);
 assert.throws(()=>traditionalChecksForBirth({...birth,timeAccuracy:'approximate',precisionOfBirthTimeMinutes:10},options,context),e=>e.code==='UNSTABLE_BIRTH_TIME');
});
