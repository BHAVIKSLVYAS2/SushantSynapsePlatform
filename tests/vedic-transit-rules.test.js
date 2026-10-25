const {test}=require('node:test'),assert=require('node:assert/strict');
const mod=import('../packages/vedic/rashifal-transits.mjs');
test('Phaladeepika 26.2 favorable-house facts apply to every graha and all twelve houses',async()=>{
 const {transitBodies,transitRulebook:r,evaluateTransitSample:f}=await mod;
 const expected={Sun:[3,6,10,11],Moon:[1,3,6,7,10,11],Mars:[3,6,11],Mercury:[2,4,6,8,10,11],Jupiter:[2,5,7,9,11],Venus:[1,2,3,4,5,8,9,11,12],Saturn:[3,6,11],Rahu:[3,6,10,11],Ketu:[3,6,10,11]};
 for(const body of transitBodies)for(let h=1;h<=12;h++){
  const avoid=r.vedha[body]?.[h],filler=[1,2,3,4,5,6,7,8,9,10,11,12].find(n=>n!==avoid);
  const positions=transitBodies.map(b=>({body:b,siderealLongitude:((b===body?h:filler)-1)*30+15}));const row=f({positions,rashi:1}).find(p=>p.body===body);
  assert.equal(row.relativeHouse,h);assert.equal(row.favorable,expected[body].includes(h));
  assert.equal(row.status,!row.favorable?'outside-favorable':avoid==null?'rule-unresolved':'supportive',body+' H'+h);
 }
});
test('Vedha pairs, exemptions, source disagreement and uncertain potential blockers fail closed',async()=>{
 const {transitBodies,evaluateTransitSample:f}=await mod;
 const sky=houses=>transitBodies.map(body=>({body,siderealLongitude:((houses[body]??2)-1)*30+15}));
 const row=(positions,body)=>f({positions,rashi:1}).find(p=>p.body===body);
 assert.equal(row(sky({Sun:3,Saturn:9}),'Sun').status,'supportive');
 let r=row(sky({Sun:3,Saturn:9,Mercury:9}),'Sun');assert.equal(r.status,'obstructed');assert.deepEqual(r.blockers,['Mercury']);
 assert.equal(row(sky({Moon:1,Mercury:5}),'Moon').status,'supportive');
 assert.equal(row(sky({Mercury:2,Moon:5}),'Mercury').status,'supportive');
 assert.equal(row(sky({Moon:1,Mercury:5,Venus:5}),'Moon').status,'obstructed');
 assert.equal(row(sky({Saturn:3,Sun:12}),'Saturn').status,'supportive');
 assert.equal(row(sky({Mercury:11}),'Mercury').status,'rule-unresolved');
 assert.equal(row(sky({Rahu:3}),'Rahu').status,'rule-unresolved');
 const p=sky({Sun:3,Mercury:8});p.find(p=>p.body==='Mercury').siderealLongitude=240-1/3600;
 r=row(p,'Sun');assert.equal(r.status,'uncertain');assert.deepEqual(r.possibleBlockers,['Mercury']);
 p.find(p=>p.body==='Sun').siderealLongitude=60;assert.equal(row(p,'Sun').status,'uncertain');
 assert.throws(()=>f({positions:p.slice(1),rashi:1}));assert.throws(()=>f({positions:p,rashi:13}));
});

test('each resolved source Vedha pair actually obstructs its favourable placement',async()=>{
 const {transitBodies,evaluateTransitSample:f}=await mod;
 // Independently transcribed numerical facts: Phaladeepika 26.3–8.
 const pairs={Sun:[[3,9],[6,12],[10,4],[11,5]],Moon:[[1,5],[3,9],[6,12],[7,2],[10,4],[11,8]],Mars:[[3,12],[6,9],[11,5]],Mercury:[[2,5],[4,3],[6,9],[8,1],[10,8]],Jupiter:[[2,12],[5,4],[7,3],[9,10],[11,8]],Venus:[[1,8],[2,7],[3,1],[4,10],[5,9],[8,5],[9,11],[11,3],[12,6]],Saturn:[[3,12],[6,9],[11,5]]};
 for(const [body,list]of Object.entries(pairs))for(const [house,block]of list){
  const blocker=body==='Mars'?'Jupiter':'Mars',filler=[1,2,3,4,5,6,7,8,9,10,11,12].find(h=>h!==block);
  const positions=transitBodies.map(b=>({body:b,siderealLongitude:((b===body?house:b===blocker?block:filler)-1)*30+15}));
  const r=f({positions,rashi:1}).find(r=>r.body===body);assert.equal(r.vedhaHouse,block);assert.equal(r.status,'obstructed',body+' H'+house);assert.deepEqual(r.blockers,[blocker]);
 }
});
