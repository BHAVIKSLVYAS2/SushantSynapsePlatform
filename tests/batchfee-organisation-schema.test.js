const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');

test('BatchFee organisation schema isolates academy history and leaves legacy rows untouched',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec('PRAGMA foreign_keys=ON');
  db.exec('CREATE TABLE users(id TEXT PRIMARY KEY); CREATE TABLE platform_organisations(id TEXT PRIMARY KEY);');
  db.exec(fs.readFileSync(path.join(__dirname,'../apps/batchfee-lite/database/001-initial.sql'),'utf8'));
  db.prepare('INSERT INTO platform_organisations VALUES(?)').run('academy-a');
  db.prepare('INSERT INTO platform_organisations VALUES(?)').run('academy-b');
  db.prepare('INSERT INTO batchfee_workspace VALUES(1,?,?)').run(7,'{"legacy":true}');
  db.exec(fs.readFileSync(path.join(__dirname,'../infrastructure/cloudflare/d1-free-migrations/0007-batchfee-organisations.sql'),'utf8'));
  assert.deepEqual(db.prepare('SELECT * FROM batchfee_organisation_workspaces').all(),[]);
  assert.equal(db.prepare('SELECT revision FROM batchfee_workspace WHERE id=1').get().revision,7);
  db.prepare('INSERT INTO batchfee_organisation_workspaces VALUES(?,?,?)').run('academy-a',1,'{}');
  db.prepare('INSERT INTO batchfee_organisation_workspaces VALUES(?,?,?)').run('academy-b',2,'{}');
  db.prepare('INSERT INTO batchfee_organisation_events(organisationId,at,actor,action,data) VALUES(?,?,?,?,?)').run('academy-a','2026-10-29T00:00:00.000Z','user-a','payment','{}');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM batchfee_organisation_events WHERE organisationId=?').get('academy-b').n,0);
  assert.throws(()=>db.prepare('INSERT INTO batchfee_organisation_events(organisationId,at,actor,action,data) VALUES(?,?,?,?,?)').run('missing','2026-10-29T00:00:00.000Z','user-a','payment','{}'),/FOREIGN KEY/);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{db.close();}
});
