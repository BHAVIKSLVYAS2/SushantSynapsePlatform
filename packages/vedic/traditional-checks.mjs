import {classifySidereal} from './angles.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';
import {traditionalRulebook,requireTraditionalOptions} from './rulebooks.mjs';
const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const count=(from,to)=>(to-from+12)%12+1;
export function geometricTraditionalChecks(input){
 fields(input,['positions','lagnaLongitude','rulebookId','mangalVariant']);const houses=requireTraditionalOptions({rulebookId:input.rulebookId,mangalVariant:input.mangalVariant});
 if(!Array.isArray(input.positions)||input.positions.length!==9)fail();const signs={};
 for(const p of input.positions){fields(p,['body','siderealLongitude']);if(!bodies.includes(p.body)||Object.hasOwn(signs,p.body))fail();signs[p.body]=classifySidereal(p.siderealLongitude).rashi;}
 const lagna=input.lagnaLongitude===null?null:classifySidereal(input.lagnaLongitude).rashi;
 // Only nominal geometry. Birth callers apply their conservative minute screens.
 const budha=signs.Sun===signs.Mercury,gaja=count(signs.Moon,signs.Jupiter);
 return freeze({contractVersion:'vedic-geometric-rule-preview-1',rulebook:traditionalRulebook,
  yogas:[{id:'budha-aditya-base',status:'evaluated-geometric-base',patternMatches:budha,factors:{Sun:signs.Sun,Mercury:signs.Mercury},assessment:'withheld-review-and-qualifications-required'},
   {id:'gaja-kesari-base',status:'evaluated-geometric-base',patternMatches:[1,4,7,10].includes(gaja),factors:{Moon:signs.Moon,Jupiter:signs.Jupiter,jupiterFromMoon:gaja},assessment:'withheld-review-and-qualifications-required'}],
  mangal:{variant:input.mangalVariant,houses,references:[['lagna',lagna],['moon',signs.Moon],['venus',signs.Venus]].map(([reference,sign])=>sign===null?
   {reference,status:'unavailable',diagnostic:{code:'UNSTABLE_BIRTH_TIME'}}:
   {reference,status:'evaluated-geometric-base',marsFromReference:count(sign,signs.Mars),patternMatches:houses.includes(count(sign,signs.Mars))}),
   cancellation:'not-evaluated',assessment:'withheld-no-final-dosha-label'},
  precision:'nominal-whole-sign-geometry-only',warnings:['INDEPENDENT_RULEBOOK_REVIEW_PENDING','GEOMETRY_IS_NOT_A_PREDICTION','NO_SEVERITY_OR_REMEDY']});
}
