import {shlokas} from './shloki-content.mjs';
import {romanize,gujaratiScript} from './script-aids.mjs';
// Original Gujarati editorial summaries; source text and English/Hindi meanings
// retain the reviewed collection's complete verse groups and references.
const gu={
 'ganesh-dhyana':['ગણેશ ધ્યાન','પાર્વતીપુત્ર ગણપતિને વંદન: હાથીનું મુખ, વિશાળ ઉદર અને કપાળની સુગંધથી આકર્ષાતા ભમરા. શ્લોકમાં શત્રુઓ પર વિજય અને સિદ્ધિ આપનાર તરીકે તેમનું સ્મરણ છે.'],
 durga:['દુર્ગા · નારાયણી સ્તુતિ','સૌ મંગળોમાં મંગળરૂપ, કલ્યાણકારી, શરણ આપનાર ત્રિનેત્રી ગૌરી નારાયણીને નમસ્કાર.'],
 mahalakshmi:['મહાલક્ષ્મી સ્મરણ','શ્રીપીઠ પર બિરાજતાં, દેવોથી પૂજિત અને શંખ, ચક્ર તથા ગદા ધારણ કરતાં મહાલક્ષ્મીને નમસ્કાર.'],
 ramayana:['એકશ્લોકી રામાયણ','રામનું વનગમન, સુવર્ણમૃગ, સીતાહરણ, જટાયુનું મૃત્યુ, સુગ્રીવ સાથે મુલાકાત, વાલીવધ, સમુદ્ર પાર કરવો, લંકાદહન અને રાવણ-કુંભકર્ણવધ દ્વારા રામાયણનું સંક્ષિપ્ત સ્મરણ છે.'],
 'hanuman-kirtan':['હનુમાન · યત્ર યત્ર','જ્યાં રામનું કીર્તન થાય છે ત્યાં જોડેલા હાથ અને અશ્રુભરી આંખો સાથે ઉપસ્થિત રહેતા હનુમાનને વંદન.'],
 'hanuman-manojavam':['હનુમાન · મનોજવમ્','મન જેવી ગતિ, પવન જેવો વેગ, ઇન્દ્રિયો પર વિજય અને ઉત્તમ બુદ્ધિ ધરાવતા વાયુપુત્ર રામદૂત હનુમાનનું શરણ લઈએ છીએ.'],
 'rama-raksha':['રામ · રામાય રામભદ્રાય','રામ, રામભદ્ર, રામચંદ્ર, સર્વના સ્વામી, રઘુનાથ અને સીતાના પતિને નમસ્કાર.'],
 bhagavata:['એકશ્લોકી ભાગવત','કૃષ્ણનો જન્મ અને ગોકુળમાં ઉછેર, પૂતનાવધ, ગોવર્ધન ધારણ, કંસવધ, કુંતીના પુત્રોનું રક્ષણ અને ઉદ્ધવને ઉપદેશ જેવા પ્રસંગોમાં ભાગવતનું સ્મરણ છે.'],
 'gita-four':['ચતુઃશ્લોકી ગીતા · ચાર શ્લોક','કૃષ્ણ કહે છે કે સર્વનું મૂળ તેઓ છે; આ જાણીને જ્ઞાની ભક્તિથી તેમનું ભજન કરે છે. પરસ્પર તેમના વિષે વાત કરતા ભક્તો સંતોષ અને આનંદ પામે છે. પ્રેમથી ભજન કરનારને તેઓ પોતાની પ્રાપ્તિ માટે બુદ્ધિયોગ આપે છે અને કરુણાથી જ્ઞાનના પ્રકાશ દ્વારા અજ્ઞાનનો અંધકાર દૂર કરે છે.'],
 'rama-name':['રામનામ · વિષ્ણુ સહસ્રનામ','રામનામમાં આનંદ પામનાર શિવ પાર્વતીને કહે છે કે રામનામનું સ્મરણ સહસ્રનામ સમાન માનવામાં આવે છે.'],
 mahabharata:['એકશ્લોકી મહાભારત','પાંડવો અને કૌરવોનો જન્મ, લાક્ષાગૃહ, દ્યુત, વનવાસ, વિરાટમાં વસવાટ, શાંતિના પ્રયાસ, યુદ્ધ અને દુર્યોધનના પતન દ્વારા મહાભારતનું સંક્ષિપ્ત સ્મરણ છે.'],
 navagraha:['નવગ્રહ નમસ્કાર','સૂર્ય, ચંદ્ર, મંગળ, બુધ, ગુરુ, શુક્ર, શનિ, રાહુ અને કેતુને નમસ્કાર.'],
 'bhagavata-four':['ચતુઃશ્લોકી ભાગવત · ચાર શ્લોક','સૃષ્ટિ પહેલાં, સૃષ્ટિમાં અને પ્રલય પછી પણ પરમ સત્ય રહે છે. તેનાથી અલગ દેખાતું અને તેમાં ન દેખાતું તત્ત્વ માયા દ્વારા અનુભવાય છે. જેમ તત્ત્વો સર્જિત પદાર્થોમાં પ્રવેશેલા અને અપ્રવેશેલા રહે છે તેમ પરમ સત્ય સર્વમાં વ્યાપ્ત છે. સત્યના જિજ્ઞાસુએ સર્વત્ર અને સર્વકાળે તેની શોધ કરવી જોઈએ.'],
 'surya-gayatri':['સૂર્ય ગાયત્રી','ભાસ્કરનું જ્ઞાન અને મહાન તેજનું ધ્યાન કરીએ; સૂર્ય અમારી બુદ્ધિને પ્રેરણા આપે.'],
 guru:['ગુરુ વંદના','બ્રહ્મા, વિષ્ણુ, મહેશ્વર અને સાક્ષાત્ પરબ્રહ્મના સ્વરૂપે ગુરુને નમસ્કાર.'],
 'ganapati-atharvashirsha':['ગણપતિ અથર્વશીર્ષ · અંશ','તમે જ પ્રત્યક્ષ પરમ તત્ત્વ છો; તમે જ કર્તા, ધારણ કરનાર અને સંહાર કરનાર છો.'],
 narasimha:['નૃસિંહ મંત્ર','ઉગ્ર, વીર, તેજસ્વી અને સર્વદિશામાં મુખ ધરાવતા મહાવિષ્ણુ નૃસિંહને નમસ્કાર; તેઓ ભયાનક હોવા છતાં કલ્યાણકારી અને મૃત્યુના પણ મૃત્યુ છે.']
};
const topics={'ganesh-dhyana':'ganesha',durga:'durga',mahalakshmi:'lakshmi',ramayana:'rama','hanuman-kirtan':'hanuman','hanuman-manojavam':'hanuman','rama-raksha':'rama',bhagavata:'krishna','gita-four':'krishna','rama-name':'rama',mahabharata:'krishna',navagraha:'navagraha','bhagavata-four':'vishnu','surya-gayatri':'navagraha',guru:'guru','ganapati-atharvashirsha':'ganesha',narasimha:'vishnu'};
// Original Gujarati editorial meanings, aligned by source locator rather than paragraph position.
const guVerses={
 'gita-four':{
  '10.8':'કૃષ્ણ પોતાને સર્વની ઉત્પત્તિનું મૂળ કહે છે. આ જાણીને જ્ઞાનીઓ ભાવપૂર્વક તેમનું ભજન કરે છે.',
  '10.9':'તેમનામાં મન અને પ્રાણ પરોવનારા ભક્તો એકબીજાને સમજાવે છે અને તેમની ચર્ચામાં સંતોષ તથા આનંદ પામે છે.',
  '10.10':'સતત પ્રેમપૂર્વક ભજન કરનારાઓને કૃષ્ણ એવો બુદ્ધિયોગ આપે છે જેના દ્વારા તેઓ તેમને પ્રાપ્ત કરે છે.',
  '10.11':'કરુણાથી તેમના અંતરમાં રહીને તેઓ જ્ઞાનના પ્રકાશમાન દીપથી અજ્ઞાનનો અંધકાર દૂર કરે છે.'
 },
 'bhagavata-four':{
  '2.9.33':'ભગવાન સૃષ્ટિ પહેલાં, વર્તમાન જગતમાં અને પ્રલય પછી શેષ રહેતા પોતાના સ્વરૂપનું વર્ણન કરે છે.',
  '2.9.34':'જે પરમ સત્યથી અલગ દેખાય અથવા તેને ઢાંકે, તેને માયા સમજવાનું કહેવાયું છે—જેમ આભાસ કે અંધકાર.',
  '2.9.35':'જેમ મહાભૂતો નાના-મોટા જીવોમાં રહીને પણ તેમનાથી અલગ છે, તેમ ભગવાન સર્વમાં વ્યાપ્ત હોવા છતાં માત્ર તેમના સુધી સીમિત નથી.',
  '2.9.36':'તત્ત્વના જિજ્ઞાસુએ અન્વય અને વ્યતિરેકથી તે સત્યને જાણવું જોઈએ જે દરેક સ્થાને અને દરેક સમયે રહેલું છે.'
 }
};
export const readingAliases={mahamrityunjaya:'mahamrityunjaya',purnamadah:'purnamadah'};
export const duplicateReferences=shlokas.filter(s=>readingAliases[s.id]).map(s=>({id:readingAliases[s.id],source:s.source}));
export const readingMantras=shlokas.filter(s=>!readingAliases[s.id]).map(s=>{
 const text=s.verses.map(v=>v.sanskrit).join('\n\n'),roman=romanize(text);
 const verses=s.verses.map(v=>({...v,meaning:{...v.meaning,gu:v.meaning.gu||guVerses[s.id]?.[v.locator]||(s.verses.length===1?gu[s.id][1]:undefined)}}));
 return {id:'reading-'+s.id,name:s.title.en,text,transliteration:roman,pronunciation:roman,verses,
 names:{en:s.title.en,hi:s.title.hi,gu:gu[s.id][0]},
 meanings:{en:s.verses.map(v=>v.meaning.en).join('\n\n'),hi:s.verses.map(v=>v.meaning.hi).join('\n\n'),gu:gu[s.id][1]},
 aids:{en:roman,hi:text,gu:gujaratiScript(text)},meaning:s.verses.map(v=>v.meaning.en).join('\n\n'),
 source:s.source.title+' · '+s.verses.map(v=>v.locator).join(', '),sourceUrl:s.source.url,
 categories:[['ramayana','bhagavata','gita-four','mahabharata','bhagavata-four','ganapati-atharvashirsha'].includes(s.id)?'scripture':'prayer',...(topics[s.id]==='navagraha'?['navagraha']:[])],topic:topics[s.id],legacyReadingId:s.id,verseCount:s.verses.length,searchTerms:'Shloki shloka shlok collection'+(topics[s.id]==='navagraha'?' navgrah nav grah navagraha':'')};
});
export function migratedReadingId(id){return readingAliases[id]||readingMantras.find(m=>m.legacyReadingId===id)?.id||null;}
