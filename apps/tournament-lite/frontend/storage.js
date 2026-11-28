'use strict';
globalThis.TournamentLocal=(()=>{
 const key='synapse-tournament-lite-v1';let baseline;
 function read(){
  let raw;try{raw=localStorage.getItem(key);}catch{throw Error('Browser storage is unavailable. Enable storage to save tournaments.');}
  if(!raw)return {version:1,events:[]};
  try{const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.events)||data.events.some(e=>!e.id||!Number.isInteger(e.revision)||!e.data||!Array.isArray(e.data.participants)||!Array.isArray(e.data.matches)))throw Error();return data;}
  catch{throw Error('Saved tournaments could not be read. Existing data has not been overwritten.');}
 }
 const output=e=>({id:e.id,revision:e.revision,...TournamentEngine.view(e.data)});
 function load(){const state=read();baseline=localStorage.getItem(key);return {tournaments:state.events.map(output)};}
 function checkBaseline(){if(localStorage.getItem(key)!==baseline)throw Error('Tournaments changed in another tab. Refresh before saving again.');}
 function write(state){
  const raw=JSON.stringify(state);
  try{localStorage.setItem(key,raw);}catch{throw Error('Could not save tournament. Browser storage may be full or blocked. Your previous saved data is unchanged.');}
  baseline=raw;
 }
 function save(path,body){
  const state=read();checkBaseline();
  let event;if(!path){event={id:crypto.randomUUID(),revision:1,data:TournamentEngine.create(body)};state.events.push(event);}
  else{event=state.events.find(e=>'/'+e.id===path);if(!event)throw Error('Tournament not found. Refresh and try again.');if(body.revision!==event.revision)throw Error('Tournament changed. Refresh before saving again.');if(body.type==='publish')throw Error('Live sharing is unavailable in this browser-only version.');event.data=TournamentEngine.apply(structuredClone(event.data),body.type,body.input||{});event.revision++;}
  write(state);return output(event);
 }
 function restore(json){
  const current=read();checkBaseline();
  if(current.events.length)throw Error('This browser already has tournaments. Open Tournament Lite in a fresh browser profile to restore this backup.');
  let events,tournaments;
  try{
   const backup=JSON.parse(json);
   if(backup?.version!==1||!Array.isArray(backup.events)||!backup.events.length)throw Error();
   events=backup.events.map(TournamentEngine.restoreEvent);
   if(new Set(events.map(event=>event.id)).size!==events.length)throw Error();
   tournaments=events.map(output);
  }catch{throw Error('Choose a valid Tournament Lite backup containing at least one tournament.');}
  write({version:1,events});
  return {tournaments};
 }
 function backup(){return JSON.stringify(read(),null,2);}
 return {load,save,backup,restore,key};
})();
