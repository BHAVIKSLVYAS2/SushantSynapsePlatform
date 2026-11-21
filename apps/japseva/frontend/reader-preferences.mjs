// Local reading preferences only. Never read or write practice/count records.
const prefix='japseva-reading:';
export function readPreference(key,fallback=null){try{return JSON.parse(localStorage.getItem(prefix+key))??fallback;}catch{return fallback;}}
export function writePreference(key,value){try{localStorage.setItem(prefix+key,JSON.stringify(value));return true;}catch{return false;}}
const copy={
 en:{settings:'Reading settings',size:'Text size',spacing:'Line spacing',reset:'Reset text',saved:'Your place is saved on this device.',unavailable:'Your place cannot be saved in this browser.',guide:'Pronunciation help',intro:'Roman letters are an approximate sound aid, not a translation. Vedic pitch accents are not included. Teacher review is pending.'},
 hi:{settings:'पठन सेटिंग',size:'अक्षर आकार',spacing:'पंक्तियों की दूरी',reset:'अक्षर रीसेट करें',saved:'पढ़ने का स्थान इस डिवाइस पर सहेजा जाता है।',unavailable:'इस ब्राउज़र में पढ़ने का स्थान सहेजा नहीं जा सकता।',guide:'उच्चारण सहायता',intro:'रोमन अक्षर अनुमानित ध्वनि-सहायता हैं, अनुवाद नहीं। वैदिक स्वरचिह्न शामिल नहीं हैं। शिक्षक की समीक्षा लंबित है।'},
 gu:{settings:'વાંચન સેટિંગ',size:'અક્ષરનું કદ',spacing:'પંક્તિનું અંતર',reset:'અક્ષર રીસેટ કરો',saved:'વાંચવાનું સ્થાન આ ઉપકરણ પર સચવાય છે.',unavailable:'આ બ્રાઉઝરમાં વાંચવાનું સ્થાન સાચવી શકાતું નથી.',guide:'ઉચ્ચાર સહાય',intro:'રોમન અક્ષરો અંદાજિત ધ્વનિ સહાય છે, અનુવાદ નથી. વૈદિક સ્વરચિહ્નો સામેલ નથી. શિક્ષકની સમીક્ષા બાકી છે.'}
};
export function mountReadingSettings(book,toolbar,soundRows,onResize){
 const make=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n;};
 const settings=make('details','book-reading-settings'),summary=make('summary'),panel=make('div','book-settings-panel'),sizeLabel=make('label'),sizeCaption=make('span'),size=make('select'),spacingLabel=make('label'),spacingCaption=make('span'),spacing=make('select'),reset=make('button'),notice=make('p','muted'),guide=make('details','book-sound-help learn-only'),guideTitle=make('summary'),intro=make('p'),sounds=make('dl');
 for(const value of [22,26,30,34])size.append(new Option(String(value)+' px',String(value)));
 for(const value of [1.9,2.05,2.3,2.5])spacing.append(new Option(String(value)+'×',String(value)));
 const stored=readPreference('type',{});size.value=[22,26,30,34].includes(stored?.size)?stored.size:26;spacing.value=[1.9,2.05,2.3,2.5].includes(stored?.spacing)?stored.spacing:2.05;
 reset.type='button';sizeLabel.append(sizeCaption,size);spacingLabel.append(spacingCaption,spacing);panel.append(sizeLabel,spacingLabel,reset,notice);guide.append(guideTitle,intro,sounds);settings.append(summary,panel,guide);toolbar.append(settings);
 let language='en',canSave=true;
 function apply(){book.style.setProperty('--reading-size',size.value+'px');book.style.setProperty('--reading-spacing',spacing.value);}
 function change(){const restore=onResize?.();apply();writePreference('type',{size:Number(size.value),spacing:Number(spacing.value)});restore?.();}
 size.onchange=spacing.onchange=change;reset.onclick=()=>{size.value=26;spacing.value=2.05;change();};apply();
 function translate(value){language=copy[value]?value:'en';const t=copy[language];notice.textContent=t[canSave?'saved':'unavailable'];summary.textContent=t.settings;sizeCaption.textContent=t.size;spacingCaption.textContent=t.spacing;reset.textContent=t.reset;guideTitle.textContent=t.guide;intro.textContent=t.intro;sounds.replaceChildren();for(const row of soundRows){const term=make('dt'),definition=make('dd');term.textContent=row[0];definition.textContent=row[{en:1,hi:2,gu:3}[language]];sounds.append(term,definition);}}
 translate('en');
 return {translate,setSaved(ok){canSave=ok;notice.textContent=copy[language][ok?'saved':'unavailable'];},close(){settings.open=guide.open=false;}};
}
