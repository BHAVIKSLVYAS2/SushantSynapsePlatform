const {scryptSync}=require('node:crypto');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {Store}=require('../apps/advocate/backend/store');
async function seed(dir,{chambers=false,multi=false}={}){
 const target=fs.realpathSync(dir),relative=path.relative(os.tmpdir(),target);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||fs.readdirSync(target).length)throw Error('Fixture preparation requires an empty directory beneath the OS temporary directory');
 const store=new Store(dir,{provider:'sqlite'});
 try{
  const password='Temporary administration fixture 2026!',salt='0123456789abcdef0123456789abcdef',encoded=salt+':'+scryptSync(password,salt,64).toString('hex');
  for(const id of ['super','master','member','outsider','client'])store.sql.prepare('INSERT INTO users(id,name,email,role,password,active) VALUES(?,?,?,?,?,1)').run(id,id,`${id}@example.com`,id==='super'?'Owner':'Clerk',encoded);
  const {migrateOrganisationSchema,OrganisationRepository}=await import('../packages/database/organisation-repository.mjs');
  const {OrganisationAdministration}=await import('../packages/database/organisation-administration.mjs');
  migrateOrganisationSchema(store.nativeSqlite);const repo=new OrganisationRepository(store.nativeSqlite),admin=new OrganisationAdministration(repo);
  repo.bootstrapSuperAdmin({userId:'super'});
  const licence={appId:'advocate',status:'Active',startsAt:'2020-01-01T00:00:00.000Z',endsAt:'2099-01-01T00:00:00.000Z',readOnlyUntil:null,staffLimit:4,clientLimit:0};
  const create=(name,masterAdminUserId)=>repo.provision({actorUserId:'super',name,type:'Legal',masterAdminUserId,staffLimit:5,clientLimit:2,licences:[licence]});
  const first=create('First Chambers','master'),second=create('Other Chambers','outsider');
  repo.acceptInvitation({actorUserId:'master',token:first.invitation.token});repo.acceptInvitation({actorUserId:'outsider',token:second.invitation.token});
  const invited=admin.inviteMember({actorUserId:'master',organisationId:first.organisationId,version:2,userId:'member',role:'Staff',reason:'Fixture membership'});
  admin.acceptMemberInvitation({actorUserId:'member',token:invited.invitation.token});
  if(chambers)for(const [organisationId,userId,role]of [[first.organisationId,'master','Owner'],[first.organisationId,'member','Clerk'],[second.organisationId,'outsider','Owner']]){
   const version=store.nativeSqlite.prepare('SELECT version FROM platform_organisations WHERE id=?').get(organisationId).version;
   admin.assignChambers({actorUserId:'super',organisationId,userId,role,status:'Active',version,reason:'Fixture Chambers access'});
  }
  if(chambers&&multi){
   let version=store.nativeSqlite.prepare('SELECT version FROM platform_organisations WHERE id=?').get(second.organisationId).version;
   const extra=admin.inviteMember({actorUserId:'super',organisationId:second.organisationId,version,userId:'master',role:'Staff',reason:'Second fixture workspace'});
   admin.acceptMemberInvitation({actorUserId:'master',token:extra.invitation.token});
   version=store.nativeSqlite.prepare('SELECT version FROM platform_organisations WHERE id=?').get(second.organisationId).version;
   admin.assignChambers({actorUserId:'super',organisationId:second.organisationId,version,userId:'master',role:'Advocate',status:'Active',reason:'Second fixture assignment'});
  }
  return {organisationId:first.organisationId,otherOrganisationId:second.organisationId};
 }finally{store.sql.close();}
}
if(require.main===module)seed(process.argv[2],{chambers:process.argv.includes('--chambers'),multi:process.argv.includes('--multi')}).then(result=>process.stdout.write(JSON.stringify(result))).catch(error=>{process.stderr.write(error.message);process.exitCode=1;});
module.exports={seed};
