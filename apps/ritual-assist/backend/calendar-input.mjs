import {cities,validateInput} from '../frontend/panchang.mjs';
import {resolvePincode} from './pincode.mjs';
import {getPlace} from '../../../packages/vedic/places.mjs';
const northStates=new Set(['Delhi','Uttar Pradesh','Uttarakhand','Himachal Pradesh','Haryana','Punjab','Chandigarh','Rajasthan','Madhya Pradesh','Bihar','Jharkhand','Chhattisgarh','Jammu and Kashmir','Jammu & Kashmir']);
const north=new Set(['delhi','jaipur','lucknow','varanasi','patna','bhopal','chandigarh','shimla','dehradun','jammu','ranchi','raipur']);
export function calendarLocationResult(result,input){
 const location=input.selectedLocation||input.postal;
 if(location)result.data.location={...result.data.location,...location};
 result.calculation={locationBasis:input.selectedLocation?'Selected Indian city is used for death-day and observance timings; settlement coordinates are approximate':'Death PIN code area or selected city is also used as the observance location; coordinates are approximate',defaults:'Regional lunar-month label; civil death date is day 1; day 13 included',processing:'server',stored:false};
 return result;
}
export function calendarInput(input,now=Date.now()){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Enter calendar details');
 if(Object.keys(input).some(key=>!['date','time','pincode','city','placeId','calendar','counting','confirmedTithi','include13'].includes(key)))throw Error('Unsupported calendar detail');
 let selectedLocation=null;
 if(input.placeId!==undefined){
  if(typeof input.placeId!=='string'||input.pincode!==undefined||input.city!==undefined)throw Error('Choose one supported Indian city');
  const place=getPlace(input.placeId);selectedLocation={id:place.id,name:place.label,lat:place.latitude,lon:place.longitude,state:place.state,approximate:true,source:'GeoNames · CC BY 4.0',calendar:northStates.has(place.state)?'purnimanta':'amanta'};
 }
 const postal=input.pincode===undefined?null:resolvePincode(input.pincode);
 if(postal&&input.city!==undefined)throw Error('Use a PIN code without a city selector');
 if(!selectedLocation&&!postal&&!cities.some(city=>city.id===input.city))throw Error('Choose a supported Indian city or enter an Indian PIN code');
 if(typeof input.time!=='string'||!input.time)throw Error('Enter the death time in IST; do not guess an unknown time');
 if(input.include13!==undefined&&typeof input.include13!=='boolean')throw Error('Day 13 choice must be true or false');
 if(input.confirmedTithi!==undefined&&typeof input.confirmedTithi!=='string'&&typeof input.confirmedTithi!=='number')throw Error('Invalid confirmed tithi');
 const location=selectedLocation||postal;
 const normalized={date:input.date,time:input.time,city:location?'custom':input.city,...location?{lat:location.lat,lon:location.lon,...selectedLocation?{selectedLocation}:{postal}}: {},calendar:input.calendar|| (location?location.calendar:north.has(input.city)?'purnimanta':'amanta'),counting:input.counting||'civil',confirmedTithi:input.confirmedTithi||'',include13:input.include13!==false};
 validateInput(normalized,now);return normalized;
}
