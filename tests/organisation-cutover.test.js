const {test}=require('node:test'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite');
const {schema}=require('../infrastructure/cloudflare/build-d1.cjs');
const base=schema()+"\nINSERT INTO users VALUES('old-owner','Owner','owner@example.test','Owner','unchanged-owner-hash',1); INSERT INTO users VALUES('old-clerk','Clerk','clerk@example.test','Clerk','unchanged-clerk-hash',1); INSERT INTO app_access VALUES('old-clerk','advocate'); INSERT INTO records VALUES('clients','old-client','{\"name\":\"Retained private client\"}');";
test('offline D1 cutover preserves users/data and keeps Super Admin separate from Chambers authority',async()=>{
 const {prepareOrganisationCutover}=await import('../packages/database/organisation-cutover.mjs');
 const {migrateOrganisationSchema}=await import('../packages/database/organisation-repository.mjs');
 const copy=new DatabaseSync(':memory:'),target=new DatabaseSync(':memory:');
 try{
  for(const db of [copy,target]){db.exec('PRAGMA foreign_keys=ON');db.exec(base);}
  const result=prepareOrganisationCutover(copy,{email:'super-admin@example.test',password:'Isolated bootstrap password!',legacyMasterAdminUserId:'old-owner'});
  migrateOrganisationSchema(target);target.exec('BEGIN');for(const row of result.statements)target.prepare(row.sql).run(...row.values);target.exec('COMMIT');
  assert.equal(target.prepare('SELECT COUNT(*) n FROM records').get().n,1);assert.equal(target.prepare('SELECT password FROM users WHERE id=?').get('old-owner').password,'unchanged-owner-hash');
  assert.equal(target.prepare('SELECT organisationId FROM chambers_record_ownership WHERE recordId=?').get('old-client').organisationId,result.summary.organisationId);
  assert.equal(target.prepare('SELECT role FROM platform_memberships WHERE userId=?').get('old-owner').role,'MasterAdmin');
  assert.equal(target.prepare('SELECT role FROM platform_app_assignments WHERE userId=?').get('old-clerk').role,'Clerk');
  assert.equal(target.prepare('SELECT role FROM users WHERE id=?').get(result.summary.superAdminUserId).role,'Clerk');
  assert.equal(target.prepare('SELECT COUNT(*) n FROM platform_app_assignments WHERE userId=?').get(result.summary.superAdminUserId).n,0);
  assert.deepEqual(target.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.throws(()=>prepareOrganisationCutover(target,{email:'other@example.test',password:'Isolated bootstrap password!',legacyMasterAdminUserId:'old-owner'}),/unmigrated/);
 }finally{copy.close();target.close();}
});

test('offline D1 recovery includes organisation authorities, licences, ownership and audit without sessions',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const {prepareOrganisationCutover}=await import('../packages/database/organisation-cutover.mjs');
 const {prepareRecovery}=require('../infrastructure/cloudflare/free-recovery.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-organisation-recovery-')),db=new DatabaseSync(':memory:');
 try{
  db.exec('PRAGMA foreign_keys=ON');db.exec(base);
  for(const file of ['0003-document-blobs.sql','0004-samaj-blobs.sql'])db.exec(fs.readFileSync(path.join('infrastructure/cloudflare/d1-free-migrations',file),'utf8'));
  const prepared=prepareOrganisationCutover(db,{email:'recovery-super@example.test',password:'Isolated recovery password!',legacyMasterAdminUserId:'old-owner'});
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run('excluded-session','old-owner',Date.now()+60000);
  const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
  const tables=db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  let dump='PRAGMA foreign_keys=OFF;\n'+tables.map(t=>t.sql+';').join('\n')+'\n'+db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").all().map(r=>r.sql+';').join('\n');
  for(const table of tables)for(const row of db.prepare('SELECT * FROM '+table.name).all())dump+='\nINSERT INTO '+table.name+'('+Object.keys(row).join(',')+') VALUES('+Object.values(row).map(literal).join(',')+');';
  const snapshot=path.join(dir,'fixture.sql');fs.writeFileSync(snapshot,dump);const report=prepareRecovery(snapshot,path.join(dir,'restored'));assert.equal(report.verified,true);
  const target=new DatabaseSync(':memory:');try{
   target.exec(schema());for(const file of ['0002-free-guards.sql','0003-document-blobs.sql','0004-samaj-blobs.sql'])target.exec(fs.readFileSync(path.join('infrastructure/cloudflare/d1-free-migrations',file),'utf8'));
   target.exec('PRAGMA foreign_keys=ON;BEGIN');target.exec(fs.readFileSync(path.join(dir,'restored/d1-restore.sql'),'utf8'));target.exec('COMMIT');
   for(const table of ['platform_super_admins','platform_organisations','platform_memberships','platform_app_licences','platform_app_assignments','chambers_record_ownership','platform_organisation_audit'])assert.deepEqual(target.prepare('SELECT * FROM '+table).all(),db.prepare('SELECT * FROM '+table).all(),table);
   assert.equal(target.prepare('SELECT COUNT(*) n FROM sessions').get().n,0);assert.deepEqual(target.prepare('PRAGMA foreign_key_check').all(),[]);assert.ok(prepared.summary.organisationId);
  }finally{target.close();}
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('cutover CLI preparation emits only a salted credential and refuses to overwrite a private patch',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomUUID}=require('node:crypto');
 const {prepare}=require('../infrastructure/cloudflare/prepare-organisation-cutover.cjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-cutover-cli-')),output=path.resolve('.publish','cutover-fixture-'+randomUUID()+'.sql');
 try{
  fs.mkdirSync(path.dirname(output),{recursive:true});const snapshot=path.join(dir,'fixture.sql');fs.writeFileSync(snapshot,base);
  const input={email:'cli-super@example.test',password:'Private CLI fixture password!',retainSoleOwner:true};
  const result=await prepare(snapshot,output,input);assert.equal(result.verified,true);const patch=fs.readFileSync(output,'utf8');assert.equal(patch.includes(input.password),false);assert.match(patch,/INSERT INTO platform_super_admins/);
  await assert.rejects(()=>prepare(snapshot,output,input),/new private output/);
 }finally{fs.rmSync(output,{force:true});fs.rmSync(dir,{recursive:true,force:true});}
});
