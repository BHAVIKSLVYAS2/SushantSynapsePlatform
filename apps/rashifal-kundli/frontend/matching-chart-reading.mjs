import {birthChartForBirth} from '../../../packages/vedic/birth-chart.mjs';
import {VedicInputError,fail} from '../../../packages/vedic/diagnostics.mjs';
import {signRulers} from './kundli-reading.mjs';
import {bodyName,signName} from './locale.mjs';
import {kundliPlacementText} from './planet-reading.mjs';

// Separate from the 36-point calculation: never adjust its score or promote a
// geometric placement into a Manglik, marriage-success or timing verdict.
export function buildMatchingChartContext({consent,inputs},context){
 if(consent!==true)fail('CONSENT_REQUIRED');
 return inputs.map(input=>{
  try{
   const {chart}=birthChartForBirth(input,context),house=chart.houses.find(h=>h.houseNumber===7),ruler=signRulers[house.rashi-1],lord=chart.planets.find(p=>p.body===ruler);
   return {status:'available',rising:chart.ascendant.rashi,
    seventh:{house:7,sign:house.rashi,ruler,rulerHouse:lord.houseNumber,rulerSign:lord.rashi,occupants:[...house.bodies]},
    planets:['Venus','Mars'].map(body=>{const p=chart.planets.find(p=>p.body===body);return {body,house:p.houseNumber,sign:p.rashi};})};
  }catch(error){if(!(error instanceof VedicInputError)||error.code!=='UNSTABLE_BIRTH_TIME')throw error;return {status:'unavailable'};}
 });
}
const copy={
 en:{title:'Partnership placements in both charts',note:'Alongside the Moon-based points, compare the seventh house and its ruler, plus the actual Venus and Mars placements below. These are admitted whole-sign birth-chart positions, not additional guna points.',person:['Person A','Person B'],rising:sign=>'The Ascendant is '+sign+'.',seventh:sign=>'The seventh house, traditionally associated with partnership, is in '+sign+'.',planet:(name,sign,house)=>name+' is in '+sign+' in house '+house+'.',unavailable:'House-based context is withheld because the recorded minute is too close to a sign or Ascendant boundary under the current calculation screen. The Moon-based comparison retains its own availability checks.',limit:'The placements are a starting point for a fuller review. Aspects, planetary strength, Navamsa, Mangal cancellation rules and combined Dasha timing have not been assessed here.'},
 hi:{title:'दोनों कुंडलियों में साझेदारी के ग्रह संकेत',note:'चंद्रमा पर आधारित गुणों के साथ सप्तम भाव और उसके स्वामी तथा नीचे दी गई शुक्र और मंगल की वास्तविक स्थिति भी देखें। ये जाँची गई पूर्ण-राशि जन्म कुंडली की स्थितियाँ हैं, अतिरिक्त गुण नहीं।',person:['व्यक्ति A','व्यक्ति B'],rising:sign=>'लग्न '+sign+' है।',seventh:sign=>'साझेदारी से जुड़ा सप्तम भाव '+sign+' राशि में है।',planet:(name,sign,house)=>name+', '+sign+' राशि में भाव '+house+' में हैं।',unavailable:'दर्ज मिनट लग्न या राशि की सीमा के पास होने से वर्तमान गणना-जाँच में भाव आधारित संदर्भ रोका गया है। चंद्रमा पर आधारित मिलान की उपलब्धता अपनी अलग जाँच के अनुसार रहती है।',limit:'ये स्थितियाँ विस्तृत समीक्षा का आधार हैं। यहाँ दृष्टि, ग्रह बल, नवांश, मंगल दोष निवारण और दोनों की संयुक्त दशा का आकलन नहीं हुआ है।'},
 gu:{title:'બંને કુંડળીમાં ભાગીદારીના ગ્રહ સંકેત',note:'ચંદ્ર આધારિત ગુણ સાથે સાતમો ભાવ અને તેના સ્વામી તથા નીચે આપેલી શુક્ર અને મંગળની વાસ્તવિક સ્થિતિ પણ જુઓ. આ તપાસેલી પૂર્ણ-રાશિ જન્મ કુંડળીની સ્થિતિઓ છે, વધારાના ગુણ નહીં.',person:['વ્યક્તિ A','વ્યક્તિ B'],rising:sign=>'લગ્ન '+sign+' છે.',seventh:sign=>'ભાગીદારી સાથે જોડાયેલો સાતમો ભાવ '+sign+' રાશિમાં છે.',planet:(name,sign,house)=>name+', '+sign+' રાશિમાં ભાવ '+house+'માં છે.',unavailable:'નોંધાયેલો મિનિટ લગ્ન કે રાશિની સીમા પાસે હોવાથી હાલની ગણતરીની તપાસમાં ભાવ આધારિત સંદર્ભ રોક્યો છે. ચંદ્ર આધારિત મિલાનની ઉપલબ્ધતા તેની અલગ તપાસ મુજબ રહે છે.',limit:'આ સ્થિતિઓ વિસ્તૃત સમીક્ષાનો આધાર છે. અહીં દૃષ્ટિ, ગ્રહ બળ, નવાંશ, મંગળ દોષ નિવારણ અને બંનેની સંયુક્ત દશાનું મૂલ્યાંકન થયું નથી.'}
};
export function matchingChartReading(contexts,language){
 const t=copy[language];
 return {title:t.title,note:t.note,limit:t.limit,people:contexts.map((value,index)=>({title:t.person[index],status:value.status,
  paragraphs:value.status==='available'?[t.rising(signName(value.rising,language)),t.seventh(signName(value.seventh.sign,language)),...kundliPlacementText(value.seventh,language),...value.planets.map(p=>t.planet(bodyName(p.body,language),signName(p.sign,language),p.house))]:[t.unavailable]}))};
}
