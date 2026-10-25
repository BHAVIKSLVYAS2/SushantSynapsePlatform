import {Body,Observer,SearchRiseSet} from './vendor/astronomy-engine-2.1.19.mjs';
import {resolveAstronomyTime,engineTime,civilInstantFromTT,J2000} from './astronomy-time.mjs';
import {civilDateMilliseconds,resolveCivilTime} from './civil-time.mjs';
import {sunriseOnCivilDay} from './panchang-observer.mjs';
import {getPlace} from './places.mjs';

const day=86400000,offset=19800000;
// Drik Panchang's published weekday tables. Day and night have different orders.
const dayOrder=['Udveg','Char','Labh','Amrit','Kaal','Shubh','Rog'];
const nightOrder=['Shubh','Amrit','Char','Rog','Kaal','Labh','Udveg'];
const dayStart=[0,3,6,2,5,1,4],nightStart=[0,2,4,6,1,3,5];
export const almanacModel={id:'ritvayam-daily-almanac-1',engine:'Astronomy Engine 2.1.19',
 horizon:'Upper limb, standard atmosphere, unobstructed horizon, sea level',
 source:'https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html?lang=en',
 limits:'Basic Choghadiya only; Vaar Vela, Kaal Vela, Kaal Ratri and Rahu Kaal overlays are not assessed.'};
export const istDate=now=>new Date(now+offset).toISOString().slice(0,10);
const shift=(date,n)=>new Date(civilDateMilliseconds(date)+n*day).toISOString().slice(0,10);
function eventOnDay(body,direction,localDate,place){
 const start=resolveCivilTime({localDate,localTime:'00:00',timeZoneId:'Asia/Kolkata'}).utcInstant;
 const startMs=Date.parse(start),endMs=startMs+day;
 const first=engineTime(resolveAstronomyTime({timeScale:'UTC',utcInstant:start}).ttJulianDay);
 const last=engineTime(resolveAstronomyTime({timeScale:'UTC',utcInstant:new Date(endMs).toISOString()}).ttJulianDay);
 const event=SearchRiseSet(body,new Observer(place.latitude,place.longitude,0),direction,first,last.ut-first.ut,0);
 if(!event)return null;
 const milliseconds=Date.parse(civilInstantFromTT(J2000+event.tt).utcInstant);
 return milliseconds>=startMs&&milliseconds<endMs?milliseconds:null;
}
function slots(start,end,weekday,night=false){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return [];
 const order=night?nightOrder:dayOrder,first=(night?nightStart:dayStart)[weekday];
 return Array.from({length:8},(_,i)=>({name:order[(first+i)%7],
  start:Math.round(start+(end-start)*i/8),end:Math.round(start+(end-start)*(i+1)/8),period:night?'night':'day'}));
}
export function currentChoghadiya(periods,now){return periods.find(slot=>now>=slot.start&&now<slot.end)||null;}
// Civil-day events remain independent: absence of a Moon event is normal on some dates.
export function dailyAlmanac({localDate,placeId}){
 const place=getPlace(placeId),weekday=new Date(civilDateMilliseconds(localDate)).getUTCDay();
 const site={latitude:place.latitude,longitude:place.longitude,timeZoneId:'Asia/Kolkata'};
 const sunrise=Date.parse(sunriseOnCivilDay({...site,localDate}).utcInstant);
 const sunset=eventOnDay(Body.Sun,-1,localDate,place);
 const nextSunrise=Date.parse(sunriseOnCivilDay({...site,localDate:shift(localDate,1)}).utcInstant);
 const previousDate=shift(localDate,-1),previousSunset=eventOnDay(Body.Sun,-1,previousDate,place);
 return {localDate,placeId,model:almanacModel,sunrise,sunset,
  moonrise:eventOnDay(Body.Moon,1,localDate,place),moonset:eventOnDay(Body.Moon,-1,localDate,place),
  day:slots(sunrise,sunset,weekday),night:slots(sunset,nextSunrise,weekday,true),
  previousNight:slots(previousSunset,sunrise,(weekday+6)%7,true),previousDate};
}
