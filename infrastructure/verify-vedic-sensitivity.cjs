const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),assert=require('node:assert/strict');
(async()=>{
 const {sensitivityForBirth}=await import('../packages/vedic/birth-sensitivity.mjs');
 const base={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
 const cases=[];
 for(const accuracy of ['exact','approximate','unknown']){
  const input={...base,timeAccuracy:accuracy};if(accuracy==='approximate')input.precisionOfBirthTimeMinutes=10;if(accuracy==='unknown')delete input.localTime;
  const result=sensitivityForBirth(input,{now:Date.parse('2026-10-24T12:00Z')});
  cases.push({accuracy,result});
 }
 const hashes=Object.fromEntries(['interval-sectors','sensitivity','birth-sensitivity'].map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../packages/vedic',name+'.mjs'))).digest('hex')]));
 const report={phase:'P14',scope:'Internal regression fixtures; conditional candidate bounds, not independent physical certification',hashes,cases};
 const destination=path.join(__dirname,'../docs/vedic/P14_REFERENCE_RESULTS.json');
 if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(destination,'utf8')),report);else fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
 console.log('P14 reference '+(process.argv.includes('--check')?'verified':'saved')+': three interval cases and source hashes');
})().catch(error=>{console.error(error);process.exitCode=1;});
