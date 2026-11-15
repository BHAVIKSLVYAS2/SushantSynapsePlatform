const words={
 en:{category:'Category',topic:'Deity / topic',audio:'Audio',all:'All',recorded:'With audio',unrecorded:'Without audio',reset:'Reset filters'},
 hi:{category:'श्रेणी',topic:'देवता / विषय',audio:'ऑडियो',all:'सभी',recorded:'ऑडियो सहित',unrecorded:'ऑडियो के बिना',reset:'फ़िल्टर हटाएँ'},
 gu:{category:'શ્રેણી',topic:'દેવતા / વિષય',audio:'ઑડિયો',all:'બધાં',recorded:'ઑડિયો સાથે',unrecorded:'ઑડિયો વગર',reset:'ફિલ્ટર દૂર કરો'}
};
const categories={nama:['Name mantras','नाम मंत्र','નામ મંત્ર'],vedic:['Vedic mantras','वैदिक मंत्र','વૈદિક મંત્ર'],prayer:['Prayers & salutations','प्रार्थना और वंदना','પ્રાર્થના અને વંદના'],scripture:['Scripture readings','शास्त्र पाठ','શાસ્ત્ર પાઠ'],peace:['Peace invocations','शांति पाठ','શાંતિ પાઠ'],navagraha:['Navagraha','नवग्रह','નવગ્રહ']};
const topics={ganesha:['Ganesha','गणेश','ગણેશ'],shiva:['Shiva','शिव','શિવ'],vishnu:['Vishnu / Narayana','विष्णु / नारायण','વિષ્ણુ / નારાયણ'],rama:['Rama','राम','રામ'],krishna:['Krishna','कृष्ण','કૃષ્ણ'],hanuman:['Hanuman','हनुमान','હનુમાન'],durga:['Durga','दुर्गा','દુર્ગા'],lakshmi:['Lakshmi','लक्ष्मी','લક્ષ્મી'],saraswati:['Saraswati','सरस्वती','સરસ્વતી'],navagraha:['Navagraha','नवग्रह','નવગ્રહ'],gayatri:['Gayatri','गायत्री','ગાયત્રી'],guru:['Guru','गुरु','ગુરુ'],peace:['Peace','शांति','શાંતિ']};
Object.assign(categories,{gayatri:['Gayatri mantras','गायत्री मंत्र','ગાયત્રી મંત્રો']});
Object.assign(topics,{
 brahma:['Brahma','ब्रह्मा','બ્રહ્મા'],devi:['Other Devi forms','देवी के अन्य स्वरूप','દેવીનાં અન્ય સ્વરૂપો'],
 skanda:['Skanda / Murugan','स्कन्द / मुरुगन','સ્કંદ / મુરુગન'],nature:['Nature deities','प्रकृति के देवता','પ્રકૃતિનાં દેવતાઓ']
});
export function mantraMetadata(m){
 if(m.id==='gayatri')return {categories:['vedic','gayatri'],topic:'gayatri'};
 if(m.id==='reading-surya-gayatri')return {categories:['gayatri','prayer','navagraha'],topic:'navagraha'};
 if(m.categories)return {categories:m.categories,topic:m.topic};
 if(m.id.startsWith('navagraha-'))return {categories:['nama','navagraha'],topic:'navagraha'};
 if(m.id.startsWith('nama-'))return {categories:['nama'],topic:m.id.slice(5)};
 const byId={gayatri:['vedic','gayatri'],mahamrityunjaya:['vedic','shiva'],shiva:['nama','shiva'],ganesha:['nama','ganesha'],vasudeva:['nama','vishnu'],narayana:['nama','vishnu'],'saha-navavatu':['peace','peace'],purnamadah:['peace','peace']};
 const [category,topic]=byId[m.id]||['prayer','peace'];return {categories:[category],topic};
}
export function mountLibraryFilters(host,onChange){
 const make=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n;},button=cls=>{const n=make('button',cls);n.type='button';return n;};
 const root=make('div','library-filters'),quick=make('div','library-category-chips'),active=make('div','library-active-filters'),trigger=button('library-filter-trigger'),icon=make('span'),triggerText=make('span'),badge=make('span','library-filter-count'),dialog=make('dialog','library-filter-dialog'),header=make('div','library-filter-heading'),title=make('h2'),close=button('library-filter-close'),categoryGroup=make('fieldset'),categoryTitle=make('legend'),categoryOptions=make('div','library-filter-options'),topicLabel=make('label'),topicCaption=make('span'),topic=make('select'),footer=make('div','library-filter-footer'),reset=button('library-filter-reset'),done=button('library-filter-done');
 const state={category:'',topic:''};let language='en';
 const extra={en:{filters:'Filters',close:'Close filters',done:'Show mantras',remove:'Remove',shortGayatri:'Gayatri'},hi:{filters:'फ़िल्टर',close:'फ़िल्टर बंद करें',done:'मंत्र दिखाएँ',remove:'हटाएँ',shortGayatri:'गायत्री'},gu:{filters:'ફિલ્ટર',close:'ફિલ્ટર બંધ કરો',done:'મંત્ર બતાવો',remove:'દૂર કરો',shortGayatri:'ગાયત્રી'}};
 root.setAttribute('data-language-preserve','');dialog.setAttribute('data-language-preserve','');title.id='library-filter-title';dialog.setAttribute('aria-labelledby',title.id);trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','library-filter-dialog');dialog.id='library-filter-dialog';
 icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--ui-solid)"/><circle cx="15" cy="17" r="3" fill="var(--ui-solid)"/></svg>';badge.setAttribute('aria-hidden','true');trigger.append(icon,triggerText,badge);
 header.append(title,close);categoryGroup.append(categoryTitle,categoryOptions);topic.id='mantra-filter-topic';topicLabel.append(topicCaption,topic);footer.append(reset,done);dialog.append(header,categoryGroup,topicLabel,footer);root.append(quick,active);host.querySelector('[role=status]').before(root);document.querySelector('#main').append(dialog);
 const label=(key,value)=>{const t=words[language],i={en:0,hi:1,gu:2}[language];return !value?t.all:((key==='category'?categories:topics)[value]?.[i]||value);};
 const chip=(key,value,compact=false)=>{const b=button('library-filter-chip');b.dataset.filter=key;b.dataset.value=value;b.textContent=compact&&value==='gayatri'?extra[language].shortGayatri:label(key,value);b.setAttribute('aria-pressed',String(state[key]===value));b.onclick=()=>{state[key]=value;paint();onChange();};return b;};
 function paint(){const t=words[language],e=extra[language],focus=document.activeElement,withinDialog=dialog.contains(focus),focusKey=focus?.dataset.filter,focusValue=focus?.dataset.value;quick.setAttribute('role','group');quick.setAttribute('aria-label',t.category);quick.replaceChildren(...['','gayatri','navagraha'].map(v=>chip('category',v,true)));categoryOptions.replaceChildren(...['',...Object.keys(categories)].map(v=>chip('category',v)));
  active.replaceChildren();for(const [key,value]of Object.entries(state)){if(!value||(key==='category'&&['gayatri','navagraha'].includes(value)))continue;const b=button('library-active-chip');b.textContent=label(key,value)+' ×';b.setAttribute('aria-label',e.remove+' '+t[key]+': '+label(key,value));b.onclick=()=>{state[key]='';paint();onChange();trigger.focus();};active.append(b);}active.hidden=!active.childElementCount;
  const count=Object.values(state).filter(Boolean).length;badge.hidden=!count;badge.textContent=String(count);triggerText.textContent=e.filters;trigger.setAttribute('aria-label',e.filters+(count?' ('+count+')':''));title.textContent=e.filters;close.textContent='×';close.setAttribute('aria-label',e.close);categoryTitle.textContent=t.category;topicCaption.textContent=t.topic;reset.textContent=t.reset;reset.disabled=!count;done.textContent=e.done;
  if(focusKey){const container=withinDialog?dialog:quick;container.querySelector('[data-filter="'+focusKey+'"][data-value="'+focusValue+'"]')?.focus({preventScroll:true});}
 }
 function clear(){for(const key of Object.keys(state))state[key]='';topic.value='';paint();}
 trigger.onclick=()=>dialog.showModal();close.onclick=done.onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>trigger.focus({preventScroll:true}));topic.onchange=()=>{state.topic=topic.value;paint();onChange();};reset.onclick=()=>{clear();onChange();done.focus();};
 return {trigger,clear,setCount(count){done.textContent=extra[language].done+' ('+count+')';},translate(next){language=words[next]?next:'en';topic.replaceChildren(new Option(words[language].all,''),...Object.keys(topics).map(id=>new Option(label('topic',id),id)));topic.value=state.topic;paint();},matches(m){const meta=mantraMetadata(m);return (!state.category||meta.categories.includes(state.category))&&(!state.topic||meta.topic===state.topic);}};
}
