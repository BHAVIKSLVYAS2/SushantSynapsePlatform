import {classifySidereal} from './angles.mjs';
import {fields,fail,freeze,plainObject} from './diagnostics.mjs';
const dataObject=value=>plainObject(value)&&Reflect.ownKeys(value).every(key=>Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'));
export const advancedVargaModels=freeze(Object.fromEntries([
 ['D7',7,'odd-self-even-seventh','6.2.7 / example 14'],
 ['D10',10,'odd-self-even-ninth','6.2.10 / example 17'],
 ['D12',12,'all-self','6.2.12 / example 19']
].map(([chartType,divisions,method,locator])=>[chartType,{id:`parasari-${chartType.toLowerCase()}-half-open-v1`,chartType,divisions,method,
 source:{title:'P.V.R. Narasimha Rao: Vedic Astrology, An Integrated Approach',url:'https://vedicastrologer.org/articles/vedic_astro_textbook.pdf',locator},
 boundaries:'canonical sign*30 + division*30/N; start inclusive, end exclusive',
 releaseStatus:'internal-candidate-individual-algorithm-signoff-pending',coordinateKind:'divisional-sign-not-physical-longitude'}])));
export function advancedDivisionForLongitude(input){
 fields(input,['chartType','siderealLongitude']);if(!Object.hasOwn(advancedVargaModels,input.chartType))fail('MODEL_UNAVAILABLE');
 const model=advancedVargaModels[input.chartType],source=classifySidereal(input.siderealLongitude),s=source.rashi-1,n=model.divisions;
 // Compare the original angle to canonical boundaries. Multiplying or taking
 // a remainder first can round an adjacent representable float across a cusp.
 const boundaries=Array.from({length:n+1},(_,i)=>s*30+i*30/n);let index=0;
 while(index+1<n&&source.longitude>=boundaries[index+1])index++;
 const even=source.rashi%2===0,offset=even?(n===7?6:n===10?8:0):0;
 const distance=Math.max(0,Math.min(source.longitude-boundaries[index],boundaries[index+1]-source.longitude))*3600;
 return freeze({sourceSiderealLongitude:source.longitude,sourceRashi:source.rashi,divisionWithinRashi:index+1,
  rashi:(s+offset+index)%12+1,boundaryDistanceArcsec:distance,nearBoundary:distance<=61,coordinateKind:model.coordinateKind});
}
export function advancedChartFromD1(input){
 fields(input,['chartType','d1']);const {d1,chartType}=input;if(!Object.hasOwn(advancedVargaModels,chartType))fail('MODEL_UNAVAILABLE');
 if(!dataObject(d1)||d1.chartType!=='D1'||d1.houseSystem!=='whole-sign'||!dataObject(d1.ascendant))fail();
 const ascendant=advancedDivisionForLongitude({chartType,siderealLongitude:d1.ascendant.siderealLongitude});
 if(!Array.isArray(d1.planets)||d1.planets.length!==9)fail();const seen=new Set();
 const planets=Array.from(d1.planets,p=>{if(!dataObject(p)||!['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Rahu','Ketu'].includes(p.body)||seen.has(p.body))fail();seen.add(p.body);
  const division=advancedDivisionForLongitude({chartType,siderealLongitude:p.siderealLongitude});return {body:p.body,kind:p.kind,...division,houseNumber:(division.rashi-ascendant.rashi+12)%12+1};});
 const houses=Array.from({length:12},(_,i)=>({houseNumber:i+1,rashi:(ascendant.rashi-1+i)%12+1,bodies:planets.filter(p=>p.houseNumber===i+1).map(p=>p.body)}));
 return freeze({contractVersion:'vedic-advanced-varga-1',chartType,houseSystem:'whole-sign',model:advancedVargaModels[chartType],ascendant,planets,houses,
  precisionClass:'nominal-divisional-signs-only',warnings:['DIVISIONAL_SIGNS_NOT_PHYSICAL_LONGITUDES','INDIVIDUAL_ALGORITHM_SIGNOFF_PENDING']});
}
