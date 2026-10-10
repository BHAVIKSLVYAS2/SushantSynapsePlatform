import {generateCalendar} from './panchang.mjs';
self.onmessage=event=>{try{self.postMessage({result:generateCalendar(event.data)});}catch(error){self.postMessage({error:error instanceof Error?error.message:String(error)});}};
