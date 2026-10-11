// Run the established behavior suite against async D1/R2; retain its assertions.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'digital-samaj.test.js');
let source=fs.readFileSync(filename,'utf8');
const start=source.indexOf('function setup(t){'),end=source.indexOf('\ntest(',start);
const harness=`async function setup(t){
 const {DatabaseSync,localD1}=require('./helpers/local-d1.cjs');
 const {schema}=require('../infrastructure/cloudflare/build-d1.cjs');
 const {sqliteSql,tables}=require('../packages/database/catalog');
 const {D1Repository}=await import('../packages/database/d1.mjs');
 const {PrivateFiles}=await import('../packages/storage/r2.mjs');
 const {samaj}=await import('../apps/digital-samaj/backend/edge.mjs');
 const db=new DatabaseSync(':memory:');db.exec(schema());
 const binding=localD1(db),objects=new Map(),bucket={async put(k,b){objects.set(k,Buffer.from(b));},async get(k){const b=objects.get(k);return b?{body:b,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.length)}:null;}};
 const sql={prepare:s=>db.prepare(sqliteSql(s)),exec:s=>db.exec(sqliteSql(s)),close:()=>db.close()};
 const store={sql,extraExportTables:Object.keys(tables),user:id=>sql.prepare('SELECT * FROM users WHERE id=?').get(id),setAccess(id,apps){for(const app of apps)sql.prepare('INSERT INTO app_access VALUES(?,?)').run(id,app);},exportSql(){
  const quote=v=>v===null?'NULL':v instanceof Uint8Array?"X'"+Buffer.from(v).toString('hex')+"'":typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
  let output='PRAGMA foreign_keys=OFF;'+schema();for(const meta of Object.values(tables)){if(['samaj_roles','samaj_permissions','samaj_role_permissions'].includes(meta.name)||meta.name.endsWith('migrations'))continue;for(const r of sql.prepare('SELECT * FROM '+meta.name).all()){if('content' in r&&r.content===null){const m=sql.prepare('SELECT object_key FROM edge_objects WHERE id=?').get(r.id);if(m)r.content=objects.get(m.object_key);}output+='INSERT INTO '+meta.name+'('+Object.keys(r).join(',')+') VALUES('+Object.values(r).map(quote).join(',')+');';}}return output+'PRAGMA foreign_keys=ON;';
 }};
 t.after(()=>db.close());
 for(const [id,role]of [['owner','Owner'],['reviewer','Owner'],['member','Clerk'],['outsider','Clerk']])sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(id,id,id+'@example.test',role,'unused');
 store.setAccess('member',['digital-samaj']);
 async function call(id,route='',method='GET',data={}){
  const repo=await new D1Repository(binding).begin(),u=id?store.user(id):null;
  if(u)u.appIds=await repo.access(id);
  const request=new Request('http://localhost/api/digital-samaj'+route,{method,headers:{'Content-Type':'application/json'},body:method==='GET'?undefined:JSON.stringify(data)});
  const response=await samaj({repo,request,route:'digital-samaj'+route.split('?')[0],user:u,files:new PrivateFiles(bucket,repo),env:{SAMAJ_LIMITER:{limit:async()=>({success:true})}}});
  return response.json();
 }
 return {store,call};
}
`;
source=source.slice(0,start)+harness+source.slice(end);
source=source.replaceAll('=setup(t)','=await setup(t)').replaceAll("test('","test('Cloudflare async: ");
source=source.replace('createDigitalSamaj({store,auth:createAuth({store})});',"require('../apps/digital-samaj/backend/edge-routes.cjs').createDigitalSamaj({store,auth:{}});");
const suite=new Module(filename,module);suite.filename=filename;suite.paths=module.paths;suite._compile(source,filename);
