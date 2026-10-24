import {fields,fail,freeze} from './diagnostics.mjs';
export const matchingRulebook=freeze({id:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1',version:1,
 region:'North Indian eight-component framework; explicit composite tables, not a canonical school',
 reviewStatus:'internal-draft-independent-traditional-review-pending',
 axes:{personA:'traditional groom/column calculation axis',personB:'traditional bride/row calculation axis'},
 exceptionPolicy:'raw scores only; no cancellation or adjusted total',
 vashyaVariant:'four-class full-sign table published by Telugu Calendar; no 15-degree splits',
 yoniVariant:'Raman Muhurtha table 2 as printed; two asymmetric pairs retained, animal symbols only',
 sourceIds:['DP-VARNA','TTC-METHOD','RAMAN-YONI'],
 limitations:['not-a-marriage-verdict','not-a-health-fertility-or-personality-assessment','no-social-category-inferred','school-disagreements','independent-review-pending']});
export const ruleSources=freeze({
 'DP-VARNA':{title:'Drik Panchang: Varna Kuta calculation (formula only)',url:'https://www.drikpanchang.com/tutorials/jyotisha/kundali-match/ashta-kuta/varna-kuta.html',accessed:'2026-10-24'},
 'TTC-METHOD':{title:'Telugu Calendar: published engine tables, four-class Vashya and component rules',url:'https://thetelugucalendar.com/marriage-matching/method/',accessed:'2026-10-24',scope:'operator specification; classical print attribution not independently authenticated'},
 'RAMAN-YONI':{title:'B. V. Raman, Muhurtha, chapter XI, tables 1 and 2',url:'https://www.panchanga.lv/wp-content/uploads/2020/06/Muhurta_Raman.pdf',locator:'PDF pages 36 and 38 (zero based)',accessed:'2026-10-24'},
 'DP-MANGAL':{title:'Drik Panchang: Mangal house/reference variants',url:'https://www.drikpanchang.com/jyotisha/mangal-dosha/mangal-dosha-calculator.html',accessed:'2026-10-24',scope:'placement sets only; predictions and severity rejected'},
 'AS-BUDHA':{title:'Astro Saxena: Budh-Aditya geometric base and additional conditions',url:'https://www.astrosaxena.com/articles/budhaditya',accessed:'2026-10-24'},
 'RATH-GAJA':{title:'Sarbani Rath: Sakata, Mukuta and Gajakesari, differing qualifications',url:'https://sarbanirath.com/jyoti%E1%B9%A3a/advanced/saka%E1%B9%ADa-muku%E1%B9%ADa-gajakesari-yoga/',accessed:'2026-10-24'}
});
export const traditionalRulebook=freeze({id:'SYNAPSE_GEOMETRIC_RULE_PREVIEW_V1',version:1,
 reviewStatus:'internal-draft-independent-traditional-review-pending',
 scope:'geometric predicates only; final Yoga/Dosha assessment withheld',
 variants:{'mangal-five-first':[1,4,7,8,12],'mangal-five-second':[2,4,7,8,12],'mangal-six':[1,2,4,7,8,12]},
 rules:[{id:'budha-aditya-base',sourceId:'AS-BUDHA',definition:'Sun and Mercury occupy the same whole sign.',omissions:'combustion, degree orb, dignity, other occupants, aspects and activation not assessed'},
 {id:'gaja-kesari-base',sourceId:'RATH-GAJA',definition:'Jupiter is in sign 1, 4, 7 or 10 counted inclusively from the Moon.',omissions:'benefic qualifications, dignity, combustion, aspects and strength not assessed'},
 {id:'mangal-placement',sourceId:'DP-MANGAL',definition:'Mars occupies a selected listed sign-house from Lagna, Moon or Venus.',omissions:'cancellation and severity not assessed; no final Manglik label'}]});
export function requireMatchingRulebook(id){if(id!==matchingRulebook.id)fail('MODEL_UNAVAILABLE');return matchingRulebook;}
export function requireTraditionalOptions(input){fields(input,['rulebookId','mangalVariant']);if(input.rulebookId!==traditionalRulebook.id||!Object.hasOwn(traditionalRulebook.variants,input.mangalVariant))fail('MODEL_UNAVAILABLE');return traditionalRulebook.variants[input.mangalVariant];}
