import {romanize,gujaratiScript} from './script-aids.mjs';
const positions=new Map(); // In-tab reading position only; never a saved japa count.
const copy={
 en:{chapter:'Anuvaka',previous:'Previous',next:'Next',script:'Reading script',hi:'Sanskrit',en:'Roman',gu:'Gujarati',meaning:'Meaning · summary',namakam:'Namakam',chamakam:'Chamakam',source:'Anuvaka source',note:'Unaccented reading aid. Learn Vedic pitch accents from a trained teacher. Reading a chapter does not increase your practice count.'},
 hi:{chapter:'अनुवाक',previous:'पिछला',next:'अगला',script:'पठन लिपि',hi:'संस्कृत',en:'रोमन',gu:'गुजराती',meaning:'अर्थ · सारांश',namakam:'नमकम्',chamakam:'चमकम्',source:'अनुवाक का स्रोत',note:'स्वरचिह्नों के बिना पठन सहायता। वैदिक स्वर प्रशिक्षित शिक्षक से सीखें। अनुवाक पढ़ने से जप गणना नहीं बढ़ती।'},
 gu:{chapter:'અનુવાક',previous:'પાછલો',next:'આગલો',script:'વાંચનની લિપિ',hi:'સંસ્કૃત',en:'રોમન',gu:'ગુજરાતી',meaning:'અર્થ · સારાંશ',namakam:'નમકમ્',chamakam:'ચમકમ્',source:'અનુવાકનો સ્રોત',note:'સ્વરચિહ્નો વગરની વાંચન સહાય. વૈદિક સ્વર પ્રશિક્ષિત શિક્ષક પાસેથી શીખો. અનુવાક વાંચવાથી જપ ગણતરી વધતી નથી.'}
};
const el=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n;};
export function mountChapterReader(host,mantra,language='en'){
 let lang=copy[language]?language:'en',position=positions.get(mantra.id)||0;
 const section=el('section','chapter-reader'),nav=el('div','chapter-navigation'),label=el('label'),caption=el('span'),select=el('select'),previous=el('button'),next=el('button'),status=el('p','muted'),heading=el('h4'),scriptLabel=el('label'),scriptCaption=el('span'),script=el('select'),text=el('p','mantra chapter-text'),meaningHeading=el('h4'),meaning=el('p','chapter-meaning'),note=el('p','muted');
 section.setAttribute('data-language-preserve','');status.role='status';text.lang='sa';previous.type=next.type='button';
 for(const key of ['hi','en','gu'])script.append(new Option('',key));script.value=positions.get(mantra.id+'-script')||(lang==='gu'?'gu':'hi');
 label.append(caption,select);scriptLabel.append(scriptCaption,script);nav.append(previous,status,next);section.append(label,heading,scriptLabel,text,meaningHeading,meaning,note,nav);heading.tabIndex=-1;host.append(section);
 function paint(){
  const t=copy[lang],chapter=mantra.chapters[position];
  select.value=String(position);previous.disabled=position===0;next.disabled=position===mantra.chapters.length-1;
  status.textContent=`${position+1} / ${mantra.chapters.length}`;heading.textContent=`${t[chapter.book]} · ${t.chapter} ${chapter.number}`;
  const key=script.value;text.textContent=key==='en'?romanize(chapter.text):key==='gu'?gujaratiScript(chapter.text):chapter.text;text.lang=key==='en'?'sa-Latn':key==='gu'?'sa-Gujr':'sa-Deva';
  meaning.textContent=chapter.meanings[lang];meaning.lang=lang;
  positions.set(mantra.id,position);positions.set(mantra.id+'-script',script.value);
 }
 function move(value){position=value;paint();heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:'auto'});}
 previous.onclick=()=>move(position-1);next.onclick=()=>move(position+1);select.onchange=()=>move(Number(select.value));script.onchange=paint;
 function translate(language){
  lang=copy[language]?language:'en';const t=copy[lang];caption.textContent=t.chapter;select.setAttribute('aria-label',t.chapter);scriptCaption.textContent=t.script;script.setAttribute('aria-label',t.script);previous.textContent=t.previous;next.textContent=t.next;meaningHeading.textContent=t.meaning;note.textContent=t.note;
  for(const option of script.options)option.textContent=t[option.value];
  select.replaceChildren();for(const book of ['namakam','chamakam']){const group=el('optgroup');group.label=t[book];mantra.chapters.forEach((chapter,index)=>{if(chapter.book===book)group.append(new Option(`${t[book]} · ${t.chapter} ${chapter.number}`,String(index)));});select.append(group);}paint();
 }
 translate(lang);return {element:section,translate};
}
