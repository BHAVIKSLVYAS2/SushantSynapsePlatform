'use strict';
const {randomUUID}=require('node:crypto');
const {fail}=require('../../../server/http');
const {clean,privacy,text,personFields}=require('./validation');
const {csv,xlsx}=require('./spreadsheet');
const {decodeFile}=require('./files');
function workflows({repo,store}){
 const {sql}=repo;
 function duplicates(person,ctx){
  const d=JSON.parse(person.data),normalize=v=>String(v||'').trim().toLocaleLowerCase().replace(/[\s+()-]/g,'');
  return repo.all('person',ctx.samajId).filter(p=>p.id!==person.id&&p.status!=='ARCHIVED'&&ctx.sec.can('person.view',p)).flatMap(p=>{
   const other=JSON.parse(p.data);let score=0;const reasons=[];
   for(const [field,weight]of [['englishName',30],['hindiName',30],['dob',25],['mobile',30],['email',30],['nativeVillage',10]])if(d[field]&&other[field]&&normalize(d[field])===normalize(other[field])&&(!['dob','mobile','email'].includes(field)||(ctx.sec.visible(person,field)&&ctx.sec.visible(p,field)))){score+=weight;reasons.push(field);}
   const relatives=id=>sql.prepare("SELECT related_id,type FROM samaj_relationships WHERE person_id=? AND type IN ('Father','Mother','Spouse') UNION SELECT person_id,type FROM samaj_relationships WHERE related_id=? AND type='Spouse'").all(id,id);
   const a=relatives(person.id),b=relatives(p.id);if(a.some(r=>b.some(s=>s.related_id===r.related_id&&s.type===r.type))){score+=20;reasons.push('relationships');}
   if(score<30)return [];const [one,two]=[person.id,p.id].sort();if(sql.prepare('SELECT 1 FROM samaj_duplicate_decisions WHERE person_id=? AND related_id=?').get(one,two))return [];
   return [{person:ctx.sec.project(p),score:Math.min(score,100),reasons}];
  }).sort((a,b)=>b.score-a.score).slice(0,50);
 }
 function merge(b,ctx){
  ctx.sec.require('admin.manage');const source=repo.get('person',b.sourceId,ctx.samajId),target=repo.get('person',b.targetId,ctx.samajId);repo.revision(source,{revision:b.sourceRevision});repo.revision(target,{revision:b.targetRevision});
  if(source.id===target.id||source.status==='ARCHIVED'||target.status==='ARCHIVED')fail(400,'Choose distinct active records');
  if(sql.prepare("SELECT 1 FROM samaj_reviews WHERE entity_id IN (?,?) AND status='PENDING'").get(source.id,target.id))fail(409,'Resolve pending reviews before merging');
  if(sql.prepare('SELECT 1 FROM samaj_user_person WHERE person_id IN (?,?) GROUP BY samaj_id HAVING count(*)>1').get(source.id,target.id))fail(409,'Both profiles are claimed; resolve identity ownership first');
  const relationships=sql.prepare('SELECT * FROM samaj_relationships WHERE person_id=? OR related_id=?').all(source.id,source.id);
  if(relationships.some(r=>r.person_id===target.id||r.related_id===target.id))fail(409,'Related profiles cannot be merged');
  // Revalidate the complete resulting ancestry graph before any writes.
  const edges=sql.prepare("SELECT person_id,related_id FROM samaj_relationships WHERE type IN ('Father','Mother','Parent')").all().map(e=>[e.person_id===source.id?target.id:e.person_id,e.related_id===source.id?target.id:e.related_id]);
  const visiting=new Set(),done=new Set();function visit(id){if(visiting.has(id))fail(409,'Merge creates an ancestry cycle');if(done.has(id))return;visiting.add(id);for(const [a,z]of edges)if(a===id)visit(z);visiting.delete(id);done.add(id);}for(const [id]of edges)visit(id);
  const at=repo.now(),before={source,relationships,memberships:sql.prepare('SELECT * FROM samaj_memberships WHERE person_id=?').all(source.id)};
  for(const m of before.memberships){const existing=sql.prepare('SELECT id FROM samaj_memberships WHERE person_id=? AND family_id=? AND type=?').get(target.id,m.family_id,m.type);if(existing)continue;const primary=m.is_primary&&!sql.prepare("SELECT 1 FROM samaj_memberships WHERE person_id=? AND is_primary=1 AND end_date=''").get(target.id);sql.prepare('INSERT INTO samaj_memberships VALUES(?,?,?,?,?,?,?)').run(randomUUID(),target.id,m.family_id,m.type,primary?1:0,m.start_date,m.end_date);}
  for(const r of relationships){let a=r.person_id===source.id?target.id:r.person_id,z=r.related_id===source.id?target.id:r.related_id;if(['Spouse','Sibling'].includes(r.type)&&a>z)[a,z]=[z,a];if(['Father','Mother'].includes(r.type)&&sql.prepare("SELECT 1 FROM samaj_relationships WHERE person_id=? AND type=? AND related_id NOT IN (?,?) AND end_date=''").get(a,r.type,z,source.id))fail(409,'Merge would introduce conflicting parents');sql.prepare('INSERT OR IGNORE INTO samaj_relationships VALUES(?,?,?,?,?,?,?)').run(randomUUID(),a,z,r.type,r.status,r.end_date,r.created_by);}
  sql.prepare('UPDATE samaj_user_person SET person_id=? WHERE person_id=?').run(target.id,source.id);sql.prepare('UPDATE samaj_families SET head_id=?,revision=revision+1,updated_at=? WHERE head_id=?').run(target.id,at,source.id);
  sql.prepare("UPDATE samaj_persons SET status='ARCHIVED',merged_into=?,revision=revision+1,updated_at=? WHERE id=?").run(target.id,at,source.id);sql.prepare('UPDATE samaj_persons SET revision=revision+1,updated_at=? WHERE id=?').run(at,target.id);
  const [a,z]=[source.id,target.id].sort();sql.prepare('INSERT OR REPLACE INTO samaj_duplicate_decisions VALUES(?,?,?,?,?)').run(a,z,'MERGE',ctx.user.id,at);repo.audit(ctx.user,ctx.samajId,'person.merge',target.id,before,{targetId:target.id,sourceId:source.id});return {id:target.id};
 }
 return async({resource,id,action,method,b,ctx,json})=>{
  const {sec,user,samajId}=ctx;
  if(resource==='drafts'){
   if(method==='GET'&&!id)return json(200,{items:sql.prepare('SELECT id,revision,step,submitted_family_id,updated_at FROM samaj_drafts WHERE samaj_id=? AND user_id=? ORDER BY updated_at DESC').all(samajId,user.id)}),true;
   if(method==='POST'&&!id){if(!sec.grants.some(g=>g.permission==='family.create'))fail(403,'Family registration permission required');const did=randomUUID();store.transaction(()=>{sql.prepare('INSERT INTO samaj_drafts(id,samaj_id,user_id,data,updated_at) VALUES(?,?,?,?,?)').run(did,samajId,user.id,'{}',repo.now());repo.audit(user,samajId,'draft.create',did,null,{});});json(201,{id:did,revision:1,step:0,data:{}});return true;}
   const draft=sql.prepare('SELECT * FROM samaj_drafts WHERE id=? AND samaj_id=? AND user_id=?').get(id||'',samajId,user.id);if(!draft)fail(404,'Draft not found');
   if(method==='GET'){json(200,{...draft,data:JSON.parse(draft.data)});return true;}
   repo.revision(draft,b);if(draft.submitted_family_id)fail(409,'Draft is already submitted');
   if(method==='PATCH'){
    if(!Number.isInteger(b.step)||b.step<0||b.step>9||!b.data||typeof b.data!=='object'||Array.isArray(b.data)||JSON.stringify(b.data).length>2900000)fail(400,'Invalid draft');
    if(b.data.familyPhoto)decodeFile(b.data.familyPhoto,{photoOnly:true});
    store.transaction(()=>{sql.prepare('UPDATE samaj_drafts SET step=?,data=?,revision=revision+1,updated_at=? WHERE id=?').run(b.step,JSON.stringify(b.data),repo.now(),id);repo.audit(user,samajId,'draft.save',id,{revision:draft.revision},{revision:draft.revision+1,step:b.step});});json(200,{id,revision:draft.revision+1});return true;
   }
   if(method==='POST'&&action==='submit'){
    const result=store.transaction(()=>{const d=JSON.parse(draft.data);if(b.consent!==true)fail(400,'Consent is required');if(!Array.isArray(d.members)||d.members.length>40)fail(400,'Maximum 40 members per registration');
     const family=repo.create('family',{data:d.family,privacy:d.privacy},ctx),members=[{personId:d.headPersonId||'',data:d.head,type:'BirthFamily',relationship:''},...d.members];let head;
     for(const [i,m]of members.entries()){
      const p=m.personId?repo.ref('person',m.personId,samajId):repo.create('person',{data:{state:d.family.state||'',district:d.family.district||'',nativeVillage:d.family.nativeVillage||'',...m.data},privacy:d.privacy},ctx);
      if(i===0)head=p;
      const joined=repo.membership({personId:p.id,familyId:family.id,type:m.type||'BirthFamily',isPrimary:!sql.prepare("SELECT 1 FROM samaj_memberships WHERE person_id=? AND is_primary=1 AND end_date=''").get(p.id)},ctx);
      if(i&&m.relationship)repo.relationship({personId:head.id,relatedId:p.id,type:m.relationship},ctx);
      if(!m.personId){sql.prepare("UPDATE samaj_persons SET status='SUBMITTED',revision=revision+1 WHERE id=?").run(p.id);repo.request('verify.person',p.id,{revision:2,status:'DRAFT'},{status:'VERIFIED'},ctx);}

     }
     if(d.familyPhoto){const file=decodeFile(d.familyPhoto,{photoOnly:true}),fid=randomUUID();sql.prepare('INSERT INTO samaj_files VALUES(?,?,?,?,?,?,?,?,?)').run(fid,samajId,null,family.id,file.name,file.mime,file.content,user.id,repo.now());sql.prepare('UPDATE samaj_families SET data=? WHERE id=?').run(JSON.stringify({...JSON.parse(family.data),photo:fid}),family.id);}
     sql.prepare("UPDATE samaj_families SET head_id=?,status='SUBMITTED',revision=revision+1 WHERE id=?").run(head.id,family.id);sql.prepare('INSERT INTO samaj_consent VALUES(?,?,?,?,?)').run(randomUUID(),family.id,user.id,'1',repo.now());repo.request('verify.family',family.id,{revision:2,status:'DRAFT'},{status:'VERIFIED'},ctx);
     sql.prepare('UPDATE samaj_drafts SET submitted_family_id=?,revision=revision+1,updated_at=? WHERE id=?').run(family.id,repo.now(),id);repo.audit(user,samajId,'draft.submit',id,null,{familyId:family.id});return {familyId:family.id};});json(201,result);return true;
   }
  }
  if(resource==='duplicates'){
   sec.require('admin.manage');
   if(method==='GET'&&id){json(200,{items:duplicates(repo.get('person',id,samajId),ctx)});return true;}
   if(method==='POST'&&action==='ignore'){const p=repo.get('person',id,samajId),z=repo.get('person',b.relatedId,samajId);if(p.id===z.id)fail(400,'Choose distinct records');const [a,c]=[p.id,z.id].sort();store.transaction(()=>{sql.prepare('INSERT OR REPLACE INTO samaj_duplicate_decisions VALUES(?,?,?,?,?)').run(a,c,'IGNORE',user.id,repo.now());repo.audit(user,samajId,'duplicate.ignore',a,null,{relatedId:c});});json(200,{ok:true});return true;}
   if(method==='POST'&&id==='merge'){json(200,store.transaction(()=>merge(b,ctx)));return true;}
  }
  if(resource==='imports'){
   sec.require('admin.manage');
   if(method==='POST'&&id==='file'){if(typeof b.content!=='string'||b.content.length>2800000)fail(400,'Import file exceeds 2 MB');const buffer=Buffer.from(b.content,'base64');json(200,b.name?.toLowerCase().endsWith('.xlsx')?xlsx(buffer):csv(buffer.toString('utf8')));return true;}
   if(method==='POST'&&!id){
    if(!Array.isArray(b.rows)||b.rows.length<1||b.rows.length>500||!b.mapping||typeof b.mapping!=='object')fail(400,'Provide 1–500 rows and column mapping');
    for(const field of Object.keys(b.mapping))if(!personFields.includes(field))fail(400,'Invalid import column');
    const seen=new Set(),rows=b.rows.map((row,index)=>{try{const data={};for(const [field,column]of Object.entries(b.mapping))if(row[column]!==undefined)data[field]=row[column];const value=clean('person',data),key=(value.englishName||value.hindiName).toLocaleLowerCase()+'|'+(value.dob||'');const matches=repo.all('person',samajId).filter(p=>p.status!=='ARCHIVED').filter(p=>{const d=JSON.parse(p.data);return (d.englishName||d.hindiName).toLocaleLowerCase()===(value.englishName||value.hindiName).toLocaleLowerCase()||value.email&&sec.visible(p,'email')&&d.email===value.email||value.mobile&&sec.visible(p,'mobile')&&d.mobile===value.mobile;});const duplicate=seen.has(key)||matches.length>0;seen.add(key);return {row:index+1,data:value,status:duplicate?'DUPLICATE':'READY'};}catch(e){return {row:index+1,status:'ERROR',error:e.message};}});
    const jid=randomUUID();store.transaction(()=>{sql.prepare('INSERT INTO samaj_import_jobs VALUES(?,?,?,?,?,?)').run(jid,samajId,user.id,'PREVIEW',JSON.stringify(rows),repo.now());repo.audit(user,samajId,'import.preview',jid,null,{rows:rows.length});});json(201,{id:jid,rows});return true;
   }
   if(method==='POST'&&id&&action==='commit'){
    const result=store.transaction(()=>{const job=sql.prepare('SELECT * FROM samaj_import_jobs WHERE id=? AND samaj_id=? AND created_by=?').get(id,samajId,user.id);if(!job||job.status!=='PREVIEW')fail(409,'Import is not pending');const rows=JSON.parse(job.data),report={created:0,updated:0,skipped:0,duplicates:0,errors:0};for(const row of rows){if(row.status==='ERROR'){report.errors++;continue;}if(row.status==='DUPLICATE'){report.duplicates++;report.skipped++;continue;}const name=(row.data.englishName||row.data.hindiName).toLocaleLowerCase();if(repo.all('person',samajId).some(p=>{const d=JSON.parse(p.data);return p.status!=='ARCHIVED'&&(d.englishName||d.hindiName).toLocaleLowerCase()===name;})){report.duplicates++;report.skipped++;continue;}repo.create('person',{data:row.data},ctx);report.created++;}sql.prepare("UPDATE samaj_import_jobs SET status='IMPORTED' WHERE id=?").run(id);repo.audit(user,samajId,'import.commit',id,null,report);return report;});json(200,result);return true;
   }
  }
  if(resource==='dashboard'&&method==='GET'){
   if(!sec.grants.some(g=>g.permission==='report.view'))fail(403,'Reporting permission required');const people=repo.all('person',samajId).filter(p=>p.status!=='ARCHIVED'&&sec.can('report.view',p)),families=repo.all('family',samajId).filter(p=>p.status!=='ARCHIVED'&&sec.can('report.view',p));const stats={};for(const field of ['gender','state','district','nativeVillage','education','occupation']){const counts={};for(const p of people){const value=JSON.parse(p.data)[field];if(value)counts[value]=(counts[value]||0)+1;}stats[field]=Object.fromEntries(Object.entries(counts).filter(([,n])=>n>=5));}const ages={},gotras={};for(const p of people){const dob=JSON.parse(p.data).dob;if(dob&&sec.visible(p,'dob')){const years=require('./directory').age(dob),band=years<18?'0–17':years<35?'18–34':years<60?'35–59':'60+';ages[band]=(ages[band]||0)+1;}}for(const f of families){const gotra=JSON.parse(f.data).gotra;if(gotra)gotras[gotra]=(gotras[gotra]||0)+1;}stats.age=Object.fromEntries(Object.entries(ages).filter(([,n])=>n>=5));stats.gotra=Object.fromEntries(Object.entries(gotras).filter(([,n])=>n>=5));json(200,{families:families.length,members:people.length,verified:people.filter(p=>p.status==='VERIFIED').length,pending:people.filter(p=>['SUBMITTED','UNDER_REVIEW'].includes(p.status)).length,corrections:people.filter(p=>p.status==='CORRECTION_REQUIRED').length,statistics:stats,suppressionMinimum:5});return true;
  }
  return false;
 };
}
module.exports={workflows};
