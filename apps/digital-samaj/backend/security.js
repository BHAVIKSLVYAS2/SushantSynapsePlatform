'use strict';
const {fail}=require('../../../server/http');
const permissions=['family.view','family.create','family.edit','person.view','person.create','person.edit','person.mobile.view','person.address.view','person.dob.view','verification.approve','directory.search','report.view','report.export','admin.manage','chat.use','announcement.create'];
const reader=['family.view','person.view','directory.search','person.mobile.view','person.address.view','person.dob.view'];
const roles={SUPER_ADMIN:permissions,SAMAJ_ADMIN:permissions,AREA_COORDINATOR:permissions.filter(p=>!['admin.manage','announcement.create'].includes(p)),FAMILY_ADMIN:[...reader,'family.create','family.edit','person.create','person.edit','report.export','chat.use'],FAMILY_MEMBER:[...reader,'person.edit','chat.use'],VERIFIED_MEMBER:[...reader,'chat.use'],GUEST:['family.view','person.view','directory.search']};
const sensitive=['mobile','alternateMobile','whatsapp','email','dob','birthTime','birthPlace','address','pin','photo','bloodGroup','achievements'];
function security(sql,user,samajId){
 const grants=sql.prepare('SELECT g.*,p.permission FROM samaj_grants g JOIN samaj_role_permissions p ON p.role_id=g.role_id WHERE g.user_id=? AND g.samaj_id=?').all(user.id,samajId);
 const linked=sql.prepare('SELECT person_id FROM samaj_user_person WHERE user_id=? AND samaj_id=?').get(user.id,samajId)?.person_id;
 const familyIds=linked?sql.prepare("SELECT family_id FROM samaj_memberships WHERE person_id=? AND end_date=''").all(linked).map(r=>r.family_id):[];
 function scope(g,r){
  if(!r)return g.scope==='ALL';
  if(r.samaj_id!==samajId)return false;
  if(g.scope==='ALL')return true;
  if(g.scope==='SELF')return r.id===linked;
  if(g.scope==='FAMILY')return r.kind==='family'?r.id===g.scope_value:!!sql.prepare("SELECT 1 FROM samaj_memberships WHERE person_id=? AND family_id=? AND end_date=''").get(r.id,g.scope_value);
  const d=typeof r.data==='string'?JSON.parse(r.data):r.data;
  const place=g.scope==='STATE'?[d.state]:g.scope==='DISTRICT'?[d.state,d.district]:[d.state,d.district,d.nativeVillage];
  return place.every(Boolean)&&place.join('|')===g.scope_value;
 }
 const can=(permission,r)=>grants.some(g=>g.permission===permission&&scope(g,r));
 const requirePermission=(p,r)=>{if(!can(p,r))fail(403,'Permission or scope denied');};
 function sameFamily(r){return r.kind==='family'?familyIds.includes(r.id):!!sql.prepare("SELECT 1 FROM samaj_memberships WHERE person_id=? AND end_date='' AND family_id IN (SELECT family_id FROM samaj_memberships WHERE person_id=? AND end_date='')").get(r.id,linked||'');}
 function visible(r,field){
  const privacy=typeof r.privacy==='string'?JSON.parse(r.privacy):r.privacy;
  const level=privacy[field]||'PRIVATE';
  const permission=['mobile','alternateMobile','whatsapp','email'].includes(field)?'person.mobile.view':['address','pin'].includes(field)?'person.address.view':field==='dob'?'person.dob.view':(r.kind==='family'?'family.view':'person.view');
  if(!can(permission,r))return false;
  if(level==='PUBLIC')return true;
  if(level==='SAMAJ')return grants.length>0;
  if(level==='ADMIN')return can('verification.approve',r);
  if(level==='FAMILY')return sameFamily(r)||r.id===linked;
  return r.id===linked||(r.created_by===user.id&&!['VERIFIED','ARCHIVED'].includes(r.status)&&can(r.kind+'.edit',r))||(r.kind==='family'&&sameFamily(r)&&can('family.edit',r));
 }
 function project(r){
  requirePermission(r.kind==='family'?'family.view':'person.view',r);
  const data=JSON.parse(r.data),out={id:r.id,code:r.code,status:r.status,revision:r.revision,kind:r.kind};
  for(const [k,v]of Object.entries(data))if(!sensitive.includes(k)||visible(r,k))out[k]=v;
  if(r.kind==='family')out.headId=r.head_id;
  if(can(r.kind==='family'?'family.edit':'person.edit',r))out.privacy=JSON.parse(r.privacy);
  return out;
 }
 return {grants,linked,can,require:requirePermission,visible,project,sameFamily};
}
module.exports={roles,permissions,sensitive,security};
