import {getPlace} from '../../../packages/vedic/places.mjs';
const states=[
 ['Jammu and Kashmir','जम्मू और कश्मीर','જમ્મુ અને કાશ્મીર'],['Tamil Nadu','तमिलनाडु','તમિલનાડુ'],['Nagaland','नागालैंड','નાગાલૅન્ડ'],['Uttar Pradesh','उत्तर प्रदेश','ઉત્તર પ્રદેશ'],['Telangana','तेलंगाना','તેલંગાણા'],['Maharashtra','महाराष्ट्र','મહારાષ્ટ્ર'],['Karnataka','कर्नाटक','કર્ણાટક'],['Andhra Pradesh','आंध्र प्रदेश','આંધ્ર પ્રદેશ'],['Haryana','हरियाणा','હરિયાણા'],['Rajasthan','राजस्थान','રાજસ્થાન'],['Bihar','बिहार','બિહાર'],['Madhya Pradesh','मध्य प्रदेश','મધ્ય પ્રદેશ'],['Gujarat','गुजरात','ગુજરાત'],['Kerala','केरल','કેરળ'],['Puducherry','पुदुचेरी','પુડુચેરી'],['Goa','गोवा','ગોવા'],['Uttarakhand','उत्तराखंड','ઉત્તરાખંડ'],['Punjab','पंजाब','પંજાબ'],['Himachal Pradesh','हिमाचल प्रदेश','હિમાચલ પ્રદેશ'],['Chhattisgarh','छत्तीसगढ़','છત્તીસગઢ'],['West Bengal','पश्चिम बंगाल','પશ્ચિમ બંગાળ'],['Manipur','मणिपुर','મણિપુર'],['Assam','असम','આસામ'],['Tripura','त्रिपुरा','ત્રિપુરા'],['Meghalaya','मेघालय','મેઘાલય'],['Odisha','ओडिशा','ઓડિશા'],['Arunachal Pradesh','अरुणाचल प्रदेश','અરુણાચલ પ્રદેશ'],['Jharkhand','झारखंड','ઝારખંડ'],['Dadra and Nagar Haveli and Daman and Diu','दादरा और नगर हवेली और दमन और दीव','દાદરા અને નગર હવેલી અને દમણ અને દીવ'],['Mizoram','मिज़ोरम','મિઝોરમ'],['Delhi','दिल्ली','દિલ્હી'],['Andaman and Nicobar','अंडमान और निकोबार','આંદામાન અને નિકોબાર'],['Ladakh','लद्दाख','લદ્દાખ'],['Sikkim','सिक्किम','સિક્કિમ'],['Chandigarh','चंडीगढ़','ચંડીગઢ']
];
export const stateTranslations=Object.freeze(Object.fromEntries(states.map(([en,hi,gu])=>[en,{en,hi,gu}])));
export function placeLabel(value,language='en'){
 const place=value.aliases?value:getPlace(value.id);if(language==='en')return place.label;
 const script=language==='hi'?/[\u0900-\u097f]/u:/[\u0a80-\u0aff]/u;
 const native=place.aliases.find(name=>script.test(name));
 // Sourced native aliases only; always retain canonical city spelling for review.
 return `${native?native+' ('+place.name+')':place.name}, ${stateTranslations[place.state]?.[language]??place.state}, ${language==='hi'?'भारत':'ભારત'}`;
}
export function relabelPlaces(select,language){for(const option of select.options)if(option.value.startsWith('geonames:'))option.textContent=placeLabel(getPlace(option.value),language);}
