const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),output=path.join(root,'docs/vedic/RASHIFAL_CALCULATION_RESULTS.json');
async function buildReport(){
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs');
 const {rashifalLibrary}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs');
 const service=createRashifalService(),rows=[],now=Date.parse('2026-10-24T12:00Z');
 for(let rashi=1;rashi<=12;rashi++)for(const view of ['today','tomorrow','weekly'])for(const language of ['en','hi','gu']){
  const r=service.getReading({rashi,view,language,ruleVersion:rashifalLibrary.version,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'},{now}).reading;
  if(r.sections.length!==2||r.factors.length!==(view==='weekly'?7:1)||r.grahas.length!==9||r.samples.length!==(view==='weekly'?56:8))throw Error('Rashifal composition failed.');
  for(const s of r.sections)if(new Set(s.items.map(i=>i.id)).size!==s.items.length)throw Error('Duplicate editorial ID.');
  rows.push({rashi,view,requestedLanguage:language,contentLanguage:r.contentLanguage,fallback:r.fallback,editorialDate:r.period.editorialDate,
   moonRashis:r.factors.map(f=>f.moonRashi),relativeHouses:r.factors.map(f=>f.relativeHouse),selection:r.selection,timelineStatus:r.timeline.status,events:r.timeline.events.map(e=>({body:e.body,kind:e.kind,utcInstant:e.utcInstant,lowerUtc:e.lowerUtc,upperUtc:e.upperUtc,fromHouse:e.fromHouse,toHouse:e.toHouse,affected:e.affected})),
   promptIds:r.sections.map(s=>s.items.map(i=>i.id))});
 }
 const files=['packages/vedic/rashifal-factors.mjs','packages/vedic/rashifal-transits.mjs','apps/rashifal-kundli/frontend/rashifal-library.mjs','apps/rashifal-kundli/frontend/rashifal-service.mjs','packages/vedic/transit-crossings.mjs','packages/vedic/rashifal-timeline.mjs'];
 return {phase:'calculation-backed-rashifal',scope:'Deterministic nine-graha calculation/rule evidence, not independent traditional acceptance or predictive accuracy',rule:rashifalLibrary.version,catalogueDate:rashifalLibrary.catalogueDate,
  cases:rows.length,grahas:9,dailyObservations:8,weeklyObservations:56,
  sourceHashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),
  translationStatus:rashifalLibrary.translationStatus,publicationStatus:rashifalLibrary.status,rows,
  limitations:['Phaladeepika 26.2–8 house/Vedha tables are implemented, not independently approved.','Mercury H11 Vedha is withheld due to transcription disagreement; nodal Vedha is not inferred.','Sample counts do not establish durations or probability; the separate nominal crossing search has explicit station/resolution limits.','No scientific or personal predictive accuracy claim.','Independent astronomy, traditional and translation review remain pending.']};
}
module.exports={buildReport};
if(require.main===module)buildReport().then(r=>{const text=JSON.stringify(r,null,2)+'\n';if(process.argv.includes('--check')){if(fs.readFileSync(output,'utf8')!==text)throw Error('Saved Rashifal calculation report differs.');}else fs.writeFileSync(output,text);console.log(JSON.stringify({phase:r.phase,cases:r.cases,grahas:r.grahas,mode:process.argv.includes('--check')?'check':'write'}));}).catch(e=>{console.error(e.message);process.exitCode=1;});
