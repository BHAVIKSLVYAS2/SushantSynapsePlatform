(function(root){
 'use strict';
 const time=value=>Date.parse(value+'+05:30');
 function conflicts(matches,match,when,location,duration=60,participants=[]){
  if(!Number.isInteger(Number(duration))||Number(duration)<5||Number(duration)>480)throw Error('Choose a duration from 5 to 480 minutes.');
  const people=m=>new Set([m.a,m.b].filter(Boolean).flatMap(id=>{const participant=participants.find(p=>p.id===id);return ['entry:'+id,...(participant?.members||'').split(',').map(n=>n.trim().normalize('NFKC').toLowerCase()).filter(Boolean).map(n=>'player:'+n)];})),players=people(match);
  const start=time(when),end=start+Number(duration)*60000,court=String(location).trim().normalize('NFKC').toLowerCase();
  return matches.filter(other=>other.id!==match.id&&other.when&&!other.result?.bye&&start<time(other.when)+Number(other.duration||60)*60000&&time(other.when)<end&&((court&&court===String(other.location||'').trim().normalize('NFKC').toLowerCase())||[...people(other)].some(id=>players.has(id))));
 }
 function suggest(matches,match,when,location,duration=60,participants=[]){let start=time(when);if(!Number.isFinite(start))throw Error('Choose a starting date and time.');for(let i=0;i<2016;i++,start+=5*60000){const slot=new Date(start+330*60000).toISOString().slice(0,16);if(!conflicts(matches,match,slot,location,duration,participants).length)return slot;}throw Error('No free slot found in the next seven days.');}
 const api={conflicts,suggest};if(typeof module==='object')module.exports=api;else root.TournamentSchedule=api;
})(typeof globalThis==='object'?globalThis:this);
