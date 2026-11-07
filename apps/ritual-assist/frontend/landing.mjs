// Landing presentation only; guide records, checklist state and calendar calculations
// remain owned by their existing modules.
const artCells={'daily-puja':0,'ganesh-puja':1,'lakshmi-puja':2,satyanarayan:3,'griha-pravesh':4,namkaran:5,vivah:6,havan:7,antyeshti:9,'prarthana-sabha':15,shraddha:8,asthi:10,'day-10':12,'day-11':13,'day-12':14};
export function illustration(id){
 const art=document.createElement('span');art.className='ritual-art';art.setAttribute('aria-hidden','true');
 const cell=artCells[id]??8;art.style.setProperty('--art-x',(cell%4)*100/3+'%');art.style.setProperty('--art-y',Math.floor(cell/4)*100/3+'%');return art;
}
export function categoryIcon(id){
 if(id==='all')return null;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('category-symbol');
 svg.innerHTML=id==='shubh'?'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>':'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>';return svg;
}
const copy={
 en:{label:'RITUAL CALENDAR',title:'Ritual Assist',intro:'Find Ekadashi, Poonam, Amavasya and Chauth, with calendar reminders and a separate Shraddha / Barsi planner.',open:'Vrats & dates',remembrance:'Shraddha / Barsi',guides:'Choose a ritual',count:'guides',notice:'Guidance, not a fixed rule',scope:'Confirm rituals, quantities and dates with your priest or family elder.',placeholder:'e.g. Ganesh, wedding, श्राद्ध'},
 hi:{label:'अनुष्ठान कैलेंडर',title:'रिचुअल असिस्ट',intro:'एकादशी, पूनम, अमावस्या और चौथ देखें, कैलेंडर में याद दिलाएँ और अलग श्राद्ध / बरसी योजना बनाएँ।',open:'व्रत और तिथियाँ',remembrance:'श्राद्ध / बरसी',guides:'अनुष्ठान चुनें',count:'मार्गदर्शिकाएँ',notice:'मार्गदर्शन, कोई निश्चित नियम नहीं',scope:'अनुष्ठान, मात्रा और तिथियाँ पुरोहित या परिवार के बड़े से पक्की करें।',placeholder:'जैसे गणेश, विवाह, श्राद्ध'}
};
export function updateLanding(language,root=document){
 const text=copy[language];for(const [key,value]of Object.entries(text))root.querySelectorAll('[data-landing="'+key+'"]').forEach(el=>el.textContent=value);
 root.querySelector('#search').placeholder=text.placeholder;
}
export function mountLanding(){
 const placeLanguage=()=>{const shell=document.querySelector('.platform-shell'),language=document.querySelector('main .language');if(shell&&language)shell.append(language);};
 placeLanguage();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',placeLanguage,{once:true});
}
