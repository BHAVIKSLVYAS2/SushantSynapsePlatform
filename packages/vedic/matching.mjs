import {classifySidereal} from './angles.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';
import {matchingRulebook,requireMatchingRulebook} from './rulebooks.mjs';
// Factual numeric tables, independently versioned from astronomical kernels.
// Group indices are chart symbols, never a person's caste or social identity.
const varna=[3,2,1,4,3,2,1,4,3,2,1,4];
const vashya=[1,1,0,2,1,0,0,3,1,2,2,2],vashyaNames=['dvipada','chatushpada','jalachara','keeta'];
const vashyaPoints=[[2,.5,.5,1],[.5,2,2,2],[.5,2,2,2],[1,2,2,2]];
const yoni=[0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
const yoniNames=['horse','elephant','sheep','serpent','dog','cat','rat','cow','buffalo','tiger','hare','monkey','mongoose','lion'];
// Lower triangle plus explicit directional overrides: do not silently repair
// the printed horse/hare and buffalo/lion disagreements between opposite cells.
const yoniTriangle=[[4],[2,4],[2,3,4],[3,3,2,4],[2,2,1,2,4],[2,2,2,1,2,4],[2,2,1,1,1,0,4],[1,2,3,1,2,2,2,4],[0,3,3,1,2,2,2,3,4],[1,1,1,2,1,1,2,0,1,4],[1,2,2,2,0,3,2,3,2,1,4],[3,3,0,2,2,3,2,2,2,1,2,4],[2,2,3,0,1,2,1,2,2,2,2,3,4],[1,0,1,2,1,1,2,1,2,1,1,2,2,4]];
const yoniScore=(row,column)=>row===0&&column===10?3:row===8&&column===13?1:yoniTriangle[Math.max(row,column)][Math.min(row,column)];
const lord=[2,5,3,1,0,3,5,2,4,6,6,4],lordNames=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
const maitri=[[5,5,5,4,5,0,0],[5,5,4,1,4,.5,.5],[5,4,5,.5,5,3,.5],[4,1,.5,5,.5,5,4],[5,4,5,.5,5,.5,3],[0,.5,3,5,.5,5,5],[0,.5,.5,4,3,5,5]];
const gana=[0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0],ganaNames=['deva','manushya','rakshasa'];
const ganaPoints=[[6,5,1],[6,6,0],[0,0,6]];
const nadi=[0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2],nadiNames=['adi','madhya','antya'];
const count=(a,b,size)=>(b-a+size)%size+1;
export function ashtakoota(input){
 fields(input,['personAMoonLongitude','personBMoonLongitude','rulebookId']);requireMatchingRulebook(input.rulebookId);
 const a=classifySidereal(input.personAMoonLongitude),b=classifySidereal(input.personBMoonLongitude),ar=a.rashi-1,br=b.rashi-1,an=a.nakshatra-1,bn=b.nakshatra-1;
 const components=[];function row(id,maximum,score,factors,definition,sourceId){components.push({id,maximum,score,factors,definition,sourceId});}
 row('varna',1,varna[ar]>=varna[br]?1:0,{personA:'V'+varna[ar],personB:'V'+varna[br]},'1 if chart-group index A >= B, else 0; no identity or human rank inferred','DP-VARNA');
 row('vashya',2,vashyaPoints[vashya[br]][vashya[ar]],{personA:vashyaNames[vashya[ar]],personB:vashyaNames[vashya[br]]},'Four full-sign classes; B row, A column. Half-sign variants are not applied.','TTC-METHOD');
 const ab=(count(a.nakshatra,b.nakshatra,27)-1)%9+1,ba=(count(b.nakshatra,a.nakshatra,27)-1)%9+1;
 row('tara',3,([ab,ba].filter(x=>![3,5,7].includes(x)).length)*1.5,{aToB:ab,bToA:ba},'Inclusive cyclic counts reduced to 1..9; each direction outside 3/5/7 earns 1.5.','TTC-METHOD');
 const ya=yoni[an],yb=yoni[bn];row('yoni',4,yoniScore(yb,ya),{personA:yoniNames[ya],personB:yoniNames[yb]},'Printed Raman table 2, B row/A column; asymmetric horse/hare and buffalo/lion cells retained.','RAMAN-YONI');
 row('graha-maitri',5,maitri[lord[br]][lord[ar]],{personA:lordNames[lord[ar]],personB:lordNames[lord[br]]},'Moon-sign lords, natural-friendship point table; temporary friendship excluded.','TTC-METHOD');
 row('gana',6,ganaPoints[gana[bn]][gana[an]],{personA:ganaNames[gana[an]],personB:ganaNames[gana[bn]]},'Directional lookup: B row, A column. Symbol names do not classify personality.','TTC-METHOD');
 const separation=count(b.rashi,a.rashi,12);row('bhakoot',7,[2,5,6,8,9,12].includes(separation)?0:7,{bToA:separation,aToB:count(a.rashi,b.rashi,12)},'0 for relative sign pairs 2/12, 5/9 or 6/8; otherwise 7. No cancellation.','TTC-METHOD');
 row('nadi',8,nadi[an]===nadi[bn]?0:8,{personA:nadiNames[nadi[an]],personB:nadiNames[nadi[bn]]},'Same symbolic group 0, different group 8. No health, hereditary or fertility inference.','TTC-METHOD');
 const total=components.reduce((sum,c)=>sum+c.score,0);if(total<0||total>36||components.some(c=>!Number.isFinite(c.score)||c.score<0||c.score>c.maximum))fail('MODEL_UNAVAILABLE');
 return freeze({contractVersion:'vedic-ashtakoota-1',rulebook:matchingRulebook,personA:{rashi:a.rashi,nakshatra:a.nakshatra,pada:a.pada},personB:{rashi:b.rashi,nakshatra:b.nakshatra,pada:b.pada},components,total,maximum:36,
  assessment:'withheld-no-marriage-verdict',precision:'nominal-longitude-input; caller must enforce birth admission',exceptions:'not-evaluated-raw-total-only'});
}
