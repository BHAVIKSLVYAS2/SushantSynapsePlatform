const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),output=path.join(root,'docs/vedic/P12_REFERENCE_RESULTS.json');
async function buildReport(){
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs');
 const {rashifalLibrary}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs');
 const service=createRashifalService(),rows=[],now=Date.parse('2026-10-24T12:00Z');
 for(let rashi=1;rashi<=12;rashi++)for(const view of ['today','tomorrow','weekly'])for(const language of ['en','hi','gu']){
  const r=service.getReading({rashi,view,language,ruleVersion:rashifalLibrary.version,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'},{now}).reading;
  if(r.sections.length!==5||r.factors.length!==(view==='weekly'?7:1))throw Error('Rashifal composition failed.');
  for(const s of r.sections)if(new Set(s.items.map(i=>i.id)).size!==s.items.length)throw Error('Duplicate editorial ID.');
  rows.push({rashi,view,requestedLanguage:language,contentLanguage:r.contentLanguage,fallback:r.fallback,editorialDate:r.period.editorialDate,
   moonRashis:r.factors.map(f=>f.moonRashi),relativeHouses:r.factors.map(f=>f.relativeHouse),selection:r.selection,
   promptIds:r.sections.map(s=>s.items.map(i=>i.id))});
 }
 const files=['packages/vedic/rashifal-factors.mjs','apps/rashifal-kundli/frontend/rashifal-library.mjs','apps/rashifal-kundli/frontend/rashifal-service.mjs'];
 return {phase:'P12',scope:'Deterministic composition/consistency evidence, not independent astronomy or editorial acceptance',rule:rashifalLibrary.version,catalogueDate:rashifalLibrary.catalogueDate,
  cases:rows.length,groups:rashifalLibrary.groupOrder.length,baselinePrompts:20,draftTranslations:40,
  sourceHashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),
  translationStatus:rashifalLibrary.translationStatus,publicationStatus:rashifalLibrary.status,rows,
  limitations:['Primary text is context for house vocabulary, not the new four-group editorial rule.','No scientific or deterministic personal prediction claim.','Authored Hindi/Gujarati translations display as explicit drafts; independent language review remains pending.','Noon snapshots do not establish whole-day sign stability or continuous weekly transits.','Prior P04 and validated general-release gates remain open; a production verification preview is authorised.']};
}
module.exports={buildReport};
if(require.main===module)buildReport().then(r=>{const text=JSON.stringify(r,null,2)+'\n';if(process.argv.includes('--check')){if(fs.readFileSync(output,'utf8')!==text)throw Error('Saved P12 report differs.');}else fs.writeFileSync(output,text);console.log(JSON.stringify({phase:'P12',cases:r.cases,baselinePrompts:r.baselinePrompts,draftTranslations:r.draftTranslations,mode:process.argv.includes('--check')?'check':'write'}));}).catch(e=>{console.error(e.message);process.exitCode=1;});
