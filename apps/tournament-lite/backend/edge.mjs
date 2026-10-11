import engine from './engine.js';
import {body,fail,json,requireApp} from '../../../server/edge-http.mjs';
const {create,apply,view}=engine;
const output=r=>({id:r.id,revision:r.revision,publicToken:r.public_token,...view(JSON.parse(r.data))});
export async function tournament({repo,user,route,request}){
 const parts=route.split('/'),method=request.method;
 if(parts[1]==='public'&&parts.length===3&&method==='GET'){const r=await repo.first('SELECT * FROM tournament_lite_events WHERE public_token=?',parts[2]);if(!r||!JSON.parse(r.data).published)fail(404,'Tournament is not shared');const v=output(r);delete v.contact;delete v.publicToken;delete v.revision;v.participants=v.participants.map(({members,...p})=>p);return json(v);}
 requireApp(user,'tournament-lite');if(!['Owner','Advocate'].includes(user.role))fail(403,'Organizer access required');if(route==='tournament-lite'&&method==='GET')return json({tournaments:(await repo.all('SELECT * FROM tournament_lite_events WHERE owner=?',user.id)).map(output)});if(method!=='POST')fail(405,'Method not allowed');const b=await body(request,600000);
 if(route==='tournament-lite'){const id=crypto.randomUUID(),token=crypto.randomUUID(),data=JSON.stringify(create(b)),r={id,revision:1,public_token:token,data};await repo.commit([repo.statement('INSERT INTO tournament_lite_events VALUES(?,?,?,?,?)',id,user.id,1,token,data)]);return json(output(r));}
 if(parts.length!==2)fail(404,'Not found');const r=await repo.first('SELECT * FROM tournament_lite_events WHERE id=? AND owner=?',parts[1],user.id);if(!r)fail(404,'Tournament not found');if(b.revision!==r.revision)fail(409,'Tournament changed. Refresh before saving again.');r.data=JSON.stringify(apply(JSON.parse(r.data),b.type,b.input||{}));r.revision++;await repo.commit([repo.statement('UPDATE tournament_lite_events SET revision=?,data=? WHERE id=?',r.revision,r.data,r.id)]);return json(output(r));
}
