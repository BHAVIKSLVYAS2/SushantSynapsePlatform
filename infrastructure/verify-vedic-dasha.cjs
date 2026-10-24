'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
async function buildReport(){
 const {vimshottariTimeline,vimshottariModel}=await import('../packages/vedic/dasha.mjs');
 const {siderealSnapshot}=await import('../packages/vedic/sidereal.mjs');
 const fixturePath=path.resolve(__dirname,'../tests/fixtures/vedic-dasha/rational.json'),raw=fs.readFileSync(fixturePath),fixture=JSON.parse(raw);
 const base={birthUtcInstant:fixture.birthUtcInstant,calculationProfileId:'IN_LAHIRI_DEFAULT_V1',yearConventionId:vimshottariModel.yearConventionId,timeZoneId:'Asia/Kolkata'};
 let maxReferenceDifferenceMilliseconds=0,comparedBoundaries=0;
 for(const example of fixture.cases){
  const r=example.moonLongitudeRational,t=vimshottariTimeline({...base,moonSiderealLongitude:r.numerator/r.denominator});
  assert.equal(t.balance.lord,example.lord);
  const pairs=[[t.birthMahadasha.start.milliseconds,example.startMilliseconds],[t.birthMahadasha.end.milliseconds,example.endMilliseconds]];
  for(let i=0;i<9;i++){
   const actual=t.mahadashas[0].antardashas[i],expected=example.antardashas[i];assert.equal(actual.lord,expected.lord);
   pairs.push([actual.start.milliseconds,expected.startMilliseconds],[actual.end.milliseconds,expected.endMilliseconds]);
  }
  for(const [a,b]of pairs){maxReferenceDifferenceMilliseconds=Math.max(maxReferenceDifferenceMilliseconds,Math.abs(a-b));assert.ok(Math.abs(a-b)<=1);comparedBoundaries++;}
 }
 let syntheticTimelines=0,majorPeriods=0,minorPeriods=0,maxCycleSumErrorMilliseconds=0,maxChildSumErrorMilliseconds=0;
 function check(t){
  majorPeriods+=t.mahadashas.length;
  const cycleTotal=t.mahadashas.reduce((sum,p)=>sum+p.durationMilliseconds,0);
  maxCycleSumErrorMilliseconds=Math.max(maxCycleSumErrorMilliseconds,Math.abs(cycleTotal-120*31557600000));
  assert.equal(cycleTotal,120*31557600000);
  for(const m of t.mahadashas){minorPeriods+=m.antardashas.length;
   const childTotal=m.antardashas.reduce((sum,p)=>sum+p.durationMilliseconds,0);
   maxChildSumErrorMilliseconds=Math.max(maxChildSumErrorMilliseconds,Math.abs(childTotal-m.durationMilliseconds));
   assert.equal(childTotal,m.durationMilliseconds);
   for(let i=1;i<9;i++)assert.equal(m.antardashas[i-1].end.milliseconds,m.antardashas[i].start.milliseconds);
  }
 }
 for(let n=0;n<27;n++)for(const fraction of [0,.5,.9]){
  const t=vimshottariTimeline({...base,moonSiderealLongitude:(n+fraction)*360/27});check(t);syntheticTimelines++;
 }
 const annualLords=new Set();let annualTimelines=0,localUnavailableTimelines=0;
 for(let year=1950;year<=2098;year++){
  const birthUtcInstant=year+'-06-15T06:30:00Z';
  const moon=siderealSnapshot({timeScale:'UTC',utcInstant:birthUtcInstant,bodies:['Moon'],calculationProfileId:base.calculationProfileId});
  const t=vimshottariTimeline({...base,birthUtcInstant,moonSiderealLongitude:moon.positions[0].siderealLongitude,
   atUtcInstant:new Date(Date.parse(birthUtcInstant)+50*31557600000).toISOString()});
  check(t);annualTimelines++;annualLords.add(t.balance.lord);
  if(t.warnings.includes('DASHA_LOCAL_PROJECTION_OUTSIDE_PINNED_CIVIL_RANGE'))localUnavailableTimelines++;
 }
 return {version:'p08-reference-report-1',model:vimshottariModel,
  fixtureSha256:crypto.createHash('sha256').update(raw).digest('hex'),referenceStatus:fixture.reviewStatus,
  rationalReferences:{midpointCases:fixture.cases.length,comparedBoundaries,maxReferenceDifferenceMilliseconds},
  internalConsistency:{syntheticTimelines,annualTimelines,majorPeriods,minorPeriods,maxCycleSumErrorMilliseconds,
   maxChildSumErrorMilliseconds,annualStartingLords:vimshottariModel.lords.map(p=>p.lord).filter(lord=>annualLords.has(lord)),
   localUnavailableTimelines},
  limitations:['Independent BigInt arithmetic verifies the frozen design rule, not independently reviewed full astronomical Dasha dates.',
   'Only the explicit 365.25-day convention is implemented; alternate conventions are typed unavailable.',
   'Unix arithmetic ISO labels do not predict future leap seconds or SI elapsed time.',
   'Local dates beyond pinned 1950-2098 India rules remain typed unavailable.',
   'Inherited PAC/IAE and birth-Moon/time uncertainty remain open; millisecond arithmetic is not physical date accuracy.',
   'No interpretation, public route, timeline UI, private persistence or deployment.']};
}
module.exports={buildReport};
if(require.main===module)buildReport().then(report=>{
 const file=path.resolve(__dirname,'../docs/vedic/P08_REFERENCE_RESULTS.json');
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(file)),report);else fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({rationalReferences:report.rationalReferences,...report.internalConsistency}));
}).catch(error=>{console.error(error);process.exitCode=1;});
