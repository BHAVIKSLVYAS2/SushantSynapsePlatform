import {mountBirthplace} from './birthplace-input.mjs';
import {kundliStore,savedCopy,savedKundliKey} from './saved-kundli.mjs';
import {installCivilInputs} from './civil-input.mjs';
import {placeLabel,relabelPlaces} from './place-text.mjs';
import {term,nakshatraName} from './display-text.mjs';
import {diagnosticText} from './diagnostic-text.mjs';
import {getPlace} from '../../../packages/vedic/places.mjs';
import {normalizeInput,calculationProfileId} from '../../../packages/vedic/normalize.mjs';
import {calculateBirthReport} from './birth-report.mjs';
import {mountCharts} from './chart-view.mjs';
import {mountDasha} from './dasha-view.mjs';
import {mountExport} from './export-report.mjs';
import {mountTraditions} from './tradition-view.mjs';
import {mountTimeMachine} from './time-machine-view.mjs';
import {mountSensitivity} from './sensitivity-view.mjs';
import {mountTraditionalChecks} from './rulebook-view.mjs';
import {mountAdvanced} from './advanced-view.mjs';
import {locale,signName,bodyName} from './locale.mjs';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};

export function mountBirthApp(container,{now=()=>Date.now()}={}){
 if(!(container instanceof Element)||typeof now!=='function')throw new TypeError('Check birth interface options.');
 let language='en',reviewed=null,report=null,displayName='',revision=0,pending=null,chartHandle=null,dashaHandle=null,exportHandle=null,traditionHandle=null,timeMachineHandle=null,sensitivityHandle=null,rulesHandle=null,advancedHandle=null;
 const root=el('section',undefined,'vedic-birth-app'),heading=el('h1'),intro=el('p'),gate=el('p',undefined,'vedic-gate');
 const languageLabel=el('label'),languageSelect=el('select');languageSelect.id='birth-language';
 for(const [value,text]of [['en','English'],['hi','हिन्दी'],['gu','ગુજરાતી']]){const o=el('option',text);o.value=value;languageSelect.append(o);}
 languageLabel.append(el('span'),languageSelect);root.append(heading,intro,gate,languageLabel);
 const form=el('form');form.autocomplete='off';form.setAttribute('aria-label','Birth details');
 const controls={},labels={};let activeSavedId=null;const store=kundliStore({now});
 function field(key,type,attrs={}){const label=el('label'),span=el('span'),input=el(type==='select'?'select':'input');
  input.id='birth-'+key;input.name=key;if(type!=='select')input.type=type;for(const [k,v]of Object.entries(attrs))input.setAttribute(k,String(v));
  label.append(span,input);form.append(label);controls[key]=input;labels[key]=span;return input;}
 field('name','text',{maxlength:80});field('date','date',{min:'1950-01-01',max:'2098-12-31',required:''});
 const accuracy=field('accuracy','select');for(const value of ['exact','approximate','unknown']){const o=el('option');o.value=value;accuracy.append(o);}
 field('time','time',{required:'',step:60});field('precision','number',{min:1,max:720,step:1});
 field('query','search',{maxlength:100});const hint=el('p',undefined,'vedic-help');hint.id='birth-search-help';controls.query.setAttribute('aria-describedby',hint.id);form.append(hint);
 field('place','select',{required:''});field('elevation','number',{min:-500,max:9000,step:1});const zone=el('p');form.append(zone);
 const reviewButton=el('button');reviewButton.type='submit';const clearButton=el('button');clearButton.type='button';form.append(reviewButton,clearButton);root.append(form);
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const reviewRegion=el('section');reviewRegion.id='birth-review';const results=el('section');results.id='birth-results';root.append(status,reviewRegion,results);container.replaceChildren(root);
 const library=el('section',undefined,'saved-kundlis');library.id='saved-kundlis';library.setAttribute('aria-labelledby','saved-kundlis-title');root.insertBefore(library,form);
 const birthplace=mountBirthplace(controls.query,controls.place,hint);
 function stopResults(){chartHandle?.destroy();dashaHandle?.destroy();exportHandle?.destroy();traditionHandle?.destroy();timeMachineHandle?.destroy();sensitivityHandle?.destroy();rulesHandle?.destroy();advancedHandle?.destroy();chartHandle=dashaHandle=exportHandle=traditionHandle=timeMachineHandle=sensitivityHandle=rulesHandle=advancedHandle=null;results.replaceChildren();}
 function invalidate(){revision++;clearTimeout(pending);pending=null;reviewed=report=null;reviewRegion.replaceChildren();stopResults();status.textContent='';}
 function errorText(code){const t=locale(language);return code==='OUT_OF_RANGE'?t.outOfRange:code==='UNSTABLE_BIRTH_TIME'?t.unstable:t.error;}
 function placeholder(){controls.place.replaceChildren(el('option',locale(language).choose));controls.place.options[0].value='';}
 function updateAccuracy(){const unknown=accuracy.value==='unknown',approximate=accuracy.value==='approximate';
  controls.time.disabled=unknown;controls.time.required=!unknown;if(unknown)controls.time.value='';
  controls.time.parentElement.hidden=unknown;
  controls.precision.disabled=!approximate;controls.precision.required=approximate;controls.precision.parentElement.hidden=!approximate;if(!approximate)controls.precision.value='';civil.refresh();}
 function inputValue(){if(!controls.place.value)throw {code:'SELECT_PLACE'};
  const input={localDate:controls.date.value,placeId:controls.place.value,timeZoneId:'Asia/Kolkata',calculationProfileId,timeAccuracy:accuracy.value,language};
  if(accuracy.value!=='unknown')input.localTime=controls.time.value;
  if(accuracy.value==='approximate')input.precisionOfBirthTimeMinutes=Number(controls.precision.value);
  if(controls.elevation.value!=='')input.elevationMetres=Number(controls.elevation.value);
  return input;}
 function safeName(){const value=controls.name.value.trim();if(value.length>80||/[\u0000-\u001f\u007f]/.test(value))throw {code:'INVALID_NAME'};return value;}
 function renderReview(){reviewRegion.replaceChildren();if(!reviewed)return;const t=locale(language),birth=reviewed.birth;
  reviewRegion.append(el('h2',t.reviewTitle),el('p',displayName),el('p',placeLabel(birth.place,language)),el('p',`${t.approx}: ${birth.place.latitude}, ${birth.place.longitude}`),
   el('p',`${birth.localDate} · ${birth.localTime??t.noTime} · ${birth.timeZoneId} ${birth.offset}`));
  reviewRegion.append(el('p',birth.utcInstant?`${t.utc}: ${birth.utcInstant}`:`${t.interval}: ${birth.interval.startUtc} → ${birth.interval.endUtc} · ${t.noTime}`));
  if(birth.place.elevationBasis==='assumed-sea-level')reviewRegion.append(el('p',t.sea));
  const calculate=el('button',t.calculate);calculate.type='button';calculate.id='birth-calculate';
  calculate.addEventListener('click',()=>{const current=revision;calculate.disabled=true;status.textContent=t.busy;
   pending=setTimeout(()=>{pending=null;if(current!==revision||!reviewed)return;
    try{const value=calculateBirthReport({...reviewed.input,language},{now:now()});if(current!==revision)return;report=value;renderResults();status.textContent=locale(language).ready;}
    catch(error){status.textContent=errorText(error.code);}
    finally{if(current===revision)calculate.disabled=false;}
   },0);
  });
  const edit=el('button',t.edit);edit.type='button';edit.addEventListener('click',()=>{invalidate();controls.date.focus();});const save=el('button',savedCopy[language][activeSavedId?'update':'save']);save.type='button';save.id='birth-save';save.addEventListener('click',()=>{try{const record=store.save({name:displayName,input:reviewed.input},activeSavedId);activeSavedId=record.id;renderLibrary();renderReview();status.textContent=savedCopy[language].saved;}catch{status.textContent=savedCopy[language].error;}});reviewRegion.append(calculate,edit,save);
 }
 function featureMessage(key,feature){const box=el('section',undefined,'vedic-feature-state');box.dataset.feature=key;box.dataset.status=feature.status;
  if(feature.status==='unavailable'){box.append(el('h3',locale(language)[key]??key),el('p',feature.diagnostic.code==='UNSTABLE_BIRTH_TIME'?locale(language).unstable:locale(language).unsupported));}
  return box;}
 function renderResults(){stopResults();if(!report)return;const t=locale(language),f=report.features;
  results.append(el('h2',displayName?`${t.results} · ${displayName}`:t.results),el('p',t.profile),el('p',t.nodes));
  if(report.birth.timeAccuracy!=='exact')results.append(el('p',t.unknownFeature));
  if(f.positions.status==='available'){
   const region=el('section');region.dataset.feature='positions';region.append(el('h3',t.positions));const table=el('table'),head=el('thead'),row=el('tr');
   for(const text of [t.body,t.sign,t.degree,t.nakshatra,t.pada]){const th=el('th',text);th.scope='col';row.append(th);}head.append(row);const body=el('tbody');
   for(const p of f.positions.value.positions){const tr=el('tr');tr.dataset.body=p.body;tr.dataset.rashi=String(p.rashi);tr.dataset.nakshatra=String(p.nakshatra);
    for(const value of [bodyName(p.body,language),`${signName(p.rashi,language)} (${p.rashi})`,p.degreeWithinRashi.toFixed(4),nakshatraName(p.nakshatra,language),p.pada])tr.append(el('td',String(value)));body.append(tr);}
   table.append(head,body);const wrap=el('div',undefined,'vedic-period-table');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',t.positions);wrap.append(table);region.append(el('p',t.scrollHint),wrap);results.append(region);
  }else results.append(featureMessage('positions',f.positions));
  for(const key of ['d1','d9','dasha'])results.append(featureMessage(key,f[key]));
  if(f.d1.status==='available'){const chartRoot=el('div');results.append(chartRoot);chartHandle=mountCharts(chartRoot,{d1:f.d1.value,d9:f.d9.status==='available'?f.d9.value:null},{language});}
  if(f.dasha.status==='available'){const dashaRoot=el('div');results.append(dashaRoot);dashaHandle=mountDasha(dashaRoot,f.dasha.value,language);}
  const provenance=el('details');provenance.append(el('summary',t.provenance),el('p',t.fallback));
  const data=el('dl');const birth=report.birth;
  for(const [key,value]of Object.entries({profile:birth.calculationProfileId,timezone:birth.timeZoneId,tzdb:birth.tzdbVersion,placeSource:birth.place.sourceVersion,precision:birth.precisionClass,calculatedAt:report.calculatedAtUtc}))data.append(el('dt',term(key,language)),el('dd',term(value,language)));
  const warnings=new Set(birth.warnings);for(const value of Object.values(f))if(value.status==='available')for(const warning of value.value.warnings??[])warnings.add(warning);
  const list=el('ul');for(const code of warnings)list.append(el('li',diagnosticText(code,language)));provenance.append(data,list);results.append(provenance);
  const traditionsRoot=el('div');results.append(traditionsRoot);traditionHandle=mountTraditions(traditionsRoot,report,{input:reviewed.input,now,language});
  const sensitivityRoot=el('div');results.append(sensitivityRoot);sensitivityHandle=mountSensitivity(sensitivityRoot,{input:reviewed.input,now,language});
  const rulesRoot=el('div');results.append(rulesRoot);rulesHandle=mountTraditionalChecks(rulesRoot,{input:reviewed.input,now,language});
  const advancedRoot=el('div');results.append(advancedRoot);advancedHandle=mountAdvanced(advancedRoot,{input:reviewed.input,d1:f.d1.status==='available'?f.d1.value:null,now,language});
  const timeMachineRoot=el('div');results.append(timeMachineRoot);timeMachineHandle=mountTimeMachine(timeMachineRoot,{birthInput:reviewed.input,now,language});
  const exportRoot=el('div');results.append(exportRoot);exportHandle=mountExport(exportRoot,report,{name:displayName,language});
 }
 function renderLibrary(){const t=savedCopy[language];library.replaceChildren();const title=el('h2',t.title);title.id='saved-kundlis-title';library.append(title,el('p',t.privacy));let records;try{records=store.read();}catch{library.append(el('p',t.error));return;}if(!records.length)library.append(el('p',t.empty));for(const record of records){const card=el('article',undefined,'saved-kundli-card');card.dataset.savedId=record.id;const name=el('h3',record.name||t.unnamed);name.setAttribute('translate','no');name.dataset.languagePreserve='';card.append(name,el('p',`${record.input.localDate} / ${record.input.localTime??locale(language).noTime}`),el('p',placeLabel(getPlace(record.input.placeId),language)));const open=el('button',t.open),remove=el('button',t.remove);open.type=remove.type='button';open.setAttribute('aria-label',t.open+' '+(record.name||t.unnamed));remove.setAttribute('aria-label',t.remove+' '+(record.name||t.unnamed));open.addEventListener('click',()=>{try{const current=store.read().find(r=>r.id===record.id);if(!current)return;clear();activeSavedId=current.id;controls.name.value=current.name;controls.date.value=current.input.localDate;accuracy.value=current.input.timeAccuracy;controls.time.value=current.input.localTime??'';controls.precision.value=String(current.input.precisionOfBirthTimeMinutes??'');controls.elevation.value=String(current.input.elevationMetres??'');birthplace.select(current.input.placeId,false);updateAccuracy();status.textContent=t.loaded;controls.date.focus();}catch{status.textContent=t.error;}});remove.addEventListener('click',()=>{try{store.remove(record.id);if(activeSavedId===record.id)activeSavedId=null;renderLibrary();renderReview();status.textContent=t.removed;}catch{status.textContent=t.error;}});card.append(open,remove);library.append(card);}}
 function translate(){civil.translate(language);const t=locale(language);root.lang=language;form.setAttribute('aria-label',t.title);heading.textContent=t.title;intro.textContent=savedCopy[language].intro;gate.textContent=t.gate;languageLabel.firstChild.textContent=t.language;
  for(const [key,span]of Object.entries(labels))span.textContent=key==='query'?savedCopy[language].place:key==='name'?savedCopy[language].name:t[key];for(const o of accuracy.options)o.textContent=t[o.value];birthplace.translate(language);renderLibrary();zone.textContent=t.timezone;
  relabelPlaces(controls.place,language);reviewButton.textContent=t.review;clearButton.textContent=savedCopy[language].clear;status.textContent=report?t.ready:'';if(!controls.place.value)controls.place.options[0].textContent=t.choose;renderReview();renderResults();}
 form.addEventListener('input',()=>invalidate());
 form.addEventListener('change',event=>{invalidate();if(event.target===accuracy)updateAccuracy();if(event.target===controls.place&&controls.place.value){try{getPlace(controls.place.value);}catch{placeholder();}}});
 form.addEventListener('submit',event=>{event.preventDefault();invalidate();try{const input=inputValue();displayName=safeName();const birth=normalizeInput(input,{now:now()});reviewed={input,birth};renderReview();}
  catch(error){status.textContent=error.code==='SELECT_PLACE'?locale(language).selectPlace:error.code==='INVALID_NAME'?locale(language).requiredName:errorText(error.code);}});
 function clear(){invalidate();form.reset();displayName='';activeSavedId=null;birthplace.clear();updateAccuracy();translate();}
 clearButton.addEventListener('click',clear);languageSelect.addEventListener('change',()=>{revision++;clearTimeout(pending);pending=null;language=languageSelect.value;translate();});
 const hide=()=>clear(),show=event=>{if(event.persisted)clear();};const storageChanged=event=>{if(event.key===savedKundliKey||event.key===null)renderLibrary();};window.addEventListener('storage',storageChanged);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
 const civil=installCivilInputs(root);placeholder();updateAccuracy();translate();
 return Object.freeze({destroy(){birthplace.destroy();civil.destroy();window.removeEventListener('storage',storageChanged);clearTimeout(pending);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);stopResults();root.remove();}});
}
