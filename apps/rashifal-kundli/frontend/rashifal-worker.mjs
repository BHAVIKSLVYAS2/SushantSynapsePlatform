import {createRashifalService} from './rashifal-service.mjs';
const service=createRashifalService();
self.addEventListener('message',event=>{
 const message=event.data;
 if(message?.type==='clear'){service.clear();return;}
 try{self.postMessage({id:message.id,result:service.getReading(message.input,message.context)});}
 catch(error){self.postMessage({id:message.id,error:error.code||'MODEL_UNAVAILABLE'});}
});
