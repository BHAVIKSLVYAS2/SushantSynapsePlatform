import {traditionalVoice} from './rashifal-voice.mjs';
// Original editorial prompts using traditional house themes, not life-event rules.
// The selected themes come from computed Moon observations, never the sign name.
const themes={
 en:[
 [...traditionalVoice.en[0],'Take ownership of one task instead of waiting for everyone to agree.','Pause before buying something just to lift your mood.','Say what you need clearly, while leaving room for the other person.'],
 [...traditionalVoice.en[1],'Check figures and wording before sending an important message.','Review upcoming bills and separate essentials from optional purchases.','A gentle tone may help a family conversation move forward.'],
 [...traditionalVoice.en[2],'Send the follow-up or ask the question you have been avoiding.','Check the practical costs before committing to a short trip or new tool.','Reach out rather than assuming someone knows what you are thinking.'],
 [...traditionalVoice.en[3],'Put your workspace in order and choose a realistic stopping time.','Check the details of any household expense before agreeing to it.','Listen to what someone at home needs before offering a solution.'],
 [...traditionalVoice.en[4],'Try a fresh approach to a familiar problem or practise a skill.','Set a comfortable limit for leisure spending; keep speculation separate.','Make time for an unhurried conversation or a shared activity.'],
 [...traditionalVoice.en[5],'Finish the pending task before adding another commitment.','Look through recurring charges and outstanding payments.','Divide practical responsibilities clearly instead of keeping a silent tally.'],
 [...traditionalVoice.en[6],'Confirm who is doing what before starting joint work.','Read the terms of a shared purchase or agreement together.','Ask a direct question and listen to the answer without rushing to defend yourself.'],
 [...traditionalVoice.en[7],'Double-check documents and avoid filling gaps with assumptions.','Review shared expenses, dues and permissions; avoid a rushed commitment.','Respect personal boundaries and choose a private moment for a sensitive topic.'],
 [...traditionalVoice.en[8],'Ask someone experienced for feedback on a plan or skill.','Compare the full cost of a course or journey before booking.','Be curious about a different point of view rather than trying to win the discussion.'],
 [...traditionalVoice.en[9],'Clarify the priority, then share a concise update with the people involved.','Check payment dates and keep work-related expenses organised.','Let people close to you know when work needs your attention.'],
 [...traditionalVoice.en[10],'Ask for specific feedback or offer useful help to a colleague.','Review a savings goal against what you can comfortably set aside.','Check in with a friend without turning the conversation into a request.'],
 [...traditionalVoice.en[11],'Close a loose end and leave space between commitments.','Check small unnoticed expenses before making another purchase.','Explain when you need some quiet time so it is not mistaken for distance.']
 ],
 hi:[
 [...traditionalVoice.hi[0],'सबकी सहमति का इंतज़ार करने के बजाय एक काम की ज़िम्मेदारी लें।','सिर्फ मन अच्छा करने के लिए खरीदारी करने से पहले रुकें।','अपनी ज़रूरत साफ़ कहें और सामने वाले की बात भी सुनें।'],
 [...traditionalVoice.hi[1],'ज़रूरी संदेश भेजने से पहले शब्द और आँकड़े जाँच लें।','आने वाले बिल देखें और ज़रूरी व टाले जा सकने वाले खर्च अलग करें।','परिवार की बात में नरम लहजा अपनाएँ।'],
 [...traditionalVoice.hi[2],'अटकी बात पर दोबारा संपर्क करें या ज़रूरी सवाल पूछें।','छोटी यात्रा या नए उपकरण पर खर्च करने से पहले कुल लागत देखें।','यह मानने के बजाय बात करें कि दूसरा आपकी सोच समझता है।'],
 [...traditionalVoice.hi[3],'काम की जगह व्यवस्थित करें और काम रोकने का समय तय करें।','घर के किसी खर्च पर हामी भरने से पहले जानकारी जाँचें।','समाधान सुझाने से पहले घर में किसी की ज़रूरत सुनें।'],
 [...traditionalVoice.hi[4],'पुराने काम को नए ढंग से करें या किसी कौशल का अभ्यास करें।','मनोरंजन का बजट तय रखें; सट्टे या अटकलबाज़ी से इसे अलग रखें।','बिना जल्दबाज़ी बातचीत करें या साथ कोई पसंद का काम करें।'],
 [...traditionalVoice.hi[5],'नई ज़िम्मेदारी लेने से पहले लंबित काम निपटाएँ।','बार-बार कटने वाले शुल्क और बाकी भुगतान जाँचें।','मन में हिसाब रखने के बजाय काम की ज़िम्मेदारियाँ बाँट लें।'],
 [...traditionalVoice.hi[6],'साझा काम शुरू करने से पहले ज़िम्मेदारियाँ तय करें।','साझी खरीद या समझौते की शर्तें साथ पढ़ें।','सीधा सवाल पूछें और सफ़ाई देने की जल्दी किए बिना जवाब सुनें।'],
 [...traditionalVoice.hi[7],'दस्तावेज़ दोबारा जाँचें; अधूरी जानकारी पर अनुमान न लगाएँ।','साझे खर्च और बकाया देखें; जल्दबाज़ी में हामी न भरें।','निजी सीमाओं का सम्मान करें और संवेदनशील बात के लिए सही समय चुनें।'],
 [...traditionalVoice.hi[8],'किसी योजना या कौशल पर अनुभवी व्यक्ति की राय लें।','कोर्स या यात्रा बुक करने से पहले कुल खर्च की तुलना करें।','बहस जीतने के बजाय दूसरे नज़रिए को समझें।'],
 [...traditionalVoice.hi[9],'प्राथमिकता तय करके संबंधित लोगों को छोटा अपडेट दें।','भुगतान की तारीखें और काम के खर्च व्यवस्थित रखें।','काम में व्यस्त होने पर अपनों को पहले बता दें।'],
 [...traditionalVoice.hi[10],'साथी से किसी खास बात पर राय लें या उपयोगी मदद दें।','बचत का लक्ष्य अपनी वास्तविक गुंजाइश के अनुसार देखें।','किसी दोस्त का हाल पूछें, बिना तुरंत कोई काम निकाले।'],
 [...traditionalVoice.hi[11],'एक अधूरा काम समेटें और ज़िम्मेदारियों के बीच समय रखें।','नई खरीद से पहले छोटे, अनदेखे खर्च जाँच लें।','अकेले समय की ज़रूरत हो तो साफ़ बता दें, ताकि दूरी न समझी जाए।']
 ],
 gu:[
 [...traditionalVoice.gu[0],'બધાની સંમતિની રાહ જોવાને બદલે એક કામની જવાબદારી લો.','માત્ર મન સારું કરવા ખરીદી કરતાં પહેલાં થોભો.','પોતાની જરૂરિયાત સ્પષ્ટ કહો અને સામેવાળાને પણ સાંભળો.'],
 [...traditionalVoice.gu[1],'જરૂરી સંદેશ મોકલતાં પહેલાં શબ્દો અને આંકડા તપાસો.','આવનારા બિલ જુઓ અને જરૂરી તથા ટાળી શકાય તેવા ખર્ચ અલગ કરો.','પરિવારની વાતમાં નરમ ભાષા રાખો.'],
 [...traditionalVoice.gu[2],'અટકેલી વાત માટે ફરી સંપર્ક કરો અથવા જરૂરી પ્રશ્ન પૂછો.','ટૂંકી મુસાફરી કે નવા સાધનનો કુલ ખર્ચ પહેલાં જુઓ.','બીજી વ્યક્તિ તમારી વાત સમજે છે એવું માનવાને બદલે વાત કરો.'],
 [...traditionalVoice.gu[3],'કામની જગ્યા ગોઠવો અને કામ રોકવાનો સમય નક્કી કરો.','ઘરના ખર્ચ માટે હા કહેતાં પહેલાં વિગતો તપાસો.','ઉકેલ સૂચવતાં પહેલાં ઘરમાં કોઈની જરૂરિયાત સાંભળો.'],
 [...traditionalVoice.gu[4],'પરિચિત કામ નવી રીતે કરો અથવા કૌશલ્યનો અભ્યાસ કરો.','મનોરંજનનું બજેટ રાખો; સટ્ટા કે અટકળથી તેને અલગ રાખો.','ઉતાવળ વગર વાત કરો અથવા સાથે ગમતું કામ કરો.'],
 [...traditionalVoice.gu[5],'નવી જવાબદારી લેતાં પહેલાં બાકી કામ પૂરું કરો.','વારંવાર કપાતા ચાર્જ અને બાકી ચુકવણી તપાસો.','મનમાં હિસાબ રાખવાને બદલે કામની જવાબદારી વહેંચો.'],
 [...traditionalVoice.gu[6],'સાથે કામ શરૂ કરતાં પહેલાં જવાબદારીઓ નક્કી કરો.','સાથે ખરીદી કે કરારની શરતો સાથે વાંચો.','સીધો પ્રશ્ન પૂછો અને બચાવ કરવાની ઉતાવળ વગર જવાબ સાંભળો.'],
 [...traditionalVoice.gu[7],'દસ્તાવેજ ફરી તપાસો; અધૂરી માહિતીથી ધારણા ન બાંધો.','સહિયારા ખર્ચ અને બાકી રકમ જુઓ; ઉતાવળમાં હા ન કહો.','અંગત મર્યાદાનો આદર કરો અને સંવેદનશીલ વાત માટે યોગ્ય સમય પસંદ કરો.'],
 [...traditionalVoice.gu[8],'યોજના કે કૌશલ્ય વિશે અનુભવી વ્યક્તિનો અભિપ્રાય લો.','કોર્સ કે મુસાફરી બુક કરતાં પહેલાં કુલ ખર્ચ સરખાવો.','ચર્ચા જીતવાને બદલે બીજો દૃષ્ટિકોણ સમજો.'],
 [...traditionalVoice.gu[9],'પ્રાથમિકતા નક્કી કરીને સંબંધિત લોકોને ટૂંકી જાણ કરો.','ચુકવણીની તારીખ અને કામના ખર્ચ ગોઠવો.','કામમાં વ્યસ્ત હો ત્યારે સ્વજનોને પહેલાં જાણ કરો.'],
 [...traditionalVoice.gu[10],'સાથીનો ચોક્કસ બાબતે અભિપ્રાય લો અથવા મદદ કરો.','બચતનું લક્ષ્ય પોતાની વાસ્તવિક ક્ષમતા મુજબ જુઓ.','તરત કોઈ કામ કઢાવ્યા વગર મિત્રની ખબર પૂછો.'],
 [...traditionalVoice.gu[11],'એક અધૂરું કામ સમેટો અને જવાબદારીઓ વચ્ચે સમય રાખો.','નવી ખરીદી પહેલાં નાના, ધ્યાન બહારના ખર્ચ તપાસો.','એકલા સમયની જરૂર હોય તો સ્પષ્ટ કહો જેથી અંતર ન સમજાય.']
 ]
};
export const everydayLabels={
 en:{areas:['Work & studies','Money & spending','Relationships'],note:'General Moon-sign guidance, not a personal forecast. These practical suggestions use traditional themes; they do not promise events.',mixed:'Your focus changes during this period',mixedText:'There is more than one theme in this period. Leave room for both rather than expecting every part of it to feel the same.',uncertain:'Keep your plans flexible',uncertainText:'The calculation is too close to a transition for a clear theme. Use your circumstances to guide decisions and check back later.',broad:'Take the period one step at a time',broadText:'The Moon moves through several themes in this period. A single daily message would hide that variation.',rhythm:{supportive:'Choose one useful step and give it your full attention.',obstructed:'Allow extra time for follow-ups and avoid forcing a quick answer.',neutral:'Keep expectations realistic and commitments manageable.',mixed:'Be ready to adjust your pace as the period unfolds.',uncertain:'Leave time to reassess before making a firm commitment.'}},
 hi:{areas:['काम और पढ़ाई','पैसे और खर्च','रिश्ते'],note:'यह सामान्य चंद्र राशि का मार्गदर्शन है, व्यक्तिगत भविष्यवाणी नहीं। व्यावहारिक सुझाव पारंपरिक विषयों पर आधारित हैं; घटनाओं का वादा नहीं करते।',mixed:'इस अवधि में ध्यान का विषय बदलता है',mixedText:'इस अवधि में एक से अधिक विषय हैं। हर समय एक जैसा अनुभव होने की उम्मीद के बजाय दोनों के लिए जगह रखें।',uncertain:'योजनाओं में लचीलापन रखें',uncertainText:'गणना बदलाव के बहुत पास है, इसलिए स्पष्ट विषय तय नहीं किया गया। अपने हालात देखकर निर्णय लें और बाद में फिर देखें।',broad:'एक समय में एक कदम बढ़ाएँ',broadText:'इस अवधि में चंद्रमा कई विषयों से गुज़रता है। पूरे समय को एक दिन के संदेश में समेटना सही नहीं होगा।',rhythm:{supportive:'एक उपयोगी कदम चुनें और उस पर पूरा ध्यान दें।',obstructed:'दोबारा बात करने के लिए समय रखें; जल्दी जवाब का दबाव न बनाएँ।',neutral:'अपेक्षाएँ वास्तविक और ज़िम्मेदारियाँ सँभालने योग्य रखें।',mixed:'अवधि के दौरान अपनी गति बदलने के लिए तैयार रहें।',uncertain:'पक्का वादा करने से पहले फिर सोचने का समय रखें।'}},
 gu:{areas:['કામ અને અભ્યાસ','પૈસા અને ખર્ચ','સંબંધો'],note:'આ સામાન્ય ચંદ્ર રાશિનું માર્ગદર્શન છે, વ્યક્તિગત આગાહી નહીં. વ્યવહારુ સૂચનો પરંપરાગત વિષયો પર આધારિત છે; ઘટનાઓનું વચન નથી.',mixed:'આ સમયગાળામાં ધ્યાનનો વિષય બદલાય છે',mixedText:'આ સમયગાળામાં એકથી વધુ વિષય છે. દરેક ભાગ એકસરખો લાગશે તેવી અપેક્ષાને બદલે બંને માટે જગ્યા રાખો.',uncertain:'યોજનામાં લવચીકતા રાખો',uncertainText:'ગણતરી ફેરફારની ખૂબ નજીક છે, તેથી સ્પષ્ટ વિષય નક્કી કર્યો નથી. પોતાના સંજોગો જોઈ નિર્ણય લો અને પછી ફરી જુઓ.',broad:'એક સમયે એક પગલું લો',broadText:'આ સમયગાળામાં ચંદ્ર અનેક વિષયોમાંથી પસાર થાય છે. આખા સમયને એક દિવસના સંદેશમાં સમેટવો યોગ્ય નહીં બને.',rhythm:{supportive:'એક ઉપયોગી પગલું પસંદ કરો અને પૂરેપૂરું ધ્યાન આપો.',obstructed:'ફરી વાત કરવા સમય રાખો; ઝડપી જવાબનું દબાણ ન કરો.',neutral:'અપેક્ષા વાસ્તવિક અને જવાબદારી સંભાળી શકાય એવી રાખો.',mixed:'સમયગાળા દરમિયાન પોતાની ગતિ બદલવા તૈયાર રહો.',uncertain:'પાકું વચન આપતાં પહેલાં ફરી વિચારવાનો સમય રાખો.'}}
};
export function composeEveryday({moon,mood,language}){
 const t=everydayLabels[language],houses=[...new Set(moon.houses||[])];
 // Never manufacture a precise theme from uncertain or widely varying samples.
 const mode=mood==='uncertain'||!houses.length?'uncertain':houses.length>2?'broad':houses.length===2?'mixed':'single';
 const rows=['single','mixed'].includes(mode)?houses.map(h=>themes[language][h-1]):[];
 return {modelId:'moon-house-editorial-themes-2',houses,mode,
  headline:rows.length?rows[0][0]:t[mode],
  summary:rows.length?rows.map(row=>row[1]).join(' '):t[mode+'Text'],paragraphs:rows.length?rows.map(row=>row[1]):[t[mode+'Text']],rhythm:t.rhythm[mood],
  themes:[],
  areas:rows.length?t.areas.map((label,i)=>({label,text:rows.map(r=>r[i+2]).join(' ')})):[],notice:t.note};
}
