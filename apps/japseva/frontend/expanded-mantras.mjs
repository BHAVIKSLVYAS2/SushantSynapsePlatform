// Traditional short nama invocations; editorial meanings and unaccented aids.
const reference='https://www.australiancouncilofhinduclergy.com/uploads/5/5/4/9/5549439/asthottara_sangraha.pdf';
// key, names, Sanskrit dative, IAST, English/Gujarati reading aids, referents.
const rows=[
 ['surya','Surya · Sun','सूर्य','સૂર્ય','सूर्याय','sūryāya','soor-yaa-ya','સૂર્-યા-ય','Surya, the Sun','सूर्य देव','સૂર્ય દેવ'],
 ['chandra','Chandra · Moon','चन्द्र','ચંદ્ર','चन्द्राय','candrāya','chan-draa-ya','ચન્-દ્રા-ય','Chandra, the Moon','चन्द्र देव','ચંદ્ર દેવ'],
 ['mangala','Mangala · Mars','मंगल','મંગળ','मङ्गलाय','maṅgalāya','mang-ga-laa-ya','મઙ્-ગ-લા-ય','Mangala, the deity associated with Mars','मंगल देव','મંગળ દેવ'],
 ['budha','Budha · Mercury','बुध','બુધ','बुधाय','budhāya','bu-dhaa-ya','બુ-ધા-ય','Budha, the deity associated with Mercury','बुध देव','બુધ દેવ'],
 ['brihaspati','Brihaspati · Jupiter','बृहस्पति','બૃહસ્પતિ','बृहस्पतये','bṛhaspataye','bri-has-pa-ta-ye','બૃ-હસ્-પ-ત-યે','Brihaspati, teacher of the devas and deity associated with Jupiter','देवगुरु बृहस्पति','દેવગુરુ બૃહસ્પતિ'],
 ['shukra','Shukra · Venus','शुक्र','શુક્ર','शुक्राय','śukrāya','shuk-raa-ya','શુક્-રા-ય','Shukra, the deity associated with Venus','शुक्र देव','શુક્ર દેવ'],
 ['shani','Shani · Saturn','शनि','શનિ','शनैश्चराय','śanaiścarāya','sha-naish-cha-raa-ya','શ-નૈશ્-ચ-રા-ય','Shanaishchara (Shani), the deity associated with Saturn','शनैश्चर (शनि) देव','શનૈશ્ચર (શનિ) દેવ'],
 ['rahu','Rahu · Ascending lunar node','राहु','રાહુ','राहवे','rāhave','raa-ha-ve','રા-હ-વે','Rahu, the ascending lunar node personified in the Navagraha tradition','राहु देव','રાહુ દેવ'],
 ['ketu','Ketu · Descending lunar node','केतु','કેતુ','केतवे','ketave','ke-ta-ve','કે-ત-વે','Ketu, the descending lunar node personified in the Navagraha tradition','केतु देव','કેતુ દેવ'],
 ['saraswati','Saraswati','सरस्वती','સરસ્વતી','सरस्वत्यै','sarasvatyai','sa-ras-vat-yai','સ-રસ્-વત્-યૈ','Saraswati, goddess of learning and speech','विद्या और वाणी की देवी सरस्वती','વિદ્યા અને વાણીનાં દેવી સરસ્વતી'],
 ['lakshmi','Lakshmi','लक्ष्मी','લક્ષ્મી','लक्ष्म्यै','lakṣmyai','laksh-myai','લક્ષ્-મ્યૈ','Lakshmi, goddess of prosperity and auspiciousness','समृद्धि और मंगल की देवी लक्ष्मी','સમૃદ્ધિ અને મંગળનાં દેવી લક્ષ્મી'],
 ['durga','Durga','दुर्गा','દુર્ગા','दुर्गायै','durgāyai','dur-gaa-yai','દુર્-ગા-યૈ','Durga, the protecting divine mother','जगन्माता दुर्गा','જગન્માતા દુર્ગા'],
 ['hanuman','Hanuman','हनुमान','હનુમાન','हनुमते','hanumate','ha-nu-ma-te','હ-નુ-મ-તે','Hanuman, revered for devotion, courage and service','भक्ति, साहस और सेवा के आदर्श हनुमान','ભક્તિ, સાહસ અને સેવાના આદર્શ હનુમાન'],
 ['rama','Rama','राम','રામ','रामाय','rāmāya','raa-maa-ya','રા-મા-ય','Rama, revered as an embodiment of dharma','धर्म के आदर्श भगवान राम','ધર્મના આદર્શ ભગવાન રામ'],
 ['krishna','Krishna','कृष्ण','કૃષ્ણ','कृष्णाय','kṛṣṇāya','krish-naa-ya','કૃષ્-ણા-ય','Krishna, the divine teacher and beloved Lord','भगवान और उपदेशक कृष्ण','ભગવાન અને ઉપદેશક કૃષ્ણ']
];
export const expandedMantras=rows.map(([key,en,hi,gu,sanskrit,iast,aid,aidGu,meaning],index)=>({
 id:(index<9?'navagraha-':'nama-')+key,
 name:index<9?`Navagraha · ${en}`:`${en} Nama Mantra`,
 searchTerms:index<9?'navgrah nav grah navagraha nav graha नव ग्रह નવ ગ્રહ':'',
 text:`ॐ ${sanskrit} नमः`,transliteration:`Om ${iast} namaḥ`,
 pronunciation:`Om | ${aid} | na-mah`,meaning:`Salutations to ${meaning}.`,
 source:`Traditional ${index<9?'Navagraha':'devotional'} nama invocation. Reference: corresponding deity namavali in Nāmāvali Saṅgraha, compiled by Pandit Sri Rama Ramanuja Achari. Short name invocation; not a bija mantra.`,sourceUrl:reference
}));
export const expandedLearning=Object.fromEntries(rows.map(([key,en,hi,gu,sanskrit,iast,aid,aidGu,meaning,meaningHi,meaningGu],index)=>[
 expandedMantras[index].id,{
  hi:index<9?`नवग्रह · ${hi}`:`${hi} नाम मंत्र`,gu:index<9?`નવગ્રહ · ${gu}`:`${gu} નામ મંત્ર`,
  meaningHi:`${meaningHi} को नमस्कार।`,meaningGu:`${meaningGu}ને નમસ્કાર.`,
  aidHi:`ॐ | ${sanskrit} | नमः`,aidGu:`ૐ | ${aidGu} | નમઃ`
 }
]));
