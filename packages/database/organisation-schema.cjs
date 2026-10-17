const {readFileSync}=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const migrations=Object.freeze(['001-organisations.sql','002-legacy-chambers.sql','003-organisation-workspaces.sql','004-invitation-identities.sql','005-client-access.sql'].map((file,index)=>{
  const source=readFileSync(index===2||index===4?path.join(__dirname,'../../apps/advocate/database',file):path.join(__dirname,'migrations',file),'utf8').replace(/\r\n/g,'\n');
  return Object.freeze({id:`platform-organisations-${file.slice(0,3)}`,source,checksum:createHash('sha256').update(source).digest('hex')});
}));
const tables=Object.freeze(['platform_organisation_migrations','platform_super_admins','platform_organisations',
  'platform_memberships','platform_app_licences','platform_app_assignments','platform_organisation_invitations',
  'platform_organisation_audit','platform_legacy_workspaces','chambers_record_ownership','chambers_file_ownership',
  'chambers_workspace_settings','chambers_activity','chambers_snapshots','platform_pending_identities','chambers_client_access']);
module.exports={migrations,tables};
