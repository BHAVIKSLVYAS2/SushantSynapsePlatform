import {readingPacks,readingRights,mountReader} from './readings.mjs';
import {learningFor} from './learning-content.mjs';
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
export function learningText(guide,language){
 const content=learningFor(guide),hi=language==='hi';
 return [guide.title[language],hi?'चरण, मंत्र और भावार्थ':'Steps, prayers and meanings',content.sequenceTitle[language],content.note[language],'',...content.steps.flatMap((s,i)=>[(i+1)+'. '+s.title[language],s.body[language], '']),...content.prayers.flatMap(prayer=>[prayer.title[language],prayer.sanskrit,prayer.iast,prayer.meaning[language],prayer.use[language],'']),...(readingPacks[guide.id]?[readingPacks[guide.id].title[language],readingPacks[guide.id].note[language],...readingPacks[guide.id].chapters.flatMap(c=>[c.title[language],c.body[language], '']),readingRights[language]]:[]),'Sushant Synapse · Ritual Assist'].join('\n');
}
export function renderLearning(parent,{guide,language,onChoose}){
 const hi=language==='hi',content=learningFor(guide),text=(en,hin)=>hi?hin:en;parent.replaceChildren();

 const tablist=node('div',null,'learning-tabs');tablist.setAttribute('role','tablist');tablist.setAttribute('aria-label',text('Learning sections','सीखने के खंड'));
 const sections={},buttons={};
 for(const [id,title]of [['vidhi',text('Preparation & steps','तैयारी और चरण')],['mantras',text('Mantras & meanings','मंत्र और भावार्थ')],...(readingPacks[guide.id]?[['readings',text('Story & reading','\u0915\u0925\u093e \u0914\u0930 \u092a\u093e\u0920')]]:[])]){
  const button=node('button',title);button.type='button';button.id='learn-tab-'+id;button.dataset.learnTab=id;button.setAttribute('role','tab');button.setAttribute('aria-controls','learn-panel-'+id);button.onclick=()=>onChoose(id);
  const panel=node('section');panel.id='learn-panel-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);sections[id]=panel;buttons[id]=button;tablist.append(button);
 }
 tablist.addEventListener('keydown',event=>{const ids=Object.keys(buttons),index=ids.indexOf(event.target.dataset.learnTab);if(index<0)return;let next;if(event.key==='ArrowRight')next=(index+1)%ids.length;else if(event.key==='ArrowLeft')next=(index+ids.length-1)%ids.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=ids.length-1;else return;event.preventDefault();onChoose(ids[next]);buttons[ids[next]].focus();});
 parent.append(tablist,...Object.values(sections));
 if(sections.readings)mountReader(sections.readings,{guide,language});
 sections.vidhi.append(node('p',guide.preparation[language]),node('h3',content.sequenceTitle[language]));
 const sequence=node('ol',null,'learning-steps');
 for(const step of guide.steps){const item=node('li',step[language]);sequence.append(item);}sections.vidhi.append(sequence);
 sections.mantras.append(node('h3',text('Read, understand, then practise','पढ़ें, भाव समझें, फिर अभ्यास करें')),node('p',text('IAST is a reading aid: ā, ī and ū are long vowels; ś and ṣ are different “sh” sounds. These texts omit Vedic accent marks. Learn accent, rhythm and ritual recitation from a teacher; no fixed repetition count is prescribed here.','IAST पढ़ने का सहारा है: ā, ī, ū लंबे स्वर हैं; ś और ṣ अलग “श/ष” ध्वनियाँ हैं। यहाँ वैदिक स्वर-चिह्न नहीं हैं। स्वर, लय और अनुष्ठान-पाठ शिक्षक से सीखें; यहाँ जप की निश्चित संख्या निर्धारित नहीं है।'),'fine'));
 for(const prayer of content.prayers){
  const card=node('article',null,'learning-mantra');card.dataset.prayer=prayer.id;card.append(node('span',prayer.kind[language],'eyebrow'),node('h4',prayer.title[language]));
  const sanskrit=node('p',prayer.sanskrit,'mantra-script');sanskrit.lang='sa';const iast=node('p',prayer.iast,'mantra-iast');iast.lang='sa-Latn';
  const meaning=node('p',prayer.meaning[language]);meaning.lang=language;const verse=prayer.source==='offering'?'Bhagavad Gita 9.26':prayer.source==='self'?'Bhagavad Gita 2.20':null;
  card.append(sanskrit,iast,meaning,node('p',prayer.use[language],'fine'));if(verse)card.append(node('p',verse,'learning-citation'));sections.mantras.append(card);
 }
 const download=node('button',text('Download learning notes','सीखने के नोट डाउनलोड करें'));download.type='button';download.className='learning-download';download.onclick=()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+learningText(guide,language)],{type:'text/plain;charset=utf-8'})),a=node('a');a.href=url;a.download='ritual-learning-'+guide.id+'-'+language+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);};parent.append(download);
 return {select(id){for(const key of Object.keys(sections)){const active=key===id;sections[key].hidden=!active;buttons[key].setAttribute('aria-selected',String(active));buttons[key].tabIndex=active?0:-1;}}};
}
