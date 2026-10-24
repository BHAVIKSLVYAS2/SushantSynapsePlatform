import {fields,fail,freeze} from './diagnostics.mjs';
export const birthdayRule=freeze({id:'AMANTA_FIRST_SUNRISE_SKIP_MISSING_V1',monthSystem:'Amanta',
 repeated:'first local sunrise within target Tithi',missing:'no date selected when Tithi touches no local sunrise',
 adhika:'caller must choose regular-only or include-adhika; birth adhika uses same named month',
 region:'Amanta exploration; not a universal regional birthday or ritual prescription',
 boundaryGuardSeconds:300,releaseStatus:'internal-candidate-observance-review-pending'});

export function selectSunriseObservance(input){
 fields(input,['startMilliseconds','endMilliseconds','sunrises','guardMilliseconds']);
 const {startMilliseconds:start,endMilliseconds:end,sunrises,guardMilliseconds:guard}=input;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end<=start||!Array.isArray(sunrises)||sunrises.length>5||!Number.isSafeInteger(guard)||guard<0)fail();
 for(const s of sunrises){fields(s,['milliseconds','localDate']);if(!Number.isSafeInteger(s.milliseconds)||typeof s.localDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s.localDate))fail();}
 const sorted=[...sunrises].sort((a,b)=>a.milliseconds-b.milliseconds);
 if(new Set(sorted.map(s=>s.localDate)).size!==sorted.length)fail();
 const dates=sorted.filter(s=>s.milliseconds>=start&&s.milliseconds<end).map(s=>s.localDate);
 const uncertain=sorted.some(s=>Math.abs(s.milliseconds-start)<=guard||Math.abs(s.milliseconds-end)<=guard);
 return freeze({status:uncertain?'boundary-uncertain':dates.length===0?'missing-at-sunrise':dates.length>1?'repeated-at-sunrise':'single-sunrise',
  sunriseDates:dates,selectedDate:uncertain?null:dates[0]??null});
}
