import {term} from './display-text.mjs';
const names={varna:'Varna',vashya:'Vashya',tara:'Tara',yoni:'Yoni','graha-maitri':'Graha Maitri',gana:'Gana',bhakoot:'Bhakoot',nadi:'Nadi'};
const copy={
 en:{headings:{uncertain:'One chapter is still open',mixed:'Shared notes, with different chords to explore',full:'The tables agree; now bring your own story',partial:'A comparison with shades, not one simple label',contrast:'Start with the differences, without writing the ending'},
 full:n=>`${n} receive full points in this comparison. These are the places where the selected traditional tables agree.`,
 zero:n=>`${n} receive no points. Read that contrast alongside the agreements, rather than letting either side tell the whole story.`,
 onlyZero:n=>`${n} receive no points under the selected rules. This identifies table differences to examine; it does not establish how the two of you will get along.`,
 partial:n=>`${n} receive partial points: there is some agreement within those rules, rather than an all-or-nothing result.`,
 uncertain:n=>`${n} can change near a Moon classification boundary. Keep these parts of the reading open; the fixed results do not settle the uncertain ones.`,
 nadi:'Nadi here compares symbolic birth-star groups. Its points are not evidence about health, heredity or having children.',
 takeaway:'One conversation to have',basis:'See the chart basis',review:'Keep the recorded birth details as they are. Review the possible classifications together before choosing one interpretation; do not adjust a birth time to improve the score.',empty:'There are no calculated factors to connect yet.'},
 hi:{headings:{uncertain:'कहानी का एक अध्याय अभी खुला है',mixed:'कुछ सुर मिलते हैं, कुछ को साथ समझना है',full:'सारणियाँ सहमत हैं, अब अपनी कहानी जोड़ें',partial:'एक ठप्पा नहीं, कई रंगों वाला मिलान',contrast:'अंतर समझें, कहानी का अंत अभी न लिखें'},
 full:n=>`${n} को इस मिलान में पूरे अंक मिले हैं। चुनी गई पारंपरिक सारणियों में ये सहमति के हिस्से हैं।`,
 zero:n=>`${n} को शून्य अंक मिले हैं। इस अंतर को सहमति वाले हिस्सों के साथ पढ़ें; किसी एक पहलू को पूरी कहानी न बनने दें।`,
 onlyZero:n=>`${n} को चुने गए नियमों में शून्य अंक मिले हैं। इससे सारणी के अंतर सामने आते हैं, यह तय नहीं होता कि असल जिंदगी में आपकी कैसी जमेगी।`,
 partial:n=>`${n} को आंशिक अंक मिले हैं: इन नियमों में कुछ सहमति है, केवल हाँ या नहीं वाला नतीजा नहीं।`,
 uncertain:n=>`${n} के अंक चंद्र वर्गीकरण की सीमा के पास बदल सकते हैं। इन हिस्सों को खुला रखें; स्थिर नतीजे अनिश्चित हिस्सों का फैसला नहीं करते।`,
 nadi:'यहाँ नाड़ी प्रतीकात्मक जन्म-नक्षत्र समूहों की तुलना है। इसके अंक स्वास्थ्य, वंशानुगत स्थितियों या संतान के बारे में प्रमाण नहीं हैं।',
 takeaway:'साथ करने वाली एक बातचीत',basis:'कुंडली का आधार देखें',review:'दर्ज जन्म विवरण वैसे ही रखें। एक अर्थ चुनने से पहले संभावित वर्गीकरण साथ देखें; अंक बढ़ाने के लिए जन्म समय न बदलें।',empty:'अभी जोड़कर समझाने के लिए गणना किए हुए घटक नहीं हैं।'},
 gu:{headings:{uncertain:'વાર્તાનું એક પ્રકરણ હજી ખુલ્લું છે',mixed:'કેટલાક સૂર મળે છે, કેટલાક સાથે સમજવાના છે',full:'કોષ્ટકો સહમત છે, હવે પોતાની વાર્તા ઉમેરો',partial:'એક લેબલ નહીં, અનેક રંગવાળું મિલાન',contrast:'તફાવત સમજો, વાર્તાનો અંત હજી ન લખો'},
 full:n=>`${n}ને આ મિલાનમાં પૂરા ગુણ મળ્યા છે. પસંદ કરેલા પરંપરાગત કોષ્ટકોમાં આ સહમતિના ભાગ છે.`,
 zero:n=>`${n}ને શૂન્ય ગુણ મળ્યા છે. આ તફાવતને સહમતિના ભાગ સાથે વાંચો; કોઈ એક પાસાને આખી વાર્તા ન બનવા દો.`,
 onlyZero:n=>`${n}ને પસંદ કરેલા નિયમોમાં શૂન્ય ગુણ મળ્યા છે. તે કોષ્ટકના તફાવત બતાવે છે, સાચા જીવનમાં તમારો મેળ કેવો રહેશે તે નક્કી કરતું નથી.`,
 partial:n=>`${n}ને આંશિક ગુણ મળ્યા છે: આ નિયમોમાં થોડી સહમતિ છે, માત્ર હા કે ના જેવું પરિણામ નથી.`,
 uncertain:n=>`${n}ના ગુણ ચંદ્રના વર્ગીકરણની સીમા પાસે બદલાઈ શકે છે. આ ભાગ ખુલ્લા રાખો; સ્થિર પરિણામો અનિશ્ચિત ભાગનો નિર્ણય કરતા નથી.`,
 nadi:'અહીં નાડી પ્રતીકાત્મક જન્મ-નક્ષત્ર જૂથોની સરખામણી છે. તેના ગુણ આરોગ્ય, વારસાગત સ્થિતિ કે સંતાન વિશે પુરાવો નથી.',
 takeaway:'સાથે કરવાની એક વાત',basis:'કુંડળીનો આધાર જુઓ',review:'નોંધાયેલી જન્મવિગતો એમ જ રાખો. એક અર્થ પસંદ કરતાં પહેલાં શક્ય વર્ગીકરણ સાથે જુઓ; ગુણ વધારવા જન્મસમય ન બદલો.',empty:'હજી જોડીને સમજાવવા ગણતરી કરેલા ઘટકો નથી.'}
};
export function matchingConnection(result,items,language='en'){
 const lang=copy[language]?language:'en',t=copy[lang];
 const groups={full:[],partial:[],zero:[],uncertain:[]};
 for(const c of result.components)groups[c.score===null?'uncertain':c.score===c.maximum?'full':c.score===0?'zero':'partial'].push(c.id);
 const pattern=groups.uncertain.length?'uncertain':groups.full.length&&groups.zero.length?'mixed':groups.full.length===result.components.length&&result.components.length?'full':groups.partial.length?'partial':'contrast';
 const format=ids=>new Intl.ListFormat({en:'en-IN',hi:'hi-IN',gu:'gu-IN'}[lang],{style:'long',type:'conjunction'}).format(ids.map(id=>term(names[id]??id,lang)));
 const paragraphs=[];for(const state of ['full','partial','zero','uncertain'])if(groups[state].length)paragraphs.push((state==='zero'&&!groups.full.length?t.onlyZero:t[state])(format(groups[state])));
 if(groups.zero.includes('nadi'))paragraphs.push(t.nadi);
 const focus=items.find(i=>i.state==='zero')??items.find(i=>i.state==='partial')??items[0];
 return {pattern,headline:t.headings[pattern],paragraphs:paragraphs.length?paragraphs:[t.empty],groups,basis:t.basis,takeawayLabel:t.takeaway,
  takeaway:groups.uncertain.length?t.review:focus?.prompt??t.empty,takeawayFactor:groups.uncertain.length?null:focus?.id??null};
}
