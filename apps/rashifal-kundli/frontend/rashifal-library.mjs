import {freeze} from '../../../packages/vedic/diagnostics.mjs';
export const rashifalLibrary=freeze({version:'rashifal-reflections-1',catalogueDate:'2026-10-24',
 author:'Synapse project-authored editorial draft',status:'draft-not-published',
 source:{id:'brihat-jataka-1-15-context',url:'https://sanskritdocuments.org/doc_z_misc_sociology_astrology/brihajjAtakam.html',
  meaning:'Classical house vocabulary is context only. Grouping and reflection prompts below are original editorial choices, not a translation or validated classical transit rule.'},
 categories:['overview','career','money','relationships','wellbeing'],
 // Every house maps explicitly; no random/hash/date-based sentence mixing.
 houseGroups:{1:'reflect',2:'organise',3:'connect',4:'reflect',5:'explore',6:'organise',7:'connect',8:'reflect',9:'explore',10:'organise',11:'connect',12:'reflect'},
 groupOrder:['reflect','organise','connect','explore'],weekly:'rank groups by noon-snapshot count; ties use groupOrder; select at most three; deduplicate sentence IDs',
 translationStatus:{en:'authored-baseline-draft',hi:'draft-awaiting-independent-review',gu:'draft-awaiting-independent-review'},
 groups:{
  reflect:{en:{overview:'A quieter pace may leave room to notice what matters to you.',career:'Consider reviewing one commitment before adding another.',money:'You could pause and review a planned expense without assuming a particular outcome.',relationships:'A little space to listen may help you understand another point of view.',wellbeing:'If it suits you, leave some unhurried time in your routine.'},
   hi:{overview:'धीमी गति से आपको अपनी प्राथमिकताओं पर ध्यान देने का अवसर मिल सकता है।',career:'नई जिम्मेदारी लेने से पहले किसी मौजूदा वचन की समीक्षा करें।',money:'किसी खास परिणाम की धारणा बनाए बिना नियोजित खर्च पर दोबारा विचार कर सकते हैं।',relationships:'ध्यान से सुनने का समय दूसरे दृष्टिकोण को समझने में मदद कर सकता है।',wellbeing:'यदि अनुकूल लगे तो दिनचर्या में थोड़ा बिना जल्दबाजी का समय रखें।'},
   gu:{overview:'ધીમી ગતિથી તમારી પ્રાથમિકતાઓ પર ધ્યાન આપવાનો અવકાશ મળી શકે છે.',career:'નવી જવાબદારી લેતાં પહેલાં હાલની એક પ્રતિબદ્ધતાની સમીક્ષા કરો.',money:'કોઈ ચોક્કસ પરિણામ ધાર્યા વિના નક્કી કરેલા ખર્ચ પર ફરી વિચાર કરી શકો છો.',relationships:'ધ્યાનથી સાંભળવાનો સમય બીજો દૃષ્ટિકોણ સમજવામાં મદદ કરી શકે છે.',wellbeing:'અનુકૂળ લાગે તો દિનચર્યામાં થોડો ઉતાવળ વિનાનો સમય રાખો.'}},
  organise:{en:{overview:'A practical, manageable step may be a useful focus.',career:'Consider choosing one task and agreeing on a realistic next step.',money:'Checking the details of a routine payment may be more useful than rushing a decision.',relationships:'Clear expectations can offer a starting point for a calm conversation.',wellbeing:'You might make room for a familiar routine that feels comfortable.'},
   hi:{overview:'एक व्यावहारिक और संभालने योग्य कदम पर ध्यान देना उपयोगी हो सकता है।',career:'एक काम चुनकर उसके अगले यथार्थवादी कदम पर सहमति बनाने पर विचार करें।',money:'जल्दबाजी में निर्णय लेने की जगह नियमित भुगतान का विवरण जाँचना उपयोगी हो सकता है।',relationships:'स्पष्ट अपेक्षाएँ शांत बातचीत की शुरुआत बन सकती हैं।',wellbeing:'किसी परिचित और सहज लगने वाली दिनचर्या के लिए समय निकाल सकते हैं।'},
   gu:{overview:'એક વ્યવહારુ અને સંભાળી શકાય તેવા પગલા પર ધ્યાન આપવું ઉપયોગી બની શકે છે.',career:'એક કામ પસંદ કરીને તેના આગામી વાસ્તવિક પગલા પર સહમતી સાધવાનો વિચાર કરો.',money:'ઉતાવળમાં નિર્ણય લેવા કરતાં નિયમિત ચુકવણીની વિગતો તપાસવી ઉપયોગી બની શકે છે.',relationships:'સ્પષ્ટ અપેક્ષાઓ શાંત વાતચીતની શરૂઆત બની શકે છે.',wellbeing:'પરિચિત અને અનુકૂળ લાગતી દિનચર્યા માટે સમય કાઢી શકો છો.'}},
  connect:{en:{overview:'An exchange of ideas may offer a fresh perspective.',career:'You could ask a clear question before assuming that everyone shares the same plan.',money:'Clarifying a shared expense may help keep expectations visible.',relationships:'Consider making time for a conversation without predicting how it will end.',wellbeing:'A comfortable connection or a quiet break may suit your own preferences.'},
   hi:{overview:'विचारों का आदान-प्रदान नया दृष्टिकोण दे सकता है।',career:'सबकी योजना एक जैसी मानने से पहले स्पष्ट प्रश्न पूछ सकते हैं।',money:'साझा खर्च को स्पष्ट करने से अपेक्षाएँ सामने रखने में मदद मिल सकती है।',relationships:'बातचीत का परिणाम तय माने बिना उसके लिए समय निकालने पर विचार करें।',wellbeing:'अपनी पसंद के अनुसार सहज संगति या शांत विराम चुन सकते हैं।'},
   gu:{overview:'વિચારોની આપલે નવો દૃષ્ટિકોણ આપી શકે છે.',career:'બધાની યોજના સમાન છે તેમ માનતાં પહેલાં સ્પષ્ટ પ્રશ્ન પૂછી શકો છો.',money:'સહિયારા ખર્ચની સ્પષ્ટતા કરવાથી અપેક્ષાઓ સામે રાખવામાં મદદ મળી શકે છે.',relationships:'પરિણામ નક્કી માન્યા વિના વાતચીત માટે સમય કાઢવાનો વિચાર કરો.',wellbeing:'પોતાની પસંદ મુજબ સહજ સંગાથ અથવા શાંત વિરામ પસંદ કરી શકો છો.'}},
  explore:{en:{overview:'Curiosity may be a helpful theme for reflection.',career:'You might try a small learning task before committing to a larger change.',money:'Gathering information can be an alternative to acting on an exciting claim.',relationships:'An open question may help you learn something about another person.',wellbeing:'Consider an enjoyable activity that fits your time and circumstances.'},
   hi:{overview:'जिज्ञासा मनन का उपयोगी विषय हो सकती है।',career:'बड़ा बदलाव अपनाने से पहले सीखने का छोटा काम आजमा सकते हैं।',money:'किसी आकर्षक दावे पर तुरंत काम करने की जगह जानकारी जुटा सकते हैं।',relationships:'खुला प्रश्न किसी दूसरे व्यक्ति के बारे में जानने में मदद कर सकता है।',wellbeing:'समय और परिस्थितियों के अनुकूल आनंददायक गतिविधि पर विचार करें।'},
   gu:{overview:'જિજ્ઞાસા મનન માટે ઉપયોગી વિષય બની શકે છે.',career:'મોટો ફેરફાર અપનાવતાં પહેલાં શીખવાનું નાનું કામ અજમાવી શકો છો.',money:'આકર્ષક દાવા પર તરત પગલું ભરવાને બદલે માહિતી મેળવી શકો છો.',relationships:'ખુલ્લો પ્રશ્ન બીજી વ્યક્તિ વિશે જાણવા મદદ કરી શકે છે.',wellbeing:'સમય અને પરિસ્થિતિને અનુકૂળ આનંદદાયક પ્રવૃત્તિનો વિચાર કરો.'}}
 }
});

export function editorialSections(groups,requestedLanguage){
 const translated=rashifalLibrary.translationStatus[requestedLanguage]==='reviewed';
 const contentLanguage=requestedLanguage==='en'||translated?requestedLanguage:'en';
 const sections=rashifalLibrary.categories.map(category=>({category,items:[...new Set(groups.map(group=>`${group}.${category}`))].map(id=>{
  const [group,key]=id.split('.');return {id,text:rashifalLibrary.groups[group][contentLanguage][key]};})}));
 return freeze({contentLanguage,fallback:contentLanguage!==requestedLanguage,translationStatus:rashifalLibrary.translationStatus[requestedLanguage],sections});
}
