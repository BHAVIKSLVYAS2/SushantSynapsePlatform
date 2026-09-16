const {fail}=require('../../../server/http');
const {createNewsRepository,today}=require('./repository');
function createNews({auth,store}) {
  const repository=createNewsRepository(store);
  return async function handle({route,method,json,user,req}) {
    if(!user)fail(401,'Please sign in');
    if(!auth.hasAppAccess(user,'news'))fail(403,'Ask the platform owner for News app access');
    // Owner preview while the catalogue entry remains Planned.
    auth.owner(user);
    if(!['news/status','news/editions'].includes(route)&&!/^news\/editions\/[^/]+$/.test(route))fail(404,'Not found');
    if(method!=='GET')fail(405,'Method not allowed');
    if(route==='news/status')return json(200,{name:'Sushant Synapse Times',author:'Bhavik',stage:'archives',generationAvailable:false,archiveAvailable:true,today:today()});
    if(route==='news/editions')return json(200,repository.list(new URL(req.url,'http://localhost').searchParams.get('before')));
    const edition=repository.get(route.split('/')[2]);
    if(!edition)fail(404,'No saved newspaper for this date');
    return json(200,edition);
  };
}
module.exports={createNews};
