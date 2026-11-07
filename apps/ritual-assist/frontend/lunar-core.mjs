// Astronomy primitives shared by remembrance and public observance calendars.
// All dates in this app are India/IST; no network or persistent state is used.
import {Body,Observer,MoonPhase,SearchMoonPhase,SearchRiseSet} from './astronomy-engine.mjs';
import {DAY,IST,localDate,midnight,addDays,BOUNDARY_GUARD} from './calendar-display.mjs';
export {DAY,IST,localDate,midnight,addDays,BOUNDARY_GUARD};
export function tithiAt(value){return Math.floor(MoonPhase(new Date(value))/12)+1;}
export function phase(angle,start,days){const value=SearchMoonPhase(angle,new Date(start),days);if(!value)throw Error('Lunar boundary could not be resolved');return +value.date;}
export function tithiWindow(value){
 const number=tithiAt(value),start=phase((number-1)*12,value,-3),end=phase(number*12%360,value,3);
 if(start>value+1000||end<value-1000)throw Error('Tithi boundary is unresolved');return {number,start,end};
}
export function nextTithi(window){const number=window.number%30+1;return {number,start:window.end,end:phase(number*12%360,window.end+1000,3)};}
export function daylight(date,location){
 const start=midnight(date),observer=new Observer(location.lat,location.lon,location.height||0),rise=SearchRiseSet(Body.Sun,observer,1,new Date(start),1),set=SearchRiseSet(Body.Sun,observer,-1,new Date(start),1);
 if(!rise||!set||set.date<=rise.date)throw Error('Local sunrise/sunset is unavailable');
 const sunrise=+rise.date,sunset=+set.date,length=sunset-sunrise;
 return {date,sunrise,sunset,aparahnaStart:sunrise+length*.6,aparahnaEnd:sunrise+length*.8};
}
export function moonrise(date,location){
 const start=midnight(date),rise=SearchRiseSet(Body.Moon,new Observer(location.lat,location.lon,location.height||0),1,new Date(start),1);
 return rise&&+rise.date<start+DAY?+rise.date:null;
}
