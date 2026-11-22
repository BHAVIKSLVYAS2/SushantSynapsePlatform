import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {mantras,canonicalMantras} from '../apps/japseva/frontend/library.mjs';
import {validateCanonical} from '../apps/japseva/frontend/canonical-content.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const snapshot=m=>({id:m.id,text:m.text,chapters:m.chapters?.map(c=>({id:c.id,text:c.text,meanings:c.meanings})),meanings:m.meanings,aids:m.aids,audio:m.audio});
// An optional git baseline checks actual old module exports, not just new code.
const baseline=process.argv.find(a=>a.startsWith('--baseline='))?.slice(11);
if(baseline){let code=execFileSync('git',['show',baseline+':apps/japseva/frontend/library.mjs'],{encoding:'utf8'});code=code.replace(/from '\.\/(.*?)'/g,(_,file)=>'from '+JSON.stringify(pathToFileURL(resolve('apps/japseva/frontend',file)).href));const previous=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));if(JSON.stringify(previous.mantras.map(snapshot))!==JSON.stringify(mantras.map(snapshot)))throw Error('Legacy content differs from baseline');}
const validation=validateCanonical(canonicalMantras);if(validation.errors.length)throw Error(JSON.stringify(validation.errors));
const groups=field=>{const map=new Map();for(const m of mantras){const key=m[field]||'';if(!key)continue;const ids=map.get(key)||[];ids.push(m.id);map.set(key,ids);}return [...map.values()].filter(ids=>ids.length>1);};
for(const r of canonicalMantras.filter(r=>r.audio)){const actual=sha(readFileSync(resolve('apps/japseva/frontend',r.audio.asset.replace('/japseva/',''))));if(actual!==r.audio.recordingVersion)throw Error('Recording changed; invalidate alignment and review '+r.id);}
const report={schemaVersion:1,baseline:baseline||null,entries:mantras.length,units:canonicalMantras.reduce((n,r)=>n+r.units.length,0),lines:canonicalMantras.reduce((n,r)=>n+r.units.reduce((s,u)=>s+u.lines.length,0),0),validation,exactTextGroups:groups('text'),repeatedEnglishMeaningGroups:groups('meaning'),inventory:canonicalMantras.map(r=>({id:r.id,version:r.version,legacySha256:sha(JSON.stringify(snapshot(r.legacy))),units:r.units.length,lines:r.units.reduce((n,u)=>n+u.lines.length,0),audio:r.audio?{asset:r.audio.asset,sha256:r.audio.recordingVersion,alignment:false}:null,pilot:r.pilot||false,reviewQueue:r.reviewQueue}))};
if(process.argv.includes('--write'))writeFileSync('docs/JAPSEVA_CONTENT_INVENTORY.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({entries:report.entries,units:report.units,lines:report.lines,errors:validation.errors.length,warnings:validation.warnings.length,exactTextGroups:report.exactTextGroups,repeatedEnglishMeaningGroups:report.repeatedEnglishMeaningGroups,baselinePreserved:!!baseline}));
