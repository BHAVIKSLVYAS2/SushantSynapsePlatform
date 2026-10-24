'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
async function buildReport(){
 const {navamsaForLongitude,divisionalChartsAtInstant}=await import('../packages/vedic/d9.mjs');
 const {chartViewModel}=await import('../apps/rashifal-kundli/frontend/chart-model.mjs');
 const fixturePath=path.resolve(__dirname,'../tests/fixtures/vedic-d9/mapping.json'),raw=fs.readFileSync(fixturePath),reference=JSON.parse(raw);
 let divisions=0;
 for(let s=0;s<12;s++)for(let p=0;p<9;p++){
  assert.equal(navamsaForLongitude(s*30+(p+.5)*360/108).rashi,reference.signsByNatalRashi[s][p]);divisions++;
 }
 const sites=[[28.6139,77.209],[13.0827,80.2707],[22.5726,88.3639],[23.0225,72.5714],[34.1526,77.5771],[8.0883,77.5385]];
 let pairs=0,positions=0;const ascendants=new Set();
 for(let year=1950;year<=2098;year++)for(const [latitude,longitude]of sites){
  const charts=divisionalChartsAtInstant({timeScale:'UTC',utcInstant:year+'-06-15T06:30:00Z',latitude,longitude,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'});
  for(const chart of [charts.d1,charts.d9]){const model=chartViewModel(chart);assert.equal(model.planets.length,9);positions+=9;}
  for(const p of charts.d9.planets){const expected=navamsaForLongitude(p.sourceSiderealLongitude);assert.equal(p.rashi,expected.rashi);}
  ascendants.add(charts.d9.ascendant.rashi);pairs++;
 }
 return {version:'p07-report-1',profileId:'IN_LAHIRI_DEFAULT_V1',fixtureSha256:crypto.createHash('sha256').update(raw).digest('hex'),
  referenceStatus:reference.reviewStatus,rule:reference.method,mappingCases:divisions,
  internalConsistency:{chartPairs:pairs,chartTables:pairs*2,positionRows:positions,d9AscendantSigns:[...ascendants].sort((a,b)=>a-b)},
  limitations:['The mapping table is agent-authored from the P01 rule, not independently reviewed astronomical goldens.',
   'Inherited PAC/IAE, full Lagna and sunrise acceptance gates remain open.',
   'D9 signs are divisional coordinates, not physical sky longitudes or D1 houses.',
   'Minute-boundary screening is not P14 birth-time stability.']};
}
module.exports={buildReport};
if(require.main===module)buildReport().then(report=>{const file=path.resolve(__dirname,'../docs/vedic/P07_REFERENCE_RESULTS.json');
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(file)),report);else fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report.internalConsistency));}).catch(e=>{console.error(e);process.exitCode=1;});
