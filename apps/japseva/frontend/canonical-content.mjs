// Lossless structural adapter. Surface spans are not a Sanskrit word parser.
export const reviewStates=Object.freeze(['draft','ai-assisted','source-checked','expert-reviewed']);
export function fingerprint(text){let h=2166136261;for(const c of text){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
const hashes={gayatri:'5ee305bed7630cc4a98803f3d00ecb3b913d643dde929209e4bc1af2efa258c3',shiva:'4d7873aa9083f4a3cdef08267a4af88895870e04e95e848aa4c93e035d3076c1',vasudeva:'804223b5f9f47c8770840e9e6f23cbc9b94cf8ccfa3ac22c7cb57ca07ed385b3'};
export function structureText(text,unitId){
 const seen=new Map();return [...text.matchAll(/[^\n\u0964\u0965]+[\u0964\u0965]*\s*|[\n\u0964\u0965]+/gu)].map((match,order)=>{
  const value=match[0],key=fingerprint(value),occurrence=(seen.get(key)||0)+1;seen.set(key,occurrence);
  const id=unitId+':line:'+key+':'+occurrence;
  return {id,order,start:match.index,end:match.index+value.length,text:value,verseId:null,boundaryStatus:'mechanical',pronunciation:null,padaccheda:null,annotations:[],
   words:[...value.matchAll(/[^\s\u0964\u0965]+/gu)].map((word,i)=>({id:id+':surface:'+i,start:word.index,end:word.index+word[0].length,text:word[0],kind:'orthographic-surface',grammar:null,meanings:[],verification:{status:'draft'}}))};
 });
}
export function createCanonical(entry){
 const unitSources=entry.chapters?.length?entry.chapters:[entry];
 const units=unitSources.map((source,i)=>{const sectionId=source.id||(source.book&&source.number!==undefined?source.book+':'+source.number:'text:'+fingerprint(source.text));const id=entry.id+':'+(entry.chapters?'section:'+sectionId:'body');return {id,order:i,source,text:source.text,lines:structureText(source.text,id),summary:{kind:entry.chapters?'chapter-summary':'whole-entry-summary',values:source.meanings||entry.meanings,verification:{status:'draft'},lineIds:[]}};});
 const version='text-'+fingerprint(JSON.stringify(units.map(u=>[u.id,u.text])));
 return {schemaVersion:1,id:entry.id,legacy:entry,titleSanskrit:null,alternativeNames:entry.names,association:entry.topic||null,category:entry.categories||[],source:{description:entry.source||null,url:entry.sourceUrl||null,verification:{status:'draft'}},scriptureReference:null,tradition:null,recension:null,language:'sa',script:'Deva',verification:{status:'draft'},publication:'legacy-preserved',version,history:[{version,reason:'Lossless legacy adaptation; no scholarly review implied.'}],variants:[],units,
  audio:entry.recording?{...entry.recording,mantraVersion:version,recordingVersion:hashes[entry.id],duration:null,tradition:null,verification:{status:'draft'},alignment:null}:null,
  reviewQueue:['source-and-recension','pronunciation','line-translation','word-segmentation','expert-review']};
}
export function usableAlignment(record){
 const audio=record.audio,a=audio?.alignment;if(!a||a.status!=='expert-reviewed'||!a.review?.reviewer||!a.review?.evidence||a.mantraVersion!==record.version||a.recordingVersion!==audio.recordingVersion||!Number.isFinite(audio.duration)||audio.duration<=0)return null;
 const ids=new Set(record.units.flatMap(u=>u.lines.map(l=>l.id)));let end=0;
 for(const segment of a.segments||[]){if(!ids.has(segment.lineId)||!Number.isFinite(segment.start)||!Number.isFinite(segment.end)||segment.start<end||segment.end<=segment.start||segment.end>audio.duration)return null;end=segment.end;}
 return a.segments?.length?a:null;
}
export function validateCanonical(records){
 const errors=[],warnings=[],ids=new Set();const fail=(id,message)=>errors.push({id,message});
 function review(value,id){if(!value||typeof value!=='object')return;if(value.verification){const v=value.verification;if(!reviewStates.includes(v.status))fail(id,'Invalid review status');if(v.status==='expert-reviewed'&&(!v.reviewer||!v.evidence))fail(id,'Expert status needs reviewer and evidence');if(v.status==='source-checked'&&!v.evidence)fail(id,'Source check needs evidence');}for(const [key,child]of Object.entries(value))if(!['legacy','source'].includes(key)){if(Array.isArray(child))child.forEach(v=>review(v,id));else if(child&&typeof child==='object')review(child,id);}}
 for(const r of records){if(ids.has(r.id))fail(r.id,'Duplicate mantra ID');ids.add(r.id);review(r,r.id);review(r.source,r.id);const lineIds=new Set(),wordIds=new Set();
  if(r.version!=='text-'+fingerprint(JSON.stringify(r.units.map(u=>[u.id,u.text]))))fail(r.id,'Canonical content version is stale');
  if(new Set(r.units.map(u=>u.id)).size!==r.units.length)fail(r.id,'Duplicate section ID');
  if(!r.history.some(v=>v.version===r.version))fail(r.id,'Current version missing from history');
  for(const [index,u]of r.units.entries()){
   if(u.order!==index||u.text!==u.source.text||u.lines.map(l=>l.text).join('')!==u.text)fail(r.id,'Original text/order changed');
   if(u.text!==u.text.normalize('NFC'))warnings.push({id:r.id,message:'Non-NFC source preserved; review Unicode manually'});
   if(/[\ufffd\u0000-\u0008]/u.test(u.text))fail(r.id,'Damaged Unicode/control character');
   let cursor=0;for(const [i,l]of u.lines.entries()){
    if(lineIds.has(l.id))fail(r.id,'Duplicate line ID');lineIds.add(l.id);
    if(l.order!==i||l.start!==cursor||u.text.slice(l.start,l.end)!==l.text)fail(r.id,'Invalid line span');cursor=l.end;
    let wordEnd=0;for(const w of l.words){if(wordIds.has(w.id)||w.start<wordEnd||l.text.slice(w.start,w.end)!==w.text)fail(r.id,'Invalid word mapping');wordIds.add(w.id);wordEnd=w.end;}
    for(const a of l.annotations){if(a.lineId!==l.id||!Array.isArray(a.wordIds)||a.wordIds.some(id=>!l.words.some(w=>w.id===id)))fail(r.id,'Annotation refers to wrong line/word');if(a.mantraVersion!==r.version)fail(r.id,'Stale annotation version');if(!['literal','natural','contextual','traditional','reflection','usage'].includes(a.kind)||!a.text||!a.language)fail(r.id,'Invalid explanation kind or language');}
   }
  }
  if(r.audio&&(r.audio.mantraVersion!==r.version||!r.audio.recordingVersion||!r.audio.licence))fail(r.id,'Audio version/licence mismatch');
  if(r.audio?.alignment&&!usableAlignment(r))fail(r.id,'Audio alignment is stale or unreviewed');
 }
 return {errors,warnings};
}
