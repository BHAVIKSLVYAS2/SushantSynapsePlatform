'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {tables,owners,qualified,sqliteSql,ROOT}=require('../packages/database/catalog');
const {compile}=require('../packages/database/sqlserver-dialect');
const {configFromEnv}=require('../packages/database/sqlserver-config');
const {Store}=require('../apps/advocate/backend/store');
test('schema ownership stays in one database and qualified SQLite compatibility preserves records',()=>{
 assert.deepEqual(owners.map(o=>o[0]),['platform','chambers','batchfee','samaj','tournament','news','fundlens','satire']);assert.equal(Object.keys(tables).length,53);
 assert.equal(qualified('users'),'[platform].[users]');assert.equal(qualified('samaj_files'),'[samaj].[samaj_files]');assert.throws(()=>sqliteSql('SELECT * FROM [news].[users]'),/ownership/);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'schema-compat-'));let store;
 try{store=new Store(root,{provider:'sqlite'});store.create('clients',{id:'same-id',name:'Preserved हिन्दी'});store.sql.close();store=new Store(root,{provider:'sqlite'});assert.equal(store.get('clients','same-id').name,'Preserved हिन्दी');assert.equal(store.sql.prepare('SELECT count(*) n FROM [chambers].[records]').get().n,1);}finally{store?.sql.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('SQL translation preserves parameter boundaries, compound upserts, ignore uniqueness and deterministic pagination',()=>{
 const read=compile("SELECT * FROM [news].[news_editions] WHERE name='Why?' AND date<? ORDER BY date DESC LIMIT 31");assert.equal(read.parameters,1);assert.match(read.text,/TOP \(31\)/);assert.match(read.text,/'Why\?'/);assert.match(read.text,/date<@p0/);
 const upsert=compile('INSERT INTO [platform].[settings] VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data');assert.equal(upsert.parameters,2);assert.match(upsert.text,/UPDLOCK,HOLDLOCK/);assert.match(upsert.text,/data=@p1 WHERE \[id\]=@p0/);
 const ignored=compile('INSERT OR IGNORE INTO [samaj].[samaj_relationships] VALUES(?,?,?,?,?,?,?)');assert.match(ignored.text,/\[person_id\]=@p1 AND \[related_id\]=@p2 AND \[type\]=@p3/);
 assert.throws(()=>compile('SELECT * FROM unknown_table'),/Unregistered/);assert.throws(()=>compile('PRAGMA integrity_check'),/Unsupported/);
 assert.match(compile('SELECT data FROM [chambers].[records] WHERE kind=? ORDER BY rowid DESC').text,/created_order DESC/);
});
test('native migrations keep cross-schema foreign keys, JSON scalar audits, binary documents and immutable migration sources',()=>{
 for(const [schema,dir]of owners){const sql=fs.readFileSync(path.join(ROOT,dir,'sqlserver/001-schema.sql'),'utf8');assert.match(sql,new RegExp('CREATE SCHEMA \\['+schema+'\\]'));assert.doesNotMatch(sql,/\bUSE\s+|CREATE DATABASE|DROP TABLE|DROP DATABASE|\bPRAGMA\b/i);}
 const samaj=fs.readFileSync(path.join(ROOT,'apps/digital-samaj/database/sqlserver/001-schema.sql'),'utf8');assert.match(samaj,/REFERENCES \[platform\]\.\[users\]/);assert.match(samaj,/ISJSON\(old_value, VALUE\)=1/);assert.match(samaj,/VARBINARY\(MAX\)/);assert.match(samaj,/INSTEAD OF DELETE/);
});
test('SQL configuration requires an explicit database and production certificate verification',()=>{
 assert.throws(()=>configFromEnv({}),/required/);
 const env={SQLSERVER_SERVER:'example.database.windows.net',SQLSERVER_DATABASE:'synapse',NODE_ENV:'production'};
 assert.equal(configFromEnv(env).config.authentication.type,'azure-active-directory-default');
 assert.throws(()=>configFromEnv({...env,SQLSERVER_TRUST_CERTIFICATE:'1'}),/certificate/);
 assert.throws(()=>configFromEnv({...env,SQLSERVER_AUTH:'integrated'}),/Unsupported/);
 assert.throws(()=>configFromEnv({...env,SQLSERVER_AUTH:'sql'}),/requires/);
 const local={NODE_ENV:'production',SQLSERVER_SERVER:'.\\SQLEXPRESS',SQLSERVER_DATABASE:'SushantSynapsePlatform',SQLSERVER_AUTH:'integrated',SQLSERVER_LOCAL_INSTANCE:'1',SQLSERVER_TRUST_CERTIFICATE:'1'};
 if(process.platform==='win32'){const connection=configFromEnv(local);assert.equal(connection.driver,'mssql/msnodesqlv8');assert.match(connection.config.connectionString,/Encrypt=Yes/);assert.match(connection.config.connectionString,/Trusted_Connection=Yes/);}
 else assert.throws(()=>configFromEnv(local),/Local SQL mode/);
 assert.throws(()=>configFromEnv({...local,SQLSERVER_SERVER:'remote.example\\SQLEXPRESS'}),/Local SQL mode/);
 assert.throws(()=>configFromEnv({...local,SQLSERVER_AUTH:'sql',SQLSERVER_USER:'app',SQLSERVER_PASSWORD:'test-only'}),/Local SQL mode/);
 if(process.platform==='win32'){const connection=configFromEnv({...local,SQLSERVER_SERVER:'(localdb)\\MSSQLLocalDB'});assert.equal(connection.config.options.encrypt,false);assert.match(connection.config.connectionString,/Encrypt=No/);}
 assert.throws(()=>configFromEnv({...local,SQLSERVER_SERVER:'remote\\MSSQLLocalDB'}),/Local SQL mode/);
});
