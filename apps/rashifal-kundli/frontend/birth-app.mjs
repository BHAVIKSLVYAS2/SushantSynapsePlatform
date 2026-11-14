import {pageLabels} from './language-shell.mjs';
import {practitionerCopy,readingWorkspaceCopy,workspaceSections,signDms} from './practitioner-copy.mjs';
import {journeyCopy,resultSections} from './kundli-journey-copy.mjs';
import {mountKundliReading} from './kundli-reading-view.mjs';
import {readingText} from './kundli-reading-copy.mjs';
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
 let dashaState=null,selectedSection='calculations',chartState={type:'D1',style:'north',selected:1};
 let language='en',reviewed=null,report=null,displayName='',revision=0,pending=null,chartHandle=null,dashaHandle=null,exportHandle=null,traditionHandle=null,timeMachineHandle=null,sensitivityHandle=null,rulesHandle=null,advancedHandle=null,readingHandle=null;
 const root=el('section',undefined,'vedic-birth-app'),heading=el('h1'),intro=el('p'),gate=el('p',undefined,'vedic-gate');
 const languageLabel=el('label'),languageSelect=el('select');languageSelect.id='birth-language';
 for(const [value,text]of [['en','English'],['hi','हिन्दी'],['gu','ગુજરાતી']]){const o=el('option',text);o.value=value;languageSelect.append(o);}
 languageLabel.append(el('span'),languageSelect);root.append(heading,intro,languageLabel);const accuracyNote=el('details',undefined,'birth-accuracy-note'),accuracySummary=el('summary');accuracyNote.append(accuracySummary,gate);
 const formPanel=el('details',undefined,'kundli-input-panel'),formSummary=el('summary');formPanel.open=true;formPanel.append(formSummary);const form=el('form');form.noValidate=true;form.autocomplete='off';form.setAttribute('aria-label','Birth details');
 const controls={},labels={};let activeSavedId=null;const store=kundliStore({now});
 function field(key,type,attrs={}){const label=el('label'),span=el('span'),input=el(type==='select'?'select':'input');
  input.id='birth-'+key;input.name=key;if(type!=='select')input.type=type;for(const [k,v]of Object.entries(attrs))input.setAttribute(k,String(v));
  label.append(span,input);form.append(label);controls[key]=input;labels[key]=span;return input;}
 field('name','text',{maxlength:80});field('date','date',{min:'1950-01-01',max:'2098-12-31',required:''});
 const accuracy=field('accuracy','select');for(const value of ['exact','approximate','unknown']){const o=el('option');o.value=value;accuracy.append(o);}
 field('time','time',{required:'',step:60});field('precision','number',{min:1,max:720,step:1});
 field('query','search',{maxlength:100});const hint=el('p',undefined,'vedic-help');hint.id='birth-search-help';controls.query.setAttribute('aria-describedby',hint.id);form.append(hint);
 field('place','select',{required:''});field('elevation','number',{min:-500,max:9000,step:1});const zone=el('p');form.append(zone);
 const reviewButton=el('button');reviewButton.type='submit';const clearButton=el('button');clearButton.type='button';reviewButton.id='birth-calculate';clearButton.id='birth-clear';const formActions=el('div',undefined,'kundli-form-actions');formActions.append(reviewButton,clearButton);form.append(formActions);formPanel.append(form,accuracyNote);root.append(formPanel);
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const reviewRegion=el('section');reviewRegion.id='birth-review';const results=el('section');results.id='birth-results';root.append(status,reviewRegion,results);container.replaceChildren(root);
 const library=el('details',undefined,'saved-kundlis');library.id='saved-kundlis';library.setAttribute('aria-labelledby','saved-kundlis-title');root.insertBefore(library,formPanel);
 const birthplace=mountBirthplace(controls.query,controls.place,hint);
 function stopResults(){chartHandle?.destroy();dashaHandle?.destroy();exportHandle?.destroy();traditionHandle?.destroy();timeMachineHandle?.destroy();sensitivityHandle?.destroy();rulesHandle?.destroy();advancedHandle?.destroy();readingHandle?.destroy();readingHandle=null;chartHandle=dashaHandle=exportHandle=traditionHandle=timeMachineHandle=sensitivityHandle=rulesHandle=advancedHandle=null;results.replaceChildren();}
 function invalidate(){dashaState=null;selectedSection='calculations';chartState={type:'D1',style:chartState.style,selected:1,body:null,compare:false,context:false};root.classList.remove('has-results');reviewButton.disabled=false;root.removeAttribute('aria-busy');revision++;clearTimeout(pending);pending=null;reviewed=report=null;reviewRegion.replaceChildren();stopResults();status.textContent='';}
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
  const summary=el('details',undefined,'kundli-birth-summary');summary.append(el('summary',journeyCopy[language].details));reviewRegion.append(summary);if(displayName)summary.append(el('p',displayName));summary.append(el('p',placeLabel(birth.place,language)));
  const civil=new Date(birth.localDate+'T'+(birth.localTime??'00:00')+':00Z');const readable=new Intl.DateTimeFormat(language,{dateStyle:'long',...(birth.localTime?{timeStyle:'short',hour12:true}:{}),timeZone:'UTC'}).format(civil);
  summary.firstChild.textContent=(displayName?displayName+' · ':'')+readable+' · '+placeLabel(birth.place,language);summary.append(el('p',readable+(birth.localTime?' IST':' / '+t.noTime)),el('p',t.accuracy+': '+t[birth.timeAccuracy]+(birth.precisionOfBirthTimeMinutes?' ± '+new Intl.NumberFormat(language,{style:'unit',unit:'minute',unitDisplay:'short'}).format(birth.precisionOfBirthTimeMinutes):'')));
  const technical=el('details');technical.append(el('summary',t.provenance),el('p',`${t.approx}: ${birth.place.latitude}, ${birth.place.longitude}`),el('p',`${birth.localDate} / ${birth.localTime??t.noTime} / ${birth.timeZoneId} ${birth.offset}`));
  technical.append(el('p',birth.utcInstant?`${t.utc}: ${birth.utcInstant}`:`${t.interval}: ${birth.interval.startUtc} / ${birth.interval.endUtc}`));if(birth.place.elevationBasis==='assumed-sea-level')technical.append(el('p',t.sea));summary.append(technical);
  const edit=el('button',t.edit);edit.type='button';edit.addEventListener('click',()=>{if(pending!==null)invalidate();formPanel.open=true;root.querySelector('#birth-date-day')?.focus();formPanel.scrollIntoView({block:'start'});});const save=el('button',savedCopy[language][activeSavedId?'update':'save']);save.type='button';save.id='birth-save';save.disabled=!report;save.addEventListener('click',()=>{try{const record=store.save({name:displayName,input:reviewed.input},activeSavedId);activeSavedId=record.id;renderLibrary();renderReview();status.textContent=savedCopy[language].saved;}catch{status.textContent=savedCopy[language].error;}});const actions=el('div',undefined,'kundli-result-actions');const download=el('button',journeyCopy[language].download);download.type='button';download.addEventListener('click',()=>results.querySelector('#export-download')?.click());actions.append(edit,save);if(report)actions.append(download);reviewRegion.append(actions);
 }
 function featureMessage(key,feature){const box=el('section',undefined,'vedic-feature-state');box.dataset.feature=key;box.dataset.status=feature.status;
  if(feature.status==='unavailable'){box.append(el('h3',locale(language)[key]??key),el('p',feature.diagnostic.code==='UNSTABLE_BIRTH_TIME'?locale(language).unstable:locale(language).unsupported));}
  return box;}
 function renderResults(){root.classList.toggle('has-results',Boolean(report));const openGroups=new Set([...results.querySelectorAll('details[data-kundli-group][open]')].map(node=>node.dataset.kundliGroup));stopResults();if(!report)return;const t=locale(language),f=report.features;
  const readingRoot=el('div');results.append(readingRoot);readingHandle=mountKundliReading(readingRoot,report,language,displayName);
  function group(id,key){const node=el('details',undefined,'kundli-expert-group');node.dataset.kundliGroup=id;node.id='kundli-'+id;node.open=openGroups.has(id);node.append(el('summary',readingText[language][key]));results.append(node);return node;}
  let chartRoot=null;const timingContext=el('p',undefined,'kundli-timing-context');
  function updateTimingContext(){const r=readingWorkspaceCopy[language];timingContext.textContent=(chartState.body?r.selected+': '+bodyName(chartState.body,language):r.noSelection)+' / '+r.same;}
  const calculations=group('calculations','charts'),planets=group('planets','charts'),timing=group('timing','timing'),advanced=group('advanced','advanced');planets.querySelector('summary').textContent=t.positions;calculations.querySelector('summary').textContent=resultSections[language].calculations;
  const checks=group('checks','advanced'),sensitivityGroup=group('sensitivity','advanced'),transits=group('transits','advanced');for(const node of [advanced,checks,sensitivityGroup,transits])node.querySelector('summary').textContent=workspaceSections[language][node.dataset.kundliGroup];
  calculations.append(el('p',t.profile,'kundli-profile-line'));
  if(report.birth.timeAccuracy!=='exact')calculations.append(el('p',t.unknownFeature));
  if(f.positions.status==='available'){
   const region=el('section');region.dataset.feature='positions';region.append(el('h3',t.positions));const table=el('table'),head=el('thead'),row=el('tr');
   for(const text of [t.body,t.sign,t.degree,t.nakshatra,t.pada]){const th=el('th',text);th.scope='col';row.append(th);}head.append(row);const body=el('tbody');
   for(const p of f.positions.value.positions){const tr=el('tr');tr.dataset.body=p.body;tr.dataset.rashi=String(p.rashi);tr.dataset.nakshatra=String(p.nakshatra);
    for(const value of [bodyName(p.body,language),`${signName(p.rashi,language)} (${p.rashi})`,signDms(p.degreeWithinRashi),nakshatraName(p.nakshatra,language),p.pada])tr.append(el('td',String(value)));body.append(tr);}
   table.append(head,body);const wrap=el('div',undefined,'vedic-period-table');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',t.positions);wrap.append(table);region.append(el('p',t.scrollHint),wrap);planets.append(region);
  }else planets.append(featureMessage('positions',f.positions));
  for(const key of ['d1','d9','dasha'])(key==='dasha'?timing:calculations).append(featureMessage(key,f[key]));
  if(f.d1.status==='available'){chartRoot=el('div');calculations.append(chartRoot);chartHandle=mountCharts(chartRoot,{d1:f.d1.value,d9:f.d9.status==='available'?f.d9.value:null,...Object.fromEntries(Object.entries(report.chartViews??{}).map(([key,f])=>[key,f.status==='available'?f.value:null]))},{language,paired:true,positions:f.positions.status==='available'?f.positions.value.positions:null,initialChart:chartState.type,initialStyle:chartState.style,initialHouse:chartState.selected,initialBody:chartState.body,initialCompare:chartState.compare,initialContext:chartState.context,onStateChange:state=>{chartState=state;updateTimingContext();}});}
  if(f.dasha.status==='available'){const dashaRoot=el('div');timing.append(dashaRoot);dashaHandle=mountDasha(dashaRoot,f.dasha.value,language,{initialMajor:dashaState,onStateChange:value=>{dashaState=value;}});}
  updateTimingContext();timing.prepend(timingContext);
  if(chartRoot){const profile=calculations.querySelector('.kundli-profile-line');if(profile)chartRoot.querySelector('.vedic-chart-notes').append(profile);}
  const c=practitionerCopy[language],r=readingWorkspaceCopy[language],sectionCopy={...resultSections[language],...workspaceSections[language],calculations:r.chart,planets:c.grahas,timing:r.timing};
  if(f.dasha.status==='available'){
   const active=f.dasha.value.active,card=el('aside',undefined,'kundli-current-dasha'),date=value=>new Intl.DateTimeFormat(language,{dateStyle:'medium',timeZone:'Asia/Kolkata'}).format(new Date(value));
   card.append(el('h3',c.current),el('strong',bodyName(active.mahadashaLord,language)+' / '+bodyName(active.antardashaLord,language)),el('span',c.asOf+': '+date(active.atUtcInstant)),el('span',c.next+': '+date(active.nextTransition.boundary.utcInstant)));calculations.append(card);
  }
  const sectionNav=el('nav',undefined,'kundli-section-nav');sectionNav.setAttribute('aria-label',resultSections[language].label);const sectionButtons=[],more=el('details',undefined,'kundli-more-nav');const moreTrigger=el('summary',c.more);more.append(moreTrigger);const moreItems=el('div'),sectionsMenu=el('section'),toolsMenu=el('section');sectionsMenu.append(el('h3',r.sections));toolsMenu.append(el('h3',journeyCopy[language].tools));moreItems.append(sectionsMenu,toolsMenu);more.append(moreItems);more.addEventListener('toggle',()=>{if(more.open)fitMenu();});
  for(const id of ['calculations','planets','timing','overview','topics','advanced','checks','sensitivity','transits','report']){const button=el('button',id==='report'?c.report:id==='transits'?r.transits:sectionCopy[id]);button.type='button';button.dataset.kundliSection=id;button.setAttribute('aria-controls',id==='report'?'kundli-export':id==='overview'||id==='topics'?'kundli-reading-content':'kundli-'+id);button.addEventListener('click',()=>{chooseSection(id);more.open=false;sectionNav.scrollIntoView({block:'nearest'});});(['calculations','planets','timing'].includes(id)?sectionNav:sectionsMenu).append(button);sectionButtons.push(button);}for(const link of root.closest('body')?.querySelectorAll('.vedic-app-header .vedic-nav a')||[]){if(new URL(link.href).pathname==='/rashifal-kundli')continue;const shortcut=link.cloneNode(true);shortcut.className='kundli-tool-link';toolsMenu.append(shortcut);}
  sectionNav.append(more);results.prepend(sectionNav);readingRoot.id='kundli-reading-content';
  function chooseSection(id){selectedSection=id;if(chartRoot&&['calculations','planets'].includes(id)){if(id==='planets')planets.append(chartRoot);else calculations.insertBefore(chartRoot,calculations.querySelector('.kundli-current-dasha'));chartHandle?.setView(id==='planets'?'grahas':'chart');}const fallback=planets.querySelector('[data-feature=positions]');if(fallback)fallback.hidden=Boolean(chartRoot);for(const button of sectionButtons)button.setAttribute('aria-pressed',String(button.dataset.kundliSection===id));const secondary=['overview','topics','advanced','checks','sensitivity','transits','report'].includes(id);more.dataset.active=String(secondary);moreTrigger.textContent=c.more;moreTrigger.setAttribute('aria-label',secondary?c.more+': '+(id==='report'?c.report:id==='transits'?r.transits:sectionCopy[id]):c.more);
   if(['overview','topics'].includes(id)){const title=readingRoot.querySelector('#kundli-reading-title');if(title?.firstChild?.nodeType===Node.TEXT_NODE)title.firstChild.textContent=sectionCopy[id];}
   readingRoot.hidden=!['overview','topics'].includes(id);for(const node of [calculations,planets,timing,advanced,checks,sensitivityGroup,transits]){node.hidden=node.dataset.kundliGroup!==id;if(!node.hidden)node.open=true;}
   for(const node of readingRoot.querySelectorAll('.kundli-reading-grid,.kundli-reading-methods,.kundli-topic-picker,.kundli-reading-navigation'))node.hidden=id!=='topics';
   for(const node of readingRoot.querySelectorAll('.kundli-identity,.kundli-future,.kundli-reading-intro,.kundli-reading-notice,.kundli-quick-topics,.kundli-expert-picker'))node.hidden=id!=='overview';
   const exportPanel=results.querySelector('#kundli-export');if(exportPanel)exportPanel.hidden=id!=='report';
  }
  readingRoot.addEventListener('kundli-topic-jump',event=>chooseSection(event.detail==='future'?'overview':'topics'));chooseSection(selectedSection);
  const provenance=el('details');provenance.id='kundli-provenance';provenance.append(el('summary',t.provenance),el('p',t.fallback));
  const data=el('dl');const birth=report.birth;
  for(const [key,value]of Object.entries({profile:birth.calculationProfileId,timezone:birth.timeZoneId,tzdb:birth.tzdbVersion,placeSource:birth.place.sourceVersion,precision:birth.precisionClass,calculatedAt:report.calculatedAtUtc}))data.append(el('dt',term(key,language)),el('dd',term(value,language)));
  const warnings=new Set(birth.warnings);for(const value of Object.values(f))if(value.status==='available')for(const warning of value.value.warnings??[])warnings.add(warning);
  const list=el('ul');for(const code of warnings)list.append(el('li',diagnosticText(code,language)));provenance.append(el('p',t.nodes),data,list);calculations.append(provenance);
  const traditionsRoot=el('div');timing.append(traditionsRoot);traditionHandle=mountTraditions(traditionsRoot,report,{input:reviewed.input,now,language});
  const sensitivityRoot=el('div');sensitivityGroup.append(sensitivityRoot);sensitivityHandle=mountSensitivity(sensitivityRoot,{input:reviewed.input,now,language});
  const rulesRoot=el('div');checks.append(rulesRoot);rulesHandle=mountTraditionalChecks(rulesRoot,{input:reviewed.input,now,language});
  const advancedRoot=el('div');advanced.append(advancedRoot);advancedHandle=mountAdvanced(advancedRoot,{input:reviewed.input,d1:f.d1.status==='available'?f.d1.value:null,now,language});
  const timeMachineRoot=el('div');transits.append(timeMachineRoot);timeMachineHandle=mountTimeMachine(timeMachineRoot,{birthInput:reviewed.input,now,language});
  for(const [panel,label]of [[advancedRoot,sectionCopy.advanced],[rulesRoot,sectionCopy.checks],[sensitivityRoot,sectionCopy.sensitivity],[timeMachineRoot,r.transits]]){const heading=panel.querySelector('h2');if(heading)heading.textContent=label;}
  const exportRoot=el('div');exportRoot.id='kundli-export';results.append(exportRoot);exportHandle=mountExport(exportRoot,report,{name:displayName,language});const exportHeading=exportRoot.querySelector('h2');if(exportHeading)exportHeading.textContent=c.report;exportRoot.hidden=selectedSection!=='report';
 }
 function renderLibrary(){
  const t=savedCopy[language],query=library.querySelector('input')?.value??'';library.replaceChildren();library.hidden=false;
  const title=el('summary',t.title);title.id='saved-kundlis-title';library.append(title);let records;
  try{records=store.read();}catch{library.append(el('p',t.error));return;}
  library.hidden=records.length===0;title.textContent=t.title+' ('+records.length+')';
  if(!library.dataset.initialized){library.open=false;library.dataset.initialized='true';}
  const searchLabel=el('label',t.find,'saved-kundli-search'),search=el('input');search.type='search';search.value=query;search.autocomplete='off';searchLabel.append(search);searchLabel.hidden=records.length<6;library.append(searchLabel);
  const list=el('ul',undefined,'saved-kundli-list'),empty=el('p',t.noMatch);empty.setAttribute('role','status');library.append(list,empty);
  for(const record of [...records].reverse()){
   const row=el('li',undefined,'saved-kundli-card');row.dataset.savedId=record.id;
   const info=el('div',undefined,'saved-kundli-info'),name=el('h3'),open=el('button',record.name||t.unnamed);open.type='button';open.className='saved-kundli-open';open.setAttribute('translate','no');open.dataset.languagePreserve='';open.setAttribute('aria-label',journeyCopy[language].view+' '+(record.name||t.unnamed));name.append(open);
   const place=placeLabel(getPlace(record.input.placeId),language),metadata=el('p',undefined,'saved-kundli-meta');metadata.append(el('span',record.input.localDate+' / '+(record.input.localTime??locale(language).noTime)),el('span',place));info.append(name,metadata);
   open.onclick=()=>{try{const current=store.read().find(r=>r.id===record.id);if(current){loadSaved(current,true);library.open=false;}}catch{status.textContent=t.error;}};
   const menu=el('details',undefined,'saved-kundli-actions'),trigger=el('summary',t.actions);trigger.setAttribute('aria-label',t.actions+': '+(record.name||t.unnamed));const actions=el('div');
   const edit=el('button',journeyCopy[language].edit),remove=el('button',t.remove);edit.type=remove.type='button';edit.setAttribute('aria-label',journeyCopy[language].edit+' '+(record.name||t.unnamed));remove.setAttribute('aria-label',t.remove+' '+(record.name||t.unnamed));
   edit.onclick=()=>{menu.open=false;loadSaved(record,false);};remove.onclick=()=>{try{store.remove(record.id);if(activeSavedId===record.id)activeSavedId=null;renderLibrary();renderReview();status.textContent=t.removed;const target=library.querySelector('.saved-kundli-open')??reviewRegion.querySelector('button')??controls.query;target?.focus();}catch{status.textContent=t.error;}};
   actions.append(edit,remove);menu.append(trigger,actions);row.append(info,menu);row.dataset.search=(record.name+' '+record.input.localDate+' '+place).toLocaleLowerCase(language);list.append(row);
  }
  function filter(){let visible=0;for(const row of list.children){row.hidden=!row.dataset.search.includes(search.value.trim().toLocaleLowerCase(language));if(!row.hidden)visible++;}empty.hidden=visible>0;}
  search.oninput=filter;filter();const privacy=el('details',undefined,'saved-kundli-privacy');privacy.append(el('summary',t.about),el('p',t.privacy));library.append(privacy);
 }

 function loadSaved(record,generate=false){try{clear();activeSavedId=record.id;controls.name.value=record.name;controls.date.value=record.input.localDate;accuracy.value=record.input.timeAccuracy;controls.time.value=record.input.localTime??'';controls.precision.value=String(record.input.precisionOfBirthTimeMinutes??'');controls.elevation.value=String(record.input.elevationMetres??'');birthplace.select(record.input.placeId,false);updateAccuracy();formPanel.open=true;if(generate)form.requestSubmit();else{root.querySelector('#birth-date-day')?.focus();formPanel.scrollIntoView({block:'start'});}}catch{status.textContent=savedCopy[language].error;}}
 function translate(){optionsSummary.textContent=journeyCopy[language].options;civil.translate(language);const t=locale(language);root.lang=language;form.setAttribute('aria-label',t.title);heading.textContent=pageLabels[language].birth;intro.textContent=journeyCopy[language].intro;formSummary.textContent=journeyCopy[language].details;gate.textContent=t.gate;accuracySummary.textContent=t.provenance;languageLabel.firstChild.textContent=t.language;
  for(const [key,span]of Object.entries(labels))span.textContent=key==='query'?savedCopy[language].place:key==='name'?savedCopy[language].name:t[key];for(const o of accuracy.options)o.textContent=t[o.value];birthplace.translate(language);renderLibrary();zone.textContent=t.timezone;zone.className='kundli-timezone';
  relabelPlaces(controls.place,language);reviewButton.textContent=journeyCopy[language].generate;clearButton.textContent=savedCopy[language].clear;status.textContent=report?t.ready:'';if(!controls.place.value)controls.place.options[0].textContent=t.choose;renderReview();renderResults();}
 form.addEventListener('invalid',event=>{for(let parent=event.target.parentElement;parent&&parent!==root;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;},true);
 form.addEventListener('input',()=>invalidate());
 form.addEventListener('change',event=>{invalidate();if(event.target===accuracy)updateAccuracy();if(event.target===controls.place&&controls.place.value){try{getPlace(controls.place.value);}catch{placeholder();}}});
 form.addEventListener('submit',event=>{event.preventDefault();if(pending!==null)return;if(!civil.valid()||!form.reportValidity())return;invalidate();try{const input=inputValue();displayName=safeName();const birth=normalizeInput(input,{now:now()});reviewed={input,birth};renderReview();const ticket=revision;reviewButton.disabled=true;root.setAttribute('aria-busy','true');status.textContent=locale(language).busy;
 pending=setTimeout(()=>{pending=null;if(ticket!==revision||!reviewed)return;try{report=calculateBirthReport({...reviewed.input,language},{now:now()});renderResults();renderReview();formPanel.open=false;const target=results.querySelector('.kundli-section-nav button[aria-pressed=true]');target?.focus({preventScroll:true});results.scrollIntoView({block:'start'});status.textContent=locale(language).ready;}catch(error){status.textContent=errorText(error.code);formPanel.open=true;}finally{if(ticket===revision){reviewButton.disabled=false;root.removeAttribute('aria-busy');}}},32);}
  catch(error){status.textContent=error.code==='SELECT_PLACE'?locale(language).selectPlace:error.code==='INVALID_NAME'?locale(language).requiredName:errorText(error.code);}});
 function clear(){formPanel.open=true;invalidate();form.reset();displayName='';activeSavedId=null;birthplace.clear();updateAccuracy();translate();}
 clearButton.addEventListener('click',clear);languageSelect.addEventListener('change',()=>{revision++;clearTimeout(pending);pending=null;reviewButton.disabled=false;root.removeAttribute('aria-busy');language=languageSelect.value;translate();});
 function fitMenu(){const menu=root.querySelector('.kundli-more-nav[open]');if(!menu)return;const panel=menu.querySelector(':scope>div'),bounds=menu.closest('nav').getBoundingClientRect(),header=document.querySelector('.platform-shell')?.getBoundingClientRect().bottom||0,below=innerHeight-bounds.bottom-12,above=bounds.top-header-12,up=below<240&&above>below;panel.style.top=up?'auto':'100%';panel.style.bottom=up?'100%':'auto';panel.style.maxHeight=Math.max(80,up?above:below)+'px';}
 window.addEventListener('resize',fitMenu);
 const dismissMenu=event=>{const menu=root.querySelector('.kundli-more-nav[open]');if(!menu)return;if(event.type==='keydown'){if(event.key!=='Escape')return;event.preventDefault();menu.open=false;menu.querySelector('summary').focus();}else if(!menu.contains(event.target))menu.open=false;};document.addEventListener('pointerdown',dismissMenu);root.addEventListener('keydown',dismissMenu);
 const hide=()=>clear(),show=event=>{if(event.persisted)clear();};const storageChanged=event=>{if(event.key===savedKundliKey||event.key===null)renderLibrary();};window.addEventListener('storage',storageChanged);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
 const civil=installCivilInputs(root);const options=el('details',undefined,'kundli-input-options'),optionsSummary=el('summary');options.append(optionsSummary,controls.name.parentElement,controls.elevation.parentElement,zone);form.insertBefore(options,formActions);const refreshOptions=()=>{optionsSummary.textContent=journeyCopy[language].options;};languageSelect.addEventListener('change',refreshOptions);refreshOptions();placeholder();updateAccuracy();translate();
 return Object.freeze({destroy(){window.removeEventListener('resize',fitMenu);document.removeEventListener('pointerdown',dismissMenu);root.removeEventListener('keydown',dismissMenu);birthplace.destroy();civil.destroy();window.removeEventListener('storage',storageChanged);clearTimeout(pending);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);stopResults();root.remove();}});
}
