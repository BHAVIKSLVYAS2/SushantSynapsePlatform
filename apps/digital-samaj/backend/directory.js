'use strict';
const {fail}=require('../../../server/http');
function age(dob){const birth=new Date(dob+'T00:00:00Z'),today=new Date();return today.getUTCFullYear()-birth.getUTCFullYear()-(today.getUTCMonth()<birth.getUTCMonth()||today.getUTCMonth()===birth.getUTCMonth()&&today.getUTCDate()<birth.getUTCDate()?1:0);}
function directory({repo,ctx,kind,url}){
 const {samajId,sec}=ctx,q=(url.searchParams.get('q')||'').toLocaleLowerCase(),offset=Number(url.searchParams.get('offset')||0);
 if(!Number.isInteger(offset)||offset<0||q.length>200)fail(400,'Invalid query');
 const fields=['gotra','nativeVillage','currentCity','district','state','occupation','qualification','maritalStatus','code','familyCode'];
 const filters=Object.fromEntries(fields.map(k=>[k,(url.searchParams.get(k)||'').trim().toLocaleLowerCase()]).filter(([,v])=>v));
 if(Object.values(filters).some(v=>v.length>200))fail(400,'Filter is too long');
 const min=url.searchParams.has('minAge')&&url.searchParams.get('minAge')!==''?Number(url.searchParams.get('minAge')):null,max=url.searchParams.has('maxAge')&&url.searchParams.get('maxAge')!==''?Number(url.searchParams.get('maxAge')):null;
 if([min,max].some(v=>v!==null&&(!Number.isInteger(v)||v<0||v>130))||min!==null&&max!==null&&min>max)fail(400,'Invalid age range');
 const rows=repo.all(kind,samajId).filter(r=>r.status!=='ARCHIVED'&&sec.can('directory.search',r)&&sec.can(kind+'.view',r)&&(sec.can(kind+'.edit',r)||r.status==='VERIFIED')).map(r=>{
  const p=sec.project(r);if(kind==='person'){const families=repo.sql.prepare("SELECT family_id FROM samaj_memberships WHERE person_id=? AND end_date=''").all(r.id).map(m=>repo.get('family',m.family_id,samajId)).filter(f=>sec.can('family.view',f)&&(f.status==='VERIFIED'||sec.can('family.edit',f))).map(f=>sec.project(f));p.familyCodes=families.map(f=>f.code);p.gotras=[...new Set(families.map(f=>f.gotra).filter(Boolean))];}return p;
 }).filter(r=>{
  if(q&&!Object.entries(r).filter(([k])=>!['privacy','revision'].includes(k)).some(([,v])=>typeof v==='string'&&v.toLocaleLowerCase().includes(q)))return false;
  if(!Object.entries(filters).every(([k,v])=>{const value=k==='familyCode'?r.familyCodes:k==='gotra'&&kind==='person'?r.gotras:r[k];return Array.isArray(value)?value.some(s=>s.toLocaleLowerCase().includes(v)):String(value||'').toLocaleLowerCase().includes(v);}))return false;
  if(min!==null||max!==null){if(!r.dob)return false;const years=age(r.dob);if(min!==null&&years<min||max!==null&&years>max)return false;}return true;
 });
 return {items:rows.slice(offset,offset+50),total:rows.length};
}
function exportFamily(repo,ctx,id){const f=repo.get('family',id,ctx.samajId);ctx.sec.require('report.export',f);ctx.sec.require('family.view',f);if(f.status!=='VERIFIED'&&!ctx.sec.can('family.edit',f))fail(404,'Profile is not published');const members=repo.sql.prepare('SELECT person_id FROM samaj_memberships WHERE family_id=?').all(id).map(m=>repo.get('person',m.person_id,ctx.samajId)).filter(p=>p.status!=='ARCHIVED'&&ctx.sec.can('person.view',p)&&(p.status==='VERIFIED'||ctx.sec.can('person.edit',p))).map(p=>ctx.sec.project(p));const ids=new Set(members.map(p=>p.id));const edges=repo.sql.prepare('SELECT r.* FROM samaj_relationships r JOIN samaj_persons p ON p.id=r.person_id WHERE p.samaj_id=?').all(ctx.samajId);const relatives=[];for(let depth=0;depth<3;depth++){const known=new Set(ids);for(const e of edges){if(!known.has(e.person_id)&&!known.has(e.related_id))continue;for(const pid of [e.person_id,e.related_id]){if(ids.has(pid))continue;const p=repo.get('person',pid,ctx.samajId);if(p.status==='ARCHIVED'||!ctx.sec.can('person.view',p)||p.status!=='VERIFIED'&&!ctx.sec.can('person.edit',p))continue;ids.add(pid);relatives.push(ctx.sec.project(p));}}if(ids.size>150)break;}
 return {family:ctx.sec.project(f),members,relatives,relationships:edges.filter(e=>ids.has(e.person_id)&&ids.has(e.related_id)).map(({person_id,related_id,type})=>({personId:person_id,relatedId:related_id,type}))};}
module.exports={directory,exportFamily,age};
