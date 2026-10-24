'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {easternHorizonReference}=require('./vedic-horizon-reference.cjs');
const profile='IN_LAHIRI_DEFAULT_V1';
const circular=(a,b)=>Math.abs(((a-b+540)%360)-180);
async function buildReport(){
 const {lagnaAtInstant,ascendantGeometry}=await import('../packages/vedic/lagna.mjs');
 const {d1ChartAtInstant}=await import('../packages/vedic/d1.mjs');
 const {greenwichMeanSidereal1982,equationEquinoxes1994}=await import('../packages/vedic/sidereal-time.mjs');
 const {normalizeDegrees}=await import('../packages/vedic/angles.mjs');
 const facts=require('../tests/fixtures/vedic-lagna/erfa-reference.json');
 const erfa=[{kind:'GMST82',differenceRadians:Math.abs(greenwichMeanSidereal1982(facts.gmst82.ut1JulianDay)*Math.PI/180-facts.gmst82.radians)},
  {kind:'EqEq94',differenceRadians:Math.abs(equationEquinoxes1994(facts.eqeq94.ttJulianDay)-facts.eqeq94.radians)},
  {kind:'GST94-same-scale',differenceRadians:Math.abs(normalizeDegrees(greenwichMeanSidereal1982(facts.gst94SameScaleReference.ut1JulianDay)
   +equationEquinoxes1994(facts.gst94SameScaleReference.ttJulianDay)*180/Math.PI)*Math.PI/180-facts.gst94SameScaleReference.radians)}];
 for(const x of erfa)assert.ok(x.differenceRadians<1e-12);
 let geometryCases=0,maxGeometryDifferenceArcsec=0,maxHorizonResidual=0,minEastProjection=1;
 // Covers all sidereal angles at equatorial, northern and southern latitudes.
 for(const latitude of [0,8,17.385,28.6139,34.15,-28.6139,60,-60])for(let angle=0;angle<360;angle+=5){
  const g=ascendantGeometry({latitude,localApparentDegrees:angle,trueObliquityDegrees:23.439291111});
  const expected=easternHorizonReference(angle,latitude,23.439291111);
  const difference=circular(g.tropicalLongitude,expected)*3600;assert.ok(difference<0.00001);
  maxGeometryDifferenceArcsec=Math.max(maxGeometryDifferenceArcsec,difference);
  maxHorizonResidual=Math.max(maxHorizonResidual,Math.abs(g.horizonResidual));
  minEastProjection=Math.min(minEastProjection,g.eastProjection);geometryCases++;
 }
 const sites=[['Delhi',28.6139,77.209],['Chennai',13.0827,80.2707],['Kolkata',22.5726,88.3639],
  ['Ahmedabad',23.0225,72.5714],['Leh',34.1526,77.5771],['Kanyakumari',8.0883,77.5385]];
 let charts=0,positions=0,maxFrameResidualArcsec=0;
 for(let year=1950;year<=2098;year++)for(const [city,latitude,longitude] of sites){
  const chart=d1ChartAtInstant({timeScale:'UTC',utcInstant:year+'-06-15T06:30:00Z',latitude,longitude,calculationProfileId:profile});
  assert.equal(chart.houses.length,12);assert.equal(chart.planets.length,9);
  assert.equal(new Set(chart.houses.map(h=>h.rashi)).size,12);
  for(const p of chart.planets){assert.equal(chart.houses[p.houseNumber-1].rashi,p.rashi);
   assert.ok(chart.houses[p.houseNumber-1].bodies.includes(p.body));positions++;}
  const a=chart.ascendant;
  const residual=circular(a.siderealLongitude,normalizeDegrees(a.tropicalLongitude-a.ayanamsha.trueDegrees))*3600;
  maxFrameResidualArcsec=Math.max(maxFrameResidualArcsec,residual);charts++;
 }
 const dailySigns=[];
 for(const [city,latitude,longitude] of sites){
  const signs=new Set();
  for(let minute=0;minute<1440;minute+=5){
   const utcInstant=new Date(Date.parse('2026-10-24T00:00:00Z')+minute*60000).toISOString();
   const a=lagnaAtInstant({timeScale:'UTC',utcInstant,latitude,longitude,calculationProfileId:profile});signs.add(a.rashi);
  }
  assert.equal(signs.size,12);dailySigns.push({city,sampleStepMinutes:5,sampleCount:288,signs:[...signs].sort((a,b)=>a-b)});
 }
 return {version:'p06-reference-report-1',profileId:profile,houseSystem:'whole-sign',
  acceptanceStatus:'internal-candidate-original-PAC-and-independent-full-Lagna-reference-pending',
  erfa,geometry:{method:'independent RA/Dec horizon scan and bisection using USNO altitude equation',
   sourceUrl:'https://aa.usno.navy.mil/faq/alt_az',cases:geometryCases,maxGeometryDifferenceArcsec,maxHorizonResidual,minEastProjection,
   meaning:'independent numerical method with supplied sidereal angle/obliquity; not an external astronomical golden'},
  annualConsistency:{charts,positions,startYear:1950,endYear:2098,maxFrameResidualArcsec,
   meaning:'sampled internal D1 occupancy/frame invariants; not independent ephemeris accuracy'},dailySigns,
  limitations:['Modelled UT1 is not observed Earth orientation; future and pre-1972 time uncertainty persists.',
   'Original PAC/IAE and matched-time/place full Lagna accuracy gates remain open.',
   'Geometric horizon ignores refraction, dip, terrain and polar motion.',
   'Nominal positions and minute-resolution screening are not P14 birth-time stability.',
   'No D9, chart graphics, Dasha, interpretations or public integration.']};
}
module.exports={buildReport};
if(require.main===module)buildReport().then(report=>{
 const target=path.resolve(__dirname,'../docs/vedic/P06_REFERENCE_RESULTS.json');
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(target)),report);
 else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({erfa:report.erfa,...report.geometry,annualConsistency:report.annualConsistency}));
}).catch(error=>{console.error(error);process.exitCode=1;});
