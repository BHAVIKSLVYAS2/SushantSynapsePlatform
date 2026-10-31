import {getPlace} from '../../../packages/vedic/places.mjs';
const northStates=new Set(['Delhi','Uttar Pradesh','Uttarakhand','Himachal Pradesh','Haryana','Punjab','Chandigarh','Rajasthan','Madhya Pradesh','Bihar','Jharkhand','Chhattisgarh','Jammu and Kashmir','Jammu & Kashmir']);
export function resolveCalendarCity(id){
 if(typeof id!=='string')throw Error('Choose a supported Indian city');
 const place=getPlace(id);
 return {id:place.id,name:place.label,lat:place.latitude,lon:place.longitude,state:place.state,approximate:true,source:'GeoNames · CC BY 4.0',calendar:northStates.has(place.state)?'purnimanta':'amanta'};
}
