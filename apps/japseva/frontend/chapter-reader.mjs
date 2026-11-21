import {readPreference,writePreference} from './reader-preferences.mjs';
import {romanize,gujaratiScript} from './script-aids.mjs';
import {capturePage,turnPage} from './book-motion.mjs';
export {turnPage} from './book-motion.mjs';
const positions=new Map(); // Reading preferences only; never a japa count.
function saved(id){try{return JSON.parse(sessionStorage.getItem('japseva-reader:'+id))||readPreference('chapter:'+id,{});}catch{return readPreference('chapter:'+id,{});}}
const groupNames={preparation:{en:'Preparation & puja',hi:'तैयारी और पूजा',gu:'તૈયારી અને પૂજા'},closing:{en:'Closing prayers',hi:'समापन',gu:'સમાપન'},saptashati:{en:'Durga Saptashati · 13 chapters',hi:'दुर्गासप्तशती · १३ अध्याय',gu:'દુર્ગાસપ્તશતી · ૧૩ અધ્યાય'},katha:{en:'Vrata katha · 5 chapters',hi:'व्रत-कथा · ५ अध्याय',gu:'વ્રતકથા · ૫ અધ્યાય'},path:{en:'Main text',hi:'मुख्य पाठ',gu:'મુખ્ય પાઠ'}};
const copy={
 en:{chapter:'Anuvaka',previous:'Previous',next:'Next',script:'Reading script',hi:'Sanskrit',en:'Roman',gu:'Gujarati',meaning:'Meaning · summary',namakam:'Namakam',chamakam:'Chamakam',source:'Anuvaka source',note:'Unaccented reading aid. Learn Vedic pitch accents from a trained teacher. Reading a chapter does not increase your practice count.'},
 hi:{chapter:'अनुवाक',previous:'पिछला',next:'अगला',script:'पठन लिपि',hi:'संस्कृत',en:'रोमन',gu:'गुजराती',meaning:'अर्थ · सारांश',namakam:'नमकम्',chamakam:'चमकम्',source:'अनुवाक का स्रोत',note:'स्वरचिह्नों के बिना पठन सहायता। वैदिक स्वर प्रशिक्षित शिक्षक से सीखें। अनुवाक पढ़ने से जप गणना नहीं बढ़ती।'},
 gu:{chapter:'અનુવાક',previous:'પાછલો',next:'આગલો',script:'વાંચનની લિપિ',hi:'સંસ્કૃત',en:'રોમન',gu:'ગુજરાતી',meaning:'અર્થ · સારાંશ',namakam:'નમકમ્',chamakam:'ચમકમ્',source:'અનુવાકનો સ્રોત',note:'સ્વરચિહ્નો વગરની વાંચન સહાય. વૈદિક સ્વર પ્રશિક્ષિત શિક્ષક પાસેથી શીખો. અનુવાક વાંચવાથી જપ ગણતરી વધતી નથી.'}
};
const summaryCopy={en:'Chapter summary · full translation pending',hi:'खंड का सारांश · पूरा अनुवाद अभी उपलब्ध नहीं',gu:'ખંડનો સારાંશ · સંપૂર્ણ અનુવાદ હજી ઉપલબ્ધ નથી'};
const aidCopy={en:'Approximate Roman reading aid',hi:'अनुमानित रोमन पठन सहायता',gu:'અંદાજિત રોમન વાંચન સહાય'};
const el=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n;};
export function mountChapterReader(host,mantra,language='en',{compact=false}={}){
 const restored=saved(mantra.id);let lang=copy[language]?language:'en',position=positions.get(mantra.id)??restored.position??0;
 if(!Number.isInteger(position)||position<0||position>=mantra.chapters.length)position=0;
 const section=el('section','chapter-reader'),nav=el('div','chapter-navigation'),label=el('label'),caption=el('span'),select=el('select'),previous=el('button'),next=el('button'),status=el('p','muted'),heading=el('h4'),scriptLabel=el('label'),scriptCaption=el('span'),script=el('select'),text=el('p','mantra chapter-text'),meaningHeading=el('h4'),meaning=el('p','chapter-meaning'),note=el('p','muted');
 let learning=false;const aidHeading=el(compact?'summary':'h4','learn-only'),aid=el('p','reading-aid learn-only'),reference=el('a','learn-only chapter-reference'),context=el('details','reading-context learn-only'),contextTitle=el('summary'),romanDetails=el('details','chapter-roman learn-only');aid.lang='sa-Latn';
 section.setAttribute('data-language-preserve','');status.role='status';text.lang='sa';previous.type=next.type='button';
 for(const key of ['hi','en','gu'])script.append(new Option('',key));const selected=positions.get(mantra.id+'-script')||restored.script;script.value=['hi','en','gu'].includes(selected)?selected:(lang==='gu'?'gu':'hi');
 label.append(caption,select);scriptLabel.append(scriptCaption,script);nav.append(previous,status,next);meaningHeading.classList.add('learn-only');meaning.classList.add('learn-only');note.classList.add('learn-only');section.append(label,heading,scriptLabel,text,aidHeading,aid,meaningHeading,meaning,note,reference,nav);heading.tabIndex=-1;host.append(section);
 if(compact){romanDetails.append(aidHeading,aid);meaningHeading.before(romanDetails);context.append(contextTitle,note,reference);nav.before(context);}
 function paint(){
  const t=copy[lang],chapter=mantra.chapters[position];
  select.value=String(position);previous.disabled=position===0;next.disabled=position===mantra.chapters.length-1;
  status.textContent=`${position+1} / ${mantra.chapters.length}`;heading.textContent=chapter.titles?.[lang]||`${t[chapter.book]} · ${t.chapter} ${chapter.number}`;
  const key=script.value;text.textContent=key==='en'?romanize(chapter.text):key==='gu'?gujaratiScript(chapter.text):chapter.text;text.lang=key==='en'?'sa-Latn':key==='gu'?'sa-Gujr':'sa-Deva';
  aidHeading.textContent=aidCopy[lang];aid.textContent=learning&&key!=='en'?romanize(chapter.text):'';aidHeading.hidden=aid.hidden=!learning||key==='en';
  romanDetails.hidden=!learning||key==='en';
  meaningHeading.textContent=summaryCopy[lang];meaning.textContent=chapter.meanings[lang];meaning.lang=lang;
  const source=chapter.sourceUrl||mantra.sourceUrl;reference.hidden=!source;reference.textContent={en:'Read the source edition',hi:'स्रोत संस्करण पढ़ें',gu:'સ્રોત આવૃત્તિ વાંચો'}[lang];if(source&&/^https:\/\//.test(source))reference.href=source;else reference.removeAttribute('href');
  positions.set(mantra.id,position);positions.set(mantra.id+'-script',script.value);
  writePreference('chapter:'+mantra.id,{position,script:script.value});
  try{sessionStorage.setItem('japseva-reader:'+mantra.id,JSON.stringify({position,script:script.value}));}catch{}
 }
 function move(value){if(!Number.isInteger(value)||value<0||value>=mantra.chapters.length)return;section.dispatchEvent(new CustomEvent('japseva-chapter-will-change',{bubbles:true}));const snapshot=capturePage(text),direction=value>=position?1:-1;position=value;paint();turnPage(text,direction,snapshot);heading.focus({preventScroll:true});const scroll=section.closest('.book-reader-scroll');if(scroll)scroll.scrollTop=0;else heading.scrollIntoView({block:'start',behavior:'auto'});section.dispatchEvent(new CustomEvent('japseva-chapter-change',{bubbles:true}));}
 previous.onclick=()=>move(position-1);next.onclick=()=>move(position+1);select.onchange=()=>move(Number(select.value));script.onchange=paint;
 function translate(language){
  lang=copy[language]?language:'en';const t=copy[lang],chapterLabel=mantra.chapterLabel?.[lang]||t.chapter;caption.textContent=chapterLabel;select.setAttribute('aria-label',chapterLabel);scriptCaption.textContent=t.script;script.setAttribute('aria-label',t.script);previous.textContent=t.previous;next.textContent=t.next;meaningHeading.textContent=t.meaning;note.textContent=mantra.readerNote?.[lang]||t.note;contextTitle.textContent={en:'About this reading',hi:'इस पाठ के बारे में',gu:'આ પાઠ વિશે'}[lang];
  for(const option of script.options)option.textContent=t[option.value];
  select.replaceChildren();let group,book;mantra.chapters.forEach((chapter,index)=>{if(chapter.book!==book){book=chapter.book;group=el('optgroup');group.label=groupNames[book]?.[lang]||t[book]||chapterLabel;select.append(group);}group.append(new Option(chapter.titles?.[lang]||`${t[book]} · ${t.chapter} ${chapter.number}`,String(index)));});paint();
 }
 translate(lang);return {element:section,translate,move,addContext(node){contextTitle.after(node);},setScript(value){if(['hi','en','gu'].includes(value)){script.value=value;paint();}},scriptControl(){return scriptLabel;},navigation(){return {position,total:mantra.chapters.length};},setLearning(value){if(learning===value)return;learning=value;paint();}};
}
