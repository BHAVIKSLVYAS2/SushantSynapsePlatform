'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const dms=a=>a[0]+a[1]/60+a[2]/3600;
const difference=(a,b)=>Math.abs((a-b+540)%360-180)*3600;
async function verify(){
 const {lahiriAyanamsha}=await import('../packages/vedic/ayanamsha.mjs');
 const {resolveAstronomyTime}=await import('../packages/vedic/astronomy-time.mjs');
 const {siderealSnapshot,siderealProfile}=await import('../packages/vedic/sidereal.mjs');
 const ref=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/vedic-sidereal/lahiri-published.json'),'utf8'));
 const results=[];
 for(const row of ref.mean){const actual=lahiriAyanamsha(row.ttJulianDay).meanDegrees;
  results.push({id:row.id,kind:'mean',ttJulianDay:row.ttJulianDay,expectedDegrees:dms(row.dms),actualDegrees:actual,residualArcsec:difference(actual,dms(row.dms))});}
 for(const row of ref.true){const jd=resolveAstronomyTime({timeScale:'UTC',utcInstant:row.nominalUtc}).ttJulianDay;
  const actual=lahiriAyanamsha(jd).trueDegrees;
  results.push({id:row.id,kind:'true',ttJulianDay:jd,expectedDegrees:dms(row.dms),actualDegrees:actual,residualArcsec:difference(actual,dms(row.dms))});}
 let maxCancellation=0,maxNodeOpposition=0,count=0,flagged=0;
 for(let y=1950;y<=2098;y++)for(let m=0;m<12;m++){
  const jd=Date.UTC(y,m,1,12)/86400000+2440587.5;
  const snapshot=siderealSnapshot({timeScale:'TT',julianDay:jd,calculationProfileId:siderealProfile.id});
  for(const p of snapshot.positions){
   maxCancellation=Math.max(maxCancellation,difference(p.siderealLongitude,p.tropicalLongitude-snapshot.ayanamsha.trueDegrees));
   if(p.nearBoundary)flagged++;count++;
  }
  const a=snapshot.positions.find(p=>p.body==='Rahu'),b=snapshot.positions.find(p=>p.body==='Ketu');
  maxNodeOpposition=Math.max(maxNodeOpposition,difference(a.siderealLongitude+180,b.siderealLongitude));
 }
 return {version:'vedic-sidereal-reference-results-1',date:'2026-10-24',profileId:siderealProfile.id,
  source:ref.sourceUrl,sourceStatus:ref.reviewStatus,
  referenceCount:results.length,maxAyanamshaResidualArcsec:Math.max(...results.map(r=>r.residualArcsec)),
  proposedToleranceArcsec:ref.proposedToleranceArcsec,results,
  invariantGrid:{snapshots:1788,positions:count,nearBoundaryNominalPositions:flagged,
   maxTrueMeanCancellationArcsec:maxCancellation,maxNodeOppositionArcsec:maxNodeOpposition},
  acceptance:'Internal sampled/source-reproduction checks only; original IAE verification, independent review and production acceptance remain pending.'};
}
module.exports={verify};
if(require.main===module)verify().then(report=>{
 const file=path.join(root,'docs/vedic/P04_REFERENCE_RESULTS.json'),value=JSON.stringify(report,null,2)+'\n';
 if(process.argv[2]==='--write')fs.writeFileSync(file,value);
 else if(process.argv[2]==='--check')assert.equal(fs.readFileSync(file,'utf8'),value);
 else assert.equal(process.argv.length,2);
 console.log(JSON.stringify({references:report.referenceCount,maxArcsec:report.maxAyanamshaResidualArcsec,grid:report.invariantGrid}));
 if(report.maxAyanamshaResidualArcsec>report.proposedToleranceArcsec)process.exitCode=1;
}).catch(error=>{console.error(error);process.exitCode=1;});
