const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {schema}=require('../infrastructure/cloudflare/build-d1.cjs');
const {preparePrivateAppsCutover}=require('../infrastructure/cloudflare/private-apps-cutover.cjs');

test('offline private app cutover copies history and maps one community without changing legacy rows',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(schema());
  for(const file of ['0002-free-guards.sql','0003-document-blobs.sql','0004-samaj-blobs.sql','0005-organisations.sql','0006-tournament-organisations.sql','0007-batchfee-organisations.sql','0008-samaj-organisations.sql'])db.exec(fs.readFileSync(path.join(__dirname,'../infrastructure/cloudflare/d1-free-migrations',file),'utf8'));
  db.exec("INSERT INTO users VALUES('owner','Owner','owner@example.test','Owner','hash',1)");
  db.exec("PRAGMA defer_foreign_keys=ON; BEGIN; INSERT INTO platform_organisations(id,name,type,timezone,status,masterAdminUserId,staffLimit,clientLimit,createdAt) VALUES('org','Test','Legal','Asia/Kolkata','Active','owner',2,0,1); INSERT INTO platform_memberships VALUES('org','owner','MasterAdmin','Active',1); COMMIT;");
  db.exec("INSERT INTO platform_app_licences(organisationId,appId,status,startsAt,endsAt,readOnlyUntil,staffLimit,clientLimit) VALUES('org','advocate','Active','2020-01-01T00:00:00.000Z','2099-01-01T00:00:00.000Z',NULL,2,0)");
  db.exec("INSERT INTO batchfee_workspace VALUES(1,3,'{\"profile\":null}'); INSERT INTO batchfee_events(at,actor,action,data) VALUES('2026-01-01T00:00:00.000Z','owner','sync','{\"id\":\"legacy-1\",\"type\":\"sync\",\"day\":\"2026-01-01\",\"input\":{}}');");
  db.exec("INSERT INTO samaj_communities VALUES('community','Private Samaj','2026-01-01T00:00:00.000Z'); INSERT INTO samaj_grants VALUES('grant','owner','community','SUPER_ADMIN','ALL','','2026-01-01T00:00:00.000Z');");
  const result=preparePrivateAppsCutover(db,'org');
  assert.equal(result.summary.batchfeeEvents,1);assert.equal(result.summary.samajCommunities,1);assert.equal(result.summary.assignments,2);
  db.exec('UPDATE edge_revision SET revision=revision+1 WHERE id=1');
  db.exec('BEGIN');assert.throws(()=>db.exec(result.sql),/CHECK constraint failed/);db.exec('ROLLBACK');
  db.exec('UPDATE edge_revision SET revision=revision-1 WHERE id=1');
  db.exec('BEGIN');db.exec(result.sql);db.exec('COMMIT');
  assert.equal(db.prepare('SELECT revision FROM batchfee_organisation_workspaces WHERE organisationId=?').get('org').revision,3);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM batchfee_organisation_events WHERE organisationId=?').get('org').n,1);
  assert.equal(db.prepare('SELECT organisationId FROM samaj_organisation_ownership WHERE samajId=?').get('community').organisationId,'org');
  assert.equal(db.prepare('SELECT revision FROM batchfee_workspace WHERE id=1').get().revision,3);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
  assert.throws(()=>preparePrivateAppsCutover(db,'org'),/already exists/);
 }finally{db.close();}
});
