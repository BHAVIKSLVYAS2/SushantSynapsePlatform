import {empty,validate} from './engine.mjs';
let database;
export async function open(){
 if(database)return database;if(!globalThis.indexedDB)throw Error('Browser storage is unavailable. Enable storage to save your rental records.');
 return new Promise((resolve,reject)=>{const r=indexedDB.open('synapse-kiraya-saathi',2);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('workspace'))r.result.createObjectStore('workspace');};r.onblocked=()=>reject(Error('Close other Kiraya Saathi tabs and retry.'));r.onerror=()=>reject(r.error);r.onsuccess=()=>{database=r.result;database.onversionchange=()=>{database.close();database=null;};resolve(database);};});
}
export async function read(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('workspace'),r=tx.objectStore('workspace').get('state');tx.oncomplete=()=>{try{resolve(r.result?validate(r.result):empty());}catch(e){reject(e);}};tx.onerror=()=>reject(tx.error);});}
export async function write(next,expected){const checked=validate(next),db=await open();return new Promise((resolve,reject)=>{let conflict=false;const tx=db.transaction('workspace','readwrite'),store=tx.objectStore('workspace'),r=store.get('state');r.onsuccess=()=>{if((r.result?.revision||0)!==expected){conflict=true;tx.abort();return;}store.put(checked,'state');};tx.oncomplete=()=>resolve(checked);tx.onerror=()=>{};tx.onabort=()=>reject(conflict?Error('Records changed in another tab. Reload before saving again.'):tx.error||Error('Could not save in this browser.'));});}
export async function restore(input,expected){const s=validate(input);s.revision=expected+1;return write(s,expected);}
