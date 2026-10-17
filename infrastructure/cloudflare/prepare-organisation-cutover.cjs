// Offline only. Read credentials from stdin, never command arguments or logs.
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
const literal=value=>value===null?'NULL':typeof value==='number'?String(value):String(value).includes('\0')?"CAST(X'"+Buffer.from(String(value)).toString('hex')+"' AS TEXT)":"'"+String(value).replaceAll("'","''")+"'";
async function prepare(snapshot,output,input){
 const target=path.resolve(output),root=path.resolve('.publish'),relative=path.relative(root,target);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||fs.existsSync(target))throw Error('Choose a new private output file beneath .publish');
 const source=fs.readFileSync(snapshot,'utf8'),db=new DatabaseSync(':memory:'),check=new DatabaseSync(':memory:');
 try{
  for(const copy of [db,check]){copy.exec(source);copy.exec('PRAGMA foreign_keys=ON');if(copy.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||copy.prepare('PRAGMA foreign_key_check').all().length)throw Error('Recovery copy failed integrity verification');}
  let master=input.legacyMasterAdminUserId;
  if(input.retainSoleOwner===true){const owners=db.prepare("SELECT id FROM users WHERE role='Owner' AND active=1").all();if(owners.length!==1)throw Error('Explicitly select a retained primary Master Admin; the source has no unique active Owner');master=owners[0].id;}
  const {prepareOrganisationCutover}=await import('../../packages/database/organisation-cutover.mjs');
  const {migrateOrganisationSchema}=await import('../../packages/database/organisation-repository.mjs');
  const planned=prepareOrganisationCutover(db,{email:input.email,password:input.password,legacyMasterAdminUserId:master});
  migrateOrganisationSchema(check);check.exec('BEGIN');for(const row of planned.statements)check.prepare(row.sql).run(...row.values);check.exec('COMMIT');
  if(check.prepare('PRAGMA foreign_key_check').all().length)throw Error('Prepared cutover failed foreign key verification');
  // Bind values with SQLite literals for the operator's D1 file import. No raw
  // password is emitted; the private patch contains only its salted hash.
  const sql=planned.statements.map(row=>{let at=0;const text=row.sql.replace(/\?/g,()=>literal(row.values[at++]));if(at!==row.values.length)throw Error('Invalid statement parameters');return text+';';}).join('\n');
  fs.writeFileSync(target,sql,{flag:'wx',mode:0o600});return {...planned.summary,output:target,verified:true};
 }finally{db.close();check.close();}
}
if(require.main===module)(async()=>{
 const args=process.argv.slice(2),arg=name=>{const at=args.indexOf(name);if(at<0||!args[at+1])throw Error('Required '+name);return args[at+1];};
 let text='';for await(const chunk of process.stdin){text+=chunk;if(Buffer.byteLength(text)>4096)throw Error('Input is too large');}
 console.log(JSON.stringify(await prepare(arg('--snapshot'),arg('--output'),JSON.parse(text))));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={prepare};
