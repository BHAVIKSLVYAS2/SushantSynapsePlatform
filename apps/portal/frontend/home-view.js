// Public home presentation preference; app permissions and account settings stay server-owned.
(()=>{'use strict';const key='synapse-home-view';let view='comfort';try{if(localStorage.getItem(key)==='compact')view='compact';}catch{}document.documentElement.dataset.homeView=view;
 const copy={en:['Home view','Comfort','Compact'],hi:['होम दृश्य','आसान दृश्य','संक्षिप्त'],gu:['હોમ દૃશ્ય','સરળ દૃશ્ય','સંક્ષિપ્ત']};
 const descriptions=[['Larger text · 2 apps per row','Smaller tiles · more apps visible'],['बड़े अक्षर · हर पंक्ति में 2 ऐप','छोटी टाइलें · अधिक ऐप दिखें'],['મોટા અક્ષર · દરેક હરોળમાં 2 ઍપ','નાની ટાઇલ્સ · વધુ ઍપ દેખાય']];
 const purposes={
 'ritual-assist':['Ritual checklists','पूजा की तैयारी','પૂજાની તૈયારી'],
 'moment-studio':['Cards and certificates','कार्ड और प्रमाणपत्र','કાર્ડ અને પ્રમાણપત્ર'],
 'daily-spark':['Puzzles and games','पहेलियाँ और खेल','કોયડા અને રમતો'],
 'satire-arena':['Fictional satire games','काल्पनिक व्यंग्य खेल','કાલ્પનિક વ્યંગ્ય રમતો'],
 'fund-overlap':['Funds and money planning','फंड और बचत की योजना','ફંડ અને બચતનું આયોજન'],
 'decision-wheel':['Pick a random choice','एक विकल्प चुनें','એક વિકલ્પ પસંદ કરો'],
 'qr-maker':['Make QR codes','QR कोड बनाएँ','QR કોડ બનાવો'],
 'photo-resize':['Resize your photos','फ़ोटो का आकार बदलें','ફોટોનું કદ બદલો'],
 'bill-splitter':['Split shared expenses','साझा खर्च बाँटें','સહિયારો ખર્ચ વહેંચો'],
 'news':['Read the news','खबरें पढ़ें','સમાચાર વાંચો'],
 'timetable-lite':['Plan a timetable','समय-सारणी बनाएँ','સમયપત્રક બનાવો'],
 'team-mixer':['Make random teams','टीमें बनाएँ','ટીમો બનાવો'],
 'focus':['Tasks and focus timer','काम और फोकस टाइमर','કામ અને ફોકસ ટાઇમર'],
 'rozhisab':['Household expense tracker','घर के खर्च का हिसाब','ઘરના ખર્ચનો હિસાબ'],
 'digital-samaj':['Community workspace','समुदाय का कार्यक्षेत्र','સમુદાયનું કાર્યસ્થળ'],
 'advocate':['Chamber workspace','चैंबर का कार्यक्षेत्र','ચેમ્બરનું કાર્યસ્થળ'],
 'tournament-lite':['Manage tournaments','टूर्नामेंट प्रबंधन','ટુર્નામેન્ટ સંચાલન'],
 'batchfee-lite':['Manage class fees','कक्षाओं की फीस','વર્ગોની ફી'],
 'pandit-booking':['Ceremony bookings','पूजा की बुकिंग','પૂજાનું બુકિંગ']};
 function language(){return {en:0,hi:1,gu:2}[window.SynapseLanguage?.get()||document.documentElement.lang]||0;}
 function paint(){document.documentElement.dataset.homeView=view;const l=language(),labels=copy[Object.keys(copy)[l]];document.querySelectorAll('.home-view-switch').forEach(control=>{const summary=control.querySelector('summary');summary.querySelector('.home-view-label').textContent=labels[view==='comfort'?1:2];summary.setAttribute('aria-label',labels[0]+': '+labels[view==='comfort'?1:2]);control.querySelector('.home-view-options').setAttribute('aria-label',labels[0]);control.querySelectorAll('[data-home-layout]').forEach((button,i)=>{button.setAttribute('aria-pressed',String(button.dataset.homeLayout===view));button.querySelector('strong').textContent=labels[i+1];button.querySelector('small').textContent=descriptions[l][i];});});}
 function mount(){const home=document.querySelector('.public-home'),toolbar=home?.querySelector('.home-discovery-toolbar');if(!toolbar)return;let control=toolbar.querySelector('.home-view-switch');if(!control){control=document.createElement('details');control.className='home-view-switch';control.setAttribute('translate','no');const summary=document.createElement('summary');summary.innerHTML='<span class="home-view-icon" aria-hidden="true"></span><span class="home-view-label"></span><svg class="home-view-chevron" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';control.append(summary);const choices=document.createElement('div');choices.className='home-view-options';choices.setAttribute('role','group');for(const mode of ['comfort','compact']){const button=document.createElement('button');button.type='button';button.dataset.homeLayout=mode;button.innerHTML='<strong></strong><small></small><span class="home-view-check" aria-hidden="true">✓</span>';button.onclick=()=>{view=mode;try{localStorage.setItem(key,view);}catch{}paint();control.open=false;summary.focus({preventScroll:true});};choices.append(button);}control.append(choices);control.addEventListener('toggle',()=>{if(control.open){const filter=toolbar.querySelector('.home-filter-menu');if(filter)filter.open=false;}});control.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();control.open=false;summary.focus({preventScroll:true});}});toolbar.append(control);}const l=language();
  for(const card of home.querySelectorAll('.compact-app')){const words=purposes[card.dataset.appId];if(!words)continue;let purpose=card.querySelector('.comfort-app-purpose');if(!purpose){purpose=document.createElement('span');purpose.className='comfort-app-purpose';purpose.setAttribute('translate','no');card.append(purpose);}purpose.textContent=words[l];}paint();
 }
 window.SynapseHomeView={get:()=>view,mount};window.addEventListener('synapse-catalogue-change',mount);window.addEventListener('synapse-language-change',mount);window.addEventListener('storage',event=>{if(event.key===key){view=event.newValue==='compact'?'compact':'comfort';paint();}});document.addEventListener('DOMContentLoaded',mount,{once:true});
 document.addEventListener('pointerdown',event=>{document.querySelectorAll('.home-view-switch[open]').forEach(control=>{if(!control.contains(event.target))control.open=false;});});
})();
