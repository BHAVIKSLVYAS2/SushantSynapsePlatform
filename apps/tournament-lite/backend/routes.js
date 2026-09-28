const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {fail,readBody}=require('../../../server/http');
const {create,apply,view}=require('./engine');
function createTournament({store,auth}){
 store.registerAppSchema('tournament-lite-v1',fs.readFileSync(path.join(__dirname,'../database/001-initial.sql'),'utf8'),['tournament_lite_events','tournament_lite_migrations']);
 store.sql.exec('INSERT OR IGNORE INTO tournament_lite_migrations VALUES(1)');
 const output=r=>({id:r.id,revision:r.revision,publicToken:r.public_token,...view(JSON.parse(r.data))});
 return async({route,method,req,json,user})=>{
  const parts=route.split('/');
  if(parts[1]==='public'&&parts.length===3&&method==='GET'){const r=store.sql.prepare('SELECT * FROM tournament_lite_events WHERE public_token=?').get(parts[2]);if(!r||!JSON.parse(r.data).published)fail(404,'Tournament is not shared');const v=output(r);delete v.contact;delete v.publicToken;delete v.revision;v.participants=v.participants.map(({members,...p})=>p);return json(200,v);}
  if(!user)fail(401,'Please sign in to organize a tournament');if(!auth.hasAppAccess(user,'tournament-lite')||!['Owner','Advocate'].includes(user.role))fail(403,'Organizer access required');
  if(route==='tournament-lite'&&method==='GET')return json(200,{tournaments:store.sql.prepare('SELECT * FROM tournament_lite_events WHERE owner=?').all(user.id).map(output)});
  if(method!=='POST')fail(405,'Method not allowed');const b=await readBody(req,600000);
  const result=store.transaction(()=>{if(route==='tournament-lite'){const id=randomUUID(),token=randomUUID(),t=create(b);store.sql.prepare('INSERT INTO tournament_lite_events VALUES(?,?,?,?,?)').run(id,user.id,1,token,JSON.stringify(t));return output({id,revision:1,public_token:token,data:JSON.stringify(t)});}
   if(parts.length!==2)fail(404,'Not found');const r=store.sql.prepare('SELECT * FROM tournament_lite_events WHERE id=? AND owner=?').get(parts[1],user.id);if(!r)fail(404,'Tournament not found');if(b.revision!==r.revision)fail(409,'Tournament changed. Refresh before saving again.');const t=apply(JSON.parse(r.data),b.type,b.input||{});r.data=JSON.stringify(t);r.revision++;store.sql.prepare('UPDATE tournament_lite_events SET revision=?,data=? WHERE id=?').run(r.revision,r.data,r.id);return output(r);});return json(200,result);
 };
}
module.exports={createTournament};
