import {gemstones,grahaMantra,ritualSteps,ratnaSources,ritualTypes,timingNote,extendedNote} from './ratna-content.mjs';
import {readPreference,writePreference} from './reader-preferences.mjs';
import {gujaratiScript} from './script-aids.mjs';
import {renderStudyPassage} from './study-passage.mjs';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const words={en:['Choose a gemstone','All gemstones','Introduction','Preparation','Guided ritual','Mantra and meaning','Extended ritual','Wearing','Sources and traditions','Previous','Next','Optional personal counter','Add 1','Reset counter','Customary household step','Name','Gotra (optional)','Place','Date','Purpose','Pronunciation aid · teacher review pending','Counter and place are saved on this device; practice totals are separate.','Saved place is unavailable in this browser.'],hi:['रत्न चुनें','सभी रत्न','परिचय','तैयारी','मार्गदर्शित विधि','मंत्र और अर्थ','विस्तृत अनुष्ठान','धारण विधि','स्रोत और परंपरा','पिछला','अगला','वैकल्पिक निजी जप-गिनती','१ जोड़ें','गिनती रीसेट','प्रचलित घरेलू चरण','नाम','गोत्र (वैकल्पिक)','स्थान','दिनांक','उद्देश्य','उच्चारण सहायता · शिक्षक समीक्षा लंबित','गिनती और स्थान इस डिवाइस पर सहेजे जाते हैं; अभ्यास-गणना अलग है।','इस ब्राउज़र में पढ़ने का स्थान सहेजना उपलब्ध नहीं है।']};
export function mountRatnaReader(host,language='en'){
 const stored=readPreference('ratna-v1',{});let lang=language,gem=gemstones.find(g=>g.id===stored?.gem)||null,position=Number.isInteger(stored?.position)?Math.max(0,Math.min(4,stored.position)):0;
 const counts={};for(const g of gemstones){const n=stored?.counts?.[g.id];counts[g.id]=Number.isSafeInteger(n)&&n>=0&&n<=100000000?n:0;}
 let script='hi',learning=true;const intentions={};const section=el('section',null,'ratna-reader'),content=el('div'),scriptLabel=el('label'),scriptCaption=el('span'),scriptSelect=el('select'),overview=el('p');
 for(const id of ['hi','en','gu'])scriptSelect.append(new Option({hi:'देवनागरी',en:'Roman',gu:'ગુજરાતી'}[id],id));scriptSelect.value=script;scriptLabel.append(scriptCaption,scriptSelect);scriptCaption.textContent='Script';scriptLabel.hidden=true;scriptSelect.onchange=()=>{script=scriptSelect.value;paint();};section.append(content);host.append(section);
 const t=()=>words[lang==='en'?'en':'hi'],pick=value=>value?.[lang==='en'?'en':'hi']||'';
 function save(){return writePreference('ratna-v1',{gem:gem?.id||null,position,counts});}
 function changed(){section.dispatchEvent(new CustomEvent('japseva-chapter-change',{bubbles:true}));}
 function button(text,action){const b=el('button',text);b.type='button';b.onclick=action;return b;}
 function block(title,value,parent=content){parent.append(el('h4',title),el('p',value));}
 function mantra(parent){
  const m=grahaMantra(gem);
  if(learning){
   parent.append(renderStudyPassage(m.text,{[lang==='en'?'en':'hi']:pick(m.meanings)},lang,{devanagari:m.aidHi,roman:m.transliteration,gujarati:m.aidGu,romanGuide:m.pronunciation}));
   return;
  }
  const text=el('p',script==='en'?m.transliteration:script==='gu'?gujaratiScript(m.text):m.text,'mantra');
  text.lang=script==='hi'?'sa-Deva':script==='en'?'sa-Latn':'sa-Gujr';parent.append(text);
 }
 function panel(title,text){const d=el('details'),s=el('summary',title);d.append(s,el('p',text));content.append(d);return d;}
 function paint(){
  content.replaceChildren();section.lang=lang==='en'?'en':'hi';const w=t();
  if(lang==='gu')content.append(el('p','આ માર્ગદર્શિકાની સંપૂર્ણ ગુજરાતી આવૃત્તિ હજી ઉપલબ્ધ નથી; નીચે હિન્દી પાઠ છે.','muted'));
  if(!gem){content.append(el('h4',w[0]),el('p',lang==='en'?'Nine gemstone guides. These are household devotional adaptations; source review remains open. Gemstones have no scientifically established planetary, medical or financial effects.':'नौ रत्नों की घरेलू भक्तिपरक मार्गदर्शिकाएँ; स्रोत-समीक्षा शेष है। रत्नों के ग्रह-संबंधी, चिकित्सा या आर्थिक प्रभाव वैज्ञानिक रूप से स्थापित नहीं हैं।'));
   const grid=el('div',null,'ratna-grid');for(const g of gemstones){const b=button(g.names.hi+' · '+g.names.en,()=>{gem=g;position=0;save();paint();changed();content.querySelector('h4')?.focus();});b.append(el('span',grahaMantra(g).nameDevanagari),el('span',pick(g.introduction)));grid.append(b);}content.append(grid);return;
  }
  content.append(button('← '+w[1],()=>{gem=null;save();paint();changed();}),el('h4',gem.names.hi+' · '+gem.names.en));content.querySelector('h4').tabIndex=-1;
  panel(w[2],pick(gem.introduction)+' '+pick(ritualTypes));
  panel(w[3],pick(gem.materials)+' '+pick(gem.care)+' '+pick(gem.weekday)+' — '+pick(timingNote));
  const steps=ritualSteps(gem),step=steps[position],guide=el('section',null,'ratna-step'),status=el('p',(position+1)+' / '+steps.length+' · '+w[14],'muted'),title=el('h4',pick(step.title));status.role='status';title.tabIndex=-1;guide.append(status,title,el('p',pick(step.action)));if(step.materials)guide.append(el('p',pick(step.materials),'muted'));if(step.mantraId)mantra(guide);
  if(step.sankalpa){const fields=el('div',null,'ratna-fields'),inputs=[];for(const [index,label]of w.slice(15,20).entries()){const l=el('label',label),input=el('input');input.type=index===3?'date':'text';input.maxLength=160;l.append(input);fields.append(l);inputs.push(input);}const result=el('p');result.setAttribute('aria-live','polite');const update=()=>{const [name,gotra,place,date,purpose]=inputs.map(n=>n.value.trim());result.textContent=lang==='en'?`I, ${name||'[name]'}${gotra?', of '+gotra+' gotra':''}, at ${place||'[place]'} on ${date||'[date]'}, offer this prayer for ${gem.names.en} with the intention: ${purpose||'[purpose]'}. May my actions be thoughtful.`:`मैं ${name||'[नाम]'}${gotra?', '+gotra+' गोत्र':''}, ${place||'[स्थान]'} में ${date||'[दिनांक]'} को ${gem.names.hi} के निमित्त ${purpose||'[उद्देश्य]'} के भाव से प्रार्थना करता/करती हूँ। मेरा आचरण विवेकपूर्ण रहे।`;};inputs.forEach(n=>n.oninput=update);update();guide.append(fields,result);}
  if(step.sankalpa){const inputs=[...guide.querySelectorAll('input')];inputs.forEach((input,index)=>{input.value=intentions[gem.id]?.[index]||'';input.addEventListener('input',()=>{intentions[gem.id]=inputs.map(n=>n.value);});});inputs[0].oninput();}
  if(step.id==='japa'){const counter=el('div',null,'ratna-counter'),value=el('output',String(counts[gem.id]));value.setAttribute('aria-label',w[11]);value.setAttribute('aria-live','polite');counter.append(el('p',w[11]+' · '+(lang==='en'?'108 optional; no mandatory count':'१०८ वैकल्पिक; कोई अनिवार्य संख्या नहीं')),value,button(w[12],()=>{if(counts[gem.id]<100000000)counts[gem.id]++;value.textContent=String(counts[gem.id]);savedNote.textContent=w[save()?21:22];}),button(w[13],()=>{counts[gem.id]=0;value.textContent='0';savedNote.textContent=w[save()?21:22];}));guide.append(counter);}
  const savedNote=el('p',w[21],'muted');guide.append(savedNote);content.append(guide);
  const mantras=panel(w[5],lang==='en'?'Traditional name invocation, reused from the existing Navagraha record. Not a bija, Vedic verse or gemstone prana-pratishtha formula.':'मौजूदा नवग्रह प्रविष्टि से पारंपरिक नाम-मंत्र। यह बीज, वैदिक ऋचा या रत्न प्राण-प्रतिष्ठा सूत्र नहीं है।');mantra(mantras);
  panel(w[6],pick(extendedNote));panel(w[7],pick(gem.wearing));const sources=panel(w[8],lang==='en'?'Source checks establish only the scope described below. Independent Sanskrit and ritual review remains pending. No complete Ratna Siddhi paddhati has been verified in Brihat Parashara Hora Shastra or Ratnapariksha literature.':'स्रोत-जाँच का दायरा नीचे दिया है। स्वतंत्र संस्कृत और अनुष्ठान-समीक्षा लंबित है। बृहत्पाराशर होराशास्त्र या रत्नपरीक्षा साहित्य में पूर्ण रत्न-सिद्धि पद्धति यहाँ सत्यापित नहीं हुई है।');
  for(const id of gem.sourceIds){const source=ratnaSources.find(s=>s.id===id),p=el('p'),label=el(source.url?'a':'span',source.textName);if(source.url)label.href=source.url;p.append(label,document.createTextNode(' · '+source.verificationStatus+' · '+source.interpretation));sources.append(p);}
 }
 function move(index){if(!gem||!Number.isInteger(index)||index<0||index>=5)return;section.dispatchEvent(new CustomEvent('japseva-chapter-will-change',{bubbles:true,detail:{direction:index>=position?1:-1}}));position=index;save();paint();changed();content.querySelector('.ratna-step h4')?.focus({preventScroll:true});}
 paint();return {element:section,overview,translate(value){lang=value;paint();},setScript(value){if(['hi','en','gu'].includes(value)){script=scriptSelect.value=value;paint();}},scriptControl(){return scriptLabel;},navigation(){return {position:gem?position:0,total:gem?5:1};},move,addContext(){},setLearning(value){learning=value;paint();}};
}
