import {createRashifalService} from './rashifal-service.mjs';
// Only generic sign/period/language requests cross this worker boundary.
export function createRashifalClient(){
 let worker=null,fallback=null,id=0,epoch=0,destroyed=false,transportFailed=false;const waiting=new Map();
 const locally=(input,context,generation)=>Promise.resolve().then(()=>{if(destroyed||generation!==epoch)throw Object.assign(new Error('Reading cleared'),{code:'MODEL_UNAVAILABLE'});fallback??=createRashifalService();return fallback.getReading(input,context);});
 try{worker=new Worker(new URL('./rashifal-worker.mjs',import.meta.url),{type:'module'});}catch{}
 if(worker){worker.onmessage=event=>{const pending=waiting.get(event.data.id);if(!pending)return;waiting.delete(event.data.id);if(event.data.error)pending.reject(Object.assign(new Error('Reading unavailable'),{code:event.data.error}));else pending.resolve(event.data.result);};
  worker.onerror=event=>{event.preventDefault();worker?.terminate();worker=null;transportFailed=true;for(const pending of waiting.values())pending.reject(Object.assign(new Error('Worker unavailable'),{code:'MODEL_UNAVAILABLE'}));waiting.clear();};
 }
 return {getReading(input,context){
  const generation=epoch;if(!worker)return locally(input,context,generation);
  return new Promise((resolve,reject)=>{const ticket=++id;waiting.set(ticket,{resolve,reject});worker.postMessage({id:ticket,input,context});}).catch(error=>{if(transportFailed&&!destroyed)return locally(input,context,generation);throw error;});
 },clear(){epoch++;worker?.postMessage({type:'clear'});fallback?.clear();},destroy(){destroyed=true;worker?.terminate();worker=null;fallback?.clear();for(const pending of waiting.values())pending.reject(Object.assign(new Error('Reading cleared'),{code:'MODEL_UNAVAILABLE'}));waiting.clear();}};
}
