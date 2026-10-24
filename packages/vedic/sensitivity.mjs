import {siderealSnapshot} from './sidereal.mjs';
import {lagnaAtInstant} from './lagna.mjs';
import {resolveAstronomyTime} from './astronomy-time.mjs';
import leaps from './data/leap-seconds.json' with {type:'json'};
import {vimshottariModel} from './dasha.mjs';
import {coverSectorInterval,summarizeSectorCover} from './interval-sectors.mjs';
import {fields,fail,freeze,VedicInputError} from './diagnostics.mjs';
export const sensitivityModel=freeze({id:'birth-interval-enclosures-candidate-1',maximumEvaluations:4096,maximumCellsPerBody:4096,minimumWindowMilliseconds:5000,
 planetRateDegreesPerDay:24,guardArcsec:61,obliquityLimitDegrees:26,siderealRateDegreesPerDay:370,obliquityRateDegreesPerDay:1,ayanamshaRateDegreesPerDay:1,
 boundStatus:'declared-conservative-candidate-bounds-not-independently-certified',
 meaning:'complete interval enclosure cover conditional on rate/guard assumptions; not certified physical birth stability',
 timePolicy:'withhold UTC leap/model-offset steps and January windows of delta-T polynomial join years',
 releaseStatus:'internal-candidate-independent-bound-and-source-acceptance-pending'});
const bodies=['Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Rahu','Ketu'];
const unsupported=code=>({status:'unsupported',scope:'conditional-on-declared-rate-and-model-guards',possibleValues:[],provedValues:[],possibleBoundaryWindows:[],diagnostic:{code}});
const aggregate=list=>list.some(c=>c.status==='changes-within-interval')?'changes-within-interval':list.every(c=>c.status==='stable')?'stable':'unsupported';

export function analyzeSensitivityInterval(input){
 fields(input,['startUtc','endUtc','endInclusive','latitude','longitude','elevationMetres','calculationProfileId']);
 if(input.calculationProfileId!=='IN_LAHIRI_DEFAULT_V1')fail('MODEL_UNAVAILABLE');
 const first=resolveAstronomyTime({timeScale:'UTC',utcInstant:input.startUtc}),last=resolveAstronomyTime({timeScale:'UTC',utcInstant:input.endUtc});
 const start=Date.parse(first.utcInstant),end=Date.parse(last.utcInstant);
 if(end<=start||end-start>86400000||typeof input.endInclusive!=='boolean')fail('OUT_OF_RANGE');
 if(!Number.isFinite(input.latitude)||Math.abs(input.latitude)>90||!Number.isFinite(input.longitude)||Math.abs(input.longitude)>180||!Number.isFinite(input.elevationMetres)||input.elevationMetres< -500||input.elevationMetres>9000)fail();
 if(leaps.entries.some(e=>Date.parse(e.effectiveUtc)>start&&Date.parse(e.effectiveUtc)<=end))fail('TIME_DATA_UNAVAILABLE');
 // DeltaT uses an approximate-year polynomial switch near mid-January. A whole
 // January guard is intentionally conservative; no derivative bound spans a join.
 for(const year of [1961,1986,2005,2050])if(start<Date.parse(`${year}-02-01T00:00Z`)&&end>=Date.parse(`${year}-01-01T00:00Z`))fail('TIME_DATA_UNAVAILABLE');
 const cache=new Map(),warnings=new Set([...first.warnings,...last.warnings,'SENSITIVITY_BOUNDS_NOT_INDEPENDENTLY_CERTIFIED','NO_REPRESENTATIVE_BIRTH_INSTANT','PRECISE_INTERVAL_CHARTS_AND_DASHA_WITHHELD']);
 function at(time){if(!cache.has(time)){if(cache.size>=sensitivityModel.maximumEvaluations)fail('COMPUTATION_LIMIT');const utcInstant=new Date(time).toISOString();
   const positions=siderealSnapshot({timeScale:'UTC',utcInstant,calculationProfileId:input.calculationProfileId});for(const w of positions.warnings)warnings.add(w);
   cache.set(time,{positions});}return cache.get(time);}
 function lagna(time){const entry=at(time);if(!entry.lagna){entry.lagna=lagnaAtInstant({timeScale:'UTC',utcInstant:new Date(time).toISOString(),latitude:input.latitude,longitude:input.longitude,elevationMetres:input.elevationMetres,calculationProfileId:input.calculationProfileId});for(const w of entry.lagna.warnings)warnings.add(w);}return entry.lagna.siderealLongitude;}
 function cover(sample,rate){return coverSectorInterval({startMilliseconds:start,endMilliseconds:end,endInclusive:input.endInclusive,maximumRateDegreesPerDay:rate,guardArcsec:sensitivityModel.guardArcsec,
  minimumWindowMilliseconds:sensitivityModel.minimumWindowMilliseconds,maximumCells:sensitivityModel.maximumCellsPerBody},sample);}
 const partitions={},planetRashis={},planetD9={};
 function planet(body){const c=cover(time=>at(time).positions.positions.find(p=>p.body===body).siderealLongitude,24);partitions[body]=c;
  planetRashis[body]=summarizeSectorCover(c,{sectorCount:12});planetD9[body]=summarizeSectorCover(c,{sectorCount:108,mapping:'navamsa'});}
 planet('Moon');
 let lagnaRashi,lagnaD9,lagnaRate=null;
 try{const phi=Math.abs(input.latitude)*Math.PI/180,minimumNorm=Math.cos(phi+26*Math.PI/180);if(minimumNorm<=1e-6)fail('LAGNA_UNAVAILABLE');
  // Argument sensitivity <= |v'|/|v|. theta <=370 deg/day, epsilon <=1,
  // ayanamsha <=1 are declared candidate envelopes, not accepted physical bounds.
  lagnaRate=(370*Math.cos(phi)+2)/minimumNorm+1;
  const c=cover(lagna,lagnaRate);lagnaRashi=summarizeSectorCover(c,{sectorCount:12});lagnaD9=summarizeSectorCover(c,{sectorCount:108,mapping:'navamsa'});
 }catch(error){if(!(error instanceof VedicInputError))throw error;lagnaRashi=unsupported(error.code);lagnaD9=unsupported(error.code);}
 for(const body of bodies.slice(1)){try{planet(body);}catch(error){if(!(error instanceof VedicInputError))throw error;planetRashis[body]=unsupported(error.code);planetD9[body]=unsupported(error.code);}}
 const moonNakshatra=summarizeSectorCover(partitions.Moon,{sectorCount:27}),moonPada=summarizeSectorCover(partitions.Moon,{sectorCount:108,mapping:'pada'});
 const lords=vimshottariModel.lords;let remainingYearsRange=null;
 if(moonNakshatra.status==='stable'){const n=moonNakshatra.possibleValues[0]-1,origin=n*360/27,width=360/27;
  let low=width,high=0;for(const c of partitions.Moon.cells){const relative=c.angle-origin;low=Math.min(low,relative-c.radiusDegrees);high=Math.max(high,relative+c.radiusDegrees);}
  const years=lords[n%9].years;remainingYearsRange=[Math.max(0,years*(1-high/width)),Math.min(years,years*(1-low/width))];
 }
 const dasha={status:moonNakshatra.status,scope:'birth-lord-only; balance varies across interval',possibleLords:[...new Set(moonNakshatra.possibleValues.map(n=>lords[(n-1)%9].lord))],remainingYearsRange,
  timeline:'withheld-no-single-birth-epoch',yearConventionId:vimshottariModel.yearConventionId};
 return freeze({contractVersion:'vedic-sensitivity-1',model:sensitivityModel,
  interval:{startUtc:first.utcInstant,endUtc:last.utcInstant,endInclusive:input.endInclusive},
  moonRashi:planetRashis.Moon,moonNakshatra,moonPada,lagnaRashi,lagnaD9,planetRashis,planetD9,dasha,
  d1:{status:aggregate([lagnaRashi,...Object.values(planetRashis)]),scope:'sign/house occupancy only, no exact longitude or representative chart'},
  d9:{status:aggregate([lagnaD9,...Object.values(planetD9)]),scope:'divisional signs only, no representative chart'},
  bounds:{planetRateDegreesPerDay:24,lagnaRateDegreesPerDay:lagnaRate,guardArcsec:61},evaluations:cache.size,
  warnings:[...warnings],presentation:'interval-only; existing precise-chart admission unchanged'});
}
