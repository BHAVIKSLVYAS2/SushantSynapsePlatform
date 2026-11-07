export const duration=60000;
export function createRound(seed=1,calm=false){return {seed:seed>>>0,calm,elapsed:0,next:600,serial:0,lane:2,score:0,combo:0,objects:[],caught:0,dodged:0,hits:0,silenced:0,missed:0,feedback:"",event:0,done:false};}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function move(s,lane){if(!s.done&&Number.isFinite(lane))s.lane=Math.max(0,Math.min(4,Math.round(lane)));}
export function silence(s,id){const i=s.objects.findIndex(o=>o.type==='alarm'&&o.id===id);if(s.done||i<0)return false;s.objects.splice(i,1);s.silenced++;s.score+=5;s.feedback='Alarm silenced - +5';s.event++;return true;}
export function advance(s,ms){
 if(s.done||!Number.isFinite(ms)||ms<=0)return s;
 const end=Math.min(duration,s.elapsed+ms);
 while(true){
  const expiry=Math.min(...s.objects.map(o=>o.end));const at=Math.min(s.next,expiry);
  if(at>end||at>=duration)break;s.elapsed=at;
  if(expiry<=s.next){
   const due=s.objects.filter(o=>o.end===expiry);s.objects=s.objects.filter(o=>o.end!==expiry);
   for(const o of due){s.event++;if(o.type==='alarm'){s.missed++;s.feedback='Missed alarm - 8 penalty - streak lost';s.combo=0;s.score=Math.max(0,s.score-8);}else if(o.type==='chai'){if(o.lane===s.lane){s.caught++;s.combo++;const reward=10*Math.min(3,1+Math.floor(s.combo/5));s.score+=reward;s.feedback='Chai caught - +'+reward;}else{s.combo=0;s.feedback='Missed chai - streak lost';}}else if(o.lane===s.lane){s.hits++;s.feedback='Meeting hit - 15 penalty - streak lost';s.combo=0;s.score=Math.max(0,s.score-15);}else{s.dodged++;s.score+=2;s.feedback='Meeting dodged - +2';}}
  }else{
   const level=Math.floor(at/20000),r=random(s),type=r<(level===0?.72:.55)?'chai':r<(level===0?.92:.84)?'meeting':'alarm';
   const travel=(type==='alarm'?2800-level*500:3000-level*650)*(s.calm?1.35:1),expiryAt=at+travel;
   // Opposing objects must leave enough time to move between their arrivals.
   const conflict=s.objects.some(o=>o.type!=='alarm'&&type!=='alarm'&&o.type!==type&&Math.abs(o.end-expiryAt)<500*(s.calm?1.35:1));
   if(!conflict)s.objects.push({id:++s.serial,type,lane:Math.floor(random(s)*5),start:at,end:expiryAt});
   s.next=at+[1100,720,430][level]*(s.calm?1.4:1);
  }
 }
 s.elapsed=end;s.done=end===duration;if(s.done)s.objects=[];return s;
}
