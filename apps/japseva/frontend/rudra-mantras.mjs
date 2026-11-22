import {romanize,gujaratiScript} from './script-aids.mjs';

const study='https://www.advaita-vedanta.org/series/shri_rudram/verses_from_the_shri_rudram-1.htm';
const namakam='https://ganeshatemple.org/wp-content/uploads/2020/02/Sri_Rudram_Namakam_Devanagari_Large.pdf';
// Traditional text, original three-language summaries. These short selections
// are not a complete Shri Rudram, Namakam/Chamakam or ritual procedure.
const entries=[
 {
  id:'rudra-invocation',names:{en:'Rudrabhishek · Rudra Invocation',hi:'रुद्राभिषेक · रुद्र आवाहन मंत्र',gu:'રુદ્રાભિષેક · રુદ્ર આવાહન મંત્ર'},
  text:'ॐ नमो भगवते रुद्राय ॥',
  meanings:{en:'I bow to the divine Lord Rudra.',hi:'भगवान रुद्र को मेरा नमस्कार।',gu:'ભગવાન રુદ્રને મારા નમસ્કાર.'},
  categories:['nama'],sourceUrl:study,
  source:'Traditional invocation prefacing Shri Rudram; see the opening of the linked study text. A short invocation, not the full Rudrabhishek chant or a verse claimed from the Namakam itself.'
 },
 {
  id:'rudra-namaskara',names:{en:'Rudrabhishek · Namaste Astu Bhagavan',hi:'रुद्राभिषेक · नमस्ते अस्तु भगवन्',gu:'રુદ્રાભિષેક · નમસ્તે અસ્તુ ભગવન્'},
  text:'नमस्ते अस्तु भगवन् विश्वेश्वराय महादेवाय त्र्यम्बकाय त्रिपुरान्तकाय त्रिकाग्निकालाय कालाग्निरुद्राय नीलकण्ठाय मृत्युञ्जयाय सर्वेश्वराय सदाशिवाय श्रीमन्महादेवाय नमः ॥',
  meanings:{
   en:'Salutations to the blessed Lord: ruler of the universe, great and three-eyed deity, destroyer of Tripura, associated with the three fires and the fire of time, blue-throated, conqueror of death, lord of all, ever-auspicious Mahadeva.',
   hi:'भगवान को नमस्कार: विश्व के ईश्वर, महादेव, त्रिनेत्रधारी, त्रिपुर का अन्त करने वाले, तीन अग्नियों और कालाग्नि से सम्बद्ध रुद्र, नीलकण्ठ, मृत्यु पर विजय पाने वाले, सर्वेश्वर और सदाशिव महादेव को प्रणाम।',
   gu:'ભગવાનને નમસ્કાર: વિશ્વના ઈશ્વર, મહાદેવ, ત્રિનેત્રધારી, ત્રિપુરનો અંત કરનાર, ત્રણ અગ્નિ અને કાળાગ્નિ સાથે સંકળાયેલા રુદ્ર, નીલકંઠ, મૃત્યુ પર વિજય મેળવનાર, સર્વેશ્વર અને સદાશિવ મહાદેવને પ્રણામ.'
  },
  categories:['prayer'],sourceUrl:namakam,
  source:'Customary Rudra Namaskara printed after Namakam Anuvaka 1 in the linked temple text. This accompanying praise is distinguished from the numbered Taittiriya Samhita mantras. The optional Shankaraya insertion in some recensions is not included.'
 },
 {
  id:'rudram-namakam-opening',names:{en:'Shri Rudram · Namakam Opening (1.1–1.2)',hi:'श्रीरुद्रम् · नमकम् आरम्भिक अंश (१.१–१.२)',gu:'શ્રીરુદ્રમ્ · નમકમ્ પ્રારંભિક અંશ (૧.૧–૧.૨)'},
  text:'नमस्ते रुद्र मन्यव उतोत इषवे नमः ।\nनमस्ते अस्तु धन्वने बाहुभ्यामुत ते नमः ॥\n\nया त इषुः शिवतमा शिवं बभूव ते धनुः ।\nशिवा शरव्या या तव तया नो रुद्र मृडय ॥',
  meanings:{
   en:'Rudra, we bow to your wrath, arrow, bow and arms. May your arrow, bow and quiver be auspicious; through that gracious power, bring us well-being. This is only the first two verses of Namakam Anuvaka 1, not the complete Shri Rudram.',
   hi:'हे रुद्र, आपके क्रोध, बाण, धनुष और भुजाओं को नमस्कार। आपके बाण, धनुष और तरकश कल्याणकारी हों; उनके शुभ स्वरूप से हमें सुख दें। यह नमकम् के प्रथम अनुवाक की केवल पहली दो ऋचाएँ हैं, सम्पूर्ण श्रीरुद्रम् नहीं।',
   gu:'હે રુદ્ર, તમારા ક્રોધ, બાણ, ધનુષ અને ભુજાઓને નમસ્કાર. તમારા બાણ, ધનુષ અને ભાથું કલ્યાણકારી બને; તેમના શુભ સ્વરૂપથી અમને સુખ આપો. આ નમકમ્‌ના પ્રથમ અનુવાકની માત્ર પહેલી બે ઋચાઓ છે, સંપૂર્ણ શ્રીરુદ્રમ્ નથી.'
  },
  categories:['vedic'],sourceUrl:study,
  source:'Krishna Yajurveda, Taittiriya Samhita 4.5.1; Namakam Anuvaka 1, first two riks (1.1–1.2 in the linked study). Opening excerpt only; neither the complete first anuvaka nor the complete Namakam–Chamakam.',
  sourceReferences:[{title:'Temple Devanagari text with Vedic accents',url:namakam}]
 }
];

export const rudraMantras=entries.map(entry=>{
 const roman=romanize(entry.text);
 const verses=entry.id==='rudram-namakam-opening'?entry.text.split('\n\n').map((sanskrit,i)=>({sanskrit,meaning:i===0?{hi:'हे रुद्र, आपके क्रोध, बाण, धनुष और भुजाओं को नमस्कार।',en:'Rudra, salutations to your wrath, arrow, bow and arms.',gu:'હે રુદ્ર, તમારા ક્રોધ, બાણ, ધનુષ અને ભુજાઓને નમસ્કાર.'}:{hi:'आपके बाण, धनुष और तरकश कल्याणकारी हों; उस शुभ शक्ति से हमें सुख दें।',en:'May your arrow, bow and quiver be auspicious; through their gracious power, bring us well-being.',gu:'તમારા બાણ, ધનુષ અને ભાથું કલ્યાણકારી બને; તે શુભ શક્તિથી અમને સુખ આપો.'}})):undefined;
 return {...entry,...(verses?{verses}:{}),name:entry.names.en,meaning:entry.meanings.en,meaningHi:entry.meanings.hi,meaningGu:entry.meanings.gu,
  transliteration:roman,pronunciation:roman,aids:{en:roman,hi:entry.text,gu:gujaratiScript(entry.text)},topic:'shiva',
  searchTerms:'rudrabhishek rudrabhisheka rudra abhishek rudra abhishekam rudrabhishekam rudram rudrapath rudri रुद्राभिषेक रुद्र अभिषेक રુદ્રાભિષેક રુદ્ર અભિષેક',
  source:entry.source+' Unaccented reading aid; Vedic pitch accents are not represented. Learn Vedic recitation with a trained teacher. Meanings are editorial summaries; pronunciation review pending.'
 };
});
