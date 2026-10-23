import {resolvePincode} from './pincode.mjs';
export const firstYear=2025,lastYear=2030;
export function observanceInput(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Enter calendar details');
 if(Object.keys(input).some(key=>!['month','pincode','calendar','tradition'].includes(key)))throw Error('Unsupported calendar detail');
 if(typeof input.month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.month)||+input.month.slice(0,4)<firstYear||+input.month.slice(0,4)>lastYear)throw Error(`Choose a month from ${firstYear} to ${lastYear}`);
 if(input.calendar!==undefined&&!['amanta','purnimanta'].includes(input.calendar))throw Error('Choose Amanta or Purnimanta');
 if(input.tradition!==undefined&&input.tradition!=='smarta')throw Error('Only the Smarta household planning policy is supported');
 const location=resolvePincode(input.pincode);
 return {month:input.month,location,calendar:input.calendar||location.calendar,tradition:'smarta'};
}
