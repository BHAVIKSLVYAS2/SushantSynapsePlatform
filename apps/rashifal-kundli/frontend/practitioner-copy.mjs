export const practitionerCopy={
 en:{workspace:'Jyotish workspace',grahas:'Graha Spashta',degrees:'Degree in sign',expand:'Expand chart',collapse:'Close expanded chart',notes:'Chart notation & calculation limits',lagna:'Lagna',current:'Current Dasha',asOf:'As of',next:'Next transition',report:'Report',more:'More',source:'D1 source position',precision:'Degrees are shown to completed arcseconds; sign assignments use the original precision.'},
 hi:{workspace:'ज्योतिष कार्यक्षेत्र',grahas:'ग्रह स्पष्ट',degrees:'राशि में अंश',expand:'चार्ट बड़ा करें',collapse:'बड़ा चार्ट बंद करें',notes:'चार्ट संकेत और गणना सीमाएँ',lagna:'लग्न',current:'वर्तमान दशा',asOf:'स्थिति दिनांक',next:'अगला परिवर्तन',report:'रिपोर्ट',more:'अन्य',source:'D1 मूल स्थिति',precision:'अंश पूरे चापसेकंड तक दिखाए गए हैं; राशि का निर्धारण मूल सटीक मान से होता है।'},
 gu:{workspace:'જ્યોતિષ કાર્યક્ષેત્ર',grahas:'ગ્રહ સ્પષ્ટ',degrees:'રાશિમાં અંશ',expand:'ચાર્ટ મોટો કરો',collapse:'મોટો ચાર્ટ બંધ કરો',notes:'ચાર્ટ સંકેતો અને ગણના મર્યાદા',lagna:'લગ્ન',current:'વર્તમાન દશા',asOf:'સ્થિતિ તારીખ',next:'આગળનો ફેરફાર',report:'રિપોર્ટ',more:'અન્ય',source:'D1 મૂળ સ્થિતિ',precision:'અંશ પૂર્ણ ચાપસેકંડ સુધી દર્શાવ્યા છે; રાશિની ગણતરી મૂળ ચોક્કસ મૂલ્યથી થાય છે.'}
};
const abbreviations={hi:{Sun:'सू',Moon:'चं',Mercury:'बु',Venus:'शु',Mars:'मं',Jupiter:'गु',Saturn:'श',Rahu:'रा',Ketu:'के'},gu:{Sun:'સૂ',Moon:'ચં',Mercury:'બુ',Venus:'શુ',Mars:'મં',Jupiter:'ગુ',Saturn:'શ',Rahu:'રા',Ketu:'કે'}};
export const grahaCode=(body,code,language)=>abbreviations[language]?.[body]??code;
export const exactBoundaryLabel={en:'Exact period boundaries',hi:'दशा परिवर्तन का सटीक समय',gu:'દશા પરિવર્તનનો ચોક્કસ સમય'};
export const workspaceSections={
 en:{advanced:'Vargas & strength',checks:'Traditional checks',sensitivity:'Birth-time sensitivity',transits:'Time Machine'},
 hi:{advanced:'वर्ग और बल',checks:'पारंपरिक जाँच',sensitivity:'जन्म-समय संवेदनशीलता',transits:'टाइम मशीन'},
 gu:{advanced:'વર્ગ અને બળ',checks:'પરંપરાગત તપાસ',sensitivity:'જન્મ-સમય સંવેદનશીલતા',transits:'ટાઇમ મશીન'}
};
// Truncate display only, so a value just below a boundary never appears in the
// next sign. Neither chart membership nor calculation values are modified.
export function signDms(longitude){
 if(!Number.isFinite(longitude))throw new TypeError('Finite longitude required');
 const seconds=Math.min(107999,Math.floor((((longitude%30)+30)%30)*3600+1e-7));
 return `${Math.floor(seconds/3600)}° ${String(Math.floor(seconds%3600/60)).padStart(2,'0')}′ ${String(seconds%60).padStart(2,'0')}″`;
}
