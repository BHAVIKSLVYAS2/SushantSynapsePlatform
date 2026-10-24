// Fresh per-request reads. App-specific role policy remains with each app.
export async function loadOrganisationScope(repo,userId,organisationId,appId){
 const organisation=await repo.first('SELECT * FROM platform_organisations WHERE id=?',organisationId);
 const membership=await repo.first('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?',organisationId,userId);
 const assignment=await repo.first('SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId=?',organisationId,userId,appId);
 const licence=await repo.first('SELECT * FROM platform_app_licences WHERE organisationId=? AND appId=?',organisationId,appId);
 return {organisation,membership,assignment,licence};
}
