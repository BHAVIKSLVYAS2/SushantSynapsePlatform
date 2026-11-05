// Remember only canonical form fields, never results, free-text searches or GPS.
const scopes={
 remembrance:{date:validDate,time:value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value),placeId:validPlace,
  calendar:value=>['','amanta','purnimanta'].includes(value),counting:value=>['civil','sunrise'].includes(value),
  confirmedTithi:value=>value===''||/^(?:[1-9]|[12]\d|30)$/.test(value),include13:value=>typeof value==='boolean'},
 observances:{placeId:validPlace,month:value=>/^20(?:2[5-9]|30)-(?:0[1-9]|1[0-2])$/.test(value),
  calendar:value=>['','amanta','purnimanta'].includes(value)}
};
function validPlace(value){return value===''||/^geonames:[1-9]\d{0,11}$/.test(value);}
function validDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1950-01-01')return false;
 const date=new Date(value+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function fields(scope,input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid saved fields');
 const result={};for(const [key,validate]of Object.entries(scopes[scope])){
  const value=input[key];if(value===undefined)continue;
  if(key==='include13'){if(validate(value))result[key]=value;}
  else if(typeof value==='string'&&value.length<=40&&(value===''||validate(value)))result[key]=value;
 }return result;
}
export function createCalendarInputMemory(scope,storage=()=>globalThis.localStorage){
 if(!Object.hasOwn(scopes,scope))throw Error('Unknown calendar form');
 const key='synapse-ritual-'+scope+'-inputs-v1';let values={},status='ready',lastRaw=null;
 try{
  const raw=storage().getItem(key);if(raw!==null){
   if(raw.length>4096)throw Error('Invalid saved fields');
   const parsed=JSON.parse(raw);if(parsed?.version!==1)throw Error('Invalid saved fields');
   values=fields(scope,parsed.fields);lastRaw=raw;
  }
 }catch(error){status=error instanceof SyntaxError||error?.message==='Invalid saved fields'?'invalid':'unavailable';}
 return {
  get values(){return {...values};},get status(){return status;},
  save(input){
   if(status!=='ready')return false;
   const next=fields(scope,input),raw=JSON.stringify({version:1,fields:next});
   try{if(raw!==lastRaw)storage().setItem(key,raw);values=next;lastRaw=raw;return true;}
   catch{status='unavailable';return false;}
  },
  clear(){
   try{storage().removeItem(key);values={};lastRaw=null;status='ready';return true;}
   catch{status='unavailable';return false;}
  }
 };
}

export function calendarMemoryCopy(language,status){
 const hi=language==='hi';
 if(status==='invalid')return hi?'पुराने सहेजे हुए विवरण पढ़े नहीं जा सके और बदले नहीं गए। फिर से सहेजने के लिए सहेजे फ़ील्ड साफ करें।':'Previous saved fields could not be read and were kept unchanged. Clear saved fields to start saving again.';
 if(status!=='ready')return hi?'ब्राउज़र में सहेजना उपलब्ध नहीं है। अभी के बदलाव इसी टैब में रहेंगे।':'Browser saving is unavailable. Current edits stay in this tab.';
 return hi?'इसी ब्राउज़र में याद रहेगा · कोई डिवाइस सिंक या अपने आप गणना नहीं।':'Remembered in this browser · no device sync or automatic calculation.';
}
