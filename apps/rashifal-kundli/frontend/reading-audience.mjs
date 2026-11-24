const key='ritvayam.reading-audience.v1',eventName='ritvayam-reading-audience';
export const audienceCopy={hi:{label:'पढ़ने का तरीका',public:'सरल',pandit:'पंडित',publicHint:'सरल अर्थ और मार्गदर्शन',panditHint:'अर्थ के साथ विस्तृत ज्योतिषीय आधार'},en:{label:'Reading view',public:'Simple',pandit:'Pandit',publicHint:'Meaning and guidance',panditHint:'Meaning with detailed calculation basis'},gu:{label:'વાંચવાની રીત',public:'સરળ',pandit:'પંડિત',publicHint:'સરળ અર્થ અને માર્ગદર્શન',panditHint:'અર્થ સાથે વિગતવાર જ્યોતિષીય આધાર'}};
let tabPreference;
export function readReadingAudience(){
 if(tabPreference)return tabPreference;
 try{return globalThis.localStorage?.getItem(key)==='pandit'?'pandit':'public';}catch{return 'public';}
}
export function setReadingAudience(value){if(!['public','pandit'].includes(value))return;tabPreference=value;try{localStorage.setItem(key,value);}catch{}window.dispatchEvent(new CustomEvent(eventName,{detail:value}));}
export function mountReadingAudience({language='hi',onChange=()=>{}}={}){
 const root=document.createElement('div');root.className='reading-audience';root.setAttribute('role','group');let value=readReadingAudience(),copy=audienceCopy[language]||audienceCopy.hi;const buttons={};
 const paint=()=>{root.setAttribute('aria-label',copy.label);for(const id of ['public','pandit']){buttons[id].textContent=copy[id];buttons[id].setAttribute('aria-pressed',String(value===id));buttons[id].title=copy[id+'Hint'];}};
 for(const id of ['public','pandit']){const b=document.createElement('button');b.type='button';b.dataset.readingAudience=id;b.addEventListener('click',()=>{if(value!==id)setReadingAudience(id);});root.append(b);buttons[id]=b;}
 const sync=e=>{if(!['public','pandit'].includes(e.detail)||value===e.detail)return;value=e.detail;paint();onChange(value);};window.addEventListener(eventName,sync);paint();
 return {element:root,get value(){return value;},setLanguage(language){copy=audienceCopy[language]||audienceCopy.hi;paint();},destroy(){window.removeEventListener(eventName,sync);root.remove();}};
}
