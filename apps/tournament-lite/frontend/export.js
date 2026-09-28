'use strict';
// Standalone artwork renderer; names are fitted to the card rather than clipped.
window.TournamentCard={download({champion,runnerUp,tournament,sport,date}){
 const canvas=document.createElement('canvas');
 canvas.width=1600;canvas.height=1000;
 const ctx=canvas.getContext('2d'),style=getComputedStyle(document.documentElement);
 const color=token=>style.getPropertyValue(token).trim();
 const ink=color('--certificate-ink'),gold=color('--certificate-gold');
 ctx.fillStyle=color('--certificate-bg');ctx.fillRect(0,0,1600,1000);
 ctx.strokeStyle=gold;ctx.lineWidth=3;
 ctx.strokeRect(45,45,1510,910);ctx.strokeRect(60,60,1480,880);ctx.textAlign='center';
 function line(text,y,size,fill){
  ctx.fillStyle=fill;ctx.font=`600 ${size}px Georgia`;
  while(ctx.measureText(text).width>1370&&size>8){size--;ctx.font=`600 ${size}px Georgia`;}
  ctx.fillText(text,800,y);
 }
 line('TOURNAMENT CHAMPION',230,36,gold);
 line(champion,430,100,ink);line(tournament,560,48,ink);
 line(sport+' · '+date,650,30,gold);line('Runner-up: '+runnerUp,750,32,ink);
 line('Tournament Lite · Sushant Synapse',870,23,gold);
 canvas.toBlob(blob=>{
  if(!blob)return;
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);
  link.download='tournament-champion.png';link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
 });
}};
