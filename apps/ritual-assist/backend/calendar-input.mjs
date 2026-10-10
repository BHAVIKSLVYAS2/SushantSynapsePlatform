import {cities,validateInput} from '../frontend/panchang.mjs';
import {resolvePincode} from './pincode.mjs';
const north=new Set(['delhi','jaipur','lucknow','varanasi','patna','bhopal','chandigarh','shimla','dehradun','jammu','ranchi','raipur']);
export function calendarInput(input,now=Date.now()){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Enter calendar details');
 if(Object.keys(input).some(key=>!['date','time','pincode','city','calendar','counting','confirmedTithi','include13'].includes(key)))throw Error('Unsupported calendar detail');
 const postal=input.pincode===undefined?null:resolvePincode(input.pincode);
 if(postal&&input.city!==undefined)throw Error('Use a PIN code without a city selector');
 if(!postal&&!cities.some(city=>city.id===input.city))throw Error('Enter an Indian PIN code');
 if(typeof input.time!=='string'||!input.time)throw Error('Enter the death time in IST; do not guess an unknown time');
 if(input.include13!==undefined&&typeof input.include13!=='boolean')throw Error('Day 13 choice must be true or false');
 if(input.confirmedTithi!==undefined&&typeof input.confirmedTithi!=='string'&&typeof input.confirmedTithi!=='number')throw Error('Invalid confirmed tithi');
 const normalized={date:input.date,time:input.time,city:postal?'custom':input.city,...postal?{lat:postal.lat,lon:postal.lon,postal}: {},calendar:input.calendar|| (postal?postal.calendar:north.has(input.city)?'purnimanta':'amanta'),counting:input.counting||'civil',confirmedTithi:input.confirmedTithi||'',include13:input.include13!==false};
 validateInput(normalized,now);return normalized;
}
