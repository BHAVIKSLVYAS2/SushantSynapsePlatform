// Explicit, versioned planning policies. Exceptional cases require confirmation.
export const policyVersion='observances-1';
export const observanceTypes={
 ekadashi:{en:'Ekadashi',hi:'एकादशी',rule:'smarta-householder',basis:{en:'Smarta household: Ekadashi at one local sunrise. Missing or repeated sunrise tithis require confirmation. Vaishnava/ISKCON rules are not included.',hi:'स्मार्त गृहस्थ: एक स्थानीय सूर्योदय पर एकादशी। सूर्योदय पर तिथि न हो या दो बार हो तो पुष्टि करें। वैष्णव/इस्कॉन नियम शामिल नहीं हैं।'}},
 amavasya:{en:'Amavasya',hi:'अमावस्या',rule:'sunrise-tithi',basis:{en:'Amavasya at local sunrise; this is the calendar tithi date, not a Darsha, Shraddha or festival rule.',hi:'स्थानीय सूर्योदय पर अमावस्या; यह पंचांग तिथि है, दर्श, श्राद्ध या त्योहार का नियम नहीं।'}},
 purnima:{en:'Purnima / Poonam',hi:'पूर्णिमा / पूनम',rule:'sunrise-tithi',basis:{en:'Purnima at local sunrise. The fasting date is listed separately and can be earlier.',hi:'स्थानीय सूर्योदय पर पूर्णिमा। व्रत की तारीख अलग दी गई है और पहले हो सकती है।'}},
 'purnima-vrat':{en:'Purnima fasting',hi:'पूर्णिमा व्रत',rule:'first-madhyahna',basis:{en:'First day with Purnima during local Madhyahna (middle fifth of daylight). Confirm family puja practice separately.',hi:'स्थानीय मध्याह्न (दिन का मध्य पाँचवाँ भाग) में पूर्णिमा वाला पहला दिन। पारिवारिक पूजा की रीति अलग से पक्की करें।'}},
 sankashti:{en:'Sankashti Chauth',hi:'संकष्टी चौथ',rule:'moonrise-chaturthi',basis:{en:'Krishna Chaturthi at local moonrise. Angarki means this date falls on Tuesday. This is not Karwa Chauth or Sakat Chauth.',hi:'स्थानीय चन्द्रोदय पर कृष्ण चतुर्थी। मंगलवार को अंगारकी। यह करवा चौथ या सकट चौथ की अलग गणना नहीं है।'}},
 vinayaka:{en:'Vinayaka Chaturthi',hi:'विनायक चतुर्थी',rule:'madhyahna-overlap',basis:{en:'Shukla Chaturthi with greatest overlap of local Madhyahna (middle fifth of daylight). Close two-day overlaps require confirmation.',hi:'स्थानीय मध्याह्न (दिन का मध्य पाँचवाँ भाग) में शुक्ल चतुर्थी की अधिकतम अवधि। दो दिनों में निकट अवधि हो तो पुष्टि करें।'}},
 pradosh:{en:'Pradosh',hi:'प्रदोष',rule:'pradosh-overlap',basis:{en:'Trayodashi with greatest overlap from sunset through the first fifth of local night. Close two-day overlaps require confirmation.',hi:'सूर्यास्त से स्थानीय रात के पहले पाँचवें भाग में त्रयोदशी की अधिकतम अवधि। दो दिनों में निकट अवधि हो तो पुष्टि करें।'}}
};
const shukla={en:['Kamada','Mohini','Nirjala','Devshayani','Shravana Putrada','Parsva','Papankusha','Devutthana','Mokshada','Pausha Putrada','Jaya','Amalaki'],hi:['कामदा','मोहिनी','निर्जला','देवशयनी','श्रावण पुत्रदा','पार्श्व','पापांकुशा','देवउठनी','मोक्षदा','पौष पुत्रदा','जया','आमलकी']};
const krishna={en:['Varuthini','Apara','Yogini','Kamika','Aja','Indira','Rama','Utpanna','Saphala','Shattila','Vijaya','Papamochani'],hi:['वरुथिनी','अपरा','योगिनी','कामिका','अजा','इन्दिरा','रमा','उत्पन्ना','सफला','षट्तिला','विजया','पापमोचनी']};
export function eventTitle(event,language='en'){
 const base=observanceTypes[event.type]?.[language]||'';
 if(event.type==='ekadashi'&&event.month&&!event.month.uncertain&&!event.month.kshaya){
  const name=event.month.adhika?(event.window.number===11?(language==='hi'?'पद्मिनी':'Padmini'):(language==='hi'?'परमा':'Parama')):(event.window.number===11?shukla:krishna)[language][event.month.index];
  return name+' '+base;
 }
 return (event.angarki?(language==='hi'?'अंगारकी ':'Angarki '):'')+base;
}
