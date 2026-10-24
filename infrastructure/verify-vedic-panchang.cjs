'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),fixturePath=path.join(root,'tests/fixtures/vedic-panchang/published.json');
const profile='IN_LAHIRI_DEFAULT_V1';
async function buildReport(){
 const {panchangSnapshot,classifyPanchangAngles}=await import('../packages/vedic/panchang.mjs');
 const {siderealSnapshot}=await import('../packages/vedic/sidereal.mjs');
 const {normalizeDegrees}=await import('../packages/vedic/angles.mjs');
 const {sunriseOnCivilDay}=await import('../packages/vedic/panchang-observer.mjs');
 const facts=JSON.parse(fs.readFileSync(fixturePath));
 const published=[];let maxTransition=0,maxSunrise=0,maxBracket=0,maxEvaluations=0;
 for(const day of facts.days){
  const result=panchangSnapshot({timeScale:'UTC',utcInstant:day.sampleUtc,calculationProfileId:profile});
  for(const limb of ['tithi','nakshatra','yoga'])assert.equal(result.limbs[limb].number,day[limb]);
  assert.equal(result.limbs.karana.name,day.karana);
  for(const [limb,expected] of Object.entries(day.nextLocal)){
   const event=result.nextTransitions[limb],residualSeconds=(Date.parse(event.utcInstant)-Date.parse(expected))/1000;
   assert.ok(Math.abs(residualSeconds)<=facts.proposedTransitionToleranceSeconds);
   maxTransition=Math.max(maxTransition,Math.abs(residualSeconds));
   published.push({date:day.date,kind:limb,actualUtc:event.utcInstant,expected,residualSeconds});
  }
  const sunrise=sunriseOnCivilDay({localDate:day.date,timeZoneId:'Asia/Kolkata',
   latitude:facts.location.latitude,longitude:facts.location.longitude});
  const expected=day.date+'T'+day.sunriseLocal+':00+05:30';
  const residualSeconds=(Date.parse(sunrise.utcInstant)-Date.parse(expected))/1000;
  // Publisher sunrise convention/observer coordinates are undisclosed. Retain
  // mismatches explicitly; do not widen the proposed gate to make these pass.
  maxSunrise=Math.max(maxSunrise,Math.abs(residualSeconds));
  published.push({date:day.date,kind:'sunrise',actualUtc:sunrise.utcInstant,expected,residualSeconds,
   withinProposedTolerance:Math.abs(residualSeconds)<=facts.proposedSunriseToleranceSeconds});
 }
 function indices(julianDay){
  const [sun,moon]=siderealSnapshot({timeScale:'TT',julianDay,bodies:['Sun','Moon'],calculationProfileId:profile}).positions;
  const c=classifyPanchangAngles({elongation:normalizeDegrees(moon.tropicalLongitude-sun.tropicalLongitude),
   moonSidereal:moon.siderealLongitude,yogaAngle:normalizeDegrees(moon.siderealLongitude+sun.siderealLongitude)});
  return {tithi:c.tithi.number-1,nakshatra:c.nakshatra.number-1,yoga:c.yoga.number-1,karana:c.karana.halfTithiIndex};
 }
 let annualSnapshots=0,crossings=0;
 for(let year=1950;year<=2098;year++){
  const utcInstant=String(year)+'-06-15T06:30:00Z';
  const result=panchangSnapshot({timeScale:'UTC',utcInstant,calculationProfileId:profile});annualSnapshots++;
  maxEvaluations=Math.max(maxEvaluations,result.calculationEvaluations);
  for(const [limb,event] of Object.entries(result.nextTransitions)){
   assert.equal(indices(event.lowerTtJulianDay)[limb],event.fromIndex);
   assert.equal(indices(event.upperTtJulianDay)[limb],event.toIndex);
   assert.ok(event.lowerTtJulianDay>=result.time.ttJulianDay);
   assert.ok(event.bracketWidthSeconds<=0.5);crossings++;
   maxBracket=Math.max(maxBracket,event.bracketWidthSeconds);
  }
 }
 const sites=[['Delhi',28.6139,77.209,0],['Chennai',13.0827,80.2707,0],['Kolkata',22.5726,88.3639,0],
  ['Ahmedabad',23.0225,72.5714,0],['Leh',34.1526,77.5771,3500],['Kanyakumari',8.0883,77.5385,0]];
 const sunriseGrid=[];let maxNoaa=0;
 for(const [city,latitude,longitude,elevationMetres] of sites)for(const localDate of ['2026-03-20','2026-06-21','2026-09-23','2026-12-21']){
  const rise=sunriseOnCivilDay({localDate,timeZoneId:'Asia/Kolkata',latitude,longitude,elevationMetres});
  assert.equal(new Date(Date.parse(rise.utcInstant)+330*60000).toISOString().slice(0,10),localDate);
  const noaaUtc=elevationMetres===0?require('./vedic-noaa-sunrise.cjs').noaaSunrise(localDate,latitude,longitude):null;
  const noaaResidualSeconds=noaaUtc?(Date.parse(rise.utcInstant)-Date.parse(noaaUtc))/1000:null;
  if(noaaResidualSeconds!==null){maxNoaa=Math.max(maxNoaa,Math.abs(noaaResidualSeconds));assert.ok(Math.abs(noaaResidualSeconds)<=120);}
  sunriseGrid.push({city,localDate,elevationMetres,utcInstant:rise.utcInstant,noaaUtc,noaaResidualSeconds});
 }
 return {version:'p05-report-1',calculationProfileId:profile,
  referenceFactsSha256:crypto.createHash('sha256').update(fs.readFileSync(fixturePath)).digest('hex'),
  acceptanceStatus:facts.acceptanceStatus,referenceClass:facts.referenceClass,
  proposedTransitionToleranceSeconds:facts.proposedTransitionToleranceSeconds,
  proposedSunriseToleranceSeconds:facts.proposedSunriseToleranceSeconds,
  maxPublishedTransitionResidualSeconds:maxTransition,maxPublishedSunriseResidualSeconds:maxSunrise,
  published,internalConsistency:{annualSnapshots,crossings,maxBracketWidthSeconds:maxBracket,
   maxSnapshotEvaluations:maxEvaluations,meaning:'sampled internal root-bracket checks, not independent ephemeris accuracy'},
  sunriseGrid,noaaScreen:{sourceUrl:'https://gml.noaa.gov/grad/solcalc/solareqns.PDF',
   cases:sunriseGrid.filter(row=>row.noaaUtc).length,maxResidualSeconds:maxNoaa,
   meaning:'independent low-order formula screening, not an observed or original PAC golden'},
  limitations:facts.knownReferenceIssues};
}
module.exports={buildReport};
if(require.main===module)buildReport().then(report=>{
 const target=path.join(root,'docs/vedic/P05_REFERENCE_RESULTS.json');
 const bytes=JSON.stringify(report,null,2)+'\n';
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(target)),report);
 else fs.writeFileSync(target,bytes);
 console.log(JSON.stringify({published:report.published.length,...report.internalConsistency,
  maxTransitionSeconds:report.maxPublishedTransitionResidualSeconds,maxSunriseSeconds:report.maxPublishedSunriseResidualSeconds}));
}).catch(error=>{console.error(error);process.exitCode=1;});
