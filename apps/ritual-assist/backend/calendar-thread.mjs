import {parentPort,workerData} from 'node:worker_threads';
import {generateCalendar} from '../frontend/panchang.mjs';
try{const result=generateCalendar(workerData);if(workerData.postal){result.data.location={...result.data.location,...workerData.postal};}result.calculation={locationBasis:'Death PIN code area is also used as the observance location; postal coordinates are approximate',defaults:'Regional lunar-month label; civil death date is day 1; day 13 included',processing:'server',stored:false};parentPort.postMessage({result});}catch(error){parentPort.postMessage({error:error.message});}
