const {fail,readBody}=require('../../../server/http');
const {createNewsRepository,today}=require('./repository');
const {createNewsProvider}=require('./provider');
const {createFetchService}=require('./fetch-service');
function createNews({auth,store,provider=createNewsProvider()}) {
  const repository=createNewsRepository(store);
  const fetching=createFetchService({store,repository,provider});
  return async function handle({route,method,json,user,req}) {
    if(!user)fail(401,'Please sign in');
    if(!auth.hasAppAccess(user,'news'))fail(403,'Ask the platform owner for News app access');
    // Owner preview while the catalogue entry remains Planned.
    auth.owner(user);
    if(route==='news/fetch'){
      if(method!=='POST')fail(405,'Method not allowed');
      const input=await readBody(req,1024);
      if(Object.keys(input).some(key=>key!=='date'))fail(400,'Only an edition date is accepted');
      if(input.date!==undefined&&typeof input.date!=='string')fail(400,'Invalid edition date');
      return json(200,await fetching.fetchDate(input.date));
    }
    if(/^news\/preview\/[^/]+$/.test(route)){
      if(method!=='GET')fail(405,'Method not allowed');
      return json(200,fetching.preview(route.split('/')[2]));
    }
    if(!['news/status','news/editions'].includes(route)&&!/^news\/editions\/[^/]+$/.test(route))fail(404,'Not found');
    if(method!=='GET')fail(405,'Method not allowed');
    if(route==='news/status')return json(200,{name:'Sushant Synapse Times',author:'Bhavik',stage:'fetch-preview',generationAvailable:false,fetchAvailable:true,provider:'GDELT',archiveAvailable:true,today:today()});
    if(route==='news/editions')return json(200,repository.list(new URL(req.url,'http://localhost').searchParams.get('before')));
    const edition=repository.get(route.split('/')[2]);
    if(!edition)fail(404,'No saved newspaper for this date');
    return json(200,edition);
  };
}
module.exports={createNews};
