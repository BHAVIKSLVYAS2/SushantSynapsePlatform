import {calendarLocationResult} from './calendar-input.mjs';
import {parentPort,workerData} from 'node:worker_threads';
import {generateCalendar} from '../frontend/panchang.mjs';
import {generateObservances} from './observances.mjs';
try{
 const result=workerData.month?generateObservances(workerData):generateCalendar(workerData);
 if(!workerData.month)calendarLocationResult(result,workerData);
 parentPort.postMessage({result});
}catch(error){parentPort.postMessage({error:error.message});}
