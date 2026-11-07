import {emptyState,validateBackup} from './engine.mjs';
const NAME='synapse-rozhisab',VERSION=1;
let database;
export async function openStore(){
 if(database)return database;if(!globalThis.indexedDB)throw Error('Local storage is unavailable');
 database=await new Promise((resolve,reject)=>{const r=indexedDB.open(NAME,VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('workspace'))r.result.createObjectStore('workspace');};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close other RozHisab tabs to upgrade storage'));r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();database=null;};resolve(r.result);};});return database;
}
export async function read(){const db=await openStore();return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readonly'),r=tx.objectStore('workspace').get('state');tx.oncomplete=()=>{try{resolve(r.result?validateBackup(r.result):emptyState());}catch(error){reject(error);}};tx.onerror=()=>reject(tx.error);});}
export async function write(next,expected){
 const db=await openStore();return new Promise((resolve,reject)=>{let conflict=false;const tx=db.transaction('workspace','readwrite'),store=tx.objectStore('workspace'),r=store.get('state');r.onsuccess=()=>{if((r.result?.revision||0)!==expected){conflict=true;tx.abort();return;}store.put(next,'state');};tx.oncomplete=()=>resolve(next);tx.onabort=()=>reject(conflict?Error('Data changed in another tab. Reload and try again.'):tx.error||Error('Could not save locally'));tx.onerror=()=>{};});
}
export async function replace(input,expected){const next=validateBackup(input);next.revision=expected+1;return write(next,expected);}
