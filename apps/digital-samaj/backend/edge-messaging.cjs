// Cloudflare asynchronous adaptation; app rules remain owned by this module.
const A=require('../../../packages/database/async-arrays.cjs');
'use strict';
const {randomUUID}=require('node:crypto');
const {fail}=require('../../../server/http');
const {security}=require('./edge-security.cjs');
const {text}=require('./validation');
const {decodeFile}=require('./edge-files.cjs');
function messaging({repo,store,auth}){
 const {sql}=repo;
 async function eligible(user,samajId){if(!user?.active||!auth.hasAppAccess(user,'digital-samaj'))return false;const sec=(await security(sql,user,samajId)),p=sec.linked&&(await repo.get('person',sec.linked,samajId));return p?.status==='VERIFIED'&&!JSON.parse(p.data).isDeceased&&sec.can('chat.use',p);}
 const blocked=async (a,z)=>!!(await sql.prepare('SELECT 1 FROM [samaj].[samaj_blocks] WHERE (user_id=? AND blocked_id=?) OR (user_id=? AND blocked_id=?)').get(a,z,z,a));
 async function conversation(id,ctx){const r=(await sql.prepare('SELECT c.* FROM [samaj].[samaj_conversations] c JOIN [samaj].[samaj_participants] p ON p.conversation_id=c.id WHERE c.id=? AND c.samaj_id=? AND p.user_id=?').get(id,ctx.samajId,ctx.user.id));if(!r)fail(404,'Conversation not found');const other=r.sender===ctx.user.id?r.receiver:r.sender;if((await blocked(ctx.user.id,other))||!(await eligible((await store.user(other)),ctx.samajId)))fail(403,'Conversation unavailable');return r;}
 async function displayUser(id,samajId){const link=(await sql.prepare('SELECT person_id FROM [samaj].[samaj_user_person] WHERE user_id=? AND samaj_id=?').get(id,samajId));if(!link)return {id,name:'Member'};const p=(await repo.get('person',link.person_id,samajId)),d=JSON.parse(p.data);return {id,personId:p.id,name:d.englishName||d.hindiName};}
 return async ({resource,id,action,method,b,ctx,json,res})=>{
  const {user,samajId,sec}=ctx;
  if(resource==='announcements'){
   if(method==='GET'){json(200,{items:(await sql.prepare('SELECT id,title,body,created_at FROM [samaj].[samaj_announcements] WHERE samaj_id=? ORDER BY created_at DESC LIMIT 50').all(samajId))});return true;}
   if(method==='POST'){sec.require('announcement.create');const aid=randomUUID(),title=text(b.title,'Title',160,true),body=text(b.body,'Announcement',4000,true);(await store.transaction(async ()=>{(await sql.prepare('INSERT INTO [samaj].[samaj_announcements] VALUES(?,?,?,?,?,?)').run(aid,samajId,title,body,user.id,repo.now()));(await repo.audit(user,samajId,'announcement.create',aid,null,{title}));}));json(201,{id:aid});return true;}
  }
  if(resource==='moderation'){
   sec.require('admin.manage');
   if(method==='GET'){json(200,{items:(await sql.prepare('SELECT r.id,r.reason,r.status,r.created_at,m.body FROM [samaj].[samaj_message_reports] r JOIN [samaj].[samaj_messages] m ON m.id=r.message_id JOIN [samaj].[samaj_conversations] c ON c.id=m.conversation_id WHERE c.samaj_id=? ORDER BY r.created_at DESC LIMIT 100').all(samajId))});return true;}
   if(method==='POST'&&id){if(!['REVIEWED','DISMISSED'].includes(b.status))fail(400,'Invalid report status');const report=(await sql.prepare('SELECT r.id FROM [samaj].[samaj_message_reports] r JOIN [samaj].[samaj_messages] m ON m.id=r.message_id JOIN [samaj].[samaj_conversations] c ON c.id=m.conversation_id WHERE r.id=? AND c.samaj_id=?').get(id,samajId));if(!report)fail(404,'Report not found');(await store.transaction(async ()=>{(await sql.prepare('UPDATE [samaj].[samaj_message_reports] SET status=? WHERE id=?').run(b.status,id));(await repo.audit(user,samajId,'message.report.review',id,null,{status:b.status}));}));json(200,{ok:true});return true;}
  }
  if(!['connect','messages','message-files','blocks','messaging-preference'].includes(resource))return false;
  if(!(await eligible(user,samajId)))fail(403,'Chat requires an approved profile claim, verified living person and chat permission');
  if(resource==='messaging-preference'){
   if(method==='GET'){json(200,{visibility:(await sql.prepare('SELECT visibility FROM [samaj].[samaj_message_preferences] WHERE user_id=? AND samaj_id=?').get(user.id,samajId))?.visibility||'VerifiedMembers'});return true;}
   if(method==='POST'){if(!['Nobody','FamilyOnly','VerifiedMembers','Connections','SamajMembers'].includes(b.visibility))fail(400,'Invalid messaging preference');(await store.transaction(async ()=>{(await sql.prepare('INSERT INTO [samaj].[samaj_message_preferences] VALUES(?,?,?) ON CONFLICT(user_id,samaj_id) DO UPDATE SET visibility=excluded.visibility').run(user.id,samajId,b.visibility));(await repo.audit(user,samajId,'messaging.preference',user.id,null,{visibility:b.visibility}));}));json(200,{ok:true});return true;}
  }
  if(resource==='blocks'){
   if(method==='GET'){json(200,{items:(await A.map((await sql.prepare('SELECT blocked_id FROM [samaj].[samaj_blocks] WHERE user_id=?').all(user.id)),async r=>(await displayUser(r.blocked_id,samajId))))});return true;}
   if(method==='POST'||method==='DELETE'){if(b.userId===user.id||!(await eligible((await store.user(b.userId)),samajId)))fail(400,'Invalid member');(await store.transaction(async ()=>{if(method==='POST')(await sql.prepare('INSERT OR IGNORE INTO [samaj].[samaj_blocks] VALUES(?,?)').run(user.id,b.userId));else (await sql.prepare('DELETE FROM [samaj].[samaj_blocks] WHERE user_id=? AND blocked_id=?').run(user.id,b.userId));(await repo.audit(user,samajId,'message.block.'+method,b.userId,null,{}));}));json(200,{ok:true});return true;}
  }
  if(resource==='connect'){
   if(method==='GET'&&!id){const rows=(await A.map((await A.filter((await sql.prepare('SELECT c.*,p.read_at,p.muted FROM [samaj].[samaj_conversations] c JOIN [samaj].[samaj_participants] p ON p.conversation_id=c.id WHERE c.samaj_id=? AND p.user_id=? ORDER BY c.created_at DESC LIMIT 100').all(samajId,user.id)),async c=>!(await blocked(c.sender,c.receiver)))),async c=>({id:c.id,status:c.status,reason:c.reason,incoming:c.receiver===user.id,muted:!!c.muted,other:(await displayUser(c.sender===user.id?c.receiver:c.sender,samajId)),unread:(await sql.prepare('SELECT count(*) n FROM [samaj].[samaj_messages] WHERE conversation_id=? AND sender<>? AND created_at>?').get(c.id,user.id,c.read_at)).n})));json(200,{items:rows});return true;}
   if(method==='POST'&&!id){const person=(await repo.get('person',b.personId,samajId));sec.require('person.view',person);const target=(await sql.prepare('SELECT user_id FROM [samaj].[samaj_user_person] WHERE person_id=? AND samaj_id=?').get(person.id,samajId))?.user_id;
    if(!target||target===user.id||!(await eligible((await store.user(target)),samajId))||(await blocked(user.id,target)))fail(403,'This member cannot receive your request');
    const pref=(await sql.prepare('SELECT visibility FROM [samaj].[samaj_message_preferences] WHERE user_id=? AND samaj_id=?').get(target,samajId))?.visibility||'VerifiedMembers';
    if(pref==='Nobody'||pref==='FamilyOnly'&&!sec.sameFamily(person)||pref==='Connections'&&!(await sql.prepare("SELECT 1 FROM [samaj].[samaj_conversations] WHERE samaj_id=? AND status='ACCEPTED' AND ((sender=? AND receiver=?) OR (sender=? AND receiver=?))").get(samajId,user.id,target,target,user.id)))fail(403,'Messaging preference does not allow this request');
    if(!['Family Connection','Professional','Samaj Activity','Business','Other'].includes(b.reason))fail(400,'Choose a contact reason');
    const cutoff=new Date(Date.now()-86400000).toISOString();if((await sql.prepare('SELECT count(*) n FROM [samaj].[samaj_conversations] WHERE sender=? AND created_at>?').get(user.id,cutoff)).n>=10)fail(429,'Daily message request limit reached');
    const cid=randomUUID();(await store.transaction(async ()=>{(await sql.prepare('INSERT INTO [samaj].[samaj_conversations] VALUES(?,?,?,?,?,?,?)').run(cid,samajId,user.id,target,b.reason,'PENDING',repo.now()));for(const uid of [user.id,target])(await sql.prepare('INSERT INTO [samaj].[samaj_participants](conversation_id,user_id) VALUES(?,?)').run(cid,uid));(await repo.audit(user,samajId,'message.request',cid,null,{reason:b.reason}));}));json(201,{id:cid});return true;
   }
   if(id){const c=(await conversation(id,ctx));
    if(method==='GET'){if(c.status!=='ACCEPTED')fail(403,'Request must be accepted');const items=(await A.map((await sql.prepare('SELECT id,sender,body,created_at FROM [samaj].[samaj_messages] WHERE conversation_id=? ORDER BY created_at DESC,id DESC LIMIT 100').all(id)).reverse(),async m=>({...m,mine:m.sender===user.id,attachments:(await sql.prepare('SELECT id,name,mime FROM [samaj].[samaj_message_attachments] WHERE message_id=?').all(m.id))})));json(200,{id,items,participants:(await sql.prepare('SELECT user_id,read_at FROM [samaj].[samaj_participants] WHERE conversation_id=?').all(id))});return true;}
    if(method==='POST'&&action==='decision'){if(c.receiver!==user.id||c.status!=='PENDING'||!['ACCEPTED','DECLINED'].includes(b.status))fail(403,'Only the recipient can decide a pending request');(await store.transaction(async ()=>{(await sql.prepare('UPDATE [samaj].[samaj_conversations] SET status=? WHERE id=?').run(b.status,id));(await repo.audit(user,samajId,'message.request.decision',id,null,{status:b.status}));}));json(200,{ok:true});return true;}
    if(method==='POST'&&action==='read'){(await sql.prepare('UPDATE [samaj].[samaj_participants] SET read_at=? WHERE conversation_id=? AND user_id=?').run(repo.now(),id,user.id));json(200,{ok:true});return true;}
    if(method==='POST'&&action==='mute'){if(typeof b.muted!=='boolean')fail(400,'Invalid mute');(await sql.prepare('UPDATE [samaj].[samaj_participants] SET muted=? WHERE conversation_id=? AND user_id=?').run(b.muted?1:0,id,user.id));json(200,{ok:true});return true;}
    if(method==='POST'&&action==='send'){
     if(c.status!=='ACCEPTED')fail(403,'Request must be accepted');const body=text(b.body,'Message',4000,!b.attachment),file=b.attachment?decodeFile(b.attachment):null;
     if((await sql.prepare('SELECT count(*) n FROM [samaj].[samaj_messages] WHERE sender=? AND created_at>?').get(user.id,new Date(Date.now()-60000).toISOString())).n>=20)fail(429,'Please wait before sending more messages');
     const mid=randomUUID();(await store.transaction(async ()=>{(await sql.prepare('INSERT INTO [samaj].[samaj_messages] VALUES(?,?,?,?,?)').run(mid,id,user.id,body,repo.now()));if(file)(await sql.prepare('INSERT INTO [samaj].[samaj_message_attachments] VALUES(?,?,?,?,?)').run(randomUUID(),mid,file.name,file.mime,file.content));(await repo.audit(user,samajId,'message.send',mid,null,{conversationId:id}));}));json(201,{id:mid});return true;
    }
   }
  }
  if(resource==='messages'&&method==='POST'&&id&&action==='report'){const m=(await sql.prepare('SELECT * FROM [samaj].[samaj_messages] WHERE id=?').get(id));if(!m)fail(404,'Message not found');(await conversation(m.conversation_id,ctx));const reason=text(b.reason,'Report reason',1000,true),rid=randomUUID();(await store.transaction(async ()=>{(await sql.prepare('INSERT INTO [samaj].[samaj_message_reports](id,message_id,reporter,reason,created_at) VALUES(?,?,?,?,?)').run(rid,id,user.id,reason,repo.now()));(await repo.audit(user,samajId,'message.report',rid,null,{messageId:id}));}));json(201,{id:rid});return true;}
  if(resource==='message-files'&&method==='GET'&&id){const f=(await sql.prepare('SELECT a.*,m.conversation_id FROM [samaj].[samaj_message_attachments] a JOIN [samaj].[samaj_messages] m ON m.id=a.message_id WHERE a.id=?').get(id));if(!f)fail(404,'Attachment not found');(await conversation(f.conversation_id,ctx));res.writeHead(200,{'Content-Type':f.mime,'Content-Disposition':`attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(f.name)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(Buffer.from(f.content));return true;}
  return false;
 };
}
module.exports={messaging};
