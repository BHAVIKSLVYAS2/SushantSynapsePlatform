const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),output=path.join(root,'docs/vedic/P11_REFERENCE_RESULTS.json');
async function buildReport(){
 const fixture=require('../tests/fixtures/vedic-calendar/published.json');
 const {lunarPhaseCrossings,amantaMonthAtInstant,lunarCalendarModel}=await import('../packages/vedic/lunar-calendar.mjs');
 const {resolveAstronomyTime}=await import('../packages/vedic/astronomy-time.mjs');
 const {yearlyTithiCandidates,birthdayRule}=await import('../packages/vedic/birth-observance.mjs');
 const jd=s=>resolveAstronomyTime({timeScale:'UTC',utcInstant:s}).ttJulianDay;
 const roots=lunarPhaseCrossings({startTtJulianDay:jd('2026-01-01T00:00:00Z'),endTtJulianDay:jd('2027-01-01T00:00:00Z'),phaseDegrees:0});
 const phases=roots.events.map((r,i)=>({expectedIst:fixture.newMoonsIst[i],actualUtc:r.utcInstant,residualSeconds:(Date.parse(r.utcInstant)-Date.parse(fixture.newMoonsIst[i]+':00+05:30'))/1000,bracketWidthSeconds:r.bracketWidthSeconds}));
 const max=Math.max(...phases.map(p=>Math.abs(p.residualSeconds)));if(phases.length!==12||max>=180)throw Error('PAC phase spot-check failed.');
 const months=fixture.monthFacts.map(f=>{const m=amantaMonthAtInstant({utcInstant:f.instant});if(m.number!==f.number||m.adhika!==f.adhika)throw Error('Month sample failed.');return {...f,actualName:m.name,actualAdhika:m.adhika};});
 const birth={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
 const years=[2026,2027].map(year=>{const r=yearlyTithiCandidates(birth,{year,observancePlaceId:birth.placeId,ruleId:birthdayRule.id,adhikaPolicy:'regular-only'},{now:Date.parse('2026-10-24T12:00Z')});return {year,kind:'internal consistency example, not independent observance golden',birthMonth:r.birthMonth,tithi:r.tithi,occurrences:r.occurrences.map(o=>({month:o.month,status:o.status,selectedDate:o.selectedDate,sunriseDates:o.sunriseDates,startUtc:o.start.utcInstant,endUtc:o.end.utcInstant}))};});
 const files=['tests/fixtures/vedic-calendar/published.json','packages/vedic/lunar-calendar.mjs','packages/vedic/birth-observance.mjs','packages/vedic/observance-rule.mjs','packages/vedic/birth-panchang.mjs','apps/rashifal-kundli/frontend/naming-data.mjs'];
 return {phase:'P11',model:lunarCalendarModel.id,rule:birthdayRule.id,sourceHashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),
  sources:{phases:fixture.phaseSource,months:fixture.monthSource,capture:fixture.capture},proposedPhaseScreenSeconds:180,maxPhaseResidualSeconds:max,phaseEvaluations:roots.evaluations,phases,months,years,
  limitations:['No physical accuracy bound inferred from root brackets.','Month spot checks are not full-range or independent birthday-rule acceptance.','P05 sunrise discrepancy remains unresolved.','Naming table variant/human transliterations need independent review.','Unknown/approximate birth times remain withheld pending P14.','No public release or production CPU claim.']};
}
module.exports={buildReport};
if(require.main===module)buildReport().then(r=>{const text=JSON.stringify(r,null,2)+'\n';if(process.argv.includes('--check')){if(fs.readFileSync(output,'utf8')!==text)throw Error('Saved P11 report differs.');}else fs.writeFileSync(output,text);console.log(JSON.stringify({phase:'P11',phases:r.phases.length,maxPhaseResidualSeconds:r.maxPhaseResidualSeconds,monthSamples:r.months.length,years:r.years.length,mode:process.argv.includes('--check')?'check':'write'}));}).catch(e=>{console.error(e.message);process.exitCode=1;});
