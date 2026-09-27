import {generate} from './engine.js';
self.onmessage=({data})=>{try{self.postMessage(generate(data));}catch{self.postMessage({ok:false,errors:['Generation failed. Check the setup and try again.']});}};
