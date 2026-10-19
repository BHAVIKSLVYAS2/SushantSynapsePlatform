const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{createRequire}=require('node:module');
test('organisation D1 serves public feedback, persists votes, and restricts moderation to current Super Admin',async t=>{
 const toolsRequire=createRequire(require.resolve('wrangler/package.json')),{Miniflare,convertV4MiniflareOptions}=toolsRequire('miniflare'),{statements}=require('../infrastructure/cloudflare/sql-statements.cjs');
 const bundled=await require('esbuild').build({stdin:{contents:"import {edgeApi} from './server/edge-index.mjs'; export default {fetch:edgeApi};",resolveDir:process.cwd()},bundle:true,write:false,banner:{js:"import {createRequire} from 'node:module'; const require=createRequire('/worker.js');"},format:'esm',platform:'neutral',external:['node:*'],conditions:['workerd','worker','browser']});
 const origin='http://localhost',options={workers:[{name:'feedback-d1',modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-10-01',compatibilityFlags:['nodejs_compat'],d1Databases:{PLATFORM_DB:'isolated-feedback'},bindings:{PUBLIC_ORIGIN:origin,FREE_MODE:'true',FULL_APPS:'true',AUTH_METHOD:'password',ORGANISATIONS_ENABLED:'true'},ratelimits:{CONFESSIONS_LIMITER:{namespace_id:'94',simple:{limit:10000,period:60}}}}]},mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);t.after(()=>mf.dispose());
 const db=await mf.getD1Database('PLATFORM_DB');for(const sql of statements(require('../infrastructure/cloudflare/build-d1.cjs').schema()))await db.prepare(sql).run();
 for(const file of ['0002-free-guards.sql','0003-document-blobs.sql','0004-samaj-blobs.sql','0005-organisations.sql'])for(const sql of statements(fs.readFileSync(path.join('infrastructure/cloudflare/d1-free-migrations',file),'utf8')))await db.prepare(sql).run();
 for(const [id,role]of [['super','Clerk'],['owner','Owner']]){await db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').bind(id,id,id+'@test.example',role,'unused').run();await db.prepare('INSERT INTO sessions VALUES(?,?,?)').bind(createHash('sha256').update((id==='super'?'a':'b').repeat(64)).digest('hex'),id,Date.now()+600000).run();}
 await db.prepare('INSERT INTO platform_super_admins VALUES(?,1,?)').bind('super',Date.now()).run();
 const api=async(path='',data,cookie='')=>{const response=await mf.dispatchFetch(origin+'/api/feedback'+path,{method:data===undefined?'GET':'POST',headers:{Cookie:cookie,...(data===undefined?{}:{Origin:origin,'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};};
 const first=await api();assert.equal(first.status,200);const cookie=first.cookie;assert(cookie);
 const created=await api('',{title:'Better mobile exports',description:'Add easier mobile exports for the whole platform.',category:'Improvement',app:'Platform'},cookie);assert.equal(created.status,201,JSON.stringify(created.data));const id=created.data.id;
 assert.equal((await api('/'+id+'/vote',{voted:true},cookie)).data.votes,1);assert.equal((await api('/'+id+'/vote',{voted:true},cookie)).data.votes,1);
 await api('/'+id+'/comments',{message:'A useful mobile improvement.'},cookie);
 const owner=cookie+'; chambers_session='+'b'.repeat(64),superCookie=cookie+'; chambers_session='+'a'.repeat(64);
 assert.equal((await api('/'+id+'/moderate',{hidden:true},owner)).status,403);
 assert.equal((await api('/'+id+'/moderate',{status:'Planned'},superCookie)).status,200);
 assert.equal((await api('/'+id)).data.status,'Planned');assert.equal((await api()).data.items[0].votes,1);
 assert.equal((await api('/'+id+'/moderate',{hidden:true},superCookie)).status,200);assert.equal((await api('/'+id)).status,404);assert.equal((await api()).data.total,0);
 assert.equal((await api('?moderation=1',undefined,owner)).status,403);assert.equal((await api('?moderation=1',undefined,superCookie)).data.total,1);
 await db.prepare('UPDATE platform_super_admins SET active=0 WHERE userId=?').bind('super').run();assert.equal((await api('/'+id+'/moderate',{hidden:false},superCookie)).status,403);
});
