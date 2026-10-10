import {parentPort,workerData} from 'node:worker_threads';
import {generateCalendar} from '../frontend/panchang.mjs';
try{const result=generateCalendar(workerData);result.calculation={locationBasis:'Death city is also used as the observance city',defaults:'Regional lunar-month label; civil death date is day 1; day 13 included',processing:'server',stored:false};parentPort.postMessage({result});}catch(error){parentPort.postMessage({error:error.message});}
