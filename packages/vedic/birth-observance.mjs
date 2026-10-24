import {panchangForBirth} from './birth-panchang.mjs';
import {amantaMonthAtInstant,lunarPhaseCrossings,lunarCalendarModel} from './lunar-calendar.mjs';
import {resolveAstronomyTime} from './astronomy-time.mjs';
import {sunriseOnCivilDay} from './panchang-observer.mjs';
import {getPlace} from './places.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';
import {birthdayRule,selectSunriseObservance} from './observance-rule.mjs';
export {birthdayRule,selectSunriseObservance} from './observance-rule.mjs';
const day=86400000,offset=19800000;

export function yearlyTithiCandidates(input,options,context){
 fields(options,['year','observancePlaceId','ruleId','adhikaPolicy']);
 if(options.ruleId!==birthdayRule.id)fail('MODEL_UNAVAILABLE');
 if(!Number.isInteger(options.year)||options.year<1951||options.year>2097)fail('OUT_OF_RANGE');
 if(!['regular-only','include-adhika'].includes(options.adhikaPolicy))fail();
 const source=panchangForBirth(input,context),birth=source.birth;
 const birthMonth=amantaMonthAtInstant({utcInstant:birth.utcInstant}),tithi=source.panchang.atInstant.limbs.tithi.number;
 const place=getPlace(options.observancePlaceId),year=options.year;
 const startUtc=`${year}-01-01T00:00:00Z`,endUtc=`${year+1}-01-01T00:00:00Z`;
 const start=resolveAstronomyTime({timeScale:'UTC',utcInstant:startUtc}).ttJulianDay-3;
 const end=resolveAstronomyTime({timeScale:'UTC',utcInstant:endUtc}).ttJulianDay+2;
 const roots=lunarPhaseCrossings({startTtJulianDay:start,endTtJulianDay:end,phaseDegrees:(tithi-1)*12});
 const rows=[],warnings=new Set([...source.warnings,...birthMonth.warnings,'SUNRISE_REFERENCE_DISCREPANCY_UNRESOLVED','OBSERVANCE_RULE_REVIEW_PENDING']);
 for(const root of roots.events){
  const ending=lunarPhaseCrossings({startTtJulianDay:root.upperTtJulianDay,endTtJulianDay:root.upperTtJulianDay+2,phaseDegrees:tithi*12%360}).events[0];
  if(!ending)fail('COMPUTATION_LIMIT');
  const middle=new Date((Date.parse(root.utcInstant)+Date.parse(ending.utcInstant))/2).toISOString();
  const month=amantaMonthAtInstant({utcInstant:middle});
  if(month.number!==birthMonth.number||(month.adhika&&options.adhikaPolicy==='regular-only'))continue;
  for(const w of [...root.warnings,...ending.warnings,...month.warnings])warnings.add(w);
  const firstDate=new Date(Date.parse(root.lowerUtcInstant)+offset-day).toISOString().slice(0,10);
  const lastDate=new Date(Date.parse(ending.utcInstant)+offset+day).toISOString().slice(0,10);
  const sunrises=[];
  for(let ms=Date.parse(firstDate+'T00:00Z');ms<=Date.parse(lastDate+'T00:00Z');ms+=day){
   const localDate=new Date(ms).toISOString().slice(0,10),rise=sunriseOnCivilDay({localDate,timeZoneId:place.timeZoneId,latitude:place.latitude,longitude:place.longitude});
   for(const w of rise.warnings)warnings.add(w);sunrises.push({localDate,milliseconds:Date.parse(rise.utcInstant)});
  }
  const selection=selectSunriseObservance({startMilliseconds:Date.parse(root.utcInstant),endMilliseconds:Date.parse(ending.utcInstant),sunrises,guardMilliseconds:300500});
  // Include edge cases that touch the requested local year even if no day is selected.
  const localBounds=[root.utcInstant,ending.utcInstant].map(s=>new Date(Date.parse(s)+offset).toISOString().slice(0,10));
  if(![...localBounds,...selection.sunriseDates].some(s=>s.startsWith(String(year))))continue;
  rows.push({month:{number:month.number,name:month.name,adhika:month.adhika},tithi,start:root,end:ending,...selection,
   selectedDate:selection.selectedDate?.startsWith(String(year))?selection.selectedDate:null});
 }
 return freeze({contractVersion:'vedic-birthday-candidates-1',rule:birthdayRule,calendarModel:lunarCalendarModel,
  year,place:{id:place.id,label:place.label,timeZoneId:place.timeZoneId},adhikaPolicy:options.adhikaPolicy,
  birthMonth:{number:birthMonth.number,name:birthMonth.name,adhika:birthMonth.adhika},tithi,occurrences:rows,warnings:[...warnings]});
}
