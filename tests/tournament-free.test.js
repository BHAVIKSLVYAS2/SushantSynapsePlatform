const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
function browser(){const data=new Map();const context=vm.createContext({crypto:crypto.webcrypto,structuredClone,console,Uint32Array,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});for(const file of ['engine.bundle.js','storage.js'])vm.runInContext(fs.readFileSync('apps/tournament-lite/frontend/'+file,'utf8'),context);return context;}
test('Browser engine retains all six sports and formats and guards invalid or stale local writes',()=>{
 const c=browser(),local=c.TournamentLocal;local.load();
 for(const sport of ['Cricket','Badminton','Table Tennis','Pickleball','Chess','Carrom'])for(const format of ['Knockout','League / Round Robin','League + Knockout','Group Stage + Knockout']){
  let t=local.save('',{name:sport+' Cup',sport,format,mode:sport==='Cricket'?'Teams':'Singles'});
  t=local.save('/'+t.id,{revision:t.revision,type:'participants',input:{participants:['One','Two','Three','Four'].map((name,i)=>({name,seed:i+1}))}});
  t=local.save('/'+t.id,{revision:t.revision,type:'generate',input:{}});assert.ok(t.matches.length);
  assert.throws(()=>local.save('/'+t.id,{revision:1,type:'details',input:{}}),/changed/);
 }
 assert.equal(local.load().tournaments.length,24);const before=local.backup();assert.throws(()=>local.save('',{name:'Invalid',sport:'Unknown'}),/sport/);assert.equal(local.backup(),before);
});
test('Retired edge tournament routes never initialise the shared database',async()=>{
 const {edgeApi}=await import('../server/edge-index.mjs');let touched=false;const env={PUBLIC_ORIGIN:'https://example.test',PLATFORM_DB:{prepare(){touched=true;throw Error('DB accessed');}}};
 for(const path of ['/api/tournament-lite','/api/tournament-lite/public/old','/api/tournament-lite/organisations/old'])for(const method of ['GET','POST']){const response=await edgeApi(new Request(env.PUBLIC_ORIGIN+path,{method}),env);assert.equal(response.status,410);}
 assert.equal(touched,false);
});
test('Tournament Lite is public and has no assignable workspace roles',async()=>{
 const {apps}=require('../packages/app-registry');assert.equal(apps.find(a=>a.id==='tournament-lite').public,true);const {assignmentAppIds,assignmentRoles}=await import('../packages/auth/app-roles.mjs');assert.equal(assignmentAppIds.includes('tournament-lite'),false);assert.equal(assignmentRoles('tournament-lite').length,0);
});
test('One-time Tournament retirement removes only its data and app-specific grants',()=>{
 const {DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(':memory:');
 try{db.exec(`CREATE TABLE tournament_lite_events(id TEXT PRIMARY KEY);CREATE TABLE tournament_lite_ownership(eventId TEXT REFERENCES tournament_lite_events(id));CREATE TABLE platform_app_assignments(appId TEXT,userId TEXT);CREATE TABLE platform_app_licences(appId TEXT);CREATE TABLE app_access(appId TEXT,userId TEXT);CREATE TABLE users(id TEXT);CREATE TABLE records(id TEXT);INSERT INTO tournament_lite_events VALUES('old');INSERT INTO tournament_lite_ownership VALUES('old');INSERT INTO users VALUES('existing');INSERT INTO records VALUES('existing');INSERT INTO platform_app_assignments VALUES('tournament-lite','existing'),('advocate','existing');INSERT INTO platform_app_licences VALUES('tournament-lite'),('advocate');INSERT INTO app_access VALUES('tournament-lite','existing'),('advocate','existing');`);
 db.exec(fs.readFileSync('apps/tournament-lite/database/retire-live-data.sql','utf8'));
 for(const table of ['tournament_lite_events','tournament_lite_ownership'])assert.equal(db.prepare('SELECT COUNT(*) n FROM '+table).get().n,0);
 for(const table of ['platform_app_assignments','platform_app_licences','app_access'])assert.deepEqual(db.prepare('SELECT appId FROM '+table).all().map(x=>x.appId),['advocate']);
 for(const table of ['users','records'])assert.equal(db.prepare('SELECT COUNT(*) n FROM '+table).get().n,1);
 assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{db.close();}
});
