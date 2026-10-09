const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{Readable}=require('node:stream');
const {Store}=require('../apps/advocate/backend/store');
const {createDigitalSamaj}=require('../apps/digital-samaj/backend/routes');
const {createAuth}=require('../packages/auth');
function setup(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'samaj-test-')),store=new Store(root),auth=createAuth({store,initializeWorkspace(){}});
 t.after(()=>{store.sql.close();fs.rmSync(root,{recursive:true,force:true});});
 for(const [id,role]of [['owner','Owner'],['reviewer','Owner'],['member','Clerk'],['outsider','Clerk']])store.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(id,id,id+'@example.test',role,'unused');
 store.setAccess('member',['digital-samaj']);const handler=createDigitalSamaj({store,auth});
 async function call(user,route='',method='GET',body={}){let result;await handler({route:'digital-samaj'+route.split('?')[0],method,user:user?store.user(user):null,req:Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]),{headers:{'content-type':'application/json'},url:'/api/digital-samaj'+route}),json(status,data){result={status,data};}});return result.data;}
 return {store,call};
}
test('Samaj additive migration, shared access, explicit bootstrap, scoped grants and append-only audit',async t=>{
 const {store,call}=setup(t);await assert.rejects(call(null),{status:401});await assert.rejects(call('outsider'),{status:403});await assert.rejects(call('member','','POST',{name:'Test'}),{status:403});
 const c=await call('owner','','POST',{name:'Test Samaj'}),base='/'+c.id;
 assert.equal((await call('reviewer')).communities.length,0);await assert.rejects(call('reviewer',base),{status:403});
 await call('owner',base+'/grants','POST',{userId:'member',role:'FAMILY_ADMIN',scope:'STATE',scopeValue:'Gujarat'});
 await assert.rejects(call('member',base+'/persons','POST',{data:{englishName:'Wrong state',state:'Rajasthan'}}),{status:403});
 const p=await call('member',base+'/persons','POST',{data:{englishName:'Person',state:'Gujarat',dob:'1990-01-01',mobile:'9876543210'}});
 assert.equal(p.dob,'1990-01-01');assert.equal(p.mobile,'9876543210');
 await assert.rejects(call('member',base+'/grants','POST',{userId:'member',role:'SUPER_ADMIN',scope:'ALL',scopeValue:''}),{status:403});
 assert.throws(()=>store.sql.exec('DELETE FROM samaj_audit'),/append only/);
 createDigitalSamaj({store,auth:createAuth({store})});assert.equal(store.sql.prepare('SELECT COUNT(*) n FROM samaj_persons').get().n,1);
 assert.equal(store.sql.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.ok(store.extraExportTables.includes('samaj_persons'));
});
test('Person identity spans birth and marital families, deceased ancestors persist and relationships reject inverses/cycles',async t=>{
 const {call}=setup(t),c=await call('owner','','POST',{name:'Genealogy'}),base='/'+c.id;
 const person=async name=>call('owner',base+'/persons','POST',{data:{englishName:name}}),family=async name=>call('owner',base+'/families','POST',{data:{name}});
 const p=await person('Daughter'),mother=await person('Mother'),grand=await call('owner',base+'/persons','POST',{data:{englishName:'Grandmother',isDeceased:true,dob:'1930-01-01',dateOfDeath:'2020-01-01'}}),birth=await family('Birth family'),married=await family('Marital family');
 for(const [f,type,isPrimary]of [[birth,'BirthFamily',true],[married,'MaritalFamily',false]])await call('owner',base+'/memberships','POST',{personId:p.id,familyId:f.id,type,isPrimary});
 assert.equal((await call('owner',base+'/persons/'+p.id)).memberships.length,2);
 await call('owner',base+'/relationships','POST',{personId:p.id,relatedId:mother.id,type:'Mother'});
 await assert.rejects(call('owner',base+'/relationships','POST',{personId:mother.id,relatedId:p.id,type:'Child'}),/already exists/);
 await call('owner',base+'/relationships','POST',{personId:mother.id,relatedId:grand.id,type:'Mother'});
 await assert.rejects(call('owner',base+'/relationships','POST',{personId:grand.id,relatedId:p.id,type:'Mother'}),/cycle/);
 const tree=await call('owner',base+'/tree/'+p.id);assert.equal(tree.nodes.length,3);assert.equal(tree.nodes.find(x=>x.id===grand.id).isDeceased,true);
 await assert.rejects(call('owner',base+'/persons/'+p.id,'PATCH',{revision:99,data:{englishName:'Stale'}}),{status:409});
});
test('Review requires separate approver, important changes retain published value, private data cannot be searched',async t=>{
 const {call}=setup(t),c=await call('owner','','POST',{name:'Review'}),base='/'+c.id;
 await call('owner',base+'/grants','POST',{userId:'reviewer',role:'SAMAJ_ADMIN',scope:'ALL',scopeValue:''});
 await call('owner',base+'/grants','POST',{userId:'member',role:'VERIFIED_MEMBER',scope:'ALL',scopeValue:''});
 const p=await call('owner',base+'/persons','POST',{data:{englishName:'Original',mobile:'9876543210',dob:'2000-01-01'},privacy:{mobile:'PRIVATE',dob:'ADMIN'}});
 const r=await call('owner',base+'/persons/'+p.id+'/submit','POST',{revision:p.revision});
 await assert.rejects(call('owner',base+'/reviews/'+r.reviewId,'POST',{decision:'APPROVE',reason:'Checked'}),{status:403});
 await call('reviewer',base+'/reviews/'+r.reviewId,'POST',{decision:'APPROVE',reason:'Checked evidence'});
 const published=await call('owner',base+'/persons/'+p.id);assert.equal(published.status,'VERIFIED');
 const change=await call('owner',base+'/persons/'+p.id,'PATCH',{revision:published.revision,data:{englishName:'Corrected'}});assert.ok(change.reviewId);
 assert.equal((await call('member',base+'/persons/'+p.id)).englishName,'Original');
 assert.equal((await call('member',base+'/persons?q=9876543210')).total,0);
 assert.equal((await call('member',base+'/persons/'+p.id)).dob,undefined);
 const preview=await call('reviewer',base+'/imports','POST',{mapping:{englishName:'Name',mobile:'Phone'},rows:[{Name:'Unrelated name',Phone:'9876543210'}]});assert.equal(preview.rows[0].status,'READY','Import must not reveal a private phone match');
 await call('reviewer',base+'/reviews/'+change.reviewId,'POST',{decision:'APPROVE',reason:'Correction verified'});
 assert.equal((await call('member',base+'/persons/'+p.id)).englishName,'Corrected');
});

test('Wizard drafts are owner-private, stale saves fail and invalid submission rolls back every entity',async t=>{
 const {call,store}=setup(t),c=await call('owner','','POST',{name:'Wizard'}),base='/'+c.id;
 await call('owner',base+'/grants','POST',{userId:'reviewer',role:'SAMAJ_ADMIN',scope:'ALL',scopeValue:''});
 const draft=await call('owner',base+'/drafts','POST');await assert.rejects(call('reviewer',base+'/drafts/'+draft.id),{status:404});
 const data={family:{name:'Test family',state:'Gujarat'},head:{englishName:'Head'},members:[{data:{englishName:'Child',dob:'2025-02-30'},type:'BirthFamily',relationship:'Child'}],privacy:{mobile:'FAMILY'}};
 await call('owner',base+'/drafts/'+draft.id,'PATCH',{revision:1,step:9,data});await assert.rejects(call('owner',base+'/drafts/'+draft.id,'PATCH',{revision:1,step:9,data}),{status:409});
 await assert.rejects(call('owner',base+'/drafts/'+draft.id+'/submit','POST',{revision:2,consent:true}),/date/);
 assert.equal(store.sql.prepare('SELECT count(*) n FROM samaj_persons').get().n,0);assert.equal(store.sql.prepare('SELECT count(*) n FROM samaj_families').get().n,0);
 data.members[0].data.dob='2020-02-29';await call('owner',base+'/drafts/'+draft.id,'PATCH',{revision:2,step:9,data});
 const result=await call('owner',base+'/drafts/'+draft.id+'/submit','POST',{revision:3,consent:true});const family=await call('owner',base+'/families/'+result.familyId);
 assert.equal(family.members.length,2);assert.equal(family.status,'SUBMITTED');assert.equal(store.sql.prepare('SELECT count(*) n FROM samaj_consent').get().n,1);
 await assert.rejects(call('owner',base+'/drafts/'+draft.id+'/submit','POST',{revision:4,consent:true}),/already submitted/);
});

test('Duplicate merge is explicit, retains historical rows, handles memberships, and protects conflicting parents',async t=>{
 const {call,store}=setup(t),c=await call('owner','','POST',{name:'Merge'}),base='/'+c.id;
 const create=englishName=>call('owner',base+'/persons','POST',{data:{englishName}}),a=await create('Same Name'),b=await create('Same Name'),child=await create('Child');
 await call('owner',base+'/relationships','POST',{personId:child.id,relatedId:b.id,type:'Father'});
 const dup=await call('owner',base+'/duplicates/'+a.id);assert.equal(dup.items[0].person.id,b.id);
 await call('owner',base+'/duplicates/merge','POST',{sourceId:b.id,targetId:a.id,sourceRevision:1,targetRevision:1});
 assert.equal(store.sql.prepare('SELECT merged_into FROM samaj_persons WHERE id=?').get(b.id).merged_into,a.id);
 assert.equal(store.sql.prepare('SELECT count(*) n FROM samaj_persons').get().n,3);
 assert.equal(store.sql.prepare('SELECT count(*) n FROM samaj_relationships WHERE person_id=?').get(child.id).n,2);
 const tree=await call('owner',base+'/tree/'+child.id);assert.ok(tree.nodes.some(p=>p.id===a.id));assert.ok(!tree.nodes.some(p=>p.id===b.id));
});

test('Import preview validates rows, detects duplicates, preserves existing profiles and commits only once',async t=>{
 const {call}=setup(t),c=await call('owner','','POST',{name:'Import'}),base='/'+c.id;
 await call('owner',base+'/persons','POST',{data:{englishName:'Existing'}});
 const preview=await call('owner',base+'/imports','POST',{mapping:{englishName:'Name',dob:'Birth'},rows:[{Name:'Existing'},{Name:'New Person',Birth:'1999-01-01'},{Name:'Bad',Birth:'1999-02-30'}]});
 assert.deepEqual(preview.rows.map(r=>r.status),['DUPLICATE','READY','ERROR']);
 const report=await call('owner',base+'/imports/'+preview.id+'/commit','POST',{});assert.equal(report.created,1);assert.equal(report.duplicates,1);assert.equal(report.errors,1);
 await assert.rejects(call('owner',base+'/imports/'+preview.id+'/commit','POST',{}),{status:409});
});

test('Chat requires claims and independent review, protects participants, gates requests and enforces blocks',async t=>{
 const {call,store}=setup(t),c=await call('owner','','POST',{name:'Chat'}),base='/'+c.id;
 await call('owner',base+'/grants','POST',{userId:'reviewer',role:'SAMAJ_ADMIN',scope:'ALL',scopeValue:''});
 await call('owner',base+'/grants','POST',{userId:'member',role:'VERIFIED_MEMBER',scope:'ALL',scopeValue:''});
 await assert.rejects(call('member',base+'/connect'),{status:403});
 const profiles=[];
 for(const [who,name]of [['owner','Owner Person'],['member','Member Person'],['reviewer','Reviewer Person']]){
  const p=await call('owner',base+'/persons','POST',{data:{englishName:name,mobile:'9876543210'}});profiles.push(p);
  const verify=await call('owner',base+'/persons/'+p.id+'/submit','POST',{revision:1});await call('reviewer',base+'/reviews/'+verify.reviewId,'POST',{decision:'APPROVE',reason:'Verified evidence'});
  const claim=await call(who,base+'/claims','POST',{personId:p.id,reason:'Family confirms identity'});await call(who==='reviewer'?'owner':'reviewer',base+'/reviews/'+claim.reviewId,'POST',{decision:'APPROVE',reason:'Confirmed identity'});
 }
 const request=await call('owner',base+'/connect','POST',{personId:profiles[1].id,reason:'Family Connection'});
 await assert.rejects(call('owner',base+'/connect/'+request.id+'/send','POST',{body:'Before acceptance'}),{status:403});
 await assert.rejects(call('reviewer',base+'/connect/'+request.id),{status:404});
 await assert.rejects(call('owner',base+'/connect/'+request.id+'/decision','POST',{status:'ACCEPTED'}),{status:403});
 await call('member',base+'/connect/'+request.id+'/decision','POST',{status:'ACCEPTED'});
 const message=await call('owner',base+'/connect/'+request.id+'/send','POST',{body:'Hello without exposing a phone number'});
 assert.equal((await call('member',base+'/connect')).items[0].unread,1);
 await call('member',base+'/connect/'+request.id+'/read','POST',{});assert.equal((await call('member',base+'/connect')).items[0].unread,0);
 assert.equal(JSON.stringify(await call('member',base+'/connect')).includes('9876543210'),false);
 await call('member',base+'/messages/'+message.id+'/report','POST',{reason:'Please review this message'});
 assert.equal((await call('reviewer',base+'/moderation')).items[0].body,'Hello without exposing a phone number');
 await call('member',base+'/blocks','POST',{userId:'owner'});await assert.rejects(call('owner',base+'/connect/'+request.id+'/send','POST',{body:'Blocked'}),{status:403});
 assert.equal(store.sql.prepare('SELECT count(*) n FROM samaj_messages').get().n,1);
});

test('Full SQL export restores populated Samaj, claims, deferred merge references and private files',async t=>{
 const {DatabaseSync}=require('node:sqlite'),{call,store}=setup(t),c=await call('owner','','POST',{name:'Backup'}),base='/'+c.id;
 const a=await call('owner',base+'/persons','POST',{data:{englishName:'First'}}),z=await call('owner',base+'/persons','POST',{data:{englishName:'Second'}});
 await call('owner',base+'/duplicates/merge','POST',{sourceId:a.id,targetId:z.id,sourceRevision:1,targetRevision:1});
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
 await call('owner',base+'/photos','POST',{kind:'person',entityId:z.id,revision:2,name:'one.png',mime:'image/png',content:png});
 const restored=new DatabaseSync(':memory:');try{restored.exec(store.exportSql());assert.equal(restored.prepare('SELECT count(*) n FROM samaj_persons').get().n,2);assert.equal(restored.prepare('SELECT count(*) n FROM samaj_files').get().n,1);assert.equal(restored.prepare('SELECT count(*) n FROM samaj_migrations').get().n,3);assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);}finally{restored.close();}
});

test('Geographic reviewers stay in scope and family-scoped creators cannot move or view other families',async t=>{
 const {call}=setup(t),c=await call('owner','','POST',{name:'Scopes'}),base='/'+c.id;
 await call('owner',base+'/grants','POST',{userId:'reviewer',role:'AREA_COORDINATOR',scope:'DISTRICT',scopeValue:'Gujarat|Surat'});
 const inside=await call('owner',base+'/persons','POST',{data:{englishName:'Inside',state:'Gujarat',district:'Surat'}}),outside=await call('owner',base+'/persons','POST',{data:{englishName:'Outside',state:'Gujarat',district:'Vadodara'}});
 const a=await call('owner',base+'/persons/'+inside.id+'/submit','POST',{revision:1}),z=await call('owner',base+'/persons/'+outside.id+'/submit','POST',{revision:1});
 assert.equal((await call('reviewer',base+'/reviews')).items.length,1);await assert.rejects(call('reviewer',base+'/reviews/'+z.reviewId),{status:403});await call('reviewer',base+'/reviews/'+a.reviewId,'POST',{decision:'APPROVE',reason:'Local evidence'});
 const f=await call('owner',base+'/families','POST',{data:{name:'Scoped family'}});await call('owner',base+'/grants','POST',{userId:'member',role:'FAMILY_ADMIN',scope:'FAMILY',scopeValue:f.id});
 const p=await call('member',base+'/persons','POST',{familyId:f.id,data:{englishName:'Family member'}});assert.equal((await call('member',base+'/persons/'+p.id)).memberships.length,1);await assert.rejects(call('member',base+'/persons/'+outside.id),{status:404});
});

test('CSV and bounded XLSX parse values, shared strings and Hindi without evaluating formulas',()=>{
 const {csv,xlsx}=require('../apps/digital-samaj/backend/spreadsheet');assert.equal(csv('Name,City\n"Vyas, Ramesh",Surat').rows[0].Name,'Vyas, Ramesh');assert.throws(()=>csv('Name,Name\na,b'),/unique/);
 function archive(files){const locals=[],directories=[];let offset=0;for(const [name,xml]of Object.entries(files)){const n=Buffer.from(name),b=Buffer.from(xml),local=Buffer.alloc(30),central=Buffer.alloc(46);local.writeUInt32LE(0x04034b50);local.writeUInt32LE(b.length,18);local.writeUInt32LE(b.length,22);local.writeUInt16LE(n.length,26);central.writeUInt32LE(0x02014b50);central.writeUInt32LE(b.length,20);central.writeUInt32LE(b.length,24);central.writeUInt16LE(n.length,28);central.writeUInt32LE(offset,42);locals.push(local,n,b);directories.push(central,n);offset+=local.length+n.length+b.length;}const dir=Buffer.concat(directories),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(directories.length/2,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,dir,end]);}
 const sheet='<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Name</t></is></c></row><row r="2"><c r="A2" t="s"><v>0</v></c></row></sheetData></worksheet>',shared='<sst><si><t>रमेश व्यास</t></si></sst>';
 assert.equal(xlsx(archive({'xl/worksheets/sheet1.xml':sheet,'xl/sharedStrings.xml':shared})).rows[0].Name,'रमेश व्यास');assert.throws(()=>xlsx(archive({'xl/worksheets/sheet1.xml':sheet.replace('<v>0</v>','<f>1+1</f><v>2</v>')})),/formulas|calculated/);
});

test('Verified family head changes require an independent, revision-checked approval',async t=>{
 const {call}=setup(t),c=await call('owner','','POST',{name:'Family head'}),base='/'+c.id;
 await call('owner',base+'/grants','POST',{userId:'reviewer',role:'SAMAJ_ADMIN',scope:'ALL',scopeValue:''});
 const family=await call('owner',base+'/families','POST',{data:{name:'Family'}}),a=await call('owner',base+'/persons','POST',{data:{englishName:'First head'}}),z=await call('owner',base+'/persons','POST',{data:{englishName:'Next head'}});
 for(const p of [a,z])await call('owner',base+'/memberships','POST',{personId:p.id,familyId:family.id,type:'BirthFamily',isPrimary:true});
 await call('owner',base+'/families/'+family.id+'/head','POST',{personId:a.id,revision:1});
 const review=await call('owner',base+'/families/'+family.id+'/submit','POST',{revision:2,consent:true});await call('reviewer',base+'/reviews/'+review.reviewId,'POST',{decision:'APPROVE',reason:'Family confirmed'});
 const pending=await call('owner',base+'/families/'+family.id+'/head','POST',{personId:z.id,revision:4});assert.ok(pending.reviewId);assert.equal((await call('owner',base+'/families/'+family.id)).headId,a.id);
 await call('reviewer',base+'/reviews/'+pending.reviewId,'POST',{decision:'APPROVE',reason:'Head confirmed'});assert.equal((await call('owner',base+'/families/'+family.id)).headId,z.id);
});

test('Registration reuses a verified head by member code and independently approves multiple associations',async t=>{
 const {call,store}=setup(t),c=await call('owner','','POST',{name:'Reuse identity'}),base='/'+c.id;
 await call('owner',base+'/grants','POST',{userId:'reviewer',role:'SAMAJ_ADMIN',scope:'ALL',scopeValue:''});
 const p=await call('owner',base+'/persons','POST',{data:{englishName:'Existing head'}}),verify=await call('owner',base+'/persons/'+p.id+'/submit','POST',{revision:1});await call('reviewer',base+'/reviews/'+verify.reviewId,'POST',{decision:'APPROVE',reason:'Verified'});
 const d=await call('owner',base+'/drafts','POST',{}),data={family:{name:'New family context'},headPersonId:p.code,head:{},members:[{data:{englishName:'Father'},relationship:'Father',type:'BirthFamily'},{data:{englishName:'Mother'},relationship:'Mother',type:'BirthFamily'}]};
 await call('owner',base+'/drafts/'+d.id,'PATCH',{revision:1,step:9,data});const result=await call('owner',base+'/drafts/'+d.id+'/submit','POST',{revision:2,consent:true});
 assert.equal(store.sql.prepare('SELECT count(*) n FROM samaj_persons').get().n,3);
 const pending=(await call('reviewer',base+'/reviews')).items;
 for(const r of pending.filter(r=>r.kind==='verify.person'))await call('reviewer',base+'/reviews/'+r.id,'POST',{decision:'APPROVE',reason:'Identity verified'});
 for(const r of pending.filter(r=>r.kind!=='verify.person'&&r.kind!=='verify.family'))await call('reviewer',base+'/reviews/'+r.id,'POST',{decision:'APPROVE',reason:'Association verified'});
 const f=pending.find(r=>r.kind==='verify.family');await call('reviewer',base+'/reviews/'+f.id,'POST',{decision:'APPROVE',reason:'Family verified'});
 assert.equal((await call('owner',base+'/families/'+result.familyId)).headId,p.id);assert.equal((await call('owner',base+'/persons/'+p.id)).memberships.length,1);
});
