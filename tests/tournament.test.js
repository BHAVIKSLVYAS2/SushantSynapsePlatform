const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{Readable}=require('node:stream');
const {create,apply,view}=require('../apps/tournament-lite/backend/engine');
const {score,balls}=require('../apps/tournament-lite/backend/sports');
const {createTournament}=require('../apps/tournament-lite/backend/routes');
const {Store}=require('../apps/advocate/backend/store');
const {DatabaseSync}=require('node:sqlite');

test('Tournament details can change after play without changing fixtures and invalid edits are atomic',()=>{
 const t=setup();finish(t);const matches=structuredClone(t.matches),rules=structuredClone(t.rules);
 apply(t,'details',{name:'Renamed Cup',venue:'New hall',start:'2026-10-01',end:'2026-10-02',organizer:'Club',contact:'Private phone',rules:{bestOf:7}});
 assert.equal(t.name,'Renamed Cup');assert.deepEqual(t.matches,matches);assert.deepEqual(t.rules,rules);
 const before=structuredClone(t);
 assert.throws(()=>apply(t,'details',{name:'Invalid',start:'2026-10-03',end:'2026-10-02'}),/End date/);
 assert.deepEqual(t,before);
 assert.throws(()=>apply(t,'details',{name:' '}),/name required/);
});
test('Capped games end on the first winning score, including deuce at the cap',()=>{
 const t=setup(2,'Knockout','Badminton',{rules:{points:21,cap:30,bestOf:1}}),m=t.matches[0];
 assert.equal(score(t,m,{games:[[30,29]]}).winner,m.a);
 assert.equal(score(t,m,{games:[[30,28]]}).winner,m.a);
 assert.throws(()=>score(t,m,{games:[[30,4]]}),/rules/);
 assert.throws(()=>score(t,m,{games:[[31,29]]}),/rules/);
 assert.throws(()=>score(t,m,{games:[[30,30]]},true),/rules/);
 assert.throws(()=>score(t,m,{games:[[30,30]]}),/rules/);
});
function setup(n=4,format='Knockout',sport='Chess',extra={}){const t=create({name:'Club Cup',sport,mode:sport==='Cricket'?'Teams':'Singles',format,...extra});apply(t,'participants',{participants:Array.from({length:n},(_,i)=>({name:'Player '+(i+1),seed:i+1}))});apply(t,'generate',{});return t;}
function finish(t){let m;while((m=t.matches.find(x=>!x.result&&x.a&&x.b)))apply(t,'result',{id:m.id,outcome:'white'});return view(t);}

test('Every sport completes all formats and invalid qualification can be corrected without losing entries',()=>{
 for(const sport of ['Cricket','Badminton','Table Tennis','Pickleball','Chess','Carrom'])for(const format of ['Knockout','League / Round Robin','League + Knockout','Group Stage + Knockout']){
  const t=setup(4,format,sport,{rules:{bestOf:1,points:11}});let m;
  while((m=t.matches.find(x=>!x.result&&x.a&&x.b))){
   const input=sport==='Chess'?{outcome:'white'}:sport==='Cricket'?{a:{runs:20,wickets:1,overs:10},b:{runs:10,wickets:2,overs:10},battingFirst:'a'}:{games:[[11,5]]};
   apply(t,'score',{id:m.id,...input});
  }
  assert.equal(view(t).status,'Completed',sport+' '+format);assert.ok(view(t).champion);
 }
 const t=create({name:'Groups',sport:'Chess',mode:'Singles',format:'Group Stage + Knockout',groupCount:4,qualifiers:2});
 apply(t,'participants',{participants:['One','Two','Three','Four'].map(name=>({name}))});const ids=t.participants.map(p=>p.id);
 assert.throws(()=>apply(t,'generate',{}),/equal qualifiers/);
 apply(t,'qualification',{groupCount:2,qualifiers:2});assert.deepEqual(t.participants.map(p=>p.id),ids);
 apply(t,'generate',{});assert.equal(finish(t).status,'Completed');
 assert.throws(()=>apply(t,'qualification',{groupCount:2,qualifiers:4}),/locked/);
});

test('Partial games persist as live scores, advance only when decided and invalidate downstream drafts',()=>{
 for(const sport of ['Badminton','Table Tennis','Pickleball','Carrom']){
  const t=setup(4,'Knockout',sport,{rules:{points:11}}),m=t.matches[0];
  apply(t,'score',{id:m.id,games:[[5,5]]});
  assert.equal(m.result,null);assert.equal(m.status,'live');assert.deepEqual(m.score.games,[[5,5]]);
  assert.equal(t.matches.at(-1).a,null);
  apply(t,'score',{id:m.id,games:[[11,5]]});assert.equal(m.result,null);
  apply(t,'score',{id:m.id,games:[[11,5],[11,7]]});assert.equal(m.result.winner,m.a);assert.equal(m.score,undefined);
  const other=t.matches[1];apply(t,'score',{id:other.id,games:[[11,5],[11,7]]});
  const final=t.matches.at(-1);apply(t,'score',{id:final.id,games:[[4,4]]});
  apply(t,'score',{id:m.id,games:[[11,5]]});
  assert.equal(final.a,null);assert.equal(final.score,undefined);assert.equal(final.status,'upcoming');
  apply(t,'score',{id:m.id,games:[[11,5],[11,7]]});apply(t,'score',{id:final.id,games:[[11,5],[11,7]]});
  assert.equal(view(t).status,'Completed');
 }
 const t=setup(2,'League + Knockout','Badminton',{rules:{bestOf:1}}),m=t.matches[0];
 apply(t,'score',{id:m.id,games:[[20,20]]});assert.equal(t.matches.length,1);assert.equal(view(t).tables.All[0].played,0);
 assert.throws(()=>apply(t,'score',{id:m.id,games:[[25,18]]}),/rules/);
 apply(t,'score',{id:m.id,games:[[22,20]]});assert.equal(t.matches.length,2);
 apply(t,'score',{id:t.matches[1].id,games:[[21,5]]});assert.equal(view(t).status,'Completed');
 apply(t,'score',{id:m.id,games:[[10,10]],confirmReset:true});assert.equal(t.matches.length,1);assert.equal(view(t).champion,null);
});

test('Sport defaults and validation ignore unrelated rules and preserve cricket tiebreak choice',()=>{
 const chess=create({name:'Chess',sport:'Chess',mode:'Singles',format:'Knockout',rules:{overs:'',bestOf:2,cap:1,points:21}});
 assert.equal(chess.rules.win,1);
 const tt=setup(2,'Knockout','Table Tennis');assert.equal(tt.rules.points,11);
 assert.throws(()=>create({name:'Badminton',sport:'Badminton',mode:'Singles',format:'Knockout',rules:{points:''}}),/Points per game/);
 const t=setup(2,'Knockout','Cricket'),m=t.matches[0];
 apply(t,'score',{id:m.id,a:{runs:20,wickets:1,overs:10},b:{runs:20,wickets:2,overs:10},battingFirst:'a',tieWinner:'b'});
 assert.equal(m.result.tieWinner,'b');assert.equal(view(t).champion,m.b);
});

test('SQLite retains partial scores across restart and rejects invalid or stale progress atomically',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tournament-progress-'));let store=new Store(dir);
 const user={id:'owner',role:'Owner'},auth={hasAppAccess:()=>true};let handler=createTournament({store,auth});
 const call=async(route,body)=>{const req=Readable.from([Buffer.from(JSON.stringify(body||{}))]);req.headers={'content-type':'application/json'};let result;await handler({route:'tournament-lite'+route,method:body?'POST':'GET',req,user,json:(_,data)=>{result=data;}});return result;};
 try{
  let t=await call('',{name:'Persistent score',sport:'Badminton',mode:'Singles',format:'Knockout'});
  t=await call('/'+t.id,{revision:t.revision,type:'participants',input:{participants:[{name:'One'},{name:'Two'}]}});
  t=await call('/'+t.id,{revision:t.revision,type:'generate'});const match=t.matches[0].id;
  t=await call('/'+t.id,{revision:t.revision,type:'score',input:{id:match,games:[[21,9]]}});
  const revision=t.revision;
  await assert.rejects(call('/'+t.id,{revision,type:'score',input:{id:match,games:[[30,9]]}}),/rules/);
  await assert.rejects(call('/'+t.id,{revision:revision-1,type:'score',input:{id:match,games:[[21,9],[21,8]]}}),/changed/);
  store.sql.close();store=new Store(dir);handler=createTournament({store,auth});
  t=(await call('')).tournaments[0];assert.equal(t.revision,revision);assert.deepEqual(t.matches[0].score.games,[[21,9]]);assert.equal(t.champion,null);
  t=await call('/'+t.id,{revision,type:'score',input:{id:match,games:[[21,9],[21,8]]}});assert.equal(t.status,'Completed');
 }finally{store.sql.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('Tournament knockout handles 2–64 entries, seeded separation, byes and winner corrections',()=>{for(let n=2;n<=64;n++){const t=setup(n);assert.equal(t.matches.filter(m=>m.result?.bye).length,2**Math.ceil(Math.log2(n))-n);const v=finish(t);assert.equal(v.status,'Completed');assert.equal(v.champion,t.participants[0].id);assert.equal(new Set(t.matches.map(x=>x.id)).size,t.matches.length);}const t=setup(8);finish(t);const m=t.matches[0];apply(t,'result',{id:m.id,outcome:'black'});assert.equal(view(t).champion,null);assert.equal(t.matches.filter(x=>!x.result).length,2);assert.equal(finish(t).champion,m.b);});
test('Round robin covers every pair exactly once, draws, qualifiers and corrections',()=>{for(let n=2;n<=12;n++){const t=setup(n,'League / Round Robin');assert.equal(t.matches.length,n*(n-1)/2);assert.equal(new Set(t.matches.map(m=>[m.a,m.b].sort().join(':'))).size,t.matches.length);for(const round of new Set(t.matches.map(m=>m.round))){const ids=t.matches.filter(m=>m.round===round).flatMap(m=>[m.a,m.b]);assert.equal(ids.length,new Set(ids).size);}}const t=setup(4,'League + Knockout');for(const m of [...t.matches])apply(t,'result',{id:m.id,outcome:'draw'});assert.equal(t.qualified.length,2);assert.equal(view(t).tables.All[0].points,1.5);finish(t);assert.throws(()=>apply(t,'result',{id:t.matches[0].id,outcome:'white'}),/Confirm/);apply(t,'result',{id:t.matches[0].id,outcome:'white',confirmReset:true});assert.equal(view(t).champion,null);assert.equal(t.matches.filter(m=>m.stage==='knockout').length,1);const g=setup(8,'Group Stage + Knockout','Chess',{qualifiers:4,groupCount:2});finish(g);assert.equal(g.qualified.length,4);assert.equal(view(g).status,'Completed');assert.throws(()=>setup(5,'Group Stage + Knockout','Chess',{qualifiers:3}),/equal qualifiers/);});
test('All six sport rules validate series, local boards, chess, overs and aggregate NRR',()=>{for(const sport of ['Badminton','Table Tennis','Pickleball','Carrom']){const t=setup(2,'Knockout',sport,{rules:{points:11,bestOf:3}}),m=t.matches[0];apply(t,'result',{id:m.id,games:[[11,5],[11,7]]});assert.equal(view(t).champion,m.a);assert.throws(()=>score(t,m,{games:[[11,5]]}),/enough/);assert.throws(()=>score(t,m,{games:[[11,5],[11,7],[11,2]]}),/decided/);assert.throws(()=>score(t,m,{games:[[4,4],[11,3]]}),/tied/);if(sport!=='Carrom')assert.throws(()=>score(t,m,{games:[[11,10],[11,7]]}),/rules/);}const chess=setup(2);assert.throws(()=>score(chess,chess.matches[0],{outcome:'draw'}),/replay/);assert.equal(balls('4.3'),27);assert.throws(()=>balls('4.6'));
 const t=setup(2,'League / Round Robin','Cricket',{rules:{overs:10}}),m=t.matches[0];apply(t,'result',{id:m.id,a:{runs:100,wickets:10,overs:'8.2'},b:{runs:101,wickets:4,overs:'9.3'},battingFirst:'a'});const v=view(t),winner=v.tables.All[0];assert.equal(v.champion,m.b);assert.equal(m.result.target,101);assert.equal(m.result.a.balls,60);assert.ok(Math.abs(winner.nrr-(101/9.5-10))<1e-9);assert.throws(()=>score(t,m,{a:{runs:100,wickets:11,overs:10},b:{runs:50,wickets:2,overs:10},battingFirst:'a'}));
});
test('Tournament API protects ownership, publication, revisions and persistence, exports additive SQL',async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tournament-test-'));let store=new Store(dir),user={id:'owner',role:'Owner'},allowed=true;let handler=createTournament({store,auth:{hasAppAccess:()=>allowed}});const call=async(method,route='',body={})=>{const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.headers={'content-type':'application/json'};let result;await handler({route:'tournament-lite'+route,method,req,user,json:(status,data)=>{result=data;}});return result;};try{store.create('clients',{name:'Existing client'});const original=store.all('clients');let t=await call('POST','',{name:'Test Cup',sport:'Chess',mode:'Singles',format:'Knockout',contact:'Private contact'});const id=t.id,token=t.publicToken;user=null;await assert.rejects(call('GET'),/sign in/);await assert.rejects(call('GET','/public/'+token),/not shared/);user={id:'other',role:'Owner'};await assert.rejects(call('POST','/'+id,{revision:1,type:'publish',input:{published:true}}),/not found/);user={id:'owner',role:'Clerk'};await assert.rejects(call('GET'),/access/);user.role='Owner';allowed=false;await assert.rejects(call('GET'),/access/);allowed=true;t=await call('POST','/'+id,{revision:1,type:'publish',input:{published:true}});await assert.rejects(call('POST','/'+id,{revision:1,type:'generate'}),/changed/);await assert.rejects(call('POST','/'+id,{revision:2,type:'participants',input:{participants:[{name:'Same'},{name:'Same'}]}}),/unique/);assert.equal((await call('GET')).tournaments[0].participants.length,0);user=null;const pub=await call('GET','/public/'+token);assert.equal(pub.contact,undefined);assert.equal(pub.revision,undefined);await assert.rejects(call('POST','/public/'+token,{type:'publish'}),/sign in/);user={id:'owner',role:'Owner'};store.sql.close();store=new Store(dir);handler=createTournament({store,auth:{hasAppAccess:()=>true}});assert.equal((await call('GET')).tournaments[0].name,'Test Cup');assert.deepEqual(store.all('clients'),original);const sql=store.exportSql();assert.match(sql,/tournament_lite_events/);const restored=new DatabaseSync(':memory:');restored.exec(sql);assert.equal(restored.prepare('SELECT count(*) AS n FROM tournament_lite_events').get().n,1);restored.close();await call('POST','/'+id,{revision:2,type:'publish',input:{published:false}});user=null;await assert.rejects(call('GET','/public/'+token),/not shared/);}finally{store.sql.close();fs.rmSync(dir,{recursive:true,force:true});}});
