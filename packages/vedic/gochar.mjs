import {classifySidereal,normalizeDegrees,sectorBoundaryDistances} from './angles.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';
const bodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Rahu','Ketu'];
export const gocharModel=freeze({id:'gochar-whole-sign-reference-1',counting:'reference sign is 1; forward zodiacal signs are 2..12',
 references:['moon','lagna'],coordinate:'geocentric sidereal longitude, existing IN_LAHIRI_DEFAULT_V1',
 nearBoundaryGuardArcsec:61,displacement:'shortest signed endpoint difference [-180,180); not travelled distance, velocity or retrograde',
 releaseStatus:'internal-candidate-reference-acceptance-pending'});
function positions(value){
 if(!Array.isArray(value)||value.length<1||value.length>9)fail();
 const seen=new Set();for(const p of value){fields(p,['body','siderealLongitude']);if(!bodies.includes(p.body)||seen.has(p.body)||typeof p.siderealLongitude!=='number'||!Number.isFinite(p.siderealLongitude)||p.siderealLongitude<0||p.siderealLongitude>=360)fail();seen.add(p.body);}
 return value;
}
export function relativeSignCount(input){
 fields(input,['rashi','referenceRashi']);if(![input.rashi,input.referenceRashi].every(n=>Number.isInteger(n)&&n>=1&&n<=12))fail();
 return (input.rashi-input.referenceRashi+12)%12+1;
}
export function gocharPlacements(input){
 fields(input,['positions','referenceKind','referenceRashi']);
 if(!gocharModel.references.includes(input.referenceKind))fail('MODEL_UNAVAILABLE');
 relativeSignCount({rashi:1,referenceRashi:input.referenceRashi});
 const rows=positions(input.positions).map(p=>{const rashi=classifySidereal(p.siderealLongitude).rashi,
  nearBoundary=sectorBoundaryDistances(p.siderealLongitude).rashiArcsec<=gocharModel.nearBoundaryGuardArcsec;
  return {body:p.body,siderealLongitude:p.siderealLongitude,rashi,nearBoundary,
   relativeHouse:nearBoundary?null:relativeSignCount({rashi,referenceRashi:input.referenceRashi}),
   status:nearBoundary?'near-model-boundary':'nominal-sign-count'};
 });
 return freeze({model:gocharModel,referenceKind:input.referenceKind,referenceRashi:input.referenceRashi,rows,
  warnings:['GOCHAR_SNAPSHOT_NOT_CONTINUOUS_TRANSIT','REFERENCE_SIGN_NOT_A_NEW_LAGNA','INDEPENDENT_GOCHAR_ACCEPTANCE_PENDING']});
}
export function compareSiderealPositions(input){
 fields(input,['birthPositions','explorationPositions']);const birth=positions(input.birthPositions),current=positions(input.explorationPositions);
 if(birth.length!==current.length||birth.some(p=>!current.some(c=>c.body===p.body)))fail();
 return freeze(current.map(p=>{const original=birth.find(b=>b.body===p.body);return {body:p.body,birthRashi:classifySidereal(original.siderealLongitude).rashi,
  explorationRashi:classifySidereal(p.siderealLongitude).rashi,birthLongitude:original.siderealLongitude,explorationLongitude:p.siderealLongitude,
  signedEndpointDifference:normalizeDegrees(p.siderealLongitude-original.siderealLongitude+180)-180};}));
}
