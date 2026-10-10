import {readFileSync} from 'node:fs';
const dataset=JSON.parse(readFileSync(new URL('../data/india-pincodes.json',import.meta.url),'utf8'));
const north=new Set(['Delhi','Uttar Pradesh','Uttarakhand','Himachal Pradesh','Haryana','Punjab','Chandigarh','Rajasthan','Madhya Pradesh','Bihar','Jharkhand','Chhattisgarh','Jammu & Kashmir']);
export function resolvePincode(value){
 if(typeof value!=='string'||! /^[1-9]\d{5}$/.test(value))throw Error('Enter a six-digit Indian PIN code');
 const entry=dataset.entries[value];
 if(!entry)throw Error('This PIN code is not in the location directory. Check the PIN code; no nearby city has been substituted.');
 if(!entry.usable)throw Error('Location coordinates for this PIN code are inconsistent. An authoritative local Panchang is required; no nearby city has been substituted.');
 return {...entry,pincode:value,name:[entry.district||entry.place,entry.state,value].join(' · '),calendar:north.has(entry.state)?'purnimanta':'amanta',source:'GeoNames postal coordinates · CC BY 4.0',approximate:true};
}
