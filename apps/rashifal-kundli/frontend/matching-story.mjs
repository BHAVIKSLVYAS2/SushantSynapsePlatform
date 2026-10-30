import {matchingConnection} from './matching-connection.mjs';
import {term} from './display-text.mjs';
import {bodyName} from './locale.mjs';
export const matchingReadingVersion='planet-grounded-matching-2';
const ids=['varna','vashya','tara','yoni','graha-maitri','gana','bhakoot','nadi'];
// Original explanations of the selected rulebook, not borrowed predictions.
const copy={
 en:{
  title:'Your traditional matching reading',
  note:'This Ashtakoota comparison uses the two calculated Moon signs and birth stars. The eight factors describe different traditional checks; the total is not a complete assessment of both birth charts.',
  titles:['Varna: symbolic sign groups','Vashya: sign-class comparison','Tara: birth-star relationship','Yoni: traditional star symbols','Graha Maitri: planetary friendship','Gana: birth-star groups','Bhakoot: Moon-sign relationship','Nadi: birth-star classification'],
  topics:[
   'Varna compares symbolic Moon-sign group indices in the declared A/B order. These groups do not identify caste, social standing or personal worth.',
   'Vashya compares the Moon signs using the selected four-class table. Other schools use different classes or split some signs at 15 degrees, which can change the points.',
   'Tara counts between the two birth stars in both directions and reduces each count to a class from 1 to 9. Each direction outside classes 3, 5 and 7 receives 1.5 points.',
   'Yoni compares traditional animal symbols assigned to the birth stars. The points follow the selected printed table; they do not measure a person’s sexual behaviour or consent.',
   'Graha Maitri compares the natural-friendship categories of the two Moon-sign rulers. It does not compare every planet in both charts or assess temporary friendship.',
   'Gana compares the traditional birth-star groups in the declared A/B order. The symbolic names are not labels for either person’s character.',
   'Bhakoot compares the distances between the two Moon signs. The selected rule gives zero points for the 2/12, 5/9 and 6/8 pairs, and seven for the other pairs.',
   'Nadi compares three symbolic birth-star groups. Different groups receive eight points; the same group receives zero. This is not evidence about health, heredity or fertility.'
  ],
  outcomes:{full:'This factor receives all available points under the selected rule.',partial:'This factor receives some of the available points under the selected rule.',zero:'This factor receives no points under the selected rule; review it alongside the other factors.',uncertain:'The Moon lies near a classification boundary, so this factor has more than one possible score. Read the range and possible factors rather than choosing one fixed result.'},
  pair:(a,b)=>'Person A: '+a+'. Person B: '+b+'.',
  rulers:(a,b)=>'Person A’s Moon-sign ruler is '+a+'; Person B’s is '+b+'.',
  counts:(a,b)=>'The reduced Tara classes are '+a+' from A to B and '+b+' from B to A.',
  distance:(a,b)=>'Counting inclusively, B’s Moon sign is '+a+' from A’s, and A’s is '+b+' from B’s.',
  varying:'The underlying classifications also have multiple possibilities. They are listed under the chart basis; no single classification is treated as certain.',
  exceptions:'Cancellation rules and regional exceptions have not been evaluated.',
  review:'Review the calculated factors in the stated A/B order and consider the complete charts before drawing a conclusion.',
  limit:'This comparison does not yet combine seventh-house rulers, Venus, Mars placements, Navamsa, aspects or both people’s Dasha periods into a full-chart relationship interpretation.'
 },
 hi:{
  title:'आपका पारंपरिक गुण मिलान',
  note:'यह अष्टकूट मिलान दोनों की गणना की गई चंद्र राशियों और जन्म नक्षत्रों पर आधारित है। आठ घटक अलग-अलग पारंपरिक जाँच हैं; कुल अंक दोनों जन्म कुंडलियों का संपूर्ण आकलन नहीं हैं।',
  titles:['वर्ण: प्रतीकात्मक राशि समूह','वश्य: राशि वर्गों की तुलना','तारा: जन्म नक्षत्रों का संबंध','योनि: पारंपरिक नक्षत्र प्रतीक','ग्रह मैत्री: राशि स्वामियों का संबंध','गण: जन्म नक्षत्र समूह','भकूट: चंद्र राशियों का संबंध','नाड़ी: जन्म नक्षत्र का वर्गीकरण'],
  topics:[
   'वर्ण में चंद्र राशि के प्रतीकात्मक समूहों की तुलना तय A/B क्रम में होती है। इनसे जाति, सामाजिक स्थिति या व्यक्ति का मूल्य तय नहीं होता।',
   'वश्य में चुनी गई चार-वर्ग सारणी से चंद्र राशियों की तुलना होती है। दूसरी परंपराओं में वर्ग या 15 अंश पर राशि का विभाजन अलग होने से अंक बदल सकते हैं।',
   'तारा में दोनों जन्म नक्षत्रों के बीच दोनों दिशाओं में गिनती करके उसे 1 से 9 के वर्ग में बदला जाता है। 3, 5 और 7 के अलावा हर दिशा को 1.5 अंक मिलते हैं।',
   'योनि में जन्म नक्षत्रों के पारंपरिक पशु प्रतीकों की तुलना होती है। अंक चुनी गई मुद्रित सारणी पर आधारित हैं; वे यौन व्यवहार या सहमति का माप नहीं हैं।',
   'ग्रह मैत्री में दोनों चंद्र राशियों के स्वामी ग्रहों की नैसर्गिक मैत्री की तुलना होती है। इसमें दोनों कुंडलियों के सभी ग्रह या तात्कालिक मैत्री नहीं देखी जाती।',
   'गण में जन्म नक्षत्रों के पारंपरिक समूहों की तुलना तय A/B क्रम में होती है। प्रतीकात्मक नाम किसी व्यक्ति के चरित्र का निर्णय नहीं हैं।',
   'भकूट में दोनों चंद्र राशियों की आपसी दूरी देखी जाती है। चुने गए नियम में 2/12, 5/9 और 6/8 के संबंध को शून्य और अन्य संबंधों को सात अंक मिलते हैं।',
   'नाड़ी में जन्म नक्षत्र के तीन प्रतीकात्मक समूहों की तुलना होती है। अलग समूहों को आठ और समान समूह को शून्य अंक मिलते हैं। यह स्वास्थ्य, वंशानुगत स्थितियों या संतान का प्रमाण नहीं है।'
  ],
  outcomes:{full:'चुने गए नियम में इस घटक को पूरे उपलब्ध अंक मिले हैं।',partial:'चुने गए नियम में इस घटक को कुछ उपलब्ध अंक मिले हैं।',zero:'चुने गए नियम में इस घटक को शून्य अंक मिले हैं; इसे अन्य घटकों के साथ देखें।',uncertain:'चंद्रमा वर्गीकरण की सीमा के पास है, इसलिए इस घटक के एक से अधिक संभावित अंक हैं। एक निश्चित परिणाम चुनने के बजाय अंक सीमा और संभावित घटक देखें।'},
  pair:(a,b)=>'व्यक्ति A: '+a+'। व्यक्ति B: '+b+'।',
  rulers:(a,b)=>'व्यक्ति A की चंद्र राशि के स्वामी '+a+' और व्यक्ति B के '+b+' हैं।',
  counts:(a,b)=>'तारा के घटाए गए वर्ग A से B की ओर '+a+' और B से A की ओर '+b+' हैं।',
  distance:(a,b)=>'आरंभ की राशि सहित गिनने पर B की चंद्र राशि A से '+a+'वें और A की चंद्र राशि B से '+b+'वें स्थान पर है।',
  varying:'मूल वर्गीकरण की भी एक से अधिक संभावनाएँ हैं। उन्हें कुंडली के आधार में देखें; किसी एक को निश्चित नहीं माना गया है।',
  exceptions:'दोष निवारण और क्षेत्रीय अपवादों की जाँच नहीं हुई है।',
  review:'तय A/B क्रम में गणना के घटक देखें और निष्कर्ष से पहले दोनों संपूर्ण कुंडलियों पर विचार करें।',
  limit:'इस मिलान में अभी सप्तम भाव के स्वामी, शुक्र, मंगल की स्थिति, नवांश, दृष्टियाँ और दोनों की दशाएँ जोड़कर संपूर्ण संबंध व्याख्या नहीं की जाती।'
 },
 gu:{
  title:'તમારું પરંપરાગત ગુણ મિલાન',
  note:'આ અષ્ટકૂટ મિલાન બંનેની ગણેલી ચંદ્ર રાશિ અને જન્મ નક્ષત્ર પર આધારિત છે. આઠ ઘટકો અલગ પરંપરાગત તપાસ છે; કુલ ગુણ બંને જન્મ કુંડળીનું સંપૂર્ણ મૂલ્યાંકન નથી.',
  titles:['વર્ણ: પ્રતીકાત્મક રાશિ જૂથ','વશ્ય: રાશિ વર્ગોની સરખામણી','તારા: જન્મ નક્ષત્રોનો સંબંધ','યોનિ: પરંપરાગત નક્ષત્ર પ્રતીક','ગ્રહ મૈત્રી: રાશિ સ્વામીઓનો સંબંધ','ગણ: જન્મ નક્ષત્ર જૂથ','ભકૂટ: ચંદ્ર રાશિઓનો સંબંધ','નાડી: જન્મ નક્ષત્રનું વર્ગીકરણ'],
  topics:[
   'વર્ણમાં ચંદ્ર રાશિના પ્રતીકાત્મક જૂથોની સરખામણી નક્કી કરેલા A/B ક્રમમાં થાય છે. તેનાથી જાતિ, સામાજિક સ્થાન કે વ્યક્તિનું મૂલ્ય નક્કી થતું નથી.',
   'વશ્યમાં પસંદ કરેલા ચાર-વર્ગ કોષ્ટકથી ચંદ્ર રાશિઓની સરખામણી થાય છે. બીજી પરંપરામાં વર્ગ કે 15 અંશે રાશિનું વિભાજન અલગ હોવાથી ગુણ બદલાઈ શકે છે.',
   'તારામાં બંને જન્મ નક્ષત્ર વચ્ચે બંને દિશામાં ગણતરી કરીને તેને 1થી 9ના વર્ગમાં ફેરવાય છે. 3, 5 અને 7 સિવાયની દરેક દિશાને 1.5 ગુણ મળે છે.',
   'યોનિમાં જન્મ નક્ષત્રોના પરંપરાગત પશુ પ્રતીકોની સરખામણી થાય છે. ગુણ પસંદ કરેલા છપાયેલા કોષ્ટક મુજબ છે; તે જાતીય વર્તન કે સંમતિનું માપ નથી.',
   'ગ્રહ મૈત્રીમાં બંને ચંદ્ર રાશિઓના સ્વામી ગ્રહોની નૈસર્ગિક મૈત્રીની સરખામણી થાય છે. તેમાં બંને કુંડળીના બધા ગ્રહો કે તાત્કાલિક મૈત્રી જોવાતી નથી.',
   'ગણમાં જન્મ નક્ષત્રોના પરંપરાગત જૂથોની સરખામણી નક્કી કરેલા A/B ક્રમમાં થાય છે. પ્રતીકાત્મક નામ કોઈ વ્યક્તિના ચારિત્ર્યનો નિર્ણય નથી.',
   'ભકૂટમાં બંને ચંદ્ર રાશિઓનું પરસ્પર અંતર જોવાય છે. પસંદ કરેલા નિયમમાં 2/12, 5/9 અને 6/8ના સંબંધને શૂન્ય અને અન્ય સંબંધોને સાત ગુણ મળે છે.',
   'નાડીમાં જન્મ નક્ષત્રના ત્રણ પ્રતીકાત્મક જૂથોની સરખામણી થાય છે. અલગ જૂથને આઠ અને સમાન જૂથને શૂન્ય ગુણ મળે છે. તે આરોગ્ય, વારસાગત સ્થિતિ કે સંતાન વિશે પુરાવો નથી.'
  ],
  outcomes:{full:'પસંદ કરેલા નિયમમાં આ ઘટકને બધા ઉપલબ્ધ ગુણ મળ્યા છે.',partial:'પસંદ કરેલા નિયમમાં આ ઘટકને કેટલાક ઉપલબ્ધ ગુણ મળ્યા છે.',zero:'પસંદ કરેલા નિયમમાં આ ઘટકને શૂન્ય ગુણ મળ્યા છે; તેને અન્ય ઘટકો સાથે જુઓ.',uncertain:'ચંદ્ર વર્ગીકરણની સીમા પાસે છે, તેથી આ ઘટકના એકથી વધુ શક્ય ગુણ છે. એક નિશ્ચિત પરિણામ પસંદ કરવાને બદલે ગુણની શ્રેણી અને શક્ય ઘટકો જુઓ.'},
  pair:(a,b)=>'વ્યક્તિ A: '+a+'. વ્યક્તિ B: '+b+'.',
  rulers:(a,b)=>'વ્યક્તિ Aની ચંદ્ર રાશિના સ્વામી '+a+' અને વ્યક્તિ Bના '+b+' છે.',
  counts:(a,b)=>'તારાના ઘટાડેલા વર્ગ Aથી B તરફ '+a+' અને Bથી A તરફ '+b+' છે.',
  distance:(a,b)=>'શરૂઆતની રાશિ સહિત ગણતાં Bની ચંદ્ર રાશિ Aથી '+a+'મા અને Aની ચંદ્ર રાશિ Bથી '+b+'મા સ્થાને છે.',
  varying:'મૂળ વર્ગીકરણની પણ એકથી વધુ શક્યતા છે. તેને કુંડળીના આધારમાં જુઓ; કોઈ એકને નિશ્ચિત માન્યું નથી.',
  exceptions:'દોષ નિવારણ અને પ્રાદેશિક અપવાદો તપાસ્યાં નથી.',
  review:'નક્કી કરેલા A/B ક્રમમાં ગણતરીના ઘટકો જુઓ અને નિષ્કર્ષ પહેલાં બંને સંપૂર્ણ કુંડળી પર વિચાર કરો.',
  limit:'આ મિલાનમાં હજી સાતમા ભાવના સ્વામી, શુક્ર, મંગળની સ્થિતિ, નવાંશ, દૃષ્ટિ અને બંનેની દશા જોડીને સંપૂર્ણ સંબંધનું અર્થઘટન થતું નથી.'
 }
};
export function matchingStory(result,language='en'){
 const lang=copy[language]?language:'en',t=copy[lang];
 const items=ids.flatMap((id,index)=>{
  const component=result.components.find(c=>c.id===id);if(!component)return [];
  const state=component.score===null?'uncertain':component.score===component.maximum?'full':component.score===0?'zero':'partial';
  const options=component.factorOptions??[component.factors],f=options[0];
  let actual='';
  // Stable scores may still have changing factors: do not assert one nominal pair.
  if(options.length>1)actual=t.varying;
  else if(state!=='uncertain'&&f){
   const a=term(bodyName(String(f.personA),lang),lang),b=term(bodyName(String(f.personB),lang),lang);
   actual=id==='graha-maitri'?t.rulers(a,b):id==='tara'?t.counts(f.aToB,f.bToA):id==='bhakoot'?t.distance(f.aToB,f.bToA):t.pair(a,b);
  }
  const text=[actual,t.topics[index],t.outcomes[state],['bhakoot','nadi'].includes(id)?t.exceptions:null].filter(Boolean).join(' ');
  return [{id,state,title:t.titles[index],text,prompt:t.review,component}];
 });
 const connection=matchingConnection(result,items,lang);
 return {modelId:matchingReadingVersion,title:t.title,note:t.note,limit:t.limit,items,connection};
}
