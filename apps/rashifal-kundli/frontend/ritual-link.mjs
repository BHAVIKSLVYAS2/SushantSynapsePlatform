export const ritualGuideDestination='https://apps.sushantsynapse.com/ritual-assist';
const copy={en:['Open Ritual Assist preparation guides','Opens the existing public guide app without attaching your birth details. Its calendar keeps its own documented conventions; dates are not transferred.'],
 hi:['Ritual Assist तैयारी मार्गदर्शिकाएँ खोलें','जन्म विवरण जोड़े बिना मौजूदा सार्वजनिक मार्गदर्शिका खुलती है। उसका कैलेंडर अपनी घोषित पद्धति रखता है; तारीखें भेजी नहीं जातीं।'],
 gu:['Ritual Assist તૈયારી માર્ગદર્શિકા ખોલો','જન્મવિગતો જોડ્યા વિના હાલની જાહેર માર્ગદર્શિકા ખૂલે છે. તેનું કેલેન્ડર પોતાની જાહેર પદ્ધતિ રાખે છે; તારીખો મોકલાતી નથી.']};
export function ritualGuideLink(language='en'){
 const [title,notice]=copy[language]??copy.en,root=document.createElement('aside'),a=document.createElement('a'),p=document.createElement('p');
 root.className='vedic-ritual-link';a.id='vedic-ritual-guides';a.href=ritualGuideDestination;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';a.textContent=title;p.textContent=notice;root.append(a,p);return root;
}
