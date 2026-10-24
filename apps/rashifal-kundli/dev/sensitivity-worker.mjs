import {sensitivityForBirth} from '../../../packages/vedic/birth-sensitivity.mjs';
self.onmessage=event=>{try{self.postMessage({result:sensitivityForBirth(event.data.input,{now:event.data.now})});}
 catch(error){self.postMessage({code:typeof error?.toJSON==='function'?error.toJSON().code:'COMPUTATION_LIMIT'});}};
