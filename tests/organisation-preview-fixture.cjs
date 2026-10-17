const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const password='Temporary administration fixture 2026!';
async function startPreview({enabled=true,chambers=false,multi=false,recoverySql}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-admin-preview-'));
 let seed={};
 if(recoverySql!==undefined){
  // Test-only restore into a newly created, empty OS-temporary directory.
  const {DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(path.join(dir,'chambers.sqlite'));
  try{db.exec(recoverySql);if(db.prepare('SELECT COUNT(*) n FROM sessions').get().n!==0)throw Error('Recovery fixture must exclude sessions');}finally{db.close();}
 }else{
  const seeded=spawnSync(process.execPath,[path.join(__dirname,'organisation-preview-seed.cjs'),dir,...(chambers?['--chambers']:[]),...(multi?['--multi']:[])],{encoding:'utf8',windowsHide:true});
  if(seeded.status!==0)throw Error('Temporary preview seeding failed: '+seeded.stderr);
  seed=JSON.parse(seeded.stdout);
 }
 const child=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'test',DATABASE_PROVIDER:'sqlite',HOST:'127.0.0.1',PORT:'0',DATA_DIR:dir,ORG_ADMIN_PREVIEW:enabled?'1':'0',PUBLIC_ORIGIN:'',COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let base;
 await new Promise((resolve,reject)=>{
  let output='';const timeout=setTimeout(()=>reject(Error('Preview server startup timeout')),15000);
  child.stdout.on('data',chunk=>{output+=chunk;const match=/localhost:(\d+)/.exec(output);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timeout);resolve();}});
  child.once('error',error=>{clearTimeout(timeout);reject(error);});child.once('exit',code=>{clearTimeout(timeout);reject(Error('Preview server exited '+code));});
 });
 async function login(id){const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`${id}@example.com`,password})});if(!response.ok)throw Error('Fixture login failed');return response.headers.get('set-cookie').split(';')[0];}
 async function stop(){if(child.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>child.kill('SIGKILL'),5000);child.once('exit',()=>{clearTimeout(timer);resolve();});child.kill();});const relative=path.relative(os.tmpdir(),dir);if(!relative||relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unsafe fixture cleanup');fs.rmSync(dir,{recursive:true,force:true});}
 return {base,dir,child,password,login,stop,...seed};
}
module.exports={startPreview,password};
