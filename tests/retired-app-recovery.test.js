const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {Store}=require('../apps/advocate/backend/store');
test('retired financial records survive a full SQLite recovery export without active app code',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'retired-recovery-'));let store,restored;
 try{
  store=new Store(dir);store.sql.exec(fs.readFileSync(path.join(__dirname,'../packages/database/retired/fund-lens/001-portfolio.sql'),'utf8'));
  store.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run('retained-owner','Owner','owner@example.test','Owner','preserved-hash');
  store.sql.prepare('INSERT INTO fund_lens_migrations VALUES(1,?)').run('2026-01-01');
  store.sql.prepare('INSERT INTO fund_lens_portfolios VALUES(?,?)').run('retained-owner',7);
  store.sql.prepare('INSERT INTO fund_lens_transactions VALUES(?,?,?,?,?,?,?,?,?,?)').run('tx1','retained-owner','123456','Retained plan','2026-01-01','BUY',10,1000,'original reference','fingerprint');
  const exported=store.exportSql();restored=new DatabaseSync(':memory:');restored.exec(exported);
  assert.equal(restored.prepare('SELECT revision FROM fund_lens_portfolios').get().revision,7);
  assert.equal(restored.prepare('SELECT reference FROM fund_lens_transactions').get().reference,'original reference');
  assert.equal(restored.prepare('SELECT password FROM users').get().password,'preserved-hash');
  assert.ok(restored.prepare("SELECT name FROM sqlite_master WHERE name='fund_lens_transactions_user_date'").get());
 }finally{restored?.close();store?.sql.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('fresh workspaces do not create retired app tables or publish retired assets',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'retired-fresh-'));let store;
 try{store=new Store(dir);assert.equal(store.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name LIKE 'fund_lens_%'").get().n,0);assert.doesNotMatch(store.exportSql(),/CREATE TABLE[^;]*fund_lens_/);}
 finally{store?.sql.close();fs.rmSync(dir,{recursive:true,force:true});}
 assert.ok(!require('../packages/app-registry').apps.some(a=>a.id==='fund-overlap'));
 assert.ok(!Object.entries(require('../server/static-assets').staticAssets).some(([url,file])=>url.includes('fund-overlap')||file.includes('fund-overlap')));
});
