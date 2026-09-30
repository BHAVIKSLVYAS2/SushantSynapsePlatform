const sports=['Cricket','Badminton','Table Tennis','Pickleball','Chess','Carrom'];
function check(ok,message){if(!ok){const error=Error(message);error.status=400;throw error;}}
function number(v,min,max){const n=Number(v);check(v!==''&&v!==null&&v!==undefined&&Number.isFinite(n)&&n>=min&&n<=max,'Invalid number');return n;}
function integer(v,min,max){const n=number(v,min,max);check(Number.isInteger(n),'Whole number required');return n;}
function balls(v){check(/^\d{1,3}(\.[0-5])?$/.test(String(v)),'Use cricket overs notation, e.g. 4.3');const [o,b=0]=String(v).split('.').map(Number);return o*6+b;}
function rules(sport,i={}){
 const defaults={bestOf:3,points:['Table Tennis','Pickleball'].includes(sport)?11:21,winBy:2,cap:0,overs:10,wickets:10,win:sport==='Chess'?1:2,draw:sport==='Chess'?.5:1,loss:0};
 const relevant=['win','draw','loss',...(sport==='Cricket'?['overs','wickets']:sport==='Chess'?[]:sport==='Carrom'?['bestOf']:['bestOf','points','winBy','cap'])];
 const limits={bestOf:[1,7],points:[1,100],winBy:[1,2],cap:[0,200],overs:[1,100],wickets:[1,10],win:[0,10],draw:[0,10],loss:[0,10]};
 const labels={bestOf:'Best of games / boards',points:'Points per game',winBy:'Win by',cap:'Score cap',overs:'Cricket overs',wickets:'Cricket wickets',win:'League win points',draw:'Draw points',loss:'Loss points'};
 const r={...defaults};
 for(const key of relevant){try{r[key]=(['win','draw','loss'].includes(key)?number:integer)(i[key]??defaults[key],...limits[key]);}catch(error){error.message=labels[key]+': '+error.message;throw error;}}
 check(r.bestOf%2===1,'Best of must be odd');check(!r.cap||r.cap>=r.points,'Cap must be at least the points target');return r;
}
function score(t,m,i,allowIncomplete=false){const r=t.rules;check(m.a&&m.b,'Both participants must be known');
 if(t.sport==='Chess'){check(['white','black','draw'].includes(i.outcome),'Choose a chess outcome');check(i.outcome!=='draw'||m.stage!=='knockout','Knockout draws require a decisive replay');return {outcome:i.outcome,winner:i.outcome==='draw'?null:i.outcome==='white'?m.a:m.b,sa:i.outcome==='white'?1:i.outcome==='draw'?.5:0,sb:i.outcome==='black'?1:i.outcome==='draw'?.5:0};}
 if(t.sport==='Cricket'){const innings=['a','b'].map(side=>{const x=i[side]||{},runs=integer(x.runs,0,2000),wickets=integer(x.wickets,0,r.wickets),bowled=balls(x.overs);check(bowled>0&&bowled<=r.overs*6,'Overs must be positive and within the match limit');return {runs,wickets,overs:String(x.overs),balls:wickets===r.wickets?r.overs*6:bowled};});const [a,b]=innings;check(['a','b'].includes(i.battingFirst),'Select batting first');const tied=a.runs===b.runs;check(!tied||m.stage!=='knockout'||['a','b'].includes(i.tieWinner),'Choose a knockout tiebreak winner');return {a,b,battingFirst:i.battingFirst,target:innings[i.battingFirst==='a'?0:1].runs+1,tieWinner:tied&&m.stage==='knockout'?i.tieWinner:'',winner:tied?(m.stage==='knockout'?m[i.tieWinner]:null):a.runs>b.runs?m.a:m.b,sa:a.runs,sb:b.runs};}
 check(Array.isArray(i.games)&&i.games.length>0&&i.games.length<=r.bestOf,'Enter game scores');
 let aw=0,bw=0,sa=0,sb=0;const needed=Math.floor(r.bestOf/2)+1;
 const games=i.games.map((g,index)=>{
  check(aw<needed&&bw<needed,'Remove games after the match was decided');
  check(Array.isArray(g)&&g.length===2,'Enter both scores for game '+(index+1));
  const a=integer(g[0],0,999),b=integer(g[1],0,999),hi=Math.max(a,b),lo=Math.min(a,b);
  const decided=t.sport==='Carrom'?a!==b:hi>=r.points&&(hi-lo>=r.winBy||!!r.cap&&hi===r.cap);
  if(t.sport!=='Carrom')check((!r.cap||hi<=r.cap)&&(!r.cap||hi<r.cap||a!==b)&&(!decided||hi===r.points&&hi-lo>=r.winBy||hi-lo===r.winBy||hi===r.cap&&hi-lo<r.winBy),'Game '+(index+1)+' score does not meet rules: '+r.points+' points, win by '+r.winBy+(r.cap?', cap '+r.cap:''));
  if(!decided)check(allowIncomplete&&index===i.games.length-1,a===b?'Games cannot be tied unless saving the current game in progress':'Finish this game before entering the next game; check points and win-by rules');
  else {a>b?aw++:bw++;}
  sa+=a;sb+=b;return [a,b];
 });
 const complete=aw===needed||bw===needed;
 check(allowIncomplete||complete,'Enter enough games to decide the match');
 return {games,winner:complete?(aw>bw?m.a:m.b):null,sa,sb};
}
module.exports={sports,check,number,integer,rules,score,balls};
