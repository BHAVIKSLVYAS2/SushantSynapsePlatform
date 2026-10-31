import {term} from './display-text.mjs';
const names={varna:'Varna',vashya:'Vashya',tara:'Tara',yoni:'Yoni','graha-maitri':'Graha Maitri',gana:'Gana',bhakoot:'Bhakoot',nadi:'Nadi'};
const copy={
 en:{headings:{uncertain:'A few scores need to stay open',mixed:'Some points match, others differ',full:'Full points across all eight factors',partial:'Some points match in this comparison',contrast:'Let’s take a closer look together'},
 full:n=>`Full points for ${n} in this comparison. That’s an encouraging part of the traditional reading; keep building understanding in everyday life too.`,
 zero:n=>`Zero points for ${n} in this rulebook. Read these differences alongside the matching points, and take time to talk about what matters to each of you.`,
 onlyZero:n=>`Zero points for ${n} in this rulebook. Give yourselves time to understand each other and talk through these differences.`,
 partial:n=>`Some points for ${n} here. There’s a mix to explore together rather than a simple yes or no.`,
 uncertain:n=>`${n} can change because the Moon is near a boundary. Leave those scores open for now, even where the other results are settled.`,
 takeaway:'Recommended review',basis:'See the chart basis',review:'Keep the recorded birth details as they are. Review the possible classifications together before choosing one interpretation; do not adjust a birth time to improve the score.',empty:'There are no calculated factors to connect yet.'},
 hi:{headings:{uncertain:'कुछ अंक अभी पक्के नहीं हैं',mixed:'कहीं गुण मिलते हैं, कहीं फर्क है',full:'आठों पहलुओं में पूरे अंक मिले हैं',partial:'इस मिलान में कुछ गुण मिलते हैं',contrast:'आइए, इसे साथ में थोड़ा और समझें'},
 full:n=>`${n} में पूरे अंक मिले हैं। यह पारंपरिक मिलान का अच्छा हिस्सा है; रोज की जिंदगी में भी एक-दूसरे को समझते रहें।`,
 zero:n=>`${n} में इस नियम से शून्य अंक मिले हैं। इन फर्कों को मिले हुए गुणों के साथ देखें और आप दोनों के लिए क्या जरूरी है, उस पर बात करें।`,
 onlyZero:n=>`${n} में इस नियम से शून्य अंक मिले हैं। एक-दूसरे को समझने के लिए समय दें और इन फर्कों पर बात करें।`,
 partial:n=>`${n} में कुछ अंक मिले हैं। इसे सीधी हाँ या ना मानने के बजाय साथ में समझने की जगह है।`,
 uncertain:n=>`${n} के अंक चंद्रमा के सीमा के पास होने से बदल सकते हैं। बाकी नतीजे पक्के हों, तब भी इन अंकों को अभी खुला रखें।`,
 takeaway:'सुझाई गई समीक्षा',basis:'कुंडली का आधार देखें',review:'दर्ज जन्म विवरण वैसे ही रखें। एक अर्थ चुनने से पहले संभावित वर्गीकरण साथ देखें; अंक बढ़ाने के लिए जन्म समय न बदलें।',empty:'अभी जोड़कर समझाने के लिए गणना किए हुए घटक नहीं हैं।'},
 gu:{headings:{uncertain:'થોડા ગુણ હજી પાકા નથી',mixed:'ક્યાંક ગુણ મળે છે, ક્યાંક ફરક છે',full:'આઠેય બાબતમાં પૂરા ગુણ મળ્યા છે',partial:'આ મિલાનમાં થોડા ગુણ મળે છે',contrast:'ચાલો, સાથે થોડું વધુ સમજીએ'},
 full:n=>`${n}માં પૂરા ગુણ મળ્યા છે. આ પરંપરાગત મિલાનનો સારો ભાગ છે; રોજિંદા જીવનમાં પણ એકબીજાને સમજતા રહો.`,
 zero:n=>`${n}માં આ નિયમ મુજબ શૂન્ય ગુણ મળ્યા છે. આ ફરકને મળતા ગુણ સાથે જુઓ અને તમારા બંને માટે શું જરૂરી છે તેની વાત કરો.`,
 onlyZero:n=>`${n}માં આ નિયમ મુજબ શૂન્ય ગુણ મળ્યા છે. એકબીજાને સમજવા સમય આપો અને આ ફરક વિશે વાત કરો.`,
 partial:n=>`${n}માં થોડા ગુણ મળ્યા છે. તેને સીધી હા કે ના માનવાને બદલે સાથે સમજવાની જગ્યા છે.`,
 uncertain:n=>`${n}ના ગુણ ચંદ્ર સીમા પાસે હોવાથી બદલાઈ શકે છે. બાકીના પરિણામ પાકા હોય તો પણ આ ગુણ હજી ખુલ્લા રાખો.`,
 takeaway:'સૂચવેલી સમીક્ષા',basis:'કુંડળીનો આધાર જુઓ',review:'નોંધાયેલી જન્મવિગતો એમ જ રાખો. એક અર્થ પસંદ કરતાં પહેલાં શક્ય વર્ગીકરણ સાથે જુઓ; ગુણ વધારવા જન્મસમય ન બદલો.',empty:'હજી જોડીને સમજાવવા ગણતરી કરેલા ઘટકો નથી.'}
};
export function matchingConnection(result,items,language='en'){
 const lang=copy[language]?language:'en',t=copy[lang];
 const groups={full:[],partial:[],zero:[],uncertain:[]};
 for(const c of result.components)groups[c.score===null?'uncertain':c.score===c.maximum?'full':c.score===0?'zero':'partial'].push(c.id);
 const pattern=groups.uncertain.length?'uncertain':groups.full.length&&groups.zero.length?'mixed':groups.full.length===result.components.length&&result.components.length?'full':groups.partial.length?'partial':'contrast';
 const format=ids=>new Intl.ListFormat({en:'en-IN',hi:'hi-IN',gu:'gu-IN'}[lang],{style:'long',type:'conjunction'}).format(ids.map(id=>term(names[id]??id,lang)));
 const paragraphs=[];for(const state of ['full','partial','zero','uncertain'])if(groups[state].length)paragraphs.push((state==='zero'&&!groups.full.length?t.onlyZero:t[state])(format(groups[state])));
 const focus=items.find(i=>i.state==='zero')??items.find(i=>i.state==='partial')??items[0];
 return {pattern,headline:t.headings[pattern],paragraphs:paragraphs.length?paragraphs:[t.empty],groups,basis:t.basis,takeawayLabel:t.takeaway,
  takeaway:groups.uncertain.length?t.review:focus?.prompt??t.empty,takeawayFactor:groups.uncertain.length?null:focus?.id??null};
}
