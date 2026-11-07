// Only complete authored UI message shapes match. Captured values are opaque:
// names, choices, amounts and identifiers are never translated recursively.
import {publicInterfaceCopy} from './public-interface-copy.mjs';
const rows=`
{n} apps|{n} ऐप|{n} એપ
Plus {n} other repeated options.|साथ ही {n} और दोहराए विकल्प।|વધુ {n} ફરી આવેલા વિકલ્પો.
{n} guides|{n} मार्गदर्शिकाएँ|{n} માર્ગદર્શિકા
{n} SECONDS|{n} सेकंड|{n} સેકન્ડ
{n} EQUAL CHOICES|{n} समान-संभावना विकल्प|{n} સરખી શક્યતાવાળા વિકલ્પ
Person {n}|व्यक्ति {n}|વ્યક્તિ {n}
Total: {amount}|कुल: {amount}|કુલ: {amount}
Shared by {names}|इनमें साझा: {names}|આ લોકો વચ્ચે વહેંચાયેલું: {names}
Remove {names} and their expenses?|{names} और उनके खर्च हटाएँ?|{names} અને તેમના ખર્ચ કાઢવા છે?
{n} checks|{n} जाँच|{n} તપાસ
{n} check|{n} जाँच|{n} તપાસ
{n} right place · {m} wrong place|{n} सही स्थान · {m} गलत स्थान|{n} સાચી જગ્યા · {m} ખોટી જગ્યા
{n} / 5 clues match|{n} / 5 संकेत मिलते हैं|{n} / 5 સંકેત મળે છે
{n} moves|{n} कदम|{n} પગલાં
{n} moves · best possible {m}|{n} कदम · न्यूनतम संभव {m}|{n} પગલાં · ઓછામાં ઓછાં શક્ય {m}
{n} move · best possible {m}|{n} कदम · न्यूनतम संभव {m}|{n} પગલું · ઓછામાં ઓછાં શક્ય {m}
Level {n} / 3 · {m} × {k}|स्तर {n} / 3 · {m} × {k}|સ્તર {n} / 3 · {m} × {k}
{n} lights still on.|{n} बत्तियाँ अभी जल रही हैं।|{n} લાઇટ હજી ચાલુ છે.
All lights off! Level {n} cleared in {m} moves.|सभी बत्तियाँ बुझ गईं! स्तर {n}, {m} कदम में पूरा।|બધી લાઇટ બંધ! સ્તર {n}, {m} પગલાંમાં પૂરું.
Try row {n}, column {m}. This is one move in a shortest solution from here.|पंक्ति {n}, कॉलम {m} आज़माएँ। यह यहाँ से सबसे छोटे हल का एक कदम है।|પંક્તિ {n}, કૉલમ {m} અજમાવો. અહીંથી સૌથી ટૂંકા ઉકેલનું આ એક પગલું છે.
{n} / 6 pairs|{n} / 6 जोड़ियाँ|{n} / 6 જોડીઓ
Six pairs in {n} moves. No clock to beat.|छह जोड़ियाँ, {n} कदम में। समय सीमा नहीं।|છ જોડીઓ, {n} પગલાંમાં. સમયમર્યાદા નથી.
{n} points|{n} अंक|{n} ગુણ
{n}s|{n} सेकंड|{n} સેકન્ડ
{n} / 5 catches - x{m}|{n} / 5 चाय - x{m}|{n} / 5 ચા - x{m}
{n} of {m} items arranged|{m} में से {n} वस्तुएँ तैयार|{m}માંથી {n} વસ્તુઓ તૈયાર
{n} classes · {m} teachers · {k} weekly lessons|{n} कक्षाएँ · {m} शिक्षक · {k} साप्ताहिक पाठ|{n} વર્ગ · {m} શિક્ષક · {k} સાપ્તાહિક પાઠ
{n} of 8 funds selected|8 में से {n} फ़ंड चुने|8માંથી {n} ફંડ પસંદ કર્યાં
Selected date · {date}|चुनी तारीख · {date}|પસંદ કરેલી તારીખ · {date}
No saved newspaper for {date}.|{date} का अख़बार सहेजा नहीं है।|{date}નું અખબાર સાચવેલું નથી.
You made {amount}. Undo a move or start again.|आपने {amount} बनाया। पिछला कदम वापस लें या फिर शुरू करें।|તમે {amount} બનાવ્યા. છેલ્લું પગલું પાછું લો અથવા ફરી શરૂ કરો.
Picksy picked: {names}.|Picksy ने चुना: {names}।|Picksyએ પસંદ કર્યું: {names}.
Solution revealed: {code}.|हल दिखाया गया: {code}।|ઉકેલ બતાવ્યો: {code}.
The solution: {code}|हल: {code}|ઉકેલ: {code}
Recheck clue {numbers}. Your code must fit all five clues.|संकेत {numbers} फिर जाँचें। कोड पाँचों संकेतों पर सही होना चाहिए।|સંકેત {numbers} ફરી તપાસો. કોડ પાંચેય સંકેતોને મળવો જોઈએ.
Recheck clues {numbers}. Your code must fit all five clues.|संकेत {numbers} फिर जाँचें। कोड पाँचों संकेतों पर सही होना चाहिए।|સંકેત {numbers} ફરી તપાસો. કોડ પાંચેય સંકેતોને મળવો જોઈએ.
You already checked {code}. Compare the highlighted clues before trying another code.|आप {code} जाँच चुके हैं। दूसरा कोड डालने से पहले चिह्नित संकेत मिलाएँ।|તમે {code} તપાસી ચૂક્યા છો. બીજો કોડ અજમાવતાં પહેલાં ચિહ્નિત સંકેતો સરખાવો.
Number {n}: {amount}|संख्या {n}: {amount}|અંક {n}: {amount}
Clue {n}: {code}|संकेत {n}: {code}|સંકેત {n}: {code}
Row {n}, column {m}: light on|पंक्ति {n}, कॉलम {m}: बत्ती जली है|પંક્તિ {n}, કૉલમ {m}: લાઇટ ચાલુ છે
Row {n}, column {m}: light off|पंक्ति {n}, कॉलम {m}: बत्ती बुझी है|પંક્તિ {n}, કૉલમ {m}: લાઇટ બંધ છે
Digit {n}: unmarked|अंक {n}: बिना निशान|અંક {n}: નિશાન વિના
Digit {n}: ruled out|अंक {n}: बाहर|અંક {n}: બાકાત
Digit {n}: maybe|अंक {n}: संभव|અંક {n}: શક્ય
Card {n}: face down|पत्ता {n}: उल्टा|પત્તું {n}: ઊંધું
Round {n}|दौर {n}|રાઉન્ડ {n}
{n} comparisons|{n} तुलनाएँ|{n} સરખામણીઓ
Your choice after {n} comparisons.|{n} तुलनाओं के बाद आपकी पसंद।|{n} સરખામણી પછી તમારી પસંદ.
Your favourite is {names}.|आपकी पसंद है {names}।|તમારી પસંદ છે {names}.
Chai caught - +{n}|चाय पकड़ी - +{n}|ચા પકડી - +{n}
You entered {n} option. Enter between 2 and 30 options, one per line. Blank lines are ignored.|आपने {n} विकल्प दिया। 2 से 30 विकल्प दें, हर पंक्ति में एक। खाली पंक्तियाँ नहीं गिनी जातीं।|તમે {n} વિકલ્પ આપ્યો. 2થી 30 વિકલ્પ આપો, દરેક લીટીમાં એક. ખાલી લીટીઓ ગણાતી નથી.
You entered {n} options. Enter between 2 and 30 options, one per line. Blank lines are ignored.|आपने {n} विकल्प दिए। 2 से 30 विकल्प दें, हर पंक्ति में एक। खाली पंक्तियाँ नहीं गिनी जातीं।|તમે {n} વિકલ્પ આપ્યાં. 2થી 30 વિકલ્પ આપો, દરેક લીટીમાં એક. ખાલી લીટીઓ ગણાતી નથી.
Line {n} has {m} characters. Keep each option to 60 characters or fewer.|पंक्ति {n} में {m} अक्षर हैं। हर विकल्प अधिकतम 60 अक्षर का रखें।|લીટી {n}માં {m} અક્ષર છે. દરેક વિકલ્પ વધુમાં વધુ 60 અક્ષરનો રાખો.
Repeated option: {detail}. Remove or rename repeats. Each unique option gets one equal slice.|दोहराया विकल्प: {detail}। दोहराव हटाएँ या नाम बदलें। हर अलग विकल्प का समान हिस्सा है।|ફરી આવેલો વિકલ્પ: {detail}. પુનરાવર્તન કાઢો કે નામ બદલો. દરેક જુદા વિકલ્પનો સરખો ભાગ છે.
Repeated options: {detail}. Remove or rename repeats. Each unique option gets one equal slice.|दोहराए विकल्प: {detail}। दोहराव हटाएँ या नाम बदलें। हर अलग विकल्प का समान हिस्सा है।|ફરી આવેલા વિકલ્પો: {detail}. પુનરાવર્તન કાઢો કે નામ બદલો. દરેક જુદા વિકલ્પનો સરખો ભાગ છે.
Download {format}|{format} डाउनलोड करें|{format} ડાઉનલોડ કરો
{n} × {m} pixels. Choose your target, review any crop, then resize.|{n} × {m} पिक्सेल। लक्ष्य चुनें, क्रॉप जाँचें और आकार बदलें।|{n} × {m} પિક્સેલ. લક્ષ્ય પસંદ કરો, ક્રોપ તપાસો અને કદ બદલો.
Original: {n} × {m} px · {amount} KB|मूल: {n} × {m} पिक्सेल · {amount} KB|મૂળ: {n} × {m} પિક્સેલ · {amount} KB
Before: {amount} KB → After: {after} KB · {n} × {m} px|पहले: {amount} KB → बाद: {after} KB · {n} × {m} पिक्सेल|પહેલાં: {amount} KB → પછી: {after} KB · {n} × {m} પિક્સેલ
At least {amount} bytes|कम से कम {amount} बाइट|ઓછામાં ઓછા {amount} બાઇટ
{n} × {m} px (exact)|{n} × {m} पिक्सेल (सटीक)|{n} × {m} પિક્સેલ (ચોક્કસ)
{n} × {m} px (within maximum)|{n} × {m} पिक्सेल (अधिकतम के भीतर)|{n} × {m} પિક્સેલ (મહત્તમની અંદર)
PNG estimate before any size reduction: {amount} KB. Final compression and size checks run below.|आकार घटाने से पहले PNG अनुमान: {amount} KB। अंतिम संपीड़न और आकार की जाँच नीचे होगी।|કદ ઘટાડતાં પહેલાં PNGનો અંદાજ: {amount} KB. અંતિમ સંકોચન અને કદની તપાસ નીચે થશે.
Estimate at 85% quality: {amount} KB. Final compression and size checks run below.|85% गुणवत्ता पर अनुमान: {amount} KB। अंतिम संपीड़न और आकार की जाँच नीचे होगी।|85% ગુણવત્તાએ અંદાજ: {amount} KB. અંતિમ સંકોચન અને કદની તપાસ નીચે થશે.
Try combining {expression} first.|पहले {expression} की क्रिया आज़माएँ।|પહેલાં {expression}ની ક્રિયા અજમાવો.
First move: {expression}. Use Show solution for the full route.|पहला कदम: {expression}। पूरा रास्ता देखने के लिए हल दिखाएँ चुनें।|પહેલું પગલું: {expression}. આખો રસ્તો જોવા ઉકેલ બતાવો પસંદ કરો.
{level} puzzle complete|{level} पहेली पूरी|{level} કોયડો પૂરો
{names} removed. {n} options remain.|{names} हटाया गया। {n} विकल्प बाकी हैं।|{names} કાઢ્યું. {n} વિકલ્પ બાકી છે.
{names} removed. Only {remaining} remains. Add more options or choose a starter list to spin again.|{names} हटाया गया। केवल {remaining} बाकी है। फिर घुमाने के लिए विकल्प जोड़ें या शुरुआती सूची चुनें।|{names} કાઢ્યું. માત્ર {remaining} બાકી છે. ફરી ફેરવવા વિકલ્પ ઉમેરો કે શરૂઆતની યાદી પસંદ કરો.
{n} points · Chief Chai Officer|{n} अंक · मुख्य चाय अधिकारी|{n} ગુણ · મુખ્ય ચા અધિકારી
{n} points · Chaos survivor|{n} अंक · अफ़रातफ़री से बचे|{n} ગુણ · દોડધામમાંથી બચ્યા
Source checked {date}. Confirm the latest notice before applying.|स्रोत जाँच की तारीख {date}। आवेदन से पहले नवीनतम सूचना देखें।|સ્રોતની તપાસની તારીખ {date}. અરજી કરતાં પહેલાં નવીનતમ સૂચના જુઓ.
{n} chai caught · {m} invites dodged · {k} invites hit · {a} alarms silenced · {b} alarms missed. Classic pace.|{n} चाय पकड़ी · {m} न्योते से बचे · {k} लगे · {a} अलार्म बंद · {b} छूटे। सामान्य गति।|{n} ચા પકડી · {m} આમંત્રણથી બચ્યા · {k} લાગ્યાં · {a} એલાર્મ બંધ · {b} છૂટ્યાં. સામાન્ય ગતિ.
{n} chai caught · {m} invites dodged · {k} invites hit · {a} alarms silenced · {b} alarms missed. Calmer pace.|{n} चाय पकड़ी · {m} न्योते से बचे · {k} लगे · {a} अलार्म बंद · {b} छूटे। धीमी गति।|{n} ચા પકડી · {m} આમંત્રણથી બચ્યા · {k} લાગ્યાં · {a} એલાર્મ બંધ · {b} છૂટ્યાં. ધીમી ગતિ.
`;
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function compile(text){
 const names=[],parts=text.split(/(\{[a-z]+\})/);let expression='';
 for(const part of parts){if(/^\{[a-z]+\}$/.test(part)){const name=part.slice(1,-1);names.push(name);expression+=['n','m','k'].includes(name)?'(\\d+)':name==='date'?'(\\d{4}-\\d{2}-\\d{2})':name==='code'?'(\\d{3})':'(.+?)';}else expression+=escape(part);}
 return {pattern:new RegExp('^'+expression+'$','u'),prefix:parts[0],names};
}
const templates=rows.trim().split('\n').map(row=>{const forms=row.split('|');if(forms.length!==3)throw Error('Invalid interface template');return {forms,matches:forms.map(compile)};});
export function localizePublicMessage(value,locale){
 const target={en:0,hi:1,gu:2}[locale];if(target===undefined)return value;
 for(const {forms,matches}of templates)for(const {pattern,prefix,names}of matches){if(!value.startsWith(prefix))continue;const found=pattern.exec(value);if(!found)continue;const values=Object.fromEntries(names.map((name,i)=>[name,found[i+1]]));if(values.level){const entry=Object.entries(publicInterfaceCopy).find(([source,locales])=>['Warm-up','Challenge','Expert','Daily'].includes(source)&&(source===values.level||locales.includes(values.level)));if(entry)values.level=target?entry[1][target-1]:entry[0];}return forms[target].replace(/\{([a-z]+)\}/g,(_,name)=>values[name]);}
 return value;
}
