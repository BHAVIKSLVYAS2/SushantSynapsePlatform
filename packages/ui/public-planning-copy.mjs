// Planning/discovery UI; uploaded names, scheme identities and source reports stay original.
const rows=`
Schedule: save your institute and working days, then build periods or add periods and breaks manually.|समय-सारणी: संस्था और कार्यदिवस सहेजें, फिर पीरियड बनाएँ या पीरियड और विराम स्वयं जोड़ें।|સમયપત્રક: સંસ્થા અને કામના દિવસો સાચવો, પછી પિરિયડ બનાવો અથવા પિરિયડ અને વિરામ જાતે ઉમેરો.
Classes: add each class or batch and optional section.|कक्षाएँ: हर कक्षा या बैच और वैकल्पिक अनुभाग जोड़ें।|વર્ગ: દરેક વર્ગ કે બેચ અને વૈકલ્પિક વિભાગ ઉમેરો.
Subjects: add subjects; marking a subject core asks the generator to try to separate demanding lessons.|विषय: विषय जोड़ें; मुख्य विषय चिह्नित करने पर जनरेटर कठिन पाठों को अलग रखने की कोशिश करता है।|વિષય: વિષયો ઉમેરો; મુખ્ય વિષય ચિહ્નિત કરતાં જનરેટર અઘરા પાઠ અલગ રાખવાનો પ્રયાસ કરે છે.
Teachers: choose subjects, available days and optional period restrictions.|शिक्षक: विषय, उपलब्ध दिन और वैकल्पिक पीरियड सीमाएँ चुनें।|શિક્ષક: વિષયો, ઉપલબ્ધ દિવસો અને વૈકલ્પિક પિરિયડની મર્યાદા પસંદ કરો.
Allocation: choose class, subject and teacher, weekly lessons, daily maximum and double-period rules.|आवंटन: कक्षा, विषय, शिक्षक, साप्ताहिक पाठ, दैनिक अधिकतम और दोहरे पीरियड के नियम चुनें।|ફાળવણી: વર્ગ, વિષય, શિક્ષક, સાપ્તાહિક પાઠ, દૈનિક મહત્તમ અને જોડિયા પિરિયડના નિયમ પસંદ કરો.
Generate: review class, teacher or master views. In Class view select a lesson and its destination to move or swap. Download PDF/images or print.|बनाएँ: कक्षा, शिक्षक या पूरी सारणी देखें। कक्षा दृश्य में पाठ और गंतव्य चुनकर स्थान बदलें या अदला-बदली करें। PDF/चित्र डाउनलोड या प्रिंट करें।|બનાવો: વર્ગ, શિક્ષક કે આખું સમયપત્રક જુઓ. વર્ગના દૃશ્યમાં પાઠ અને ગંતવ્ય પસંદ કરીને ખસેડો કે અદલાબદલી કરો. PDF/ચિત્ર ડાઉનલોડ કે પ્રિન્ટ કરો.
After you use Add, Save or Build, the app saves institute name, year and logo, working days, periods and breaks, classes and sections, subjects, teachers and availability, allocations and holidays. Generated lessons and successful moves, swaps and undo are saved too. There is one current setup per browser profile and site address, with no automatic expiry set by this app.|जोड़ें, सहेजें या बनाएँ के बाद ऐप संस्था का नाम, वर्ष, लोगो, कार्यदिवस, पीरियड, विराम, कक्षाएँ, अनुभाग, विषय, शिक्षक, उपलब्धता, आवंटन और छुट्टियाँ सहेजता है। बनाए पाठ और सफल स्थानांतरण, अदला-बदली व वापस लिए कदम भी सहेजे जाते हैं। हर ब्राउज़र प्रोफ़ाइल और साइट पते पर एक मौजूदा सेटअप रहता है; ऐप इसकी समय-सीमा तय नहीं करता।|ઉમેરો, સાચવો કે બનાવો પછી એપ સંસ્થાનું નામ, વર્ષ, લોગો, કામના દિવસો, પિરિયડ, વિરામ, વર્ગ, વિભાગ, વિષય, શિક્ષક, ઉપલબ્ધતા, ફાળવણી અને રજાઓ સાચવે છે. બનાવેલા પાઠ અને સફળ ખસેડવા, અદલાબદલી તથા પાછાં લીધેલાં પગલાં પણ સાચવાય છે. દરેક બ્રાઉઝર પ્રોફાઇલ અને સાઇટ સરનામે એક હાલનો સેટઅપ રહે છે; એપ તેની સમયમર્યાદા નક્કી કરતી નથી.
Unsubmitted form entries, the current screen/view, calendar-week selection and undo history are not restored after reload. Changes to institute/day settings, periods, classes, subjects, teachers or allocations clear generated lessons; your setup remains and you must generate again. Rebuilding periods also clears teacher period restrictions. Deleting a class, subject or teacher removes linked allocations.|अधूरे फ़ॉर्म, मौजूदा स्क्रीन, कैलेंडर सप्ताह और वापस लेने का इतिहास रीफ़्रेश पर नहीं लौटते। संस्था/दिन, पीरियड, कक्षा, विषय, शिक्षक या आवंटन बदलने पर बने पाठ मिटते हैं; सेटअप रहता है और फिर बनाना होता है। पीरियड दोबारा बनाने पर शिक्षक की पीरियड सीमाएँ भी मिटती हैं। कक्षा, विषय या शिक्षक हटाने पर जुड़े आवंटन हटते हैं।|અધૂરાં ફોર્મ, હાલની સ્ક્રીન, કેલેન્ડરનું અઠવાડિયું અને પાછું લેવાનો ઇતિહાસ રિફ્રેશ પછી પાછાં આવતા નથી. સંસ્થા/દિવસ, પિરિયડ, વર્ગ, વિષય, શિક્ષક કે ફાળવણી બદલતાં બનાવેલા પાઠ ભૂંસાઈ જાય છે; સેટઅપ રહે છે અને ફરી બનાવવું પડે છે. પિરિયડ ફરી બનાવતાં શિક્ષકની પિરિયડ મર્યાદા પણ ભૂંસાઈ જાય છે. વર્ગ, વિષય કે શિક્ષક કાઢતાં જોડાયેલી ફાળવણી કાઢવામાં આવે છે.
Use the same browser profile and site address to return to your work. Other devices, browsers and private windows do not share it. Anyone using this profile can access it. Clearing site data, browser cleanup or closing a private session can remove it. There is no account sync or server backup.|काम पर लौटने के लिए वही ब्राउज़र प्रोफ़ाइल और साइट पता उपयोग करें। दूसरे डिवाइस, ब्राउज़र और निजी विंडो इसे साझा नहीं करते। यह प्रोफ़ाइल उपयोग करने वाला कोई भी इसे देख सकता है। साइट डेटा मिटाने, ब्राउज़र सफ़ाई या निजी सत्र बंद करने से यह हट सकता है। खाता सिंक या सर्वर बैकअप नहीं है।|કામ પર પાછા આવવા એ જ બ્રાઉઝર પ્રોફાઇલ અને સાઇટ સરનામું વાપરો. બીજાં ઉપકરણ, બ્રાઉઝર અને ખાનગી વિન્ડો તે વહેંચતાં નથી. આ પ્રોફાઇલ વાપરનાર કોઈ પણ તે જોઈ શકે છે. સાઇટનો ડેટા સાફ કરવાથી, બ્રાઉઝરની સફાઈથી કે ખાનગી સત્ર બંધ કરવાથી તે દૂર થઈ શકે છે. ખાતા સાથે સમન્વય કે સર્વર બેકઅપ નથી.
Export backup downloads the complete current setup and timetable as JSON. PDF and images cannot restore your setup. Import backup validates JSON before asking to replace the current setup; export your current work first. A corrupt stored copy is left untouched and saving pauses until you import a valid backup. If storage is unavailable or full, export a backup before closing the tab. Use one editing tab at a time: separate tabs do not merge changes and the last save replaces the stored setup.|बैकअप डाउनलोड में पूरा मौजूदा सेटअप और सारणी JSON में मिलते हैं। PDF या चित्र से सेटअप बहाल नहीं हो सकता। आयात पहले JSON जाँचकर मौजूदा सेटअप बदलने को पूछता है; पहले अपना बैकअप लें। खराब सहेजी प्रति नहीं बदली जाती और सही बैकअप आने तक सहेजना रुकता है। स्टोरेज बंद या भरा हो तो टैब बंद करने से पहले बैकअप लें। एक समय में एक संपादन टैब रखें: टैब बदलाव नहीं मिलाते और अंतिम सेव पुराने सेटअप को बदल देता है।|બેકઅપ ડાઉનલોડમાં આખો હાલનો સેટઅપ અને સમયપત્રક JSONમાં મળે છે. PDF કે ચિત્રથી સેટઅપ પાછો મેળવી શકાતો નથી. આયાત પહેલાં JSON તપાસીને હાલનો સેટઅપ બદલવા પૂછે છે; પહેલાં તમારું બેકઅપ લો. ખરાબ સાચવેલી નકલ બદલાતી નથી અને યોગ્ય બેકઅપ આવે ત્યાં સુધી સાચવવાનું અટકે છે. સંગ્રહ બંધ કે ભરેલો હોય તો ટેબ બંધ કરતાં પહેલાં બેકઅપ લો. એક સમયે એક સંપાદન ટેબ રાખો: ટેબ ફેરફારો ભેગા કરતાં નથી અને છેલ્લે સાચવવાથી જૂનો સેટઅપ બદલાય છે.
Download sample document provides fictional Sample Academy data: two classes, two subjects, two teachers, five working days, a break and 20 generated lessons. Downloading does not change your work. Export your own backup first, then use Import backup to open the sample JSON.|नमूना दस्तावेज़ में काल्पनिक Sample Academy के दो वर्ग, दो विषय, दो शिक्षक, पाँच कार्यदिवस, एक विराम और 20 पाठ हैं। डाउनलोड से आपका काम नहीं बदलता। पहले अपना बैकअप लें, फिर नमूना JSON आयात करें।|નમૂના દસ્તાવેજમાં કાલ્પનિક Sample Academyના બે વર્ગ, બે વિષય, બે શિક્ષક, પાંચ કામના દિવસ, એક વિરામ અને 20 પાઠ છે. ડાઉનલોડથી તમારું કામ બદલાતું નથી. પહેલાં તમારું બેકઅપ લો, પછી નમૂનાનું JSON આયાત કરો.
If generation fails, check weekly totals, teacher availability, daily limits and double-period rules. A search-limit result does not prove the setup is impossible. Holidays annotate the selected calendar week; they do not cancel or reschedule recurring lessons.|सारणी न बने तो साप्ताहिक योग, शिक्षक उपलब्धता, दैनिक सीमा और दोहरे पीरियड के नियम जाँचें। खोज की सीमा आने से सेटअप असंभव सिद्ध नहीं होता। छुट्टियाँ चुने सप्ताह पर टिप्पणी हैं; वे नियमित पाठ रद्द या पुनर्निर्धारित नहीं करतीं।|સમયપત્રક ન બને તો સાપ્તાહિક સરવાળો, શિક્ષકની ઉપલબ્ધતા, દૈનિક મર્યાદા અને જોડિયા પિરિયડના નિયમ તપાસો. શોધની મર્યાદા આવવાથી સેટઅપ અશક્ય સાબિત થતો નથી. રજાઓ પસંદ કરેલા અઠવાડિયાની નોંધ છે; નિયમિત પાઠ રદ કે ફરી ગોઠવાતાં નથી.
Create periods automatically, then edit individual rows below. Breaks are always protected.|पीरियड अपने-आप बनाएँ, फिर नीचे पंक्तियाँ बदलें। विराम हमेशा सुरक्षित रहते हैं।|પિરિયડ આપમેળે બનાવો, પછી નીચે પંક્તિઓ બદલો. વિરામ હંમેશાં સુરક્ષિત રહે છે.
A period is shortened if it reaches a break or the end of the day. Review the rows before continuing.|विराम या दिन के अंत तक पहुँचने पर पीरियड छोटा होता है। आगे बढ़ने से पहले पंक्तियाँ जाँचें।|વિરામ કે દિવસના અંત સુધી પહોંચતાં પિરિયડ ટૂંકો થાય છે. આગળ વધતાં પહેલાં પંક્તિઓ તપાસો.
Holidays annotate the selected calendar week. Your recurring weekly timetable stays intact.|छुट्टियाँ चुने सप्ताह पर नोट हैं। नियमित साप्ताहिक सारणी नहीं बदलती।|રજાઓ પસંદ કરેલા અઠવાડિયાની નોંધ છે. નિયમિત સાપ્તાહિક સમયપત્રક બદલાતું નથી.
Your classes & batches|आपकी कक्षाएँ और बैच|તમારા વર્ગ અને બેચ
From Class 6-A to NEET Morning. Use the names that work for you.|कक्षा 6-A से NEET Morning तक। अपने अनुसार नाम रखें।|વર્ગ 6-Aથી NEET Morning સુધી. તમારા અનુકૂળ નામ રાખો.
02 / CLASSES|02 / कक्षाएँ|02 / વર્ગ
Class / batch name|कक्षा / बैच का नाम|વર્ગ / બેચનું નામ
Section (optional)|अनुभाग (वैकल्पिक)|વિભાગ (વૈકલ્પિક)
Add class|कक्षा जोड़ें|વર્ગ ઉમેરો
What will they learn?|वे क्या सीखेंगे?|તેઓ શું શીખશે?
Add any subject. Weekly requirements are set per class in Allocation.|कोई भी विषय जोड़ें। साप्ताहिक ज़रूरत आवंटन में हर कक्षा के लिए तय करें।|કોઈ પણ વિષય ઉમેરો. સાપ્તાહિક જરૂરિયાત ફાળવણીમાં દરેક વર્ગ માટે નક્કી કરો.
03 / SUBJECTS|03 / विषय|03 / વિષય
Subject name|विषय का नाम|વિષયનું નામ
Core / demanding subject|मुख्य / कठिन विषय|મુખ્ય / અઘરો વિષય
Add subject|विषय जोड़ें|વિષય ઉમેરો
The people behind each lesson|हर पाठ के पीछे शिक्षक|દરેક પાઠ પાછળ શિક્ષક
Choose subjects and availability. A teacher can teach across classes.|विषय और उपलब्धता चुनें। शिक्षक कई कक्षाएँ पढ़ा सकता है।|વિષય અને ઉપલબ્ધતા પસંદ કરો. શિક્ષક અનેક વર્ગોમાં ભણાવી શકે છે.
04 / TEACHERS|04 / शिक्षक|04 / શિક્ષક
Add subjects first so you can select what each teacher teaches.|पहले विषय जोड़ें, फिर शिक्षक के विषय चुनें।|પહેલાં વિષય ઉમેરો, પછી શિક્ષકના વિષય પસંદ કરો.
Teacher name|शिक्षक का नाम|શિક્ષકનું નામ
Subjects they can teach|पढ़ा सकने वाले विषय|ભણાવી શકે તેવા વિષય
Available days|उपलब्ध दिन|ઉપલબ્ધ દિવસો
Available periods (optional)|उपलब्ध पीरियड (वैकल्पिक)|ઉપલબ્ધ પિરિયડ (વૈકલ્પિક)
Leave all unchecked for every teaching period. The selected periods apply on each available day.|हर पीरियड के लिए सभी खाली छोड़ें। चुने पीरियड हर उपलब्ध दिन पर लागू हैं।|દરેક પિરિયડ માટે બધું ખાલી રાખો. પસંદ કરેલા પિરિયડ દરેક ઉપલબ્ધ દિવસે લાગુ છે.
Restrict to these periods|केवल इन पीरियड में|માત્ર આ પિરિયડમાં
Add teacher|शिक्षक जोड़ें|શિક્ષક ઉમેરો
A subject. A teacher. A weekly plan.|एक विषय। एक शिक्षक। साप्ताहिक योजना।|એક વિષય. એક શિક્ષક. સાપ્તાહિક યોજના.
Set the required lessons for each class. Daily limits are enforced, including manual edits.|हर कक्षा के पाठ तय करें। हाथ से बदलाव में भी दैनिक सीमाएँ लागू हैं।|દરેક વર્ગના પાઠ નક્કી કરો. જાતે કરેલા ફેરફારોમાં પણ દૈનિક મર્યાદા લાગુ છે.
05 / ALLOCATION|05 / आवंटन|05 / ફાળવણી
Class / batch|कक्षा / बैच|વર્ગ / બેચ
Subject|विषय|વિષય
Teacher|शिक्षक|શિક્ષક
Required periods / week|आवश्यक पीरियड / सप्ताह|જરૂરી પિરિયડ / અઠવાડિયું
Maximum periods / day|अधिकतम पीरियड / दिन|મહત્તમ પિરિયડ / દિવસ
Double periods allowed|दोहरा पीरियड मान्य|જોડિયા પિરિયડ માન્ય
Add allocation|आवंटन जोड़ें|ફાળવણી ઉમેરો
Your week, thoughtfully arranged|सोच-समझकर बनाई आपकी सप्ताह योजना|સમજીને ગોઠવેલું તમારું અઠવાડિયું
All required lessons. No teacher clashes. Breaks kept free.|सभी आवश्यक पाठ। शिक्षक का समय नहीं टकराता। विराम खाली।|બધા જરૂરી પાઠ. શિક્ષકનો સમય ટકરાતો નથી. વિરામ ખાલી.
Generate timetable|समय-सारणी बनाएँ|સમયપત્રક બનાવો
Teaching periods / day|पढ़ाई के पीरियड / दिन|ભણાવવાના પિરિયડ / દિવસ
Required lessons / week|आवश्यक पाठ / सप्ताह|જરૂરી પાઠ / અઠવાડિયું
Before you generate|बनाने से पहले|બનાવતાં પહેલાં
Enter the institute name.|संस्था का नाम भरें।|સંસ્થાનું નામ ભરો.
Enable working days and configure teaching periods.|कार्यदिवस चालू करें और पढ़ाई के पीरियड तय करें।|કામના દિવસો ચાલુ કરો અને ભણાવવાના પિરિયડ નક્કી કરો.
Add classes and subject allocations.|कक्षाएँ और विषय आवंटन जोड़ें।|વર્ગ અને વિષયની ફાળવણી ઉમેરો.
A clear week is a click away|एक क्लिक में स्पष्ट सप्ताह योजना|એક ક્લિકમાં સ્પષ્ટ સાપ્તાહિક યોજના
Your generated timetable will appear here. Free periods stay visibly empty.|बनाई सारणी यहाँ दिखेगी। खाली पीरियड साफ़ दिखेंगे।|બનાવેલું સમયપત્રક અહીં દેખાશે. ખાલી પિરિયડ સ્પષ્ટ દેખાશે.
Teacher workload|शिक्षक का कार्यभार|શિક્ષકનો કાર્યભાર
Based on your allocations and available teaching slots. Holiday annotations do not change recurring workload.|आवंटन और उपलब्ध समय पर आधारित। छुट्टी की टिप्पणियाँ नियमित कार्यभार नहीं बदलतीं।|ફાળવણી અને ઉપલબ્ધ સમય પર આધારિત. રજાની નોંધ નિયમિત કાર્યભાર બદલતી નથી.
Creates an optional, dated cover sheet using qualified, available teachers. The weekly timetable stays unchanged. Review suggestions before sharing; uncovered lessons are clearly marked.|योग्य उपलब्ध शिक्षकों से वैकल्पिक, तारीख वाली प्रतिस्थापन सूची बनती है। साप्ताहिक सारणी नहीं बदलती। साझा करने से पहले सुझाव देखें; बिना शिक्षक के पाठ स्पष्ट हैं।|લાયક ઉપલબ્ધ શિક્ષકોથી વૈકલ્પિક, તારીખવાળી અવેજી યાદી બને છે. સાપ્તાહિક સમયપત્રક બદલાતું નથી. શેર કરતાં પહેલાં સૂચનો જુઓ; શિક્ષક વિનાના પાઠ સ્પષ્ટ છે.
`;
export const publicPlanningCopy=Object.freeze(Object.fromEntries(rows.trim().split('\n').map(row=>{const parts=row.split('|');if(parts.length!==3||parts.some(p=>!p))throw Error('Incomplete planning interface translation');return [parts[0],parts.slice(1)];})));
