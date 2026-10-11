const original=require('./security');
async function security(sql,user,samajId){
 const grants=await sql.prepare('SELECT g.*,p.permission FROM [samaj].[samaj_grants] g JOIN [samaj].[samaj_role_permissions] p ON p.role_id=g.role_id WHERE g.user_id=? AND g.samaj_id=?').all(user.id,samajId);
 const linked=await sql.prepare('SELECT person_id FROM [samaj].[samaj_user_person] WHERE user_id=? AND samaj_id=?').get(user.id,samajId);
 const familyIds=linked?await sql.prepare("SELECT family_id FROM [samaj].[samaj_memberships] WHERE person_id=? AND end_date=''").all(linked.person_id):[];
 const memberships=await sql.prepare("SELECT m.person_id,m.family_id FROM [samaj].[samaj_memberships] m JOIN [samaj].[samaj_persons] p ON p.id=m.person_id WHERE p.samaj_id=? AND m.end_date=''").all(samajId);
 // Reuse the original scope/privacy rules with a complete request-local membership
 // projection. Never cache grants across requests or substitute platform ownership.
 const currentMemberships=()=>{const rows=new Map(memberships.map(r=>[r.person_id+'|'+r.family_id,r]));for(const {row,old}of sql.overlay?.get('samaj_memberships')?.values()||[]){if(old)rows.delete(old.person_id+'|'+old.family_id);if(row&&row.end_date==='')rows.set(row.person_id+'|'+row.family_id,row);}return [...rows.values()];};
 const snapshot={prepare(query){return {all(){if(query.includes('samaj_role_permissions'))return grants;if(query.includes('SELECT family_id'))return linked?currentMemberships().filter(r=>r.person_id===linked.person_id):familyIds;if(query.includes('SELECT m.person_id'))return currentMemberships();throw Error('Unexpected permission query');},get(){if(query.includes('samaj_user_person'))return linked;throw Error('Unexpected permission query');}};}};
 const initial=original.security(snapshot,user,samajId,{readOnly:true});
 // A newly created person can acquire a family membership within the same atomic
 // request. Scope/privacy checks must see staged memberships before projection.
 for(const method of ['can','require','visible','project','sameFamily'])initial[method]=(...args)=>original.security(snapshot,user,samajId,{readOnly:true})[method](...args);
 return initial;
}
module.exports={...original,security};
