'use strict';
const fs=require('node:fs'),path=require('node:path'),{randomUUID,createHash}=require('node:crypto');
const {fail}=require('../../../server/http');
const {roles,permissions}=require('./security');
const {clean,privacy,date}=require('./validation');
const tables={person:'samaj_persons',family:'samaj_families'};
function repository(store){
 const sql=store.sql,source=fs.readFileSync(path.join(__dirname,'../database/001-initial.sql'),'utf8');
 store.registerAppSchema('digital-samaj-v1',source,[...source.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(m=>m[1]));
 const workflows=fs.readFileSync(path.join(__dirname,'../database/002-workflows.sql'),'utf8');
 store.registerAppSchema('digital-samaj-v2',workflows,[...workflows.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(m=>m[1]));
 store.transaction(()=>{
  sql.exec('INSERT OR IGNORE INTO samaj_migrations VALUES(1); INSERT OR IGNORE INTO samaj_migrations VALUES(2);');
  for(const p of permissions)sql.prepare('INSERT OR IGNORE INTO samaj_permissions VALUES(?)').run(p);
  for(const [role,ps]of Object.entries(roles)){sql.prepare('INSERT OR IGNORE INTO samaj_roles VALUES(?)').run(role);for(const p of ps)sql.prepare('INSERT OR IGNORE INTO samaj_role_permissions VALUES(?,?)').run(role,p);}
 });
 const now=()=>new Date().toISOString();
 function fingerprint(r){const data=JSON.parse(r.data);delete data.photo;return createHash('sha256').update(JSON.stringify(data)).digest('hex');}
 function get(kind,id,samajId){if(!tables[kind])fail(400,'Invalid entity kind');const r=sql.prepare(`SELECT * FROM ${tables[kind]} WHERE id=? AND samaj_id=?`).get(id,samajId);if(!r)fail(404,'Record not found');return {...r,kind};}
 function ref(kind,value,samajId){if(!tables[kind]||typeof value!=='string')fail(400,'Invalid member or family reference');const r=sql.prepare(`SELECT id FROM ${tables[kind]} WHERE (id=? OR code=?) AND samaj_id=?`).get(value,value.trim().toUpperCase(),samajId);if(!r)fail(404,'Member or family code not found');return get(kind,r.id,samajId);}
 const all=(kind,samajId)=>sql.prepare(`SELECT * FROM ${tables[kind]} WHERE samaj_id=? ORDER BY created_at,id`).all(samajId).map(r=>({...r,kind}));
 function audit(user,samajId,action,id,oldValue,newValue){sql.prepare('INSERT INTO samaj_audit VALUES(?,?,?,?,?,?,?,?)').run(randomUUID(),samajId,user.id,action,id,JSON.stringify(oldValue),JSON.stringify(newValue),now());}
 function create(kind,b,ctx){
  const data=clean(kind,b.data),pv=privacy(b.privacy),id=randomUUID(),at=now();
  const candidate={id,kind,samaj_id:ctx.samajId,data};
  let family;
  if(kind==='person'&&b.familyId){family=get('family',b.familyId,ctx.samajId);ctx.sec.require('person.create',family);ctx.sec.require('family.edit',family);if(family.status==='VERIFIED'||family.status==='ARCHIVED')fail(409,'Add new people to a draft family first');}
  else ctx.sec.require(kind+'.create',candidate);
  // Random public codes avoid leaking population counts and never identify a login.
  const code=(kind==='person'?'M':'F')+'-'+randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
  sql.prepare(`INSERT INTO ${tables[kind]}(id,samaj_id,code,status,data,privacy,created_by,created_at,updated_at) VALUES(?,?,?,'DRAFT',?,?,?,?,?)`).run(id,ctx.samajId,code,JSON.stringify(data),JSON.stringify(pv),ctx.user.id,at,at);
  if(family)sql.prepare('INSERT INTO samaj_memberships(id,person_id,family_id,type,is_primary) VALUES(?,?,?,?,1)').run(randomUUID(),id,family.id,'BirthFamily');
  audit(ctx.user,ctx.samajId,'create.'+kind,id,null,{data,privacy:pv});return get(kind,id,ctx.samajId);
 }
 function revision(r,b){if(!Number.isInteger(b.revision)||b.revision!==r.revision)fail(409,'Record changed. Reload before saving.');}
 function update(kind,id,b,ctx){
  const r=get(kind,id,ctx.samajId);ctx.sec.require(kind+'.edit',r);revision(r,b);if(r.status==='ARCHIVED')fail(409,'Archived records cannot be edited');if(['SUBMITTED','UNDER_REVIEW'].includes(r.status))fail(409,'Withdraw the pending review before editing');
  const data=clean(kind,b.data||{},JSON.parse(r.data)),pv=privacy(b.privacy,JSON.parse(r.privacy));ctx.sec.require(kind+'.edit',{...r,data});
  // Hidden values cannot be overwritten through a blind edit.
  const {sensitive}=require('./security');for(const k of Object.keys(b.data||{}))if(sensitive.includes(k)&&!ctx.sec.visible(r,k))fail(403,'Private field is not editable by this account');
  if(b.privacy&&Object.keys(b.privacy).some(k=>!ctx.sec.visible(r,k))&&r.created_by!==ctx.user.id&&r.id!==ctx.sec.linked)fail(403,'Privacy is controlled by the profile owner');
  const claim=kind==='person'?sql.prepare('SELECT user_id FROM samaj_user_person WHERE person_id=?').get(r.id):null;
  if(claim&&claim.user_id!==ctx.user.id&&Object.entries(b.privacy||{}).some(([k,v])=>v!==(JSON.parse(r.privacy)[k]||'PRIVATE')))fail(403,'Only the claimed profile owner can change visibility');
  const important=kind==='person'?['englishName','hindiName','dob']:['gotra'];
  if(r.status==='VERIFIED'&&important.some(k=>data[k]!==JSON.parse(r.data)[k]))return request('change.'+kind,r.id,{revision:r.revision,data:JSON.parse(r.data),privacy:JSON.parse(r.privacy)},{data,privacy:pv},ctx);
  sql.prepare(`UPDATE ${tables[kind]} SET data=?,privacy=?,revision=revision+1,updated_at=? WHERE id=?`).run(JSON.stringify(data),JSON.stringify(pv),now(),id);
  audit(ctx.user,ctx.samajId,'edit.'+kind,id,{data:JSON.parse(r.data),privacy:JSON.parse(r.privacy)},{data,privacy:pv});return get(kind,id,ctx.samajId);
 }
 function request(kind,id,oldValue,newValue,ctx){
  const pending=sql.prepare("SELECT new_value FROM samaj_reviews WHERE kind=? AND entity_id=? AND status='PENDING'").all(kind,id);
  if(pending.some(r=>{if(!['membership','relationship'].includes(kind))return true;const other=JSON.parse(r.new_value);return other.familyId===newValue.familyId&&other.relatedId===newValue.relatedId&&other.type===newValue.type;}))fail(409,'A review is already pending');
  const rid=randomUUID();sql.prepare('INSERT INTO samaj_reviews(id,samaj_id,kind,entity_id,requested_by,old_value,new_value,created_at) VALUES(?,?,?,?,?,?,?,?)').run(rid,ctx.samajId,kind,id,ctx.user.id,JSON.stringify(oldValue),JSON.stringify(newValue),now());audit(ctx.user,ctx.samajId,'request.'+kind,id,oldValue,newValue);return {reviewId:rid,status:'PENDING'};
 }
 function membership(b,ctx,approved=false){
  const p=ref('person',b.personId,ctx.samajId),f=ref('family',b.familyId,ctx.samajId);ctx.sec.require('person.edit',p);ctx.sec.require('family.edit',f);
  if([p.status,f.status].includes('ARCHIVED'))fail(409,'Archived record cannot gain membership');
  if(!['BirthFamily','MaritalFamily','GuardianFamily','Other'].includes(b.type)||typeof b.isPrimary!=='boolean')fail(400,'Invalid membership');
  const start=date(b.startDate||'','Start date');
  if(!approved&&(p.status==='VERIFIED'||f.status==='VERIFIED'))return request('membership',p.id,{personHash:fingerprint(p),familyHash:fingerprint(f)},{...b,personId:p.id,familyId:f.id,startDate:start},ctx);
  const id=randomUUID();sql.prepare('INSERT INTO samaj_memberships(id,person_id,family_id,type,is_primary,start_date) VALUES(?,?,?,?,?,?)').run(id,p.id,f.id,b.type,b.isPrimary?1:0,start);
  audit(ctx.user,ctx.samajId,'membership.add',id,null,b);return {id};
 }
 function relationship(b,ctx,approved=false){
  let a=ref('person',b.personId,ctx.samajId),z=ref('person',b.relatedId,ctx.samajId),type=b.type;ctx.sec.require('person.edit',a);ctx.sec.require('person.edit',z);
  if(a.id===z.id||[a.status,z.status].includes('ARCHIVED'))fail(400,'Invalid relationship');
  if(type==='Child'){[a,z]=[z,a];type='Parent';}
  if(!['Father','Mother','Parent','Spouse','Sibling','Guardian','Other'].includes(type))fail(400,'Invalid relationship type');
  if(['Spouse','Sibling'].includes(type)&&a.id>z.id)[a,z]=[z,a];
  // person -> related person is child -> parent. Inverse views are derived.
  if(['Father','Mother','Parent'].includes(type)){
   if(sql.prepare("SELECT 1 FROM samaj_relationships WHERE person_id=? AND related_id=? AND type IN ('Father','Mother','Parent')").get(a.id,z.id))fail(409,'Parent relationship already exists');
   if(['Father','Mother'].includes(type)&&sql.prepare("SELECT 1 FROM samaj_relationships WHERE person_id=? AND type=? AND end_date=''").get(a.id,type))fail(409,'A parent of this type already exists');
   const cycle=sql.prepare("WITH RECURSIVE ancestors(id) AS (SELECT ? UNION SELECT r.related_id FROM samaj_relationships r JOIN ancestors a ON r.person_id=a.id WHERE r.type IN ('Father','Mother','Parent')) SELECT 1 FROM ancestors WHERE id=?").get(z.id,a.id);if(cycle)fail(400,'Ancestry cycle is not allowed');
  }
  const normalized={personId:a.id,relatedId:z.id,type};
  if(!approved&&(a.status==='VERIFIED'||z.status==='VERIFIED'))return request('relationship',a.id,{personHash:fingerprint(a),relatedHash:fingerprint(z)},normalized,ctx);
  const id=randomUUID();sql.prepare('INSERT INTO samaj_relationships(id,person_id,related_id,type,status,created_by) VALUES(?,?,?,?,?,?)').run(id,a.id,z.id,type,approved?'VERIFIED':'SUBMITTED',ctx.user.id);audit(ctx.user,ctx.samajId,'relationship.add',id,null,normalized);return {id};
 }
 return {sql,now,get,ref,fingerprint,all,audit,create,update,revision,request,membership,relationship};
}
module.exports={repository,tables};
