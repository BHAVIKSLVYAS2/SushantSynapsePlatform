'use strict';
const {randomUUID}=require('node:crypto');
const {fail,readBody}=require('../../../server/http');
const {repository,tables}=require('./repository');
const {roles,security}=require('./security');
const {text}=require('./validation');
const {workflows}=require('./workflows');
const {files}=require('./files');
const {messaging}=require('./messaging');
const {directory,exportFamily}=require('./directory');
function createDigitalSamaj({store,auth}){
 const repo=repository(store),sql=repo.sql;
 const workflow=workflows({repo,store}),fileHandler=files({repo,store}),chat=messaging({repo,store,auth});
 const limits=new Map();
 return async({route,method,req,res,json,user})=>{
  if(!user)fail(401,'Please sign in');if(!auth.hasAppAccess(user,'digital-samaj'))fail(403,'DIGITAL SAMAJ access required');
  if(method!=='GET'){const now=Date.now();for(const [key,value]of limits)if(value.until<=now)limits.delete(key);const rate=limits.get(user.id)||{count:0,until:now+60000};if(rate.count>=120)fail(429,'Too many writes. Please wait a minute.');rate.count++;limits.set(user.id,rate);}
  const parts=route.split('/').slice(1),[samajId,resource,id,action]=parts;
  if(samajId==='openapi.json'&&parts.length===1&&method==='GET')return json(200,require('./openapi'));
  if(parts.length>4)fail(404,'Not found');
  if(!samajId&&method==='GET')return json(200,{communities:sql.prepare('SELECT DISTINCT s.* FROM samaj_communities s JOIN samaj_grants g ON g.samaj_id=s.id WHERE g.user_id=?').all(user.id),canSetup:user.role==='Owner',roles});
  const b=['POST','PATCH','DELETE'].includes(method)?await readBody(req,3000000):{};
  if(!samajId&&method==='POST'){
   // Shared platform ownership is used only to bootstrap an explicit app grant.
   auth.owner(user);const name=text(b.name,'Samaj name',120,true),sid=randomUUID();
   store.transaction(()=>{sql.prepare('INSERT INTO samaj_communities VALUES(?,?,?)').run(sid,name,repo.now());sql.prepare('INSERT INTO samaj_grants VALUES(?,?,?,?,?,?,?)').run(randomUUID(),user.id,sid,'SUPER_ADMIN','ALL','',repo.now());repo.audit(user,sid,'community.create',sid,null,{name});});return json(201,{id:sid,name});
  }
  if(!sql.prepare('SELECT 1 FROM samaj_communities WHERE id=?').get(samajId))fail(404,'Samaj not found');
  const sec=security(sql,user,samajId),ctx={samajId,sec,user};if(!sec.grants.length)fail(403,'Samaj membership required');
  function canReview(r){try{const next=JSON.parse(r.new_value);const kind=r.kind.endsWith('.family')?'family':'person';const target=repo.get(kind,r.entity_id,samajId);if(!sec.can('verification.approve',target))return false;if(r.kind==='head.family')return sec.can('verification.approve',repo.get('person',next.headId,samajId));if(r.kind==='membership')return sec.can('verification.approve',repo.get('family',next.familyId,samajId));if(r.kind==='relationship')return sec.can('verification.approve',repo.get('person',next.relatedId,samajId));return true;}catch{return false;}}
  const command={resource,id,action,method,b,ctx,json,res};
  if(await workflow(command)||fileHandler(command)||chat(command))return;
  if(!resource&&method==='GET')return json(200,{id:samajId,name:sql.prepare('SELECT name FROM samaj_communities WHERE id=?').get(samajId).name,grants:sec.grants,linkedPersonId:sec.linked||null});
  if(resource==='grants'){
   sec.require('admin.manage');
   if(method==='GET'&&!id)return json(200,{grants:sql.prepare('SELECT * FROM samaj_grants WHERE samaj_id=?').all(samajId),users:store.users().filter(u=>u.active&&auth.hasAppAccess(u,'digital-samaj')).map(({id,name})=>({id,name})),roles});
   if(method==='POST'&&!id){
    const target=store.user(b.userId);if(!target?.active||!auth.hasAppAccess(target,'digital-samaj')||!Object.hasOwn(roles,b.role))fail(400,'Choose an active account with app access and a valid role');
    if(!['ALL','STATE','DISTRICT','VILLAGE','FAMILY','SELF'].includes(b.scope))fail(400,'Invalid scope');
    const value=text(b.scopeValue,'Scope value',600);if(['ALL','SELF'].includes(b.scope)?!!value:!value)fail(400,'Invalid scope value');
    if(b.scope==='FAMILY')repo.get('family',value,samajId);
    if(['STATE','DISTRICT','VILLAGE'].includes(b.scope)&&value.split('|').length!==({STATE:1,DISTRICT:2,VILLAGE:3}[b.scope]))fail(400,'Use State|District|Village scope path');
    // Only unrestricted administrators can delegate; every permission must be held.
    for(const p of roles[b.role])sec.require(p);
    const gid=randomUUID();store.transaction(()=>{sql.prepare('INSERT INTO samaj_grants VALUES(?,?,?,?,?,?,?)').run(gid,target.id,samajId,b.role,b.scope,value,repo.now());repo.audit(user,samajId,'grant.create',gid,null,b);});return json(201,{id:gid});
   }
   if(method==='DELETE'&&id&&!action){const g=sql.prepare('SELECT * FROM samaj_grants WHERE id=? AND samaj_id=?').get(id,samajId);if(!g)fail(404,'Grant not found');if(g.user_id===user.id)fail(400,'You cannot revoke your own grant');store.transaction(()=>{sql.prepare('DELETE FROM samaj_grants WHERE id=?').run(id);repo.audit(user,samajId,'grant.revoke',id,g,null);});return json(200,{ok:true});}
  }
  const kind=resource==='persons'?'person':resource==='families'?'family':null;
  if(kind){
   if(method==='GET'&&!id)return json(200,directory({repo,ctx,kind,url:new URL(req.url,'http://localhost')}));
   if(method==='GET'&&id&&action==='export'){if(kind==='family')return json(200,exportFamily(repo,ctx,id));const p=repo.get(kind,id,samajId);sec.require('report.export',p);if(p.status!=='VERIFIED'&&!sec.can('person.edit',p))fail(404,'Profile is not published');return json(200,{person:sec.project(p)});}
   if(method==='GET'&&id&&!action){const r=repo.get(kind,id,samajId);if(!sec.can(kind+'.edit',r)&&r.status!=='VERIFIED')fail(404,'Profile is not published');const result=sec.project(r);if(kind==='person'){result.memberships=sql.prepare('SELECT * FROM samaj_memberships WHERE person_id=?').all(id).filter(m=>{const f=repo.get('family',m.family_id,samajId);return sec.can('family.view',f)&&(f.status==='VERIFIED'||sec.can('family.edit',f));});}else result.members=sql.prepare('SELECT person_id FROM samaj_memberships WHERE family_id=?').all(id).map(m=>repo.get('person',m.person_id,samajId)).filter(p=>p.status!=='ARCHIVED'&&sec.can('person.view',p)&&(p.status==='VERIFIED'||sec.can('person.edit',p))).map(p=>sec.project(p));return json(200,result);}
   if(method==='POST'&&!id){const r=store.transaction(()=>repo.create(kind,b,ctx));return json(201,sec.project(r));}
   if(method==='PATCH'&&id&&!action){const r=store.transaction(()=>repo.update(kind,id,b,ctx));return json(200,r.reviewId?r:sec.project(r));}
   if(method==='POST'&&id&&action==='submit'){
    const result=store.transaction(()=>{const r=repo.get(kind,id,samajId);sec.require(kind+'.edit',r);repo.revision(r,b);if(!['DRAFT','CORRECTION_REQUIRED','REJECTED'].includes(r.status))fail(409,'Record cannot be submitted');if(kind==='family'){if(b.consent!==true)fail(400,'Consent is required');if(!r.head_id)fail(400,'Choose a family head before submitting');sql.prepare('INSERT INTO samaj_consent VALUES(?,?,?,?,?)').run(randomUUID(),id,user.id,'1',repo.now());}sql.prepare(`UPDATE ${tables[kind]} SET status='SUBMITTED',revision=revision+1,updated_at=? WHERE id=?`).run(repo.now(),id);return repo.request('verify.'+kind,id,{revision:r.revision+1,status:r.status},{status:'VERIFIED'},ctx);});return json(200,result);
   }
   if(method==='POST'&&id&&action==='head'&&kind==='family'){
    const result=store.transaction(()=>{const f=repo.get('family',id,samajId),p=repo.ref('person',b.personId,samajId);sec.require('family.edit',f);sec.require('person.edit',p);repo.revision(f,b);if(['ARCHIVED','SUBMITTED','UNDER_REVIEW'].includes(f.status))fail(409,'Family is archived or awaiting review');if(!sql.prepare("SELECT 1 FROM samaj_memberships WHERE person_id=? AND family_id=? AND end_date=''").get(p.id,id))fail(400,'Head must be a current family member');if(f.status==='VERIFIED')return repo.request('head.family',id,{revision:f.revision,headId:f.head_id},{headId:p.id},ctx);sql.prepare('UPDATE samaj_families SET head_id=?,revision=revision+1,updated_at=? WHERE id=?').run(p.id,repo.now(),id);repo.audit(user,samajId,'family.head',id,{personId:f.head_id},{personId:p.id});return {ok:true};});return json(200,result);
   }
  }
  if(resource==='memberships'&&method==='POST'&&!id)return json(201,store.transaction(()=>repo.membership(b,ctx)));
  if(resource==='relationships'&&method==='POST'&&!id)return json(201,store.transaction(()=>repo.relationship(b,ctx)));
  if(resource==='tree'&&method==='GET'&&id&&!action){
   const root=repo.get('person',id,samajId);sec.require('person.view',root);const rows=repo.all('person',samajId).filter(p=>p.status!=='ARCHIVED'&&sec.can('person.view',p)&&(p.status==='VERIFIED'||sec.can('person.edit',p))),allowed=new Set(rows.map(p=>p.id));if(!allowed.has(id))fail(404,'Profile is not published');
   const edges=sql.prepare('SELECT r.* FROM samaj_relationships r JOIN samaj_persons p ON p.id=r.person_id WHERE p.samaj_id=?').all(samajId).filter(e=>allowed.has(e.person_id)&&allowed.has(e.related_id)&&(e.status==='VERIFIED'||sec.can('person.edit',rows.find(p=>p.id===e.person_id))&&sec.can('person.edit',rows.find(p=>p.id===e.related_id))));const reached=new Set([id]);for(let depth=0;depth<8;depth++){const prior=new Set(reached);for(const e of edges)if(prior.has(e.person_id)||prior.has(e.related_id)){reached.add(e.person_id);reached.add(e.related_id);}if(reached.size>250)fail(400,'Tree too large; choose a closer relative');if(prior.size===reached.size)break;}
   return json(200,{root:id,nodes:rows.filter(p=>reached.has(p.id)).map(p=>sec.project(p)),edges:edges.filter(e=>reached.has(e.person_id)&&reached.has(e.related_id)).map(({id,person_id,related_id,type,status,end_date})=>({id,personId:person_id,relatedId:related_id,type,status,endDate:end_date}))});
  }
  if(resource==='reviews'){
   if(method==='POST'&&id&&action==='start'){const r=sql.prepare("SELECT * FROM samaj_reviews WHERE id=? AND samaj_id=? AND status='PENDING'").get(id,samajId);if(!r||!canReview(r))fail(403,'Review scope denied');if(r.requested_by===user.id)fail(403,'Another reviewer must handle your submission');if(r.kind.startsWith('verify.'))store.transaction(()=>{const k=r.kind.split('.')[1],entity=repo.get(k,r.entity_id,samajId),old=JSON.parse(r.old_value);if(entity.revision!==old.revision)fail(409,'Profile changed; request is stale');if(entity.status==='SUBMITTED'){sql.prepare(`UPDATE ${tables[k]} SET status='UNDER_REVIEW',revision=revision+1,updated_at=? WHERE id=?`).run(repo.now(),entity.id);sql.prepare('UPDATE samaj_reviews SET old_value=? WHERE id=?').run(JSON.stringify({...old,revision:entity.revision+1}),id);repo.audit(user,samajId,'review.start',entity.id,{status:'SUBMITTED'},{status:'UNDER_REVIEW'});}});return json(200,{ok:true});}
   if(method==='GET'&&id&&!action){const r=sql.prepare('SELECT * FROM samaj_reviews WHERE id=? AND samaj_id=?').get(id,samajId);if(!r)fail(404,'Review not found');if(!canReview(r))fail(403,'Review scope denied');let oldValue=JSON.parse(r.old_value),newValue=JSON.parse(r.new_value);const kind=r.kind.split('.')[1];if(kind==='person'||kind==='family'){const entity=repo.get(kind,r.entity_id,samajId);const filter=value=>{if(!value?.data)return value;const projected=sec.project({...entity,data:JSON.stringify(value.data)});delete projected.privacy;return {...value,data:projected};};oldValue=filter(oldValue);newValue=filter(newValue);if(r.kind.startsWith('verify.'))newValue={...newValue,profile:sec.project(entity)};}if(['membership','relationship'].includes(r.kind)){oldValue={};const p=repo.get('person',newValue.personId,samajId),other=repo.get(r.kind==='membership'?'family':'person',newValue.familyId||newValue.relatedId,samajId);newValue={person:sec.project(p),related:sec.project(other),type:newValue.type};}return json(200,{id:r.id,kind:r.kind,entityId:r.entity_id,requestedBy:r.requested_by,status:r.status,oldValue,newValue,reason:r.reason});}
   if(method==='GET'&&!id){const items=sql.prepare("SELECT * FROM samaj_reviews WHERE samaj_id=? AND status='PENDING' ORDER BY created_at").all(samajId).filter(r=>canReview(r)||r.requested_by===user.id).map(r=>({id:r.id,kind:r.kind,entityId:r.entity_id,status:r.status,createdAt:r.created_at,requestedBy:r.requested_by}));return json(200,{items});}
   if(method==='POST'&&id&&action==='withdraw'){const r=sql.prepare("SELECT * FROM samaj_reviews WHERE id=? AND samaj_id=? AND status='PENDING'").get(id,samajId);if(!r||r.requested_by!==user.id)fail(403,'Only the requester can withdraw');store.transaction(()=>{sql.prepare("UPDATE samaj_reviews SET status='WITHDRAWN',reviewed_at=? WHERE id=?").run(repo.now(),id);if(r.kind.startsWith('verify.')){const k=r.kind.split('.')[1];sql.prepare(`UPDATE ${tables[k]} SET status='DRAFT',revision=revision+1 WHERE id=?`).run(r.entity_id);}repo.audit(user,samajId,'review.withdraw',r.entity_id,{reviewId:id},null);});return json(200,{ok:true});}
   if(method==='POST'&&id&&!action){const reason=text(b.reason,'Reason',1000,true);if(!['APPROVE','REJECT','CORRECTION_REQUIRED'].includes(b.decision))fail(400,'Invalid decision');const result=store.transaction(()=>{
    const r=sql.prepare('SELECT * FROM samaj_reviews WHERE id=? AND samaj_id=?').get(id,samajId);if(!r||r.status!=='PENDING')fail(409,'Review not pending');if(r.requested_by===user.id)fail(403,'Another reviewer must decide this request');
    if(!canReview(r))fail(403,'Review scope denied');const old=JSON.parse(r.old_value),next=JSON.parse(r.new_value),[op,k]=r.kind.split('.');
    if(['verify','change'].includes(op)){
     const entity=repo.get(k,r.entity_id,samajId);if(entity.revision!==old.revision)fail(409,'Profile changed; request is stale');
     if(op==='change'&&b.decision==='APPROVE')for(const field of require('./security').sensitive)if(next.data[field]!==old.data[field]&&!sec.visible(entity,field))fail(403,'Reviewer cannot inspect the changed private field');
     if(b.decision==='APPROVE'){if(op==='verify'&&k==='family'&&!sql.prepare("SELECT 1 FROM samaj_memberships WHERE family_id=? AND person_id=? AND end_date=''").get(entity.id,entity.head_id))fail(409,'Approve the family head membership before verifying this family');if(op==='verify')sql.prepare(`UPDATE ${tables[k]} SET status='VERIFIED',revision=revision+1,updated_at=? WHERE id=?`).run(repo.now(),entity.id);else sql.prepare(`UPDATE ${tables[k]} SET data=?,privacy=?,revision=revision+1,updated_at=? WHERE id=?`).run(JSON.stringify(next.data),JSON.stringify(next.privacy),repo.now(),entity.id);}
     else if(op==='verify')sql.prepare(`UPDATE ${tables[k]} SET status=?,revision=revision+1,updated_at=? WHERE id=?`).run(b.decision==='REJECT'?'REJECTED':'CORRECTION_REQUIRED',repo.now(),entity.id);
    }else if(r.kind==='head.family'){
     const f=repo.get('family',r.entity_id,samajId);if(f.revision!==old.revision)fail(409,'Family changed; request is stale');if(b.decision==='APPROVE'){const p=repo.get('person',next.headId,samajId);if(p.status==='ARCHIVED'||!sql.prepare("SELECT 1 FROM samaj_memberships WHERE person_id=? AND family_id=? AND end_date=''").get(p.id,f.id))fail(409,'Head must remain a current member');sql.prepare('UPDATE samaj_families SET head_id=?,revision=revision+1,updated_at=? WHERE id=?').run(p.id,repo.now(),f.id);}
    }else if(r.kind==='membership'||r.kind==='relationship'){
     if(b.decision==='APPROVE'){const p=repo.get('person',next.personId,samajId),other=repo.get(r.kind==='membership'?'family':'person',next.familyId||next.relatedId,samajId);if(repo.fingerprint(p)!==old.personHash||repo.fingerprint(other)!==(old.familyHash||old.relatedHash))fail(409,'Association changed; request is stale');repo[r.kind](next,ctx,true);}
    }else if(r.kind==='claim'&&b.decision==='APPROVE'){
     const p=repo.get('person',r.entity_id,samajId);if(p.status!=='VERIFIED')fail(409,'Person must be verified');sql.prepare('INSERT INTO samaj_user_person VALUES(?,?,?)').run(r.requested_by,samajId,p.id);
    }
    if(op==='verify'&&k==='person'&&b.decision==='APPROVE')for(const edge of sql.prepare("SELECT * FROM samaj_relationships WHERE status='SUBMITTED' AND (person_id=? OR related_id=?)").all(r.entity_id,r.entity_id)){const a=repo.get('person',edge.person_id,samajId),z=repo.get('person',edge.related_id,samajId);if(a.status==='VERIFIED'&&z.status==='VERIFIED'&&sec.can('verification.approve',a)&&sec.can('verification.approve',z)){sql.prepare("UPDATE samaj_relationships SET status='VERIFIED' WHERE id=?").run(edge.id);repo.audit(user,samajId,'relationship.verify',edge.id,{status:edge.status},{status:'VERIFIED'});}}
    sql.prepare('UPDATE samaj_reviews SET status=?,reviewed_by=?,reviewed_at=?,reason=? WHERE id=?').run(b.decision,user.id,repo.now(),reason,id);repo.audit(user,samajId,'review.'+b.decision,r.entity_id,{reviewId:id},{reason});return {ok:true};});return json(200,result);
   }
  }
  if(resource==='claims'&&method==='POST'&&!id){const p=repo.get('person',b.personId,samajId);sec.require('person.view',p);if(p.status!=='VERIFIED'||sql.prepare('SELECT 1 FROM samaj_user_person WHERE person_id=? OR (user_id=? AND samaj_id=?)').get(p.id,user.id,samajId))fail(409,'Profile is unavailable for claiming');return json(201,store.transaction(()=>repo.request('claim',p.id,null,{reason:text(b.reason,'Claim evidence',1000,true)},ctx)));}
  if(resource==='audit'&&method==='GET'&&!id){sec.require('admin.manage');return json(200,{items:sql.prepare('SELECT id,actor,action,entity_id,at FROM samaj_audit WHERE samaj_id=? ORDER BY at DESC LIMIT 100').all(samajId)});}
  fail(404,'Not found');
 };
}
module.exports={createDigitalSamaj};
